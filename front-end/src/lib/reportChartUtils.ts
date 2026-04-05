import type { Transaction } from '../types';
import type { TitleAggregate } from './accountOverviewUtils';

/** 根据 `overview.month`（YYYY-MM）得到上一自然月的 from/to（YYYY-MM-DD） */
export function prevMonthRange(ym: string): { from: string; to: string } | null {
  const parts = ym.trim().match(/^(\d{4})-(\d{2})$/);
  if (!parts) return null;
  let y = Number(parts[1]);
  let mo = Number(parts[2]) - 1;
  if (mo < 1) {
    mo = 12;
    y -= 1;
  }
  const pad = (n: number) => String(n).padStart(2, '0');
  const lastDay = new Date(Date.UTC(y, mo, 0)).getUTCDate();
  return {
    from: `${y}-${pad(mo)}-01`,
    to: `${y}-${pad(mo)}-${pad(lastDay)}`,
  };
}

/** 当月收入按日汇总，取最近 `maxDays` 个有数据的日期（升序），用于趋势图 */
export function buildDailyIncomeSeries(
  incomeList: Transaction[],
  monthPrefix: string,
  maxDays: number,
): { name: string; value: number }[] {
  const dayMap = new Map<string, number>();
  for (const t of incomeList) {
    if (!t.date.startsWith(monthPrefix)) continue;
    const v = Math.max(0, Number(t.amount) || 0);
    dayMap.set(t.date, (dayMap.get(t.date) ?? 0) + v);
  }
  const dates = [...dayMap.keys()].sort();
  const slice = dates.length <= maxDays ? dates : dates.slice(-maxDays);
  return slice.map((d) => ({
    name: `${Number(d.slice(5, 7))}.${Number(d.slice(8, 10))}`,
    value: Math.round((dayMap.get(d) ?? 0) * 100) / 100,
  }));
}

const PIE_COLORS = ['#6462cc', '#f27d51', '#5ec9db', '#fdc765', '#94a3b8'];

type PieSlice = { name: string; value: number; color: string };

/** 收入按标题汇总：取前 4 项，其余合并为「其他」 */
export function incomeAggregatesToPieSlices(aggregates: TitleAggregate[]): PieSlice[] {
  if (aggregates.length === 0) return [];
  const top = aggregates.slice(0, 4);
  const restSum = aggregates.slice(4).reduce((s, r) => s + r.total, 0);
  const out: PieSlice[] = top.map((r, i) => ({
    name: r.title,
    value: r.total,
    color: PIE_COLORS[i % PIE_COLORS.length],
  }));
  if (restSum > 0.005) {
    out.push({ name: '其他', value: restSum, color: PIE_COLORS[4] });
  }
  return out;
}

/** 热销 Top N：按收入标题汇总后取前若干条 */
export function topIncomeTitlesForBar(
  aggregates: TitleAggregate[],
  n: number,
): { name: string; value: number }[] {
  return aggregates.slice(0, n).map((r) => ({
    name: r.title.length > 8 ? `${r.title.slice(0, 8)}…` : r.title,
    value: Math.round(r.total * 100) / 100,
  }));
}

export function countMonthIncomeLines(incomeList: Transaction[], monthPrefix: string): number {
  return incomeList.filter((t) => t.date.startsWith(monthPrefix)).length;
}
