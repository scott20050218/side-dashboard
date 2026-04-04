import { Router } from 'express';
import type Database from 'better-sqlite3';
import { randomUUID } from 'node:crypto';
import type { AuthedRequest } from '../middleware/authJwt.js';

export function createManagementRouter(db: Database.Database) {
  const r = Router();

  r.get('/', (req: AuthedRequest, res) => {
    const rows = db
      .prepare(
        `SELECT id, title, status, type, occurred_at as occurredAt, created_at as createdAt
         FROM management_items WHERE user_id = ? ORDER BY occurred_at DESC`,
      )
      .all(req.userId!);
    res.json(rows);
  });

  r.post('/', (req: AuthedRequest, res) => {
    const { title, subtitle: _s, date, type } = req.body ?? {};
    if (!title || typeof title !== 'string') {
      res.status(400).json({ error: 'title required' });
      return;
    }
    const itemType =
      type === 'approval' ? 'approval' : 'notification';
    const dateStr = typeof date === 'string' && date ? date : new Date().toISOString().slice(0, 10);
    const occurredAt = `${dateStr}T12:00:00.000Z`;
    const id = randomUUID();
    const now = new Date().toISOString();
    db.prepare(
      `INSERT INTO management_items (id, user_id, title, status, type, occurred_at, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    ).run(id, req.userId!, title, '待处理', itemType, occurredAt, now);
    const row = db
      .prepare(
        `SELECT id, title, status, type, occurred_at as occurredAt, created_at as createdAt
         FROM management_items WHERE id = ?`,
      )
      .get(id);
    res.status(201).json(row);
  });

  return r;
}
