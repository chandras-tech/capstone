import { DashboardSummary } from '../../types';

interface Props { data: DashboardSummary; }

const cards = (d: DashboardSummary) => [
  { label: 'Total Income',   value: `$${d.total_income.toLocaleString()}`,   color: 'text-green-400',  bg: 'bg-green-500/10',  border: 'border-green-500/20',  icon: '💰' },
  { label: 'Total Expenses', value: `$${d.total_expenses.toLocaleString()}`, color: 'text-red-400',    bg: 'bg-red-500/10',    border: 'border-red-500/20',    icon: '💸' },
  { label: 'Savings',        value: `$${d.savings.toLocaleString()}`,        color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20', icon: '🏦' },
  { label: 'Savings Rate',   value: `${d.savings_rate}%`,                    color: 'text-violet-400', bg: 'bg-violet-500/10', border: 'border-violet-500/20', icon: '📈' },
];

export default function SummaryCards({ data }: Props) {
  return (
    <div className="grid grid-cols-4 gap-4">
      {cards(data).map(c => (
        <div key={c.label}
          className={`${c.bg} border ${c.border} rounded-2xl p-5 flex flex-col gap-2`}>
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400 font-medium">{c.label}</span>
            <span className="text-lg">{c.icon}</span>
          </div>
          <div className={`text-2xl font-black ${c.color}`}>{c.value}</div>
          {c.label === 'Savings Rate' && (
            <div className="w-full bg-gray-800 rounded-full h-1 mt-1">
              <div className="bg-violet-500 h-1 rounded-full" style={{ width: `${Math.min(data.savings_rate, 100)}%` }} />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
