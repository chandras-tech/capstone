import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import AppNavbar from '../components/layout/AppNavbar';
import { useTransactions, useUpdateCategory, useExcludeTransaction, useFlagTransaction } from '../hooks/useTransactions';
import { Transaction } from '../types';

const CATEGORIES = ['Food/Groceries','Dining/Restaurants','Shopping','Transport/Gas',
  'Housing/Rent','Mortgage','HOA','Utilities','Entertainment','Healthcare','Income/Salary',
  'Transfer','Subscription','Travel','Education','Kid Learning','Kid Spending',
  'Personal Care','Insurance','Loan Payment','Trading','Other'];

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export default function Transactions() {
  const now = new Date();
  const [searchParams] = useSearchParams();
  const [month, setMonth] = useState<number | undefined>(
    searchParams.get('month') ? Number(searchParams.get('month')) : undefined
  );
  const [year, setYear] = useState(
    searchParams.get('year') ? Number(searchParams.get('year')) : now.getFullYear()
  );
  const [editId, setEditId] = useState<string | null>(null);
  const [editCat, setEditCat] = useState('');

  const { data: txs = [], isLoading } = useTransactions(month, year);
  const updateCat = useUpdateCategory();
  const excludeTx = useExcludeTransaction();
  const flagTx    = useFlagTransaction();

  const saveEdit = (id: string) => {
    updateCat.mutate({ id, category: editCat }, { onSuccess: () => setEditId(null) });
  };

  return (
    <div className="min-h-screen bg-[#070711] text-white">
      <AppNavbar />
      <main className="pt-20 px-8 pb-12 max-w-6xl mx-auto">
        <div className="flex items-center justify-between py-8">
          <div>
            <h1 className="text-2xl font-black">Transactions</h1>
            <p className="text-gray-400 text-sm mt-1">{txs.length} transactions</p>
          </div>
          <div className="flex items-center gap-2">
            <select value={month ?? ''} onChange={e => setMonth(e.target.value ? Number(e.target.value) : undefined)}
              className="bg-[#0f0f1a] border border-gray-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500">
              <option value="">All Months</option>
              {MONTHS.map((m, i) => <option key={m} value={i+1}>{m}</option>)}
            </select>
            <select value={year} onChange={e => setYear(Number(e.target.value))}
              className="bg-[#0f0f1a] border border-gray-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500">
              {[2024,2025,2026].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        </div>

        <div className="bg-[#0f0f1a] border border-purple-900/20 rounded-2xl overflow-hidden">
          {isLoading ? (
            <div className="py-16 text-center text-gray-500">Loading…</div>
          ) : txs.length === 0 ? (
            <div className="py-16 text-center text-gray-500">
              <p className="text-3xl mb-3">🧾</p>
              <p className="text-white font-medium mb-1">No transactions found</p>
              <p className="text-sm">Try selecting <span className="text-purple-400">All Months</span> or a different month/year</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-800 text-xs text-gray-500 font-medium">
                  <th className="text-left px-5 py-3">Date</th>
                  <th className="text-left px-5 py-3">Description</th>
                  <th className="text-left px-5 py-3">Category</th>
                  <th className="text-right px-5 py-3">Amount</th>
                  <th className="text-center px-5 py-3">Watch</th>
                  <th className="text-center px-5 py-3">Exclude</th>
                </tr>
              </thead>
              <tbody>
                {txs.map((tx: Transaction) => (
                  <tr key={tx.id} className="border-b border-gray-800/50 hover:bg-[#1a1a2e] transition-colors">
                    <td className="px-5 py-3.5 text-xs text-gray-400 whitespace-nowrap">
                      {new Date(tx.date).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="text-sm text-white">{tx.merchant || tx.description}</div>
                      {tx.is_recurring && (
                        <span className="text-[10px] text-purple-400 bg-purple-500/10 px-1.5 py-0.5 rounded-full">recurring</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      {editId === tx.id ? (
                        <div className="flex items-center gap-2">
                          <select value={editCat} onChange={e => setEditCat(e.target.value)}
                            className="bg-[#070711] border border-purple-500 rounded-lg px-2 py-1 text-xs text-white focus:outline-none">
                            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                          </select>
                          <button onClick={() => saveEdit(tx.id)} className="text-xs text-purple-400 hover:text-purple-300">✓</button>
                          <button onClick={() => setEditId(null)} className="text-xs text-gray-500 hover:text-gray-400">✕</button>
                        </div>
                      ) : (
                        <button onClick={() => { setEditId(tx.id); setEditCat(tx.category); }}
                          className="text-xs px-2.5 py-1 bg-[#1a1a2e] border border-gray-700 rounded-lg
                                     text-gray-300 hover:border-purple-600/50 transition-colors">
                          {tx.category}
                        </button>
                      )}
                    </td>
                    <td className={`px-5 py-3.5 text-right text-sm font-semibold
                      ${tx.excluded ? 'text-gray-600 line-through' : tx.type === 'credit' ? 'text-green-400' : 'text-white'}`}>
                      {tx.type === 'credit' ? '+' : '-'}${tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    {/* Flag / Watch */}
                    <td className="px-5 py-3.5 text-center">
                      <button
                        onClick={() => flagTx.mutate({ id: tx.id, flagged: !tx.flagged })}
                        title={tx.flagged ? 'Remove from watchlist' : 'Add to watchlist'}
                        className={`text-lg transition-all hover:scale-110 ${tx.flagged ? 'opacity-100' : 'opacity-20 hover:opacity-60'}`}>
                        🚩
                      </button>
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <button
                        onClick={() => excludeTx.mutate({ id: tx.id, excluded: !tx.excluded })}
                        title={tx.excluded ? 'Click to include' : 'Click to exclude from dashboard'}
                        className={`text-xs px-2 py-1 rounded-lg border transition-colors
                          ${tx.excluded
                            ? 'bg-red-500/20 border-red-500/40 text-red-400 hover:bg-red-500/30'
                            : 'bg-gray-800 border-gray-700 text-gray-500 hover:border-red-500/40 hover:text-red-400'}`}>
                        {tx.excluded ? 'Excluded' : '—'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>
    </div>
  );
}
