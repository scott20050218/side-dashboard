import type { Transaction } from '../types';

/** `2026.04` → 用于匹配 `transaction.date` 前缀 `2026-04` */
export function monthDotToDatePrefix(monthDot: string): string | null {
  const parts = monthDot.trim().split('.');
  if (parts.length !== 2) return null;
  const y = parts[0].trim();
  const mo = parts[1].trim().padStart(2, '0');
  if (!/^\d{4}$/.test(y) || !/^\d{2}$/.test(mo)) return null;
  return `${y}-${mo}`;
}

/** 自当前月起向前共 `count` 个月，格式 `YYYY.MM` */
export function recentMonthDots(count: number, anchor: Date = new Date()): string[] {
  const out: string[] = [];
  const y = anchor.getFullYear();
  const m = anchor.getMonth();
  for (let i = 0; i < count; i++) {
    const d = new Date(y, m - i, 1);
    const ys = d.getFullYear();
    const ms = String(d.getMonth() + 1).padStart(2, '0');
    out.push(`${ys}.${ms}`);
  }
  return out;
}

export type FlowRow = Transaction & { flowKind: 'income' | 'expense' };

/** 按金额绝对值：降序 = 大到小，升序 = 小到大 */
type MonthlyAmountSortDirection = 'asc' | 'desc';

function flowAmountAbs(row: FlowRow): number {
  const n = Number(row.amount);
  return Number.isFinite(n) ? Math.abs(n) : 0;
}

export function buildFlowRows(incomeList: Transaction[], expenseList: Transaction[], monthPrefix: string): FlowRow[] {
  const rows: FlowRow[] = [
    ...incomeList.filter((t) => t.date.startsWith(monthPrefix)).map((t) => ({ ...t, flowKind: 'income' as const })),
    ...expenseList.filter((t) => t.date.startsWith(monthPrefix)).map((t) => ({ ...t, flowKind: 'expense' as const })),
  ];
  return rows;
}

/** 本月收支：按金额绝对值排序；同额按 id 稳定排序（与发生日期、时刻无关） */
export function sortMonthlyFlowRowsByAmount(
  rows: FlowRow[],
  direction: MonthlyAmountSortDirection = 'desc',
): FlowRow[] {
  const copy = [...rows];
  copy.sort((a, b) => {
    const diff =
      direction === 'desc'
        ? flowAmountAbs(b) - flowAmountAbs(a)
        : flowAmountAbs(a) - flowAmountAbs(b);
    if (diff !== 0) return diff;
    return a.id.localeCompare(b.id);
  });
  return copy;
}

/** `2026-04-04` → `4月4日` */
export function formatMonthDay(ymd: string): string {
  const parts = ymd.split('-').map(Number);
  if (parts.length !== 3 || parts.some((n) => !Number.isFinite(n))) return ymd;
  return `${parts[1]}月${parts[2]}日`;
}

export function sumIncomeTotal(rows: FlowRow[]): number {
  return rows.filter((r) => r.flowKind === 'income').reduce((s, r) => s + Math.max(0, r.amount), 0);
}

export function sumExpenseTotal(rows: FlowRow[]): number {
  return rows.filter((r) => r.flowKind === 'expense').reduce((s, r) => s + Math.abs(r.amount), 0);
}

/** 按标题、副标题子串匹配（英文不区分大小写）；空查询视为全部匹配 */
export function matchesFlowSearch(row: FlowRow, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const hay = `${row.title}\n${row.subtitle}`.toLowerCase();
  return hay.includes(q);
}
