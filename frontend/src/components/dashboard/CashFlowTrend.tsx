import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { TrendPoint } from '../../types';

interface Props { data: TrendPoint[]; }

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#1a1a2e] border border-purple-900/40 rounded-xl p-3 text-xs space-y-1">
      <p className="text-gray-400 font-medium">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color }}>{p.name}: ${p.value.toLocaleString()}</p>
      ))}
    </div>
  );
};

export default function CashFlowTrend({ data }: Props) {
  return (
    <div className="bg-[#0f0f1a] border border-purple-900/20 rounded-2xl p-6">
      <h3 className="text-sm font-semibold text-gray-300 mb-5">6-Month Cash Flow Trend</h3>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data}>
          <XAxis dataKey="label" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false}
            tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine y={0} stroke="#374151" strokeDasharray="3 3" />
          <Line dataKey="savings" name="Savings" stroke="#a78bfa" strokeWidth={2.5}
            dot={{ fill: '#7c3aed', r: 3 }} activeDot={{ r: 5 }} />
          <Line dataKey="income" name="Income" stroke="#22c55e" strokeWidth={2}
            dot={false} strokeDasharray="4 4" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
