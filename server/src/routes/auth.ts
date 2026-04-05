import { Router } from 'express';
import type Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { assertStoreOwnerOrAdmin } from '../lib/storeAuth.js';

export function createAuthRouter(db: Database.Database, jwtSecret: string) {
  const r = Router();

  r.post('/login', (req, res) => {
    const username = (req.body?.username ?? req.body?.email ?? '') as string;
    const password = (req.body?.password ?? '') as string;
    if (!username || !password) {
      res.status(400).json({ error: 'username and password required' });
      return;
    }

    const row = db
      .prepare(
        `SELECT u.id, u.username, u.email, u.password_hash, u.name, u.status, u.avatar_url, r.name as role_name, r.permissions as role_permissions
         FROM users u JOIN roles r ON u.role_id = r.id
         WHERE u.username = ? OR u.email = ?`,
      )
      .get(username, username) as
      | {
          id: string;
          username: string;
          email: string;
          password_hash: string;
          name: string;
          status: string;
          avatar_url: string | null;
          role_name: string;
          role_permissions: string;
        }
      | undefined;

    if (!row || row.status !== 'active') {
      res.status(401).json({ error: '用户名或密码错误' });
      return;
    }

    if (!bcrypt.compareSync(password, row.password_hash)) {
      res.status(401).json({ error: '用户名或密码错误' });
      return;
    }

    let rolePermissions: string[] = [];
    try {
      const p = JSON.parse(row.role_permissions) as unknown;
      if (Array.isArray(p)) rolePermissions = p.filter((x): x is string => typeof x === 'string');
    } catch {
      rolePermissions = [];
    }

    const token = jwt.sign({ sub: row.id }, jwtSecret, { expiresIn: '7d' });
    const stores = db
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
      .all(row.id) as Array<{
        id: string;
        name: string;
        storeRole: string;
        canViewOverview: number;
        canViewTransactionLines: number;
        canRecord: number;
      }>;
    res.json({
      token,
      user: {
        id: row.id,
        name: row.name,
        username: row.username,
        email: row.email,
        role: row.role_name,
        rolePermissions,
        status: row.status,
        avatar: row.avatar_url ?? '',
        isSuperAdmin: row.role_name === '超级管理员',
        stores: stores.map((s) => ({
          id: s.id,
          name: s.name,
          storeRole: s.storeRole,
          canViewOverview: Boolean(s.canViewOverview),
          canViewTransactionLines: Boolean(s.canViewTransactionLines),
          canRecord: Boolean(s.canRecord),
          canManageStoreTeam: assertStoreOwnerOrAdmin(db, row.id, s.id),
        })),
      },
    });
  });

  return r;
}
