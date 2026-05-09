import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, Cell,
} from 'recharts';

interface Props { data: any[]; }

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#1a1a2e] border border-yellow-500/30 rounded-xl p-3 text-xs">
      <p className="text-gray-300 font-semibold mb-1">{label}</p>
      <div className="flex justify-between gap-4">
        <span className="text-yellow-400">Misc / Adhoc</span>
        <span className="text-white font-medium">${payload[0]?.value?.toLocaleString()}</span>
      </div>
    </div>
  );
};

export default function AdhocChart({ data }: Props) {
  if (!data.some(d => d.adhoc > 0)) return null;

  const max = Math.max(...data.map(d => d.adhoc));

  return (
    <div className="bg-[#0f0f1a] border border-yellow-500/10 rounded-2xl p-6">
      <h3 className="text-sm font-semibold text-gray-300 mb-1">Miscellaneous / Adhoc Spending</h3>
      <p className="text-xs text-gray-500 mb-5">Dining · Shopping · Transport · Healthcare · Other</p>
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
          <XAxis dataKey="label" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false}
            tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(245,158,11,0.05)' }} />
          <Bar dataKey="adhoc" name="Adhoc/Misc" radius={[4, 4, 0, 0]}>
            {data.map((entry, i) => (
              <Cell key={i}
                fill={entry.adhoc === max ? '#f59e0b' : 'rgba(245,158,11,0.4)'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <p className="text-xs text-gray-600 mt-2 text-right">
        Highest month highlighted in amber
      </p>
    </div>
  );
}
