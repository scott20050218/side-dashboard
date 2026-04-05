import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { ChevronLeft, MoreHorizontal } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { View, Transaction } from '../types';
import { fetchSummary, ApiError } from '../lib/api';
import { formatOverviewMonthCn, aggregateIncomeByTitleForMonth } from '../lib/accountOverviewUtils';
import {
  prevMonthRange,
  buildDailyIncomeSeries,
  incomeAggregatesToPieSlices,
  topIncomeTitlesForBar,
  countMonthIncomeLines,
} from '../lib/reportChartUtils';

interface ReportProps {
  setView: (view: View) => void;
  overview: { incomeTotal: number; expenseTotal: number; month: string; net: number } | null;
  incomeList: Transaction[];
  storeId: string;
}

function fmtCurrency(n: number): string {
  return `¥ ${n.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export const Report = ({ setView, overview, incomeList, storeId }: ReportProps) => {
  const [trendDays, setTrendDays] = useState<7 | 30>(7);
  const [prevMonthIncome, setPrevMonthIncome] = useState<number | null>(null);

  const monthPrefix = overview?.month ?? '';

  useEffect(() => {
    if (!monthPrefix || !storeId.trim()) {
      setPrevMonthIncome(null);
      return;
    }
    const range = prevMonthRange(monthPrefix);
    if (!range) {
      setPrevMonthIncome(null);
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const s = await fetchSummary(range.from, range.to, storeId);
        if (!cancelled) setPrevMonthIncome(s.incomeTotal);
      } catch (e) {
        if (!cancelled) {
          if (e instanceof ApiError && e.status === 403) setPrevMonthIncome(null);
          else setPrevMonthIncome(null);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [monthPrefix, storeId]);

  const aggregates = useMemo(
    () => (monthPrefix ? aggregateIncomeByTitleForMonth(incomeList, monthPrefix) : []),
    [incomeList, monthPrefix],
  );

  const revenueSeries = useMemo(
    () => (monthPrefix ? buildDailyIncomeSeries(incomeList, monthPrefix, trendDays) : []),
    [incomeList, monthPrefix, trendDays],
  );

  const categoryData = useMemo(() => incomeAggregatesToPieSlices(aggregates), [aggregates]);
  const topItemsData = useMemo(() => topIncomeTitlesForBar(aggregates, 5), [aggregates]);
  const incomeLineCount = useMemo(
    () => (monthPrefix ? countMonthIncomeLines(incomeList, monthPrefix) : 0),
    [incomeList, monthPrefix],
  );

  const monthRevenue = overview?.incomeTotal ?? 0;
  const avgPerLine =
    incomeLineCount > 0 ? Math.round((monthRevenue / incomeLineCount) * 100) / 100 : 0;

  const momBadge = useMemo(() => {
    if (prevMonthIncome === null || !overview) return null;
    if (prevMonthIncome <= 0 && monthRevenue > 0) return '上月无收入或暂无数据';
    if (prevMonthIncome <= 0) return null;
    const pct = ((monthRevenue - prevMonthIncome) / prevMonthIncome) * 100;
    const arrow = pct >= 0 ? '↑' : '↓';
    return `较上月 ${arrow}${Math.abs(pct).toFixed(1)}%`;
  }, [prevMonthIncome, overview, monthRevenue]);

  const monthTitle = overview ? formatOverviewMonthCn(overview.month) : '';

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="min-h-screen bg-[#F8FAFC] text-[#1E293B] pb-24"
    >
      <div className="px-6 pt-12 pb-6 flex items-center justify-between sticky top-0 bg-[#F8FAFC]/80 backdrop-blur-md z-10">
        <button
          type="button"
          onClick={() => setView('home')}
          className="w-10 h-10 rounded-full bg-white shadow-sm border border-gray-100 flex items-center justify-center text-gray-600"
        >
          <ChevronLeft size={24} />
        </button>
        <h2 className="text-lg font-bold">营收报表</h2>
        <button
          type="button"
          className="w-10 h-10 rounded-full bg-white shadow-sm border border-gray-100 flex items-center justify-center text-gray-400"
          aria-label="更多"
        >
          <MoreHorizontal size={24} />
        </button>
      </div>

      <div className="px-6 space-y-6">
        <div className="bg-primary p-6 rounded-[32px] shadow-xl text-white">
          <p className="text-white/60 text-sm mb-1">
            {overview ? `总营收（${monthTitle}）` : '总营收'}
          </p>
          <h3 className="text-3xl font-black mb-4">
            {overview ? fmtCurrency(overview.incomeTotal) : '—'}
          </h3>
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {momBadge ? <span className="bg-white/20 px-2 py-1 rounded-full">{momBadge}</span> : null}
            {overview ? (
              <span className="bg-white/20 px-2 py-1 rounded-full">
                净额 {fmtCurrency(overview.net)}
              </span>
            ) : null}
          </div>
        </div>

        {!overview ? (
          <p className="text-center text-sm text-gray-400 font-bold py-8">
            暂无经营概况数据（无权限或未选择门店）
          </p>
        ) : null}

        {overview ? (
          <>
            <div className="bg-white p-6 rounded-[32px] shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-6">
                <h4 className="font-bold">营收趋势（按日）</h4>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setTrendDays(7)}
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      trendDays === 7 ? 'bg-primary/10 text-primary' : 'text-gray-400'
                    }`}
                  >
                    7天
                  </button>
                  <button
                    type="button"
                    onClick={() => setTrendDays(30)}
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      trendDays === 30 ? 'bg-primary/10 text-primary' : 'text-gray-400'
                    }`}
                  >
                    30天
                  </button>
                </div>
              </div>
              {revenueSeries.length === 0 ? (
                <p className="text-sm text-gray-400 font-bold text-center py-12">本月暂无按日收入数据</p>
              ) : (
                <div className="h-48 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={revenueSeries}>
                      <defs>
                        <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6462cc" stopOpacity={0.2} />
                          <stop offset="95%" stopColor="#6462cc" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                      <XAxis
                        dataKey="name"
                        stroke="#94a3b8"
                        fontSize={10}
                        tickLine={false}
                        axisLine={false}
                        dy={10}
                      />
                      <Tooltip
                        formatter={(v: number) => [fmtCurrency(v), '营收']}
                        contentStyle={{
                          backgroundColor: '#fff',
                          border: 'none',
                          borderRadius: '12px',
                          fontSize: '12px',
                          boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
                        }}
                        itemStyle={{ color: '#1E293B' }}
                      />
                      <Area
                        type="monotone"
                        dataKey="value"
                        stroke="#6462cc"
                        strokeWidth={3}
                        fillOpacity={1}
                        fill="url(#colorValue)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            <div className="bg-white p-6 rounded-[32px] shadow-sm border border-gray-100">
              <h4 className="font-bold mb-6">收入构成（按标题）</h4>
              {categoryData.length === 0 ? (
                <p className="text-sm text-gray-400 font-bold text-center py-8">暂无收入分类数据</p>
              ) : (
                <div className="flex items-center">
                  <div className="h-40 w-40">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={categoryData}
                          cx="50%"
                          cy="50%"
                          innerRadius={45}
                          outerRadius={60}
                          paddingAngle={8}
                          dataKey="value"
                        >
                          {categoryData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex-1 space-y-3 ml-4">
                    {categoryData.map((item) => (
                      <div key={item.name} className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                          <span className="text-xs text-gray-500 truncate">{item.name}</span>
                        </div>
                        <span className="text-xs font-bold shrink-0">
                          ¥{item.value.toLocaleString('zh-CN', { maximumFractionDigits: 0 })}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white p-5 rounded-[32px] shadow-sm border border-gray-100">
                <p className="text-gray-400 text-[10px] mb-1">平均每笔收入</p>
                <h5 className="text-lg font-black">{incomeLineCount > 0 ? fmtCurrency(avgPerLine) : '—'}</h5>
                <p className="text-[10px] text-gray-400 font-bold mt-1">当月收入笔数加权</p>
              </div>
              <div className="bg-white p-5 rounded-[32px] shadow-sm border border-gray-100">
                <p className="text-gray-400 text-[10px] mb-1">收入笔数</p>
                <h5 className="text-lg font-black">{incomeLineCount > 0 ? incomeLineCount.toLocaleString('zh-CN') : '—'}</h5>
                <p className="text-[10px] text-gray-400 font-bold mt-1">{monthTitle}</p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-[32px] shadow-sm border border-gray-100">
              <h4 className="font-bold mb-6">收入项目 Top 5</h4>
              {topItemsData.length === 0 ? (
                <p className="text-sm text-gray-400 font-bold text-center py-12">暂无数据</p>
              ) : (
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={topItemsData} layout="vertical" margin={{ left: 8, right: 20 }}>
                      <XAxis type="number" hide />
                      <YAxis
                        dataKey="name"
                        type="category"
                        stroke="#64748b"
                        fontSize={10}
                        width={88}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip
                        cursor={{ fill: 'transparent' }}
                        formatter={(v: number) => fmtCurrency(v)}
                        contentStyle={{
                          backgroundColor: '#fff',
                          border: 'none',
                          borderRadius: '12px',
                          fontSize: '12px',
                          boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
                        }}
                        itemStyle={{ color: '#1E293B' }}
                      />
                      <Bar dataKey="value" fill="#6462cc" radius={[0, 10, 10, 0]} barSize={20} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </>
        ) : null}
      </div>
    </motion.div>
  );
};
