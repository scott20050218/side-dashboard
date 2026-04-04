import { Router } from 'express';
import type Database from 'better-sqlite3';
import type { AuthedRequest } from '../middleware/authJwt.js';

export function createSummaryRouter(db: Database.Database) {
  const r = Router();

  r.get('/', (req: AuthedRequest, res) => {
    const from = req.query.from as string | undefined;
    const to = req.query.to as string | undefined;
    if (!from || !to) {
      res.status(400).json({ error: 'from and to query params required (YYYY-MM-DD)' });
      return;
    }
    const fromIso = `${from}T00:00:00.000Z`;
    const toIso = `${to}T23:59:59.999Z`;
    const income = db
      .prepare(
        `SELECT COALESCE(SUM(amount), 0) as total FROM transactions
         WHERE user_id = ? AND kind = 'income' AND occurred_at >= ? AND occurred_at <= ?`,
      )
      .get(req.userId!, fromIso, toIso) as { total: number };
    const expense = db
      .prepare(
        `SELECT COALESCE(SUM(amount), 0) as total FROM transactions
         WHERE user_id = ? AND kind = 'expense' AND occurred_at >= ? AND occurred_at <= ?`,
      )
      .get(req.userId!, fromIso, toIso) as { total: number };
    res.json({
      from,
      to,
      incomeTotal: income.total,
      expenseTotal: expense.total,
      net: income.total + expense.total,
    });
  });

  return r;
}
