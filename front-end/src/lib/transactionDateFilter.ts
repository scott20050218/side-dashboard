import type { FilterType } from '../components/DateFilter';

/** 本地日历「今天」的 YYYY-MM-DD，与 mapApiTransaction 的 item.date 一致 */
function localTodayYmd(): string {
  const n = new Date();
  const y = n.getFullYear();
  const m = String(n.getMonth() + 1).padStart(2, '0');
  const d = String(n.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** 解析 YYYY-MM-DD 为本地日期的 0 点，避免 `new Date('2026-04-05')` 的 UTC 偏移 */
function parseYmdLocal(ymd: string): Date {
  const parts = ymd.split('-').map((x) => parseInt(x, 10));
  if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) {
    return new Date(NaN);
  }
  const [yy, mm, dd] = parts;
  return new Date(yy!, mm! - 1, dd!);
}

export function filterByDateFilter<T extends { date: string }>(
  items: T[],
  filter: { type: FilterType; start?: string; end?: string },
): T[] {
  const today = new Date();
  const todayYmd = localTodayYmd();

  return items.filter((item) => {
    const itemDate = parseYmdLocal(item.date);
    if (Number.isNaN(itemDate.getTime())) return false;

    if (filter.type === 'day') {
      return item.date === todayYmd;
    }
    if (filter.type === 'week') {
      const start = new Date(today);
      start.setDate(today.getDate() - 6);
      start.setHours(0, 0, 0, 0);
      const end = new Date(today);
      end.setHours(23, 59, 59, 999);
      return itemDate >= start && itemDate <= end;
    }
    if (filter.type === 'month') {
      return itemDate.getMonth() === today.getMonth() && itemDate.getFullYear() === today.getFullYear();
    }
    if (filter.type === 'custom' && filter.start && filter.end) {
      const start = parseYmdLocal(filter.start);
      start.setHours(0, 0, 0, 0);
      const end = parseYmdLocal(filter.end);
      end.setHours(23, 59, 59, 999);
      return itemDate >= start && itemDate <= end;
    }
    return true;
  });
}
