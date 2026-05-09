import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  Legend, ResponsiveContainer, CartesianGrid,
} from 'recharts';

interface Props { data: any[]; }

const COLORS: Record<string, string> = {
  'Mortgage':     '#4f46e5',
  'Housing/Rent': '#7c3aed',
  'HOA':          '#0891b2',
  'Utilities':    '#2563eb',
  'Subscription': '#db2777',
  'Insurance':    '#d97706',
  'Loan Payment':  '#dc2626',
  'Kid Learning':  '#16a34a',
  'Kid Spending':  '#15803d',
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const total = payload.reduce((s: number, p: any) => s + (p.value || 0), 0);
  return (
    <div className="bg-[#1a1a2e] border border-purple-900/40 rounded-xl p-3 text-xs space-y-1">
      <p className="text-gray-300 font-semibold mb-1">{label}</p>
      {payload.map((p: any) => (
        <div key={p.name} className="flex justify-between gap-4">
          <span style={{ color: p.color }}>{p.name}</span>
          <span className="text-white">${p.value?.toLocaleString()}</span>
        </div>
      ))}
      <div className="border-t border-gray-700 pt-1 flex justify-between font-semibold">
        <span className="text-gray-400">Total</span>
        <span className="text-purple-300">${total.toLocaleString()}</span>
      </div>
    </div>
  );
};

export default function RecurringBillsChart({ data }: Props) {
  const keys = Array.from(new Set(
    data.flatMap(d => Object.keys(d).filter(k => !['month','year','label','adhoc'].includes(k)))
  ));

  if (!data.some(d => keys.some(k => d[k] > 0))) return null;

  return (
    <div className="bg-[#0f0f1a] border border-purple-900/20 rounded-2xl p-6">
      <h3 className="text-sm font-semibold text-gray-300 mb-1">Recurring Bills by Month</h3>
      <p className="text-xs text-gray-500 mb-5">Housing · Utilities · Subscriptions · Insurance</p>
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
          <XAxis dataKey="label" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false}
            tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(124,58,237,0.05)' }} />
          <Legend wrapperStyle={{ fontSize: 11, color: '#9ca3af', paddingTop: 8 }} />
          {keys.map((cat, i) => (
            <Bar key={cat} dataKey={cat} stackId="a"
              fill={COLORS[cat] || `hsl(${i * 50}, 65%, 55%)`}
              radius={i === keys.length - 1 ? [3, 3, 0, 0] : [0, 0, 0, 0]} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
