import { Router } from 'express';
import type Database from 'better-sqlite3';
import { randomUUID } from 'node:crypto';
import type { StoreAuthedRequest } from '../middleware/storeMember.js';
import {
  isStoreBossRoleName,
  isStoreCashierRoleName,
  isStoreManagerRoleName,
  isStoreShareholderRoleName,
  restrictStoreTransactionsToOwnUser,
} from '../lib/storeAuth.js';

function snapshotRow(row: Record<string, unknown>) {
  return JSON.stringify({
    kind: row.kind,
    title: row.title,
    subtitle: row.subtitle,
    amount: row.amount,
    occurred_at: row.occurred_at,
  });
}

export function createTransactionsRouter(db: Database.Database) {
  const r = Router();

  r.get('/', (req: StoreAuthedRequest, res) => {
    const ctx = req.storeCtx!;
    const kind = req.query.kind as string | undefined;
    if (kind && kind !== 'income' && kind !== 'expense') {
      res.status(400).json({ error: 'kind must be income or expense' });
      return;
    }
    /** 老板/店长：全店；收银员：仅本人（有录入或流水权之一即可拉列表）；股东：按是否全店流水 */
    const role = req.storeRole;
    const canListLines =
      ctx.isSuperAdmin ||
      ctx.canViewTransactionLines ||
      isStoreBossRoleName(role) ||
      isStoreManagerRoleName(role) ||
      (isStoreCashierRoleName(role) && (ctx.canRecord || ctx.canViewTransactionLines)) ||
      (isStoreShareholderRoleName(role) && (ctx.canViewTransactionLines || ctx.canRecord));
    if (!canListLines) {
      res.status(403).json({ error: 'No permission to view transaction lines' });
      return;
    }

    let sql = `SELECT id, kind, title, subtitle, amount, occurred_at as occurredAt, created_at as createdAt
       FROM transactions WHERE store_id = ?`;
    const params: unknown[] = [req.storeId!];
    if (restrictStoreTransactionsToOwnUser(role, ctx)) {
      sql += ' AND user_id = ?';
      params.push(req.userId!);
    }
    if (kind) {
      sql += ' AND kind = ?';
      params.push(kind);
    }
    sql += ' ORDER BY occurred_at DESC';
    const rows = db.prepare(sql).all(...params);
    res.json(rows);
  });

  r.post('/', (req: StoreAuthedRequest, res) => {
    const ctx = req.storeCtx!;
    if (!ctx.canRecord) {
      res.status(403).json({ error: 'No permission to record transactions' });
      return;
    }
    const { kind, title, subtitle, amount, date } = req.body ?? {};
    if (kind !== 'income' && kind !== 'expense') {
      res.status(400).json({ error: 'kind must be income or expense' });
      return;
    }
    if (!title || typeof title !== 'string') {
      res.status(400).json({ error: 'title required' });
      return;
    }
    const num = Number(amount);
    if (!Number.isFinite(num)) {
      res.status(400).json({ error: 'amount must be a number' });
      return;
    }
    const signed =
      kind === 'income' ? Math.abs(num) : num > 0 ? -Math.abs(num) : -Math.abs(num);
    const dateStr = typeof date === 'string' && date ? date : new Date().toISOString().slice(0, 10);
    const occurredAt = `${dateStr}T12:00:00.000Z`;
    const id = randomUUID();
    const now = new Date().toISOString();
    db.prepare(
      `INSERT INTO transactions (id, store_id, user_id, kind, title, subtitle, amount, occurred_at, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run(
      id,
      req.storeId!,
      req.userId!,
      kind,
      title,
      typeof subtitle === 'string' ? subtitle : '',
      signed,
      occurredAt,
      now,
    );
    const row = db
      .prepare(
        `SELECT id, kind, title, subtitle, amount, occurred_at as occurredAt, created_at as createdAt
         FROM transactions WHERE id = ?`,
      )
      .get(id);
    res.status(201).json(row);
  });

  r.post('/:id/amendments', (req: StoreAuthedRequest, res) => {
    const ctx = req.storeCtx!;
    if (!ctx.canRecord) {
      res.status(403).json({ error: 'No permission to request amendments' });
      return;
    }
    const tx = db
      .prepare('SELECT * FROM transactions WHERE id = ? AND store_id = ?')
      .get(req.params.id, req.storeId!) as Record<string, unknown> | undefined;
    if (!tx) {
      res.status(404).json({ error: 'not found' });
      return;
    }
    if (isStoreCashierRoleName(req.storeRole) && !ctx.isSuperAdmin && tx.user_id !== req.userId) {
      res.status(403).json({ error: 'Can only amend own transactions' });
      return;
    }
    const pending = db
      .prepare(
        `SELECT id FROM transaction_amendments WHERE transaction_id = ? AND status = 'pending'`,
      )
      .get(req.params.id) as { id: string } | undefined;
    if (pending) {
      res.status(409).json({ error: 'A pending amendment already exists' });
      return;
    }

    const body = req.body ?? {};
    const reason =
      typeof body.reason === 'string'
        ? body.reason.trim()
        : typeof (body as { requestReason?: string }).requestReason === 'string'
          ? String((body as { requestReason?: string }).requestReason).trim()
          : '';
    if (!reason) {
      res.status(400).json({ error: '申请原因不能为空' });
      return;
    }
    const proposed = {
      kind: body.kind,
      title: body.title,
      subtitle: body.subtitle,
      amount: body.amount,
      date: body.date,
      reason,
    };
    const aid = randomUUID();
    const now = new Date().toISOString();
    const prev = snapshotRow(tx);
    db.prepare(
      `INSERT INTO transaction_amendments (id, transaction_id, store_id, requested_by, payload, previous_snapshot, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, 'pending', ?)`,
    ).run(
      aid,
      req.params.id,
      req.storeId!,
      req.userId!,
      JSON.stringify(proposed),
      prev,
      now,
    );
    const row = db
      .prepare(
        `SELECT id, transaction_id as transactionId, status, payload, previous_snapshot as previousSnapshot,
                created_at as createdAt
         FROM transaction_amendments WHERE id = ?`,
      )
      .get(aid);
    res.status(201).json(row);
  });

  r.patch('/:id', (_req: StoreAuthedRequest, res) => {
    res.status(403).json({ error: 'Direct edits are not allowed; use amendment workflow' });
  });

  r.delete('/:id', (_req: StoreAuthedRequest, res) => {
    res.status(403).json({ error: 'Direct deletes are not allowed; use amendment workflow' });
  });

  return r;
}
