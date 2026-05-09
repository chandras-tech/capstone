import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from 'react-query';
import AppNavbar from '../components/layout/AppNavbar';
import SummaryCards from '../components/dashboard/SummaryCards';
import IncomeExpenseChart from '../components/dashboard/IncomeExpenseChart';
import CategoryPieChart from '../components/dashboard/CategoryPieChart';
import CashFlowTrend from '../components/dashboard/CashFlowTrend';
import RecurringBillsChart from '../components/dashboard/RecurringBillsChart';
import InsightsPanel from '../components/dashboard/InsightsPanel';
import AdhocChart from '../components/dashboard/AdhocChart';
import { useSummary, useCategories, useTrends, useRecurring } from '../hooks/useDashboard';
import { useWatchlist, useFlagTransaction } from '../hooks/useTransactions';
import api from '../api';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

type Period = 'this_month' | 'ytd' | 'last3' | 'last6';

const PERIOD_OPTIONS: { key: Period; label: string }[] = [
  { key: 'this_month', label: 'This Month' },
  { key: 'ytd',        label: 'Jan → Now' },
  { key: 'last3',      label: 'Last 3 Months' },
  { key: 'last6',      label: 'Last 6 Months' },
];

function getPeriodRange(period: Period, now: Date) {
  const month = now.getMonth() + 1;
  const year  = now.getFullYear();
  if (period === 'this_month') return { month, year, fromMonth: undefined, fromYear: undefined };
  if (period === 'ytd')        return { month, year, fromMonth: 1,     fromYear: year };
  if (period === 'last3') {
    let m = month - 2, y = year;
    if (m <= 0) { m += 12; y -= 1; }
    return { month, year, fromMonth: m, fromYear: y };
  }
  if (period === 'last6') {
    let m = month - 5, y = year;
    if (m <= 0) { m += 12; y -= 1; }
    return { month, year, fromMonth: m, fromYear: y };
  }
  return { month, year, fromMonth: undefined, fromYear: undefined };
}

export default function Dashboard() {
  const now = new Date();
  const [period, setPeriod] = useState<Period>('ytd');
  const [autoSet, setAutoSet] = useState(false);
  const [recat, setRecat] = useState<string | null>(null);
  const qc = useQueryClient();

  const { month, year, fromMonth, fromYear } = getPeriodRange(period, now);

  const recategorize = useMutation(
    () => api.post('/transactions/recategorize').then(r => r.data),
    {
      onSuccess: (data: any) => {
        setRecat(data.message);
        qc.invalidateQueries('categories');
        qc.invalidateQueries('summary');
        qc.invalidateQueries('trends');
        qc.invalidateQueries('transactions');
        qc.invalidateQueries('recurring');
        setTimeout(() => setRecat(null), 5000);
      },
    }
  );

  const { data: trends,    isLoading: lt } = useTrends(12);
  const { data: summary,   isLoading: ls } = useSummary(month, year, fromMonth, fromYear);
  const { data: categories, isLoading: lc } = useCategories(month, year);
  const { data: recurring  } = useRecurring(12);
  const { data: watchlist = [] } = useWatchlist();
  const [watchlistOpen, setWatchlistOpen] = useState(true);
  const flagTx = useFlagTransaction();

  // Auto-select YTD if data exists, else this_month
  useEffect(() => {
    if (!autoSet && trends) {
      setAutoSet(true);
    }
  }, [trends, autoSet]);

  const loading  = ls || lc || lt;
  const hasData  = summary && (summary.total_income > 0 || summary.total_expenses > 0);
  const hasAny   = trends?.some((t: any) => t.income + t.expenses > 0);

  const periodLabel = (() => {
    if (period === 'this_month') return `${MONTHS[month - 1]} ${year}`;
    if (period === 'ytd')        return `Jan ${year} → ${MONTHS[month - 1]} ${year}`;
    if (period === 'last3')      return `Last 3 Months`;
    return `Last 6 Months`;
  })();

  return (
    <div className="min-h-screen bg-[#070711] text-white">
      <AppNavbar />
      <main className="pt-20 px-8 pb-12 max-w-7xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between py-8">
          <div>
            <h1 className="text-2xl font-black">Dashboard</h1>
            <p className="text-gray-400 text-sm mt-1">{periodLabel}</p>
          </div>
          <div className="flex items-center gap-3">
            {/* Period quick-select */}
            <div className="flex items-center bg-[#0f0f1a] border border-gray-800 rounded-xl p-1 gap-1">
              {PERIOD_OPTIONS.map(opt => (
                <button key={opt.key} onClick={() => setPeriod(opt.key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all
                    ${period === opt.key
                      ? 'bg-purple-600 text-white shadow'
                      : 'text-gray-400 hover:text-white'}`}>
                  {opt.label}
                </button>
              ))}
            </div>

            <button onClick={() => recategorize.mutate()} disabled={recategorize.isLoading}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600/20 border border-purple-600/30
                         hover:bg-purple-600/30 rounded-xl text-sm text-purple-300 transition-colors
                         disabled:opacity-50">
              {recategorize.isLoading ? '⏳ Categorizing…' : '🏷️ Auto-Categorize'}
            </button>
            {recat && <span className="text-xs text-green-400">{recat}</span>}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64 text-gray-500">Loading…</div>
        ) : (
          <div className="space-y-6">

            {/* Summary cards */}
            {hasData ? (
              <SummaryCards data={summary} />
            ) : (
              <div className="bg-[#0f0f1a] border border-yellow-500/20 rounded-2xl p-5 text-center">
                <p className="text-yellow-400 text-sm font-medium">No transactions for {periodLabel}</p>
                <p className="text-gray-500 text-xs mt-1">
                  Try a different period — your data is in{' '}
                  {trends?.filter((t: any) => t.income + t.expenses > 0)
                    .map((t: any) => `${MONTHS[t.month-1]} ${t.year}`)
                    .join(', ') || 'another period'}
                </p>
              </div>
            )}

            {/* Income vs Expense + Category Pie */}
            {hasAny && (
              <div className="grid grid-cols-2 gap-6">
                <IncomeExpenseChart data={trends} />
                {categories && categories.length > 0
                  ? <CategoryPieChart data={categories} />
                  : <div className="bg-[#0f0f1a] border border-purple-900/20 rounded-2xl p-6
                                    flex items-center justify-center text-gray-600 text-sm">
                      No expense categories for {MONTHS[month-1]} {year}
                    </div>
                }
              </div>
            )}

            {/* Cash flow trend */}
            {hasAny && <CashFlowTrend data={trends} />}

            {/* Recurring bills + Adhoc — two separate charts */}
            {recurring && (
              <div className="grid grid-cols-2 gap-6">
                <RecurringBillsChart data={recurring} />
                <AdhocChart data={recurring} />
              </div>
            )}

            {/* AI Insights — 3 cards */}
            <InsightsPanel />

            {/* Watchlist — collapsible */}
            {watchlist.length > 0 && (
              <div className="bg-[#0f0f1a] border border-yellow-500/30 rounded-2xl overflow-hidden">
                {/* Header — always visible, click to collapse */}
                <button
                  onClick={() => setWatchlistOpen(o => !o)}
                  className="w-full flex items-center justify-between px-6 py-4
                             hover:bg-yellow-500/5 transition-colors">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🚩</span>
                    <h3 className="text-sm font-semibold text-yellow-400">
                      Watchlist — Suspicious / Monitor
                    </h3>
                    <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded-full">
                      {watchlist.length} flagged
                    </span>
                  </div>
                  <span className="text-gray-500 text-sm transition-transform duration-200"
                    style={{ display: 'inline-block', transform: watchlistOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                    ▼
                  </span>
                </button>

                {/* Body — collapsible */}
                {watchlistOpen && (
                  <div className="px-6 pb-5 space-y-2">
                    {watchlist.map((tx: any) => (
                      <div key={tx.id}
                        className="flex items-center justify-between py-2.5 px-4
                                   bg-yellow-500/5 border border-yellow-500/10 rounded-xl">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-white font-medium truncate">
                            {tx.merchant || tx.description}
                          </p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {new Date(tx.date).toLocaleDateString()} · {tx.category}
                            {tx.is_recurring && <span className="ml-2 text-yellow-600">🔄 recurring</span>}
                          </p>
                        </div>
                        <div className="flex items-center gap-3 ml-4">
                          <p className={`text-sm font-bold whitespace-nowrap
                            ${tx.type === 'credit' ? 'text-green-400' : 'text-red-400'}`}>
                            {tx.type === 'credit' ? '+' : '-'}${tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </p>
                          <button
                            onClick={() => flagTx.mutate({ id: tx.id, flagged: false })}
                            title="Mark as verified and remove from watchlist"
                            className="flex items-center gap-1 px-3 py-1 text-xs font-medium
                                       bg-green-600/20 border border-green-500/30 text-green-400
                                       hover:bg-green-600/30 rounded-lg transition-colors whitespace-nowrap">
                            ✓ Verified
                          </button>
                        </div>
                      </div>
                    ))}
                    <p className="text-xs text-gray-600 pt-1">
                      Click <strong className="text-gray-500">✓ Verified</strong> to remove from watchlist · Flag new transactions with 🚩 on the Transactions page
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* DTI meter */}
            {hasData && (
              <div className="bg-[#0f0f1a] border border-purple-900/20 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-5">
                  <span className="text-sm text-gray-300 font-medium">Debt-to-Income Ratio</span>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-black text-purple-400">{summary.dti_ratio}%</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium
                      ${summary.dti_ratio > 40 ? 'bg-red-500/20 text-red-400'
                      : summary.dti_ratio > 35 ? 'bg-orange-500/20 text-orange-400'
                      : summary.dti_ratio > 20 ? 'bg-yellow-500/20 text-yellow-400'
                      : 'bg-green-500/20 text-green-400'}`}>
                      {summary.dti_ratio > 40 ? 'High Risk'
                        : summary.dti_ratio > 35 ? 'Caution'
                        : summary.dti_ratio > 20 ? 'Good'
                        : 'Excellent'}
                    </span>
                  </div>
                </div>

                {/* Scale track */}
                <div className="relative mb-6">
                  {/* Colored segments */}
                  <div className="flex h-3 rounded-full overflow-hidden">
                    <div className="bg-green-500"     style={{ width: '20%' }} />
                    <div className="bg-emerald-400"   style={{ width: '15%' }} />
                    <div className="bg-yellow-400"    style={{ width: '15%' }} />
                    <div className="bg-orange-500"    style={{ width: '10%' }} />
                    <div className="bg-red-500"       style={{ width: '40%' }} />
                  </div>

                  {/* YOU marker */}
                  <div className="absolute top-0 flex flex-col items-center"
                    style={{ left: `${Math.min(summary.dti_ratio * 2, 98)}%`, transform: 'translateX(-50%)' }}>
                    <div className="w-1 h-3 bg-white rounded-full" />
                    <div className="mt-1 bg-white text-[#070711] text-[10px] font-black
                                    px-1.5 py-0.5 rounded-full whitespace-nowrap">
                      YOU {summary.dti_ratio}%
                    </div>
                  </div>
                </div>

                {/* Scale labels */}
                <div className="flex justify-between text-[10px] text-gray-500 mb-1 px-0.5">
                  <span>0%</span>
                  <span>10%</span>
                  <span>20%</span>
                  <span>30%</span>
                  <span>40%</span>
                  <span>50%</span>
                </div>
                <div className="flex text-[10px] font-medium mb-4">
                  <span className="text-green-400"  style={{ width: '20%' }}>Excellent</span>
                  <span className="text-emerald-400" style={{ width: '15%' }}>Good</span>
                  <span className="text-yellow-400" style={{ width: '15%' }}>Moderate</span>
                  <span className="text-orange-400" style={{ width: '10%' }}>Caution</span>
                  <span className="text-red-400"    style={{ width: '40%' }}>High Risk</span>
                </div>

                {/* Context */}
                <div className="grid grid-cols-3 gap-3 text-center">
                  {[
                    { label: 'Lender limit',    value: '36%',  note: 'conventional' },
                    { label: 'FHA limit',        value: '43%',  note: 'government loan' },
                    { label: 'Your ratio',       value: `${summary.dti_ratio}%`, note: summary.dti_ratio <= 36 ? '✅ within limits' : '⚠️ above limit' },
                  ].map(c => (
                    <div key={c.label} className="bg-[#1a1a2e] rounded-xl p-3">
                      <p className="text-xs text-gray-500">{c.label}</p>
                      <p className="text-base font-bold text-white">{c.value}</p>
                      <p className="text-[10px] text-gray-600">{c.note}</p>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-3">
                  {summary.dti_ratio > 40
                    ? '⚠️ High — reducing debt payments or increasing income will improve borrowing power'
                    : summary.dti_ratio > 35
                    ? '🟠 Approaching caution zone — monitor closely before taking new loans'
                    : summary.dti_ratio > 20
                    ? '🟡 Good standing — eligible for most loans and refinancing'
                    : '🟢 Excellent — low debt burden, strong borrowing power'}
                </p>
              </div>
            )}

            {!hasAny && (
              <div className="text-center py-24 text-gray-500">
                <p className="text-4xl mb-4">📊</p>
                <p className="font-medium text-white mb-2">No data yet</p>
                <p className="text-sm mb-6">Upload a bank statement to see your dashboard</p>
                <a href="/upload" className="px-6 py-2.5 bg-purple-600 hover:bg-purple-500 rounded-xl
                                              text-sm font-medium transition-colors">
                  Upload Statement
                </a>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
