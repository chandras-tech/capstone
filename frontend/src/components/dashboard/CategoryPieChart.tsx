import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { CategoryBreakdown } from '../../types';

interface Props { data: CategoryBreakdown[]; }

const COLORS = ['#7c3aed','#a78bfa','#6d28d9','#8b5cf6','#4c1d95','#c4b5fd','#5b21b6','#ddd6fe'];

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-[#1a1a2e] border border-purple-900/40 rounded-xl p-3 text-xs">
      <p className="text-white font-medium">{d.category}</p>
      <p className="text-gray-400">${d.amount.toLocaleString()} · {d.percentage}%</p>
    </div>
  );
};

export default function CategoryPieChart({ data }: Props) {
  const top = data.slice(0, 8);
  return (
    <div className="bg-[#0f0f1a] border border-purple-900/20 rounded-2xl p-6">
      <h3 className="text-sm font-semibold text-gray-300 mb-5">Spending by Category</h3>
      <div className="flex items-center gap-4">
        <ResponsiveContainer width={180} height={180}>
          <PieChart>
            <Pie data={top} dataKey="amount" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2}>
              {top.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        <div className="flex-1 space-y-2">
          {top.slice(0, 6).map((c, i) => (
            <div key={c.category} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                <span className="text-xs text-gray-400 truncate max-w-[110px]">{c.category}</span>
              </div>
              <span className="text-xs text-gray-300 font-medium">{c.percentage}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
