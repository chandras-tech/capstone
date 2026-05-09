import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import AppNavbar from '../components/layout/AppNavbar';
import api from '../api';

const CATEGORIES = [
  'Food/Groceries','Dining/Restaurants','Shopping','Transport/Gas',
  'Housing/Rent','Mortgage','HOA','Utilities','Entertainment','Healthcare',
  'Income/Salary','Transfer','Subscription','Travel',
  'Education','Kid Learning','Kid Spending',
  'Personal Care','Insurance','Loan Payment','Trading','Other',
];

export default function Rules() {
  const qc = useQueryClient();
  const [keyword,  setKeyword]  = useState('');
  const [category, setCategory] = useState('Shopping');
  const [merchant, setMerchant] = useState('');

  const { data: rules = [], isLoading } = useQuery('rules',
    () => api.get('/rules').then(r => r.data));

  const addRule = useMutation(
    () => api.post('/rules', {
      keyword:  keyword.toLowerCase().trim(),
      category,
      merchant: merchant.trim() || null,
      priority: 5,
    }).then(r => r.data),
    {
      onSuccess: () => {
        qc.invalidateQueries('rules');
        setKeyword(''); setMerchant('');
      },
    }
  );

  const deleteRule = useMutation(
    (id: string) => api.delete(`/rules/${id}`).then(r => r.data),
    { onSuccess: () => qc.invalidateQueries('rules') }
  );

  const isGlobal = (rule: any) => !rule.user_id;

  return (
    <div className="min-h-screen bg-[#070711] text-white">
      <AppNavbar />
      <main className="pt-20 px-8 pb-12 max-w-5xl mx-auto">
        <div className="py-8">
          <h1 className="text-2xl font-black">Categorization Rules</h1>
          <p className="text-gray-400 text-sm mt-1">
            Keywords matched against transaction descriptions — applied automatically on every upload
          </p>
        </div>

        {/* Add new rule */}
        <div className="bg-[#0f0f1a] border border-purple-900/20 rounded-2xl p-6 mb-6">
          <h3 className="text-sm font-semibold text-gray-300 mb-4">Add Custom Rule</h3>
          <div className="grid grid-cols-4 gap-3">
            <input
              placeholder='Keyword (e.g. "costco")'
              value={keyword}
              onChange={e => setKeyword(e.target.value)}
              className="col-span-1 bg-[#1a1a2e] border border-gray-700 rounded-xl px-3 py-2.5
                         text-sm text-white focus:outline-none focus:border-purple-500"
            />
            <select value={category} onChange={e => setCategory(e.target.value)}
              className="col-span-1 bg-[#1a1a2e] border border-gray-700 rounded-xl px-3 py-2.5
                         text-sm text-white focus:outline-none focus:border-purple-500">
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <input
              placeholder='Merchant name (e.g. "Costco")'
              value={merchant}
              onChange={e => setMerchant(e.target.value)}
              className="col-span-1 bg-[#1a1a2e] border border-gray-700 rounded-xl px-3 py-2.5
                         text-sm text-white focus:outline-none focus:border-purple-500"
            />
            <button
              onClick={() => keyword && addRule.mutate()}
              disabled={!keyword || addRule.isLoading}
              className="col-span-1 bg-purple-600 hover:bg-purple-500 disabled:opacity-50
                         rounded-xl text-sm font-medium transition-colors px-4 py-2.5">
              + Add Rule
            </button>
          </div>
          <p className="text-gray-600 text-xs mt-2">
            Keyword is matched anywhere in the transaction description (case-insensitive)
          </p>
        </div>

        {/* Rules table */}
        <div className="bg-[#0f0f1a] border border-purple-900/20 rounded-2xl overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-800 flex items-center justify-between">
            <span className="text-sm text-gray-400">{rules.length} rules total</span>
            <div className="flex items-center gap-3 text-xs text-gray-600">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-purple-500" /> Your rules
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-gray-600" /> Global defaults
              </span>
            </div>
          </div>

          {isLoading ? (
            <div className="py-12 text-center text-gray-500">Loading…</div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="text-xs text-gray-500 border-b border-gray-800">
                  <th className="text-left px-5 py-3">Keyword</th>
                  <th className="text-left px-5 py-3">Category</th>
                  <th className="text-left px-5 py-3">Merchant</th>
                  <th className="text-left px-5 py-3">Source</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody>
                {rules.map((rule: any) => (
                  <tr key={rule.id} className="border-b border-gray-800/50 hover:bg-[#1a1a2e] transition-colors">
                    <td className="px-5 py-3 text-sm font-mono text-purple-300">{rule.keyword}</td>
                    <td className="px-5 py-3">
                      <span className="text-xs px-2 py-1 bg-purple-600/20 border border-purple-600/30
                                       text-purple-300 rounded-lg">
                        {rule.category}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-sm text-gray-400">{rule.merchant || '—'}</td>
                    <td className="px-5 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        isGlobal(rule)
                          ? 'bg-gray-700 text-gray-400'
                          : 'bg-purple-600/20 text-purple-400'}`}>
                        {isGlobal(rule) ? 'Global' : 'Custom'}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      {!isGlobal(rule) && (
                        <button
                          onClick={() => deleteRule.mutate(rule.id)}
                          className="text-xs text-gray-600 hover:text-red-400 transition-colors">
                          Delete
                        </button>
                      )}
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
