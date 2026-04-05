import { Router } from 'express';
import type Database from 'better-sqlite3';
import { randomUUID } from 'node:crypto';
import bcrypt from 'bcryptjs';
import type { AuthedRequest } from '../middleware/authJwt.js';
import { assertStoreOwnerOrAdmin, getStoreMembership } from '../lib/storeAuth.js';

/** 本店新建账号：仅店长/收银员/股东（与「我的团队」一致） */
const STAFF_GLOBAL_ROLE_IDS = new Set(['2', '3', '4']);
/** 绑定已有用户到门店：可含老板（如转让） */
const BIND_STORE_ROLE_IDS = new Set(['2', '3', '4', '5']);

export function createStoresRouter(db: Database.Database) {
  const r = Router();

  r.get('/mine', (req: AuthedRequest, res) => {
    const rows = db
      .prepare(
        `SELECT s.id, s.name, r.name as storeRole,
                m.can_view_overview as canViewOverview, m.can_view_transaction_lines as canViewTransactionLines,
                COALESCE(m.can_record, 0) as canRecord
         FROM store_members m
         JOIN stores s ON s.id = m.store_id
         JOIN roles r ON r.id = m.role_id
         WHERE m.user_id = ?
         ORDER BY s.created_at`,
      )
      .all(req.userId!) as Record<string, unknown>[];
    res.json(
      rows.map((row) => ({
        id: row.id,
        name: row.name,
        storeRole: row.storeRole,
        canViewOverview: Boolean(row.canViewOverview),
        canViewTransactionLines: Boolean(row.canViewTransactionLines),
        canRecord: Boolean(row.canRecord),
        canManageStoreTeam: assertStoreOwnerOrAdmin(db, req.userId!, row.id as string),
      })),
    );
  });

  r.post('/:storeId/staff', (req: AuthedRequest, res) => {
    const { storeId } = req.params;
    if (!assertStoreOwnerOrAdmin(db, req.userId!, storeId)) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }
    if (!db.prepare(`SELECT 1 FROM stores WHERE id = ?`).get(storeId)) {
      res.status(404).json({ error: 'Store not found' });
      return;
    }
    const body = req.body ?? {};
    const username = typeof body.username === 'string' ? body.username.trim() : '';
    const email = typeof body.email === 'string' ? body.email.trim() : '';
    const password = typeof body.password === 'string' ? body.password : '';
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    const roleId = typeof body.roleId === 'string' ? body.roleId.trim() : '';
    if (!username || !email || !password || !name || !roleId) {
      res.status(400).json({ error: 'username, email, password, name, roleId required' });
      return;
    }
    if (!STAFF_GLOBAL_ROLE_IDS.has(roleId)) {
      res.status(400).json({ error: 'roleId 仅支持店长/收银员/股东（角色 id 2、3、4）' });
      return;
    }
    const roleRow = db
      .prepare(`SELECT id, name FROM roles WHERE id = ?`)
      .get(roleId) as { id: string; name: string } | undefined;
    if (!roleRow || roleRow.name === '超级管理员') {
      res.status(400).json({ error: 'Invalid roleId' });
      return;
    }
    const canViewOverview = Boolean(body.canViewOverview) ? 1 : 0;
    const canViewLines = Boolean(body.canViewTransactionLines) ? 1 : 0;
    const canRec = Boolean(body.canRecord) ? 1 : 0;
    const uid = randomUUID();
    const now = new Date().toISOString();
    const hash = bcrypt.hashSync(password, 10);
    try {
      const run = db.transaction(() => {
        db.prepare(
          `INSERT INTO users (id, username, email, password_hash, name, role_id, status, avatar_url, created_at)
           VALUES (?, ?, ?, ?, ?, ?, 'active', '', ?)`,
        ).run(uid, username, email, hash, name, roleId, now);
        db.prepare(
          `INSERT INTO store_members (user_id, store_id, role_id, can_view_overview, can_view_transaction_lines, can_record, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
        ).run(uid, storeId, roleId, canViewOverview, canViewLines, canRec, now);
      });
      run();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : '';
      if (msg.includes('UNIQUE')) {
        res.status(409).json({ error: '用户名或邮箱已存在' });
        return;
      }
      throw e;
    }
    res.status(201).json({
      id: uid,
      name,
      username,
      email,
      role: roleRow.name,
      storeId,
      storeRole: roleRow.name,
    });
  });

  r.get('/:storeId/members', (req: AuthedRequest, res) => {
    const { storeId } = req.params;
    if (!assertStoreOwnerOrAdmin(db, req.userId!, storeId)) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }
    const rows = db
      .prepare(
        `SELECT m.user_id as userId, u.name, u.username, u.email, r.name as storeRole,
                m.can_view_overview as canViewOverview, m.can_view_transaction_lines as canViewTransactionLines,
                COALESCE(m.can_record, 0) as canRecord
         FROM store_members m
         JOIN users u ON u.id = m.user_id
         JOIN roles r ON r.id = m.role_id
         WHERE m.store_id = ?`,
      )
      .all(storeId);
    res.json(rows);
  });

  r.post('/:storeId/members', (req: AuthedRequest, res) => {
    const { storeId } = req.params;
    if (!assertStoreOwnerOrAdmin(db, req.userId!, storeId)) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }
    const exists = db.prepare(`SELECT 1 FROM stores WHERE id = ?`).get(storeId);
    if (!exists) {
      res.status(404).json({ error: 'Store not found' });
      return;
    }
    const body = req.body ?? {};
    const username = body.username as string | undefined;
    const roleId = typeof body.roleId === 'string' ? body.roleId.trim() : '';
    if (!username || !BIND_STORE_ROLE_IDS.has(roleId)) {
      res.status(400).json({ error: 'username and roleId (2|3|4|5 店长|收银员|股东|老板) required' });
      return;
    }
    const roleRow = db
      .prepare(`SELECT id, name FROM roles WHERE id = ?`)
      .get(roleId) as { id: string; name: string } | undefined;
    if (!roleRow || roleRow.name === '超级管理员') {
      res.status(400).json({ error: 'Invalid roleId' });
      return;
    }
    const target = db
      .prepare(`SELECT id FROM users WHERE username = ? OR email = ?`)
      .get(username, username) as { id: string } | undefined;
    if (!target) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    const canViewOverview = Boolean(body.canViewOverview) ? 1 : 0;
    const canViewLines = Boolean(body.canViewTransactionLines) ? 1 : 0;
    const canRecord = Boolean(body.canRecord) ? 1 : 0;
    const now = new Date().toISOString();
    db.prepare(`UPDATE users SET role_id = ? WHERE id = ?`).run(roleId, target.id);
    db.prepare(
      `INSERT INTO store_members (user_id, store_id, role_id, can_view_overview, can_view_transaction_lines, can_record, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(user_id, store_id) DO UPDATE SET
         role_id = excluded.role_id,
         can_view_overview = excluded.can_view_overview,
         can_view_transaction_lines = excluded.can_view_transaction_lines,
         can_record = excluded.can_record`,
    ).run(target.id, storeId, roleId, canViewOverview, canViewLines, canRecord, now);
    const row = getStoreMembership(db, target.id, storeId);
    res.status(201).json(row);
  });

  r.delete('/:storeId/members/:userId', (req: AuthedRequest, res) => {
    const { storeId, userId } = req.params;
    if (!assertStoreOwnerOrAdmin(db, req.userId!, storeId)) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }
    const mem = db
      .prepare(
        `SELECT m.role_id, r.name as role_name FROM store_members m
         JOIN roles r ON r.id = m.role_id
         WHERE m.store_id = ? AND m.user_id = ?`,
      )
      .get(storeId, userId) as { role_id: string; role_name: string } | undefined;
    if (mem?.role_name === '老板') {
      res.status(400).json({ error: 'Cannot remove store owner; assign another owner first' });
      return;
    }
    const r0 = db
      .prepare(`DELETE FROM store_members WHERE store_id = ? AND user_id = ?`)
      .run(storeId, userId);
    if (r0.changes === 0) {
      res.status(404).json({ error: 'not found' });
      return;
    }
    res.status(204).send();
  });

  return r;
}
