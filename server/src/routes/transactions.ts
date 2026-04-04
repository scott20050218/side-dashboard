import { Router } from 'express';
import type Database from 'better-sqlite3';
import { randomUUID } from 'node:crypto';
import type { AuthedRequest } from '../middleware/authJwt.js';

export function createTransactionsRouter(db: Database.Database) {
  const r = Router();

  r.get('/', (req: AuthedRequest, res) => {
    const kind = req.query.kind as string | undefined;
    if (kind && kind !== 'income' && kind !== 'expense') {
      res.status(400).json({ error: 'kind must be income or expense' });
      return;
    }
    let sql =
      `SELECT id, kind, title, subtitle, amount, occurred_at as occurredAt, created_at as createdAt
       FROM transactions WHERE user_id = ?`;
    const params: string[] = [req.userId!];
    if (kind) {
      sql += ' AND kind = ?';
      params.push(kind);
    }
    sql += ' ORDER BY occurred_at DESC';
    const rows = db.prepare(sql).all(...params);
    res.json(rows);
  });

  r.post('/', (req: AuthedRequest, res) => {
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
      `INSERT INTO transactions (id, user_id, kind, title, subtitle, amount, occurred_at, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run(
      id,
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

  r.patch('/:id', (req: AuthedRequest, res) => {
    const { title, subtitle, amount, date, kind } = req.body ?? {};
    const existing = db
      .prepare('SELECT * FROM transactions WHERE id = ? AND user_id = ?')
      .get(req.params.id, req.userId!) as Record<string, unknown> | undefined;
    if (!existing) {
      res.status(404).json({ error: 'not found' });
      return;
    }
    const nextKind =
      kind === 'income' || kind === 'expense' ? kind : (existing.kind as string);
    let nextAmount = existing.amount as number;
    if (amount !== undefined) {
      const num = Number(amount);
      if (!Number.isFinite(num)) {
        res.status(400).json({ error: 'invalid amount' });
        return;
      }
      nextKind === 'income'
        ? (nextAmount = Math.abs(num))
        : (nextAmount = num > 0 ? -Math.abs(num) : -Math.abs(num));
    }
    const nextTitle = typeof title === 'string' ? title : (existing.title as string);
    const nextSubtitle =
      typeof subtitle === 'string' ? subtitle : (existing.subtitle as string);
    let occurredAt = existing.occurred_at as string;
    if (typeof date === 'string' && date) {
      occurredAt = `${date}T12:00:00.000Z`;
    }
    db.prepare(
      `UPDATE transactions SET kind = ?, title = ?, subtitle = ?, amount = ?, occurred_at = ?
       WHERE id = ? AND user_id = ?`,
    ).run(nextKind, nextTitle, nextSubtitle, nextAmount, occurredAt, req.params.id, req.userId!);
    const row = db
      .prepare(
        `SELECT id, kind, title, subtitle, amount, occurred_at as occurredAt, created_at as createdAt
         FROM transactions WHERE id = ?`,
      )
      .get(req.params.id);
    res.json(row);
  });

  r.delete('/:id', (req: AuthedRequest, res) => {
    const r0 = db
      .prepare('DELETE FROM transactions WHERE id = ? AND user_id = ?')
      .run(req.params.id, req.userId!);
    if (r0.changes === 0) {
      res.status(404).json({ error: 'not found' });
      return;
    }
    res.status(204).send();
  });

  return r;
}
