import { Router } from 'express';
import type Database from 'better-sqlite3';
import type { AuthedRequest } from '../middleware/authJwt.js';

export function createRolesRouter(db: Database.Database) {
  const r = Router();

  r.get('/', (_req: AuthedRequest, res) => {
    const rows = db.prepare('SELECT id, name, permissions FROM roles ORDER BY id').all() as Array<{
      id: string;
      name: string;
      permissions: string;
    }>;
    res.json(
      rows.map((row) => ({
        id: row.id,
        name: row.name,
        permissions: JSON.parse(row.permissions) as string[],
      })),
    );
  });

  return r;
}
