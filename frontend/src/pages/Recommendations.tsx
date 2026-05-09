import { useMutation, useQuery, useQueryClient } from 'react-query';
import AppNavbar from '../components/layout/AppNavbar';
import { Recommendation } from '../types';
import api from '../api';

const TYPE_STYLE: Record<string, { icon: string; color: string; bg: string }> = {
  subscription:   { icon: '🔍', color: 'text-pink-400',   bg: 'bg-pink-500/10 border-pink-500/20' },
  cashback:       { icon: '💳', color: 'text-green-400',  bg: 'bg-green-500/10 border-green-500/20' },
  spending_alert: { icon: '⚠️',  color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/20' },
  savings:        { icon: '🏦', color: 'text-blue-400',   bg: 'bg-blue-500/10 border-blue-500/20' },
  general:        { icon: '💡', color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/20' },
};

export default function Recommendations() {
  const qc = useQueryClient();
  const { data: recs = [], isLoading } = useQuery('recommendations',
    () => api.get('/recommendations').then(r => r.data));

  const refresh = useMutation(
    () => api.post('/recommendations/refresh').then(r => r.data),
    { onSuccess: () => qc.invalidateQueries('recommendations') }
  );

  const totalSaving = recs.reduce((s: number, r: Recommendation) => s + r.potential_saving, 0);

  return (
    <div className="min-h-screen bg-[#070711] text-white">
      <AppNavbar />
      <main className="pt-20 px-8 pb-12 max-w-5xl mx-auto">
        <div className="flex items-center justify-between py-8">
          <div>
            <h1 className="text-2xl font-black">AI Recommendations</h1>
            {totalSaving > 0 && (
              <p className="text-purple-400 text-sm mt-1 font-medium">
                Potential savings identified: ${totalSaving.toLocaleString(undefined, { minimumFractionDigits: 0 })}/mo
              </p>
            )}
          </div>
          <button onClick={() => refresh.mutate()} disabled={refresh.isLoading}
            className="flex items-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-500
                       disabled:opacity-50 rounded-xl text-sm font-medium transition-colors
                       shadow-lg shadow-purple-900/30">
            {refresh.isLoading ? '⏳ Analyzing…' : '🤖 Refresh with AI'}
          </button>
        </div>

        {isLoading ? (
          <div className="py-16 text-center text-gray-500">Loading…</div>
        ) : recs.length === 0 ? (
          <div className="text-center py-24 text-gray-500">
            <p className="text-4xl mb-4">💡</p>
            <p className="font-medium text-white mb-2">No recommendations yet</p>
            <p className="text-sm mb-6">Upload statements first, then click "Refresh with AI"</p>
            <button onClick={() => refresh.mutate()} disabled={refresh.isLoading}
              className="px-6 py-2.5 bg-purple-600 hover:bg-purple-500 rounded-xl text-sm font-medium transition-colors">
              Generate Recommendations
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-5">
            {recs.map((r: Recommendation) => {
              const style = TYPE_STYLE[r.type] || TYPE_STYLE.general;
              return (
                <div key={r.id}
                  className="bg-[#0f0f1a] border border-purple-900/20 rounded-2xl p-6
                             hover:border-purple-600/30 transition-colors">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{style.icon}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${style.bg} ${style.color}`}>
                        {r.type.replace('_', ' ')}
                      </span>
                    </div>
                    {r.potential_saving > 0 && (
                      <div className="text-right">
                        <div className="text-green-400 font-bold text-sm">
                          ${r.potential_saving.toLocaleString()}/mo
                        </div>
                        <div className="text-gray-600 text-[10px]">potential saving</div>
                      </div>
                    )}
                  </div>
                  <h3 className="font-bold text-white mb-2">{r.title}</h3>
                  <p className="text-gray-400 text-sm leading-relaxed">{r.body}</p>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
