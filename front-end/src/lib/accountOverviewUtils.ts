import type { Transaction } from '../types';

/** `2026-04` → `2026年4月` */
export function formatOverviewMonthCn(ym: string): string {
  const [y, m] = ym.trim().split('-');
  if (!y || !m) return ym;
  const mi = Number(m);
  if (!Number.isFinite(mi)) return ym;
  return `${y}年${mi}月`;
}

export type TitleAggregate = { title: string; total: number; count: number };

export function aggregateIncomeByTitleForMonth(
  items: Transaction[],
  monthPrefix: string,
): TitleAggregate[] {
  const map = new Map<string, { total: number; count: number }>();
  for (const t of items) {
    if (!t.date.startsWith(monthPrefix)) continue;
    const e = map.get(t.title) ?? { total: 0, count: 0 };
    e.total += Math.max(0, Number(t.amount) || 0);
    e.count += 1;
    map.set(t.title, e);
  }
  return [...map.entries()]
    .map(([title, v]) => ({ title, ...v }))
    .sort((a, b) => b.total - a.total);
}

export function aggregateExpenseByTitleForMonth(
  items: Transaction[],
  monthPrefix: string,
): TitleAggregate[] {
  const map = new Map<string, { total: number; count: number }>();
  for (const t of items) {
    if (!t.date.startsWith(monthPrefix)) continue;
    const e = map.get(t.title) ?? { total: 0, count: 0 };
    e.total += Math.abs(Number(t.amount) || 0);
    e.count += 1;
    map.set(t.title, e);
  }
  return [...map.entries()]
    .map(([title, v]) => ({ title, ...v }))
    .sort((a, b) => b.total - a.total);
}
