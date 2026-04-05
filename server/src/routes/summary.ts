import { Router } from 'express';
import type Database from 'better-sqlite3';
import type { StoreAuthedRequest } from '../middleware/storeMember.js';
import { restrictStoreTransactionsToOwnUser } from '../lib/storeAuth.js';

export function createSummaryRouter(db: Database.Database) {
  const r = Router();

  r.get('/', (req: StoreAuthedRequest, res) => {
    const ctx = req.storeCtx!;
    if (!ctx.canViewOverview) {
      res.status(403).json({ error: 'No permission to view overview / summary' });
      return;
    }
    const from = req.query.from as string | undefined;
    const to = req.query.to as string | undefined;
    if (!from || !to) {
      res.status(400).json({ error: 'from and to query params required (YYYY-MM-DD)' });
      return;
    }
    const fromIso = `${from}T00:00:00.000Z`;
    const toIso = `${to}T23:59:59.999Z`;
    const ownOnlyRange = restrictStoreTransactionsToOwnUser(req.storeRole, ctx);
    const ownClauseRange = ownOnlyRange ? ' AND user_id = ?' : '';
    const incParams: unknown[] = [req.storeId!, fromIso, toIso];
    const expParams: unknown[] = [req.storeId!, fromIso, toIso];
    if (ownOnlyRange) {
      incParams.push(req.userId!);
      expParams.push(req.userId!);
    }
    const income = db
      .prepare(
        `SELECT COALESCE(SUM(amount), 0) as total FROM transactions
         WHERE store_id = ? AND kind = 'income' AND occurred_at >= ? AND occurred_at <= ?${ownClauseRange}`,
      )
      .get(...incParams) as { total: number };
    const expense = db
      .prepare(
        `SELECT COALESCE(SUM(amount), 0) as total FROM transactions
         WHERE store_id = ? AND kind = 'expense' AND occurred_at >= ? AND occurred_at <= ?${ownClauseRange}`,
      )
      .get(...expParams) as { total: number };
    res.json({
      from,
      to,
      incomeTotal: income.total,
      expenseTotal: expense.total,
      net: income.total + expense.total,
    });
  });

  r.get('/overview', (req: StoreAuthedRequest, res) => {
    const ctx = req.storeCtx!;
    if (!ctx.canViewOverview) {
      res.status(403).json({ error: 'No permission to view overview' });
      return;
    }
    const now = new Date();
    const y = now.getUTCFullYear();
    const m = now.getUTCMonth() + 1;
    const pad = (n: number) => String(n).padStart(2, '0');
    const from = `${y}-${pad(m)}-01`;
    const lastDay = new Date(Date.UTC(y, m, 0)).getUTCDate();
    const to = `${y}-${pad(m)}-${pad(lastDay)}`;
    const fromIso = `${from}T00:00:00.000Z`;
    const toIso = `${to}T23:59:59.999Z`;
    const ownOnlyOv = restrictStoreTransactionsToOwnUser(req.storeRole, ctx);
    const ownClauseOv = ownOnlyOv ? ' AND user_id = ?' : '';
    const incParams: unknown[] = [req.storeId!, fromIso, toIso];
    const expParams: unknown[] = [req.storeId!, fromIso, toIso];
    if (ownOnlyOv) {
      incParams.push(req.userId!);
      expParams.push(req.userId!);
    }
    const income = db
      .prepare(
        `SELECT COALESCE(SUM(amount), 0) as total FROM transactions
         WHERE store_id = ? AND kind = 'income' AND occurred_at >= ? AND occurred_at <= ?${ownClauseOv}`,
      )
      .get(...incParams) as { total: number };
    const expense = db
      .prepare(
        `SELECT COALESCE(SUM(amount), 0) as total FROM transactions
         WHERE store_id = ? AND kind = 'expense' AND occurred_at >= ? AND occurred_at <= ?${ownClauseOv}`,
      )
      .get(...expParams) as { total: number };
    const store = db
      .prepare(`SELECT id, name FROM stores WHERE id = ?`)
      .get(req.storeId!) as { id: string; name: string };
    res.json({
      store,
      month: `${y}-${pad(m)}`,
      incomeTotal: income.total,
      expenseTotal: expense.total,
      net: income.total + expense.total,
    });
  });

  return r;
}
