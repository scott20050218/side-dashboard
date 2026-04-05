import { Router } from 'express';
import type Database from 'better-sqlite3';
import { randomUUID } from 'node:crypto';
import type { AuthedRequest } from '../middleware/authJwt.js';
import { isSuperAdmin } from '../lib/storeAuth.js';

export function createAdminStoresRouter(db: Database.Database) {
  const r = Router();

  r.use((req: AuthedRequest, res, next) => {
    if (!isSuperAdmin(db, req.userId!)) {
      res.status(403).json({ error: 'Admin only' });
      return;
    }
    next();
  });

  r.post('/stores', (req: AuthedRequest, res) => {
    const { name, ownerUserId } = req.body ?? {};
    if (!name || typeof name !== 'string' || !ownerUserId || typeof ownerUserId !== 'string') {
      res.status(400).json({ error: 'name and ownerUserId required' });
      return;
    }
    const ownerRow = db
      .prepare(
        `SELECT u.id, r.name as role_name FROM users u JOIN roles r ON r.id = u.role_id WHERE u.id = ?`,
      )
      .get(ownerUserId) as { id: string; role_name: string } | undefined;
    if (!ownerRow) {
      res.status(404).json({ error: 'Owner user not found' });
      return;
    }
    if (ownerRow.role_name === '超级管理员') {
      res.status(400).json({ error: '登记店主不能为超级管理员，请选择实际老板/店长账号' });
      return;
    }
    const id = randomUUID();
    const now = new Date().toISOString();
    db.prepare(
      `INSERT INTO stores (id, name, created_at, created_by_admin_id)
       VALUES (?, ?, ?, ?)`,
    ).run(id, name, now, req.userId!);
    db.prepare(
      `INSERT INTO store_members (user_id, store_id, role_id, can_view_overview, can_view_transaction_lines, can_record, created_at)
       VALUES (?, ?, '5', 1, 1, 1, ?)`,
    ).run(ownerUserId, id, now);
    const row = db
      .prepare(`SELECT id, name, created_at as createdAt FROM stores WHERE id = ?`)
      .get(id);
    res.status(201).json(row);
  });

  r.get('/stores', (_req: AuthedRequest, res) => {
    const rows = db
      .prepare(
        `SELECT s.id, s.name, s.created_at as createdAt,
                (SELECT sm.user_id FROM store_members sm
                 WHERE sm.store_id = s.id AND sm.role_id = '5' LIMIT 1) as ownerUserId,
                (SELECT u.name FROM store_members sm
                 JOIN users u ON u.id = sm.user_id
                 WHERE sm.store_id = s.id AND sm.role_id = '5' LIMIT 1) as ownerName
         FROM stores s
         ORDER BY s.created_at DESC`,
      )
      .all();
    res.json(rows);
  });

  return r;
}
