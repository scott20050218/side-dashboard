import { Router } from 'express';
import type Database from 'better-sqlite3';
import type { AuthedRequest } from '../middleware/authJwt.js';

export function createUsersRouter(db: Database.Database) {
  const r = Router();

  r.get('/', (_req: AuthedRequest, res) => {
    const rows = db
      .prepare(
        `SELECT u.id, u.name, u.status, u.email, u.avatar_url as avatar, r.name as role
         FROM users u JOIN roles r ON u.role_id = r.id ORDER BY u.created_at`,
      )
      .all();
    res.json(rows);
  });

  return r;
}
