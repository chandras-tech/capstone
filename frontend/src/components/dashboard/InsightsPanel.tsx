import { useState } from 'react';
import { useQuery } from 'react-query';
import api from '../../api';

function useInsights() {
  return useQuery('insights', () => api.get('/dashboard/insights').then(r => r.data),
    { staleTime: 5 * 60 * 1000 });
}

// ── Collapsible card wrapper ───────────────────────────────────────────────────
function InsightCard({ icon, title, badge, badgeColor, children }:
  { icon: string; title: string; badge?: string; badgeColor?: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="bg-[#0f0f1a] border border-purple-900/20 rounded-2xl overflow-hidden">
      <button onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-6 py-4 hover:bg-white/5 transition-colors">
        <div className="flex items-center gap-2">
          <span className="text-xl">{icon}</span>
          <span className="text-sm font-semibold text-white">{title}</span>
          {badge && (
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${badgeColor}`}>
              {badge}
            </span>
          )}
        </div>
        <span className="text-gray-500 text-xs transition-transform duration-200"
          style={{ display: 'inline-block', transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}>▼</span>
      </button>
      {open && <div className="px-6 pb-6">{children}</div>}
    </div>
  );
}

// ── Cash Flow Prediction ───────────────────────────────────────────────────────
function CashFlowCard({ data }: { data: any }) {
  if (!data) return null;
  const { upcoming_bills, total_next_30_days, avg_monthly_income, typical_payday, buffer, buffer_pct } = data;

  const bufferColor = buffer_pct === null ? 'text-gray-400'
    : buffer_pct < 10 ? 'text-red-400'
    : buffer_pct < 25 ? 'text-yellow-400'
    : 'text-green-400';

  const bufferStatus = buffer_pct === null ? 'No income data'
    : buffer_pct < 10 ? '⚠️ Very tight — watch spending'
    : buffer_pct < 25 ? '⚡ Moderate buffer'
    : '✅ Healthy buffer';

  return (
    <InsightCard icon="📅" title="Cash Flow — Next 30 Days"
      badge={buffer != null ? `Buffer $${buffer?.toLocaleString()}` : undefined}
      badgeColor={buffer_pct && buffer_pct > 25 ? 'bg-green-500/20 text-green-400'
        : buffer_pct && buffer_pct < 10 ? 'bg-red-500/20 text-red-400'
        : 'bg-yellow-500/20 text-yellow-400'}>

      {/* Summary bar */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-[#1a1a2e] rounded-xl p-3">
          <p className="text-xs text-gray-500">Bills due</p>
          <p className="text-lg font-bold text-red-400">${total_next_30_days?.toLocaleString()}</p>
        </div>
        <div className="bg-[#1a1a2e] rounded-xl p-3">
          <p className="text-xs text-gray-500">Avg Income</p>
          <p className="text-lg font-bold text-green-400">${avg_monthly_income?.toLocaleString()}</p>
        </div>
        <div className="bg-[#1a1a2e] rounded-xl p-3">
          <p className="text-xs text-gray-500">Buffer</p>
          <p className={`text-lg font-bold ${bufferColor}`}>
            {buffer != null ? `$${buffer?.toLocaleString()}` : '—'}
          </p>
        </div>
      </div>

      {/* Status */}
      <p className={`text-xs font-medium mb-4 ${bufferColor}`}>{bufferStatus}</p>
      {typical_payday && (
        <p className="text-xs text-gray-500 mb-3">
          💰 Paycheck typically arrives around the <strong className="text-gray-300">{typical_payday}{ordinal(typical_payday)}</strong> of the month
        </p>
      )}

      {/* Upcoming bills */}
      <div className="space-y-2">
        {upcoming_bills?.map((b: any, i: number) => (
          <div key={i} className="flex items-center justify-between py-1.5 px-3
                                   bg-[#1a1a2e] rounded-lg">
            <div className="flex items-center gap-3">
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium
                ${b.days_until <= 5 ? 'bg-red-500/20 text-red-400'
                : b.days_until <= 10 ? 'bg-yellow-500/20 text-yellow-400'
                : 'bg-gray-700 text-gray-400'}`}>
                {b.days_until === 0 ? 'Today' : `${b.days_until}d`}
              </span>
              <span className="text-sm text-white">{b.merchant}</span>
            </div>
            <span className="text-sm font-medium text-red-400">-${b.amount.toLocaleString()}</span>
          </div>
        ))}
      </div>
    </InsightCard>
  );
}

// ── Subscription Audit ────────────────────────────────────────────────────────
function SubscriptionCard({ data }: { data: any }) {
  if (!data) return null;
  const { subscriptions, total_monthly, total_annual, overlapping, potential_saving } = data;

  return (
    <InsightCard icon="🔄" title="Subscription Audit"
      badge={`$${total_annual?.toLocaleString()}/year`}
      badgeColor="bg-purple-500/20 text-purple-400">

      {/* Totals */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-[#1a1a2e] rounded-xl p-3">
          <p className="text-xs text-gray-500">Monthly total</p>
          <p className="text-lg font-bold text-purple-400">${total_monthly?.toLocaleString()}</p>
        </div>
        <div className="bg-[#1a1a2e] rounded-xl p-3">
          <p className="text-xs text-gray-500">Annual total</p>
          <p className="text-lg font-bold text-purple-400">${total_annual?.toLocaleString()}</p>
        </div>
      </div>

      {/* Overlap warnings */}
      {Object.entries(overlapping || {}).map(([key, grp]: any) => (
        <div key={key} className="mb-3 p-3 bg-yellow-500/5 border border-yellow-500/20 rounded-xl">
          <p className="text-xs text-yellow-400 font-medium mb-1">⚠️ Overlap detected</p>
          <p className="text-xs text-gray-300">{grp.tip}</p>
        </div>
      ))}

      {potential_saving > 0 && (
        <p className="text-xs text-green-400 mb-3 font-medium">
          💡 Potential saving: ${potential_saving?.toLocaleString()}/year by cutting overlaps
        </p>
      )}

      {/* List */}
      <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
        {subscriptions?.map((s: any, i: number) => (
          <div key={i} className="flex items-center justify-between py-1 px-3 rounded-lg hover:bg-[#1a1a2e]">
            <span className="text-sm text-gray-300">{s.merchant}</span>
            <div className="text-right">
              <span className="text-sm font-medium text-white">${s.monthly}/mo</span>
              <span className="text-xs text-gray-600 ml-2">${s.annual}/yr</span>
            </div>
          </div>
        ))}
      </div>
    </InsightCard>
  );
}

// ── Wealth Leaks ──────────────────────────────────────────────────────────────
function WealthLeaksCard({ data }: { data: any }) {
  if (!data) return null;
  const { leaks, total_annual, total_monthly } = data;

  return (
    <InsightCard icon="🕳️" title="Wealth Leaks — Small Recurring"
      badge={`$${total_annual?.toLocaleString()}/year`}
      badgeColor="bg-red-500/20 text-red-400">

      {/* Totals */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-[#1a1a2e] rounded-xl p-3">
          <p className="text-xs text-gray-500">Monthly leaks</p>
          <p className="text-lg font-bold text-red-400">${total_monthly?.toLocaleString()}</p>
        </div>
        <div className="bg-[#1a1a2e] rounded-xl p-3">
          <p className="text-xs text-gray-500">Annual leaks</p>
          <p className="text-lg font-bold text-red-400">${total_annual?.toLocaleString()}</p>
        </div>
      </div>

      <p className="text-xs text-gray-500 mb-3">
        Small charges &lt;$30 appearing in 2+ months — review and cancel unused ones
      </p>

      <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
        {leaks?.map((l: any, i: number) => (
          <div key={i} className="flex items-center justify-between py-1 px-3 rounded-lg hover:bg-[#1a1a2e]">
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-600">{l.months_seen}mo</span>
              <span className="text-sm text-gray-300">{l.merchant}</span>
            </div>
            <div className="text-right">
              <span className="text-sm font-medium text-red-400">${l.monthly}/mo</span>
              <span className="text-xs text-gray-600 ml-2">${l.annual}/yr</span>
            </div>
          </div>
        ))}
      </div>
    </InsightCard>
  );
}

// ── Ordinal helper ────────────────────────────────────────────────────────────
function ordinal(n: number) {
  if (n > 3 && n < 21) return 'th';
  switch (n % 10) { case 1: return 'st'; case 2: return 'nd'; case 3: return 'rd'; default: return 'th'; }
}

// ── Main panel ────────────────────────────────────────────────────────────────
export default function InsightsPanel() {
  const { data, isLoading } = useInsights();

  if (isLoading) return (
    <div className="grid grid-cols-3 gap-6">
      {[1,2,3].map(i => (
        <div key={i} className="bg-[#0f0f1a] border border-purple-900/20 rounded-2xl p-6 animate-pulse">
          <div className="h-4 bg-gray-800 rounded w-3/4 mb-3" />
          <div className="h-20 bg-gray-800 rounded" />
        </div>
      ))}
    </div>
  );

  if (!data) return null;

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <span className="text-lg">🧠</span>
        <h2 className="text-base font-bold text-white">AI Financial Insights</h2>
        <span className="text-xs text-gray-600 ml-1">computed from your transaction history</span>
      </div>
      <div className="grid grid-cols-3 gap-6">
        <CashFlowCard       data={data.cash_flow} />
        <SubscriptionCard   data={data.subscription_audit} />
        <WealthLeaksCard    data={data.wealth_leaks} />
      </div>
    </div>
  );
}
