import {
  ComposedChart, Bar, Line, XAxis, YAxis, Tooltip,
  Legend, ResponsiveContainer, CartesianGrid,
} from 'recharts';

interface Props { data: any[]; }

const RECURRING_COLORS: Record<string, string> = {
  'Housing/Rent':  '#7c3aed',
  'Utilities':     '#2563eb',
  'Subscription':  '#db2777',
  'Insurance':     '#d97706',
  'Loan Payment':  '#dc2626',
  'Trading':       '#059669',
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#1a1a2e] border border-purple-900/40 rounded-xl p-3 text-xs space-y-1 min-w-[160px]">
      <p className="text-gray-300 font-semibold mb-2">{label}</p>
      {payload.map((p: any) => (
        <div key={p.name} className="flex items-center justify-between gap-4">
          <span style={{ color: p.color }}>{p.name}</span>
          <span className="text-white font-medium">${p.value?.toLocaleString()}</span>
        </div>
      ))}
    </div>
  );
};

export default function RecurringChart({ data }: Props) {
  // Collect all recurring category keys present in data
  const recurringKeys = Array.from(
    new Set(
      data.flatMap(d => Object.keys(d).filter(k => k !== 'month' && k !== 'year' && k !== 'label' && k !== 'adhoc'))
    )
  );

  const hasData = data.some(d =>
    d.adhoc > 0 || recurringKeys.some(k => d[k] > 0)
  );

  if (!hasData) return null;

  return (
    <div className="bg-[#0f0f1a] border border-purple-900/20 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-sm font-semibold text-gray-300">Recurring Bills vs Miscellaneous</h3>
          <p className="text-xs text-gray-500 mt-0.5">Monthly since Jan 2026</p>
        </div>
        <div className="flex items-center gap-3 text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <span className="w-3 h-0.5 bg-gray-400 inline-block" style={{ borderTop: '2px dashed #9ca3af' }} />
            Adhoc/Misc line
          </span>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={280}>
        <ComposedChart data={data} barGap={2}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
          <XAxis dataKey="label" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false}
            tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(124,58,237,0.05)' }} />
          <Legend wrapperStyle={{ fontSize: 11, color: '#9ca3af', paddingTop: 12 }} />

          {/* Stacked bars for each recurring category */}
          {recurringKeys.map((cat, idx) => (
            <Bar key={cat} dataKey={cat} stackId="recurring"
              fill={RECURRING_COLORS[cat] || `hsl(${idx * 45}, 65%, 55%)`}
              radius={idx === recurringKeys.length - 1 ? [3, 3, 0, 0] : [0, 0, 0, 0]} />
          ))}

          {/* Line for adhoc/miscellaneous */}
          <Line dataKey="adhoc" name="Adhoc/Misc" type="monotone"
            stroke="#f59e0b" strokeWidth={2.5} dot={{ fill: '#f59e0b', r: 3 }}
            strokeDasharray="5 3" />
        </ComposedChart>
      </ResponsiveContainer>

      {/* Legend for recurring categories */}
      <div className="mt-4 flex flex-wrap gap-3">
        {recurringKeys.map((cat, idx) => (
          <div key={cat} className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm"
              style={{ background: RECURRING_COLORS[cat] || `hsl(${idx * 45}, 65%, 55%)` }} />
            <span className="text-xs text-gray-400">{cat}</span>
          </div>
        ))}
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-0.5 bg-yellow-500" />
          <span className="text-xs text-gray-400">Adhoc / Misc</span>
        </div>
      </div>
    </div>
  );
}
