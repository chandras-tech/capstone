import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TrendPoint } from '../../types';

interface Props { data: TrendPoint[]; }

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#1a1a2e] border border-purple-900/40 rounded-xl p-3 text-xs">
      <p className="text-gray-400 mb-2 font-medium">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color }}>{p.name}: ${p.value.toLocaleString()}</p>
      ))}
    </div>
  );
};

export default function IncomeExpenseChart({ data }: Props) {
  return (
    <div className="bg-[#0f0f1a] border border-purple-900/20 rounded-2xl p-6">
      <h3 className="text-sm font-semibold text-gray-300 mb-5">Income vs Expenses</h3>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} barGap={4}>
          <XAxis dataKey="label" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false}
            tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(124,58,237,0.05)' }} />
          <Legend wrapperStyle={{ fontSize: 11, color: '#9ca3af' }} />
          <Bar dataKey="income"   name="Income"   fill="#22c55e" radius={[4,4,0,0]} />
          <Bar dataKey="expenses" name="Expenses" fill="#7c3aed" radius={[4,4,0,0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
