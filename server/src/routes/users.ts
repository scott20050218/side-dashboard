import { Router } from 'express';
import type Database from 'better-sqlite3';
import { randomUUID } from 'node:crypto';
import bcrypt from 'bcryptjs';
import type { AuthedRequest } from '../middleware/authJwt.js';
import { getUserGlobalRoleName, isSuperAdmin } from '../lib/storeAuth.js';

const SUPER_ADMIN_ROLE_NAME = '超级管理员';
const MANAGER_ROLE_NAME = '店长';
/** 超管创建门店用户：老板/店长/收银员/股东（与 users.role_id 一致） */
const STORE_BIND_ROLE_IDS = new Set(['2', '3', '4', '5']);

export function createUsersRouter(db: Database.Database) {
  const r = Router();

  r.get('/', (req: AuthedRequest, res) => {
    if (!isSuperAdmin(db, req.userId!)) {
      res.json([]);
      return;
    }
    const rows = db
      .prepare(
        `SELECT u.id, u.username, u.name, u.status, u.email, u.avatar_url as avatar, u.role_id as roleId, r.name as role
         FROM users u JOIN roles r ON u.role_id = r.id ORDER BY u.created_at`,
      )
      .all();
    res.json(rows);
  });

  r.patch('/:id', (req: AuthedRequest, res) => {
    const actorId = req.userId!;
    if (!isSuperAdmin(db, actorId)) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    const id = typeof req.params.id === 'string' ? req.params.id.trim() : '';
    if (!id) {
      res.status(400).json({ error: 'Invalid id' });
      return;
    }

    const target = db
      .prepare(
        `SELECT u.id, u.username, u.email, u.name, u.role_id, u.status, r.name as role_name
         FROM users u JOIN roles r ON u.role_id = r.id WHERE u.id = ?`,
      )
      .get(id) as
      | {
          id: string;
          username: string;
          email: string;
          name: string;
          role_id: string;
          status: string;
          password_hash: string;
          role_name: string;
        }
      | undefined;

    if (!target) {
      res.status(404).json({ error: '用户不存在' });
      return;
    }

    const body = req.body ?? {};
    const nameIn = typeof body.name === 'string' ? body.name.trim() : undefined;
    const emailIn = typeof body.email === 'string' ? body.email.trim() : undefined;
    const usernameIn = typeof body.username === 'string' ? body.username.trim() : undefined;
    const roleIdIn = typeof body.roleId === 'string' ? body.roleId.trim() : undefined;
    const statusIn = body.status === 'active' || body.status === 'inactive' ? body.status : undefined;
    const passwordIn = typeof body.password === 'string' ? body.password : '';

    const activeSuperCount = (
      db
        .prepare(
          `SELECT COUNT(*) as c FROM users u
           JOIN roles r ON r.id = u.role_id
           WHERE r.name = ? AND u.status = 'active'`,
        )
        .get(SUPER_ADMIN_ROLE_NAME) as { c: number }
    ).c;

    const targetWasSuper = target.role_name === SUPER_ADMIN_ROLE_NAME;

    let nextRoleId = target.role_id;
    let nextRoleName = target.role_name;
    if (roleIdIn !== undefined) {
      const rr = db.prepare(`SELECT id, name FROM roles WHERE id = ?`).get(roleIdIn) as
        | { id: string; name: string }
        | undefined;
      if (!rr) {
        res.status(400).json({ error: 'Invalid roleId' });
        return;
      }
      nextRoleId = rr.id;
      nextRoleName = rr.name;
    }

    if (id === actorId) {
      if (roleIdIn !== undefined && nextRoleName !== SUPER_ADMIN_ROLE_NAME) {
        res.status(403).json({ error: '不能修改自己的超级管理员角色' });
        return;
      }
    }

    if (targetWasSuper && activeSuperCount <= 1) {
      if (roleIdIn !== undefined && nextRoleName !== SUPER_ADMIN_ROLE_NAME) {
        res.status(400).json({ error: '不能撤销唯一的超级管理员' });
        return;
      }
      if (statusIn === 'inactive') {
        res.status(400).json({ error: '不能停用唯一的超级管理员' });
        return;
      }
    }

    if (usernameIn !== undefined && usernameIn !== target.username) {
      const taken = db.prepare(`SELECT 1 as x FROM users WHERE username = ? AND id != ?`).get(usernameIn, id) as
        | { x: number }
        | undefined;
      if (taken) {
        res.status(409).json({ error: '用户名已被占用' });
        return;
      }
    }

    if (emailIn !== undefined && emailIn !== target.email) {
      const taken = db.prepare(`SELECT 1 as x FROM users WHERE email = ? AND id != ?`).get(emailIn, id) as
        | { x: number }
        | undefined;
      if (taken) {
        res.status(409).json({ error: '邮箱已被占用' });
        return;
      }
    }

    const sets: string[] = [];
    const params: (string | number)[] = [];

    if (nameIn !== undefined) {
      if (!nameIn) {
        res.status(400).json({ error: 'name required' });
        return;
      }
      sets.push('name = ?');
      params.push(nameIn);
    }
    if (emailIn !== undefined) {
      if (!emailIn) {
        res.status(400).json({ error: 'email required' });
        return;
      }
      sets.push('email = ?');
      params.push(emailIn);
    }
    if (usernameIn !== undefined) {
      if (!usernameIn) {
        res.status(400).json({ error: 'username required' });
        return;
      }
      sets.push('username = ?');
      params.push(usernameIn);
    }
    if (roleIdIn !== undefined) {
      sets.push('role_id = ?');
      params.push(nextRoleId);
    }
    if (statusIn !== undefined) {
      sets.push('status = ?');
      params.push(statusIn);
    }
    if (passwordIn.length > 0) {
      sets.push('password_hash = ?');
      params.push(bcrypt.hashSync(passwordIn, 10));
    }

    if (sets.length === 0) {
      res.status(400).json({ error: '无更新字段' });
      return;
    }

    params.push(id);

    const tx = db.transaction(() => {
      db.prepare(`UPDATE users SET ${sets.join(', ')} WHERE id = ?`).run(...params);
      if (roleIdIn !== undefined && nextRoleId !== target.role_id) {
        if (nextRoleName === SUPER_ADMIN_ROLE_NAME) {
          db.prepare(`DELETE FROM store_members WHERE user_id = ?`).run(id);
        } else {
          db.prepare(`UPDATE store_members SET role_id = ? WHERE user_id = ?`).run(nextRoleId, id);
        }
      }
    });

    try {
      tx();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : '';
      if (msg.includes('UNIQUE')) {
        res.status(409).json({ error: '用户名或邮箱已存在' });
        return;
      }
      throw e;
    }

    const row = db
      .prepare(
        `SELECT u.id, u.username, u.name, u.status, u.email, u.avatar_url as avatar, u.role_id as roleId, r.name as role
         FROM users u JOIN roles r ON u.role_id = r.id WHERE u.id = ?`,
      )
      .get(id);
    res.json(row);
  });

  r.post('/', (req: AuthedRequest, res) => {
    const actorId = req.userId!;
    const actorIsSuper = isSuperAdmin(db, actorId);
    const actorRoleName = getUserGlobalRoleName(db, actorId);
    const actorIsStoreManager = actorRoleName === MANAGER_ROLE_NAME;

    if (!actorIsSuper && !actorIsStoreManager) {
      res.status(403).json({ error: 'Forbidden' });
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

    const roleRow = db
      .prepare(`SELECT id, name FROM roles WHERE id = ?`)
      .get(roleId) as { id: string; name: string } | undefined;
    if (!roleRow) {
      res.status(400).json({ error: 'Invalid roleId' });
      return;
    }

    const newUserIsSuperAdmin = roleRow.name === SUPER_ADMIN_ROLE_NAME;

    if (actorIsStoreManager) {
      if (newUserIsSuperAdmin) {
        res.status(403).json({ error: 'Forbidden' });
        return;
      }
      const storeId = typeof body.storeId === 'string' ? body.storeId.trim() : '';
      if (storeId) {
        res.status(400).json({ error: '店长创建用户时不应绑定门店' });
        return;
      }
    }

    let storeId = typeof body.storeId === 'string' ? body.storeId.trim() : '';
    const canViewOverview = Boolean(body.canViewOverview) ? 1 : 0;
    const canViewLines = Boolean(body.canViewTransactionLines) ? 1 : 0;
    const canRecordBody = Boolean(body.canRecord) ? 1 : 0;

    if (actorIsSuper) {
      if (!newUserIsSuperAdmin) {
        if (!storeId || !STORE_BIND_ROLE_IDS.has(roleId)) {
          res.status(400).json({
            error: '非超级管理员需指定门店，且角色须为老板/店长/收银员/股东（roleId 2–5）',
          });
          return;
        }
        const storeOk = db.prepare(`SELECT id FROM stores WHERE id = ?`).get(storeId);
        if (!storeOk) {
          res.status(404).json({ error: '门店不存在' });
          return;
        }
      } else {
        if (storeId) {
          res.status(400).json({ error: '超级管理员账号无需绑定门店，请勿传 storeId' });
          return;
        }
        storeId = '';
      }
    }

    const id = randomUUID();
    const now = new Date().toISOString();
    const hash = bcrypt.hashSync(password, 10);

    const insertUser = () => {
      db.prepare(
        `INSERT INTO users (id, username, email, password_hash, name, role_id, status, avatar_url, created_at)
         VALUES (?, ?, ?, ?, ?, ?, 'active', ?, ?)`,
      ).run(id, username, email, hash, name, roleId, '', now);
    };

    const insertMember = () => {
      if (!actorIsSuper || newUserIsSuperAdmin || !storeId) return;
      db.prepare(
        `INSERT INTO store_members (user_id, store_id, role_id, can_view_overview, can_view_transaction_lines, can_record, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
      ).run(id, storeId, roleId, canViewOverview, canViewLines, canRecordBody, now);
    };

    try {
      const tx = db.transaction(() => {
        insertUser();
        insertMember();
      });
      tx();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : '';
      if (msg.includes('UNIQUE')) {
        res.status(409).json({ error: '用户名或邮箱已存在' });
        return;
      }
      throw e;
    }

    const row = db
      .prepare(
        `SELECT u.id, u.username, u.name, u.status, u.email, u.avatar_url as avatar, u.role_id as roleId, r.name as role
         FROM users u JOIN roles r ON u.role_id = r.id WHERE u.id = ?`,
      )
      .get(id);
    res.status(201).json(row);
  });

  return r;
}
