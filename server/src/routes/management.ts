import { Router } from 'express';
import type Database from 'better-sqlite3';
import { randomUUID } from 'node:crypto';
import type { StoreAuthedRequest } from '../middleware/storeMember.js';
import {
  isStoreShareholderRoleName,
  restrictStoreTransactionsToOwnUser,
} from '../lib/storeAuth.js';

export function createManagementRouter(db: Database.Database) {
  const r = Router();

  r.get('/', (req: StoreAuthedRequest, res) => {
    const ctx = req.storeCtx!;
    if (isStoreShareholderRoleName(req.storeRole) && !ctx.isSuperAdmin && !ctx.canViewOverview) {
      res.status(403).json({ error: 'Shareholders cannot view management items' });
      return;
    }
    /** 与 POST 一致：可看概览者看全店；仅有录入权者（如收银员）也可拉列表，由下方 ownOnly 收窄为本人相关 */
    if (!ctx.canViewOverview && !ctx.isSuperAdmin && !ctx.canRecord) {
      res.status(403).json({ error: 'No permission to view management items' });
      return;
    }
    let sql = `SELECT m.id, m.title, m.note, m.status, m.type, m.occurred_at as occurredAt, m.created_at as createdAt,
         m.reviewed_by as reviewedBy, m.reviewed_at as reviewedAt, m.reject_reason as rejectReason,
         u.name as createdByName, ru.name as reviewedByName
         FROM management_items m
         LEFT JOIN users u ON u.id = m.user_id
         LEFT JOIN users ru ON ru.id = m.reviewed_by
         WHERE m.store_id = ?`;
    const params: unknown[] = [req.storeId!];
    const ownOnly = restrictStoreTransactionsToOwnUser(req.storeRole, ctx);
    if (ownOnly) {
      sql += ' AND m.user_id = ?';
      params.push(req.userId!);
    }
    sql += ' ORDER BY m.occurred_at DESC';
    const rows = db.prepare(sql).all(...params);
    res.json(rows);
  });

  r.post('/', (req: StoreAuthedRequest, res) => {
    const ctx = req.storeCtx!;
    if (!ctx.canRecord) {
      res.status(403).json({ error: 'No permission to create management items' });
      return;
    }
    const body = req.body ?? {};
    const { title, date, type } = body as { title?: string; date?: string; type?: string; note?: string };
    if (!title || typeof title !== 'string') {
      res.status(400).json({ error: 'title required' });
      return;
    }
    const rawNote =
      typeof body.note === 'string'
        ? body.note
        : typeof (body as { subtitle?: string }).subtitle === 'string'
          ? (body as { subtitle: string }).subtitle
          : '';
    const note = rawNote.trim();
    const itemType = type === 'approval' ? 'approval' : 'notification';
    const dateStr = typeof date === 'string' && date ? date : new Date().toISOString().slice(0, 10);
    const occurredAt = `${dateStr}T12:00:00.000Z`;
    const id = randomUUID();
    const now = new Date().toISOString();
    db.prepare(
      `INSERT INTO management_items (id, store_id, user_id, title, status, type, occurred_at, created_at, note)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run(id, req.storeId!, req.userId!, title, '待审批', itemType, occurredAt, now, note);
    const row = db
      .prepare(
        `SELECT m.id, m.title, m.note, m.status, m.type, m.occurred_at as occurredAt, m.created_at as createdAt,
         m.reviewed_by as reviewedBy, m.reviewed_at as reviewedAt, m.reject_reason as rejectReason,
         u.name as createdByName, ru.name as reviewedByName
         FROM management_items m
         LEFT JOIN users u ON u.id = m.user_id
         LEFT JOIN users ru ON ru.id = m.reviewed_by
         WHERE m.id = ?`,
      )
      .get(id);
    res.status(201).json(row);
  });

  r.patch('/:itemId', (req: StoreAuthedRequest, res) => {
    const ctx = req.storeCtx!;
    if (!ctx.isOwner) {
      res.status(403).json({ error: 'Only store owner or admin can review management items' });
      return;
    }
    const action = (req.body as { action?: string })?.action;
    const rejectReason = (req.body as { rejectReason?: string })?.rejectReason;
    if (action !== 'approve' && action !== 'reject') {
      res.status(400).json({ error: 'action must be approve or reject' });
      return;
    }
    const row = db
      .prepare(`SELECT * FROM management_items WHERE id = ? AND store_id = ?`)
      .get(req.params.itemId, req.storeId!) as Record<string, unknown> | undefined;
    if (!row) {
      res.status(404).json({ error: 'not found' });
      return;
    }
    const st = row.status as string;
    if (st !== '待审批' && st !== '待处理') {
      res.status(409).json({ error: 'Item is not pending review' });
      return;
    }
    const now = new Date().toISOString();
    if (action === 'reject') {
      db.prepare(
        `UPDATE management_items SET status = '已拒绝', reviewed_by = ?, reviewed_at = ?, reject_reason = ?
         WHERE id = ? AND store_id = ?`,
      ).run(
        req.userId!,
        now,
        typeof rejectReason === 'string' ? rejectReason : '',
        req.params.itemId,
        req.storeId!,
      );
    } else {
      db.prepare(
        `UPDATE management_items SET status = '已通过', reviewed_by = ?, reviewed_at = ?, reject_reason = NULL
         WHERE id = ? AND store_id = ?`,
      ).run(req.userId!, now, req.params.itemId, req.storeId!);
    }
    const out = db
      .prepare(
        `SELECT m.id, m.title, m.note, m.status, m.type, m.occurred_at as occurredAt, m.created_at as createdAt,
         m.reviewed_by as reviewedBy, m.reviewed_at as reviewedAt, m.reject_reason as rejectReason,
         u.name as createdByName, ru.name as reviewedByName
         FROM management_items m
         LEFT JOIN users u ON u.id = m.user_id
         LEFT JOIN users ru ON ru.id = m.reviewed_by
         WHERE m.id = ?`,
      )
      .get(req.params.itemId);
    res.json(out);
  });

  return r;
}
