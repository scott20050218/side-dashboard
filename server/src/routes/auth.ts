import { Router } from 'express';
import type Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

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
        `SELECT u.id, u.username, u.email, u.password_hash, u.name, u.status, u.avatar_url, r.name as role_name
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

    const token = jwt.sign({ sub: row.id }, jwtSecret, { expiresIn: '7d' });
    res.json({
      token,
      user: {
        id: row.id,
        name: row.name,
        username: row.username,
        email: row.email,
        role: row.role_name,
        status: row.status,
        avatar: row.avatar_url ?? '',
      },
    });
  });

  return r;
}
