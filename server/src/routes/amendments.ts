import { Router } from 'express';
import type Database from 'better-sqlite3';
import type { StoreAuthedRequest } from '../middleware/storeMember.js';

function applyPayload(
  existing: Record<string, unknown>,
  payload: Record<string, unknown>,
): {
  kind: string;
  title: string;
  subtitle: string;
  amount: number;
  occurred_at: string;
} {
  const kind =
    payload.kind === 'income' || payload.kind === 'expense'
      ? payload.kind
      : (existing.kind as string);
  const title = typeof payload.title === 'string' ? payload.title : (existing.title as string);
  const subtitle =
    typeof payload.subtitle === 'string' ? payload.subtitle : (existing.subtitle as string);
  let amount = existing.amount as number;
  if (payload.amount !== undefined) {
    const num = Number(payload.amount);
    if (!Number.isFinite(num)) throw new Error('invalid amount');
    amount =
      kind === 'income' ? Math.abs(num) : num > 0 ? -Math.abs(num) : -Math.abs(num);
  }
  let occurredAt = existing.occurred_at as string;
  if (typeof payload.date === 'string' && payload.date) {
    occurredAt = `${payload.date}T12:00:00.000Z`;
  }
  return { kind, title, subtitle, amount, occurred_at: occurredAt };
}

export function createAmendmentsRouter(db: Database.Database) {
  const r = Router();

  r.get('/', (req: StoreAuthedRequest, res) => {
    const ctx = req.storeCtx!;
    if (!ctx.isOwner) {
      res.status(403).json({ error: 'Only store owner or admin can list amendments' });
      return;
    }
    const status = (req.query.status as string | undefined) ?? undefined;
    let sql = `SELECT a.id, a.transaction_id as transactionId, a.requested_by as requestedBy, u.name as requestedByName,
         a.payload, a.previous_snapshot as previousSnapshot, a.status, a.reviewed_by as reviewedBy,
         ru.name as reviewedByName, a.reviewed_at as reviewedAt, a.reject_reason as rejectReason, a.created_at as createdAt
       FROM transaction_amendments a
       LEFT JOIN users u ON u.id = a.requested_by
       LEFT JOIN users ru ON ru.id = a.reviewed_by
       WHERE a.store_id = ?`;
    const params: unknown[] = [req.storeId!];
    if (status === 'pending' || status === 'approved' || status === 'rejected') {
      sql += ' AND a.status = ?';
      params.push(status);
    }
    sql += ' ORDER BY a.created_at DESC';
    const rows = db.prepare(sql).all(...params);
    res.json(rows);
  });

  r.patch('/:amendmentId', (req: StoreAuthedRequest, res) => {
    const ctx = req.storeCtx!;
    if (!ctx.isOwner) {
      res.status(403).json({ error: 'Only store owner or admin can review' });
      return;
    }
    const action = (req.body as { action?: string })?.action;
    const rejectReason = (req.body as { rejectReason?: string })?.rejectReason;
    if (action !== 'approve' && action !== 'reject') {
      res.status(400).json({ error: 'action must be approve or reject' });
      return;
    }
    const am = db
      .prepare(`SELECT * FROM transaction_amendments WHERE id = ? AND store_id = ?`)
      .get(req.params.amendmentId, req.storeId!) as Record<string, unknown> | undefined;
    if (!am) {
      res.status(404).json({ error: 'not found' });
      return;
    }
    if (am.status !== 'pending') {
      res.status(409).json({ error: 'Amendment is not pending' });
      return;
    }
    const now = new Date().toISOString();
    if (action === 'reject') {
      db.prepare(
        `UPDATE transaction_amendments SET status = 'rejected', reviewed_by = ?, reviewed_at = ?, reject_reason = ?
         WHERE id = ?`,
      ).run(req.userId!, now, typeof rejectReason === 'string' ? rejectReason : '', am.id);
      const row = db
        .prepare(
          `SELECT id, transaction_id as transactionId, status, reviewed_at as reviewedAt, reject_reason as rejectReason
           FROM transaction_amendments WHERE id = ?`,
        )
        .get(am.id);
      res.json(row);
      return;
    }

    const tx = db
      .prepare('SELECT * FROM transactions WHERE id = ? AND store_id = ?')
      .get(am.transaction_id, req.storeId!) as Record<string, unknown> | undefined;
    if (!tx) {
      res.status(404).json({ error: 'transaction missing' });
      return;
    }
    let next: ReturnType<typeof applyPayload>;
    try {
      const payload = JSON.parse(am.payload as string) as Record<string, unknown>;
      next = applyPayload(tx, payload);
    } catch {
      res.status(400).json({ error: 'Invalid payload' });
      return;
    }

    const updateTx = db.transaction(() => {
      db.prepare(
        `UPDATE transactions SET kind = ?, title = ?, subtitle = ?, amount = ?, occurred_at = ?
         WHERE id = ? AND store_id = ?`,
      ).run(
        next.kind,
        next.title,
        next.subtitle,
        next.amount,
        next.occurred_at,
        am.transaction_id,
        req.storeId!,
      );
      db.prepare(
        `UPDATE transaction_amendments SET status = 'approved', reviewed_by = ?, reviewed_at = ? WHERE id = ?`,
      ).run(req.userId!, now, am.id);
    });
    updateTx();
    const row = db
      .prepare(
        `SELECT id, transaction_id as transactionId, status, reviewed_at as reviewedAt
         FROM transaction_amendments WHERE id = ?`,
      )
      .get(am.id);
    res.json(row);
  });

  return r;
}
