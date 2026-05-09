import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from 'react-query';
import AppNavbar from '../components/layout/AppNavbar';
import DropZone from '../components/upload/DropZone';
import { useAccounts, useStatements } from '../hooks/useTransactions';
import { Statement, Account } from '../types';
import api from '../api';

const STATUS_COLOR: Record<string, string> = {
  completed:  'text-green-400 bg-green-500/10 border-green-500/20',
  processing: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
  pending:    'text-gray-400  bg-gray-500/10  border-gray-500/20',
  failed:     'text-red-400   bg-red-500/10   border-red-500/20',
};

// ── Result popup ──────────────────────────────────────────────────────────────
function ResultPopup({ result, onClose }: { result: { ok: boolean; message: string; count?: number }; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div className={`bg-[#0f0f1a] border rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl
        ${result.ok ? 'border-green-500/30' : 'border-red-500/30'}`}>
        <div className="text-4xl mb-4 text-center">{result.ok ? '✅' : '⚠️'}</div>
        <h3 className={`text-lg font-bold text-center mb-3 ${result.ok ? 'text-green-400' : 'text-red-400'}`}>
          {result.ok ? `${result.count} Transactions Imported` : 'No Transactions Found'}
        </h3>
        <p className="text-gray-400 text-sm text-center leading-relaxed mb-6">{result.message}</p>
        <button onClick={onClose}
          className={`w-full py-2.5 rounded-xl font-medium text-sm transition-colors
            ${result.ok
              ? 'bg-green-600/20 border border-green-500/30 text-green-400 hover:bg-green-600/30'
              : 'bg-red-600/20 border border-red-500/30 text-red-400 hover:bg-red-600/30'}`}>
          {result.ok ? 'View Transactions' : 'Dismiss'}
        </button>
      </div>
    </div>
  );
}

export default function Upload() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [accountId, setAccountId] = useState('');
  const [newAccount, setNewAccount] = useState({ name: '', type: 'checking', bank_name: '' });
  const [showNewAccount, setShowNewAccount] = useState(false);
  const [popup, setPopup] = useState<{ ok: boolean; message: string; count?: number; period?: string } | null>(null);
  const [uploadError, setUploadError] = useState('');

  const { data: accounts = [] } = useAccounts();
  const { data: statements = [] } = useStatements();

  const createAccount = useMutation(
    (body: typeof newAccount) => api.post('/accounts', body).then(r => r.data),
    {
      onSuccess: (acc: Account) => {
        qc.invalidateQueries('accounts');
        setAccountId(acc.id);
        setShowNewAccount(false);
      },
    }
  );

  const upload = useMutation(
    (file: File) => {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('account_id', accountId);
      return api.post('/statements/upload', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 600000, // 10 minutes — PDF vision processing takes 2-4 min
      }).then(r => r.data);
    },
    {
      onSuccess: (data: any) => {
        qc.invalidateQueries('statements');
        setUploadError('');
        if (data.status === 'failed') {
          setPopup({ ok: false, message: data.error_message || 'No transactions could be extracted from this file.' });
        } else {
          // Build URL params from statement period so Transactions page auto-filters
          let period = '';
          if (data.period_start) {
            const d = new Date(data.period_start);
            period = `?month=${d.getMonth() + 1}&year=${d.getFullYear()}`;
          }
          setPopup({
            ok: true,
            count: data.transaction_count,
            message: `Successfully imported ${data.transaction_count} transactions from ${data.filename}.`,
            period,
          });
        }
      },
      onError:   (e: any) => setUploadError(e.response?.data?.detail || 'Upload failed'),
    }
  );

  const handleFile = (file: File) => {
    if (!accountId) { setUploadError('Please select or create an account first'); return; }
    setUploadError('');
    upload.mutate(file);
  };

  return (
    <div className="min-h-screen bg-[#070711] text-white">
      {popup && (
        <ResultPopup
          result={popup}
          onClose={() => {
            const p = popup;
            setPopup(null);
            if (p.ok) navigate(`/transactions${p.period || ''}`);
          }}
        />
      )}
      <AppNavbar />
      <main className="pt-20 px-8 pb-12 max-w-4xl mx-auto">
        <div className="py-8">
          <h1 className="text-2xl font-black">Upload Statement</h1>
          <p className="text-gray-400 text-sm mt-1">PDF or CSV from any major bank or credit card</p>
        </div>

        {/* Account selector */}
        <div className="bg-[#0f0f1a] border border-purple-900/20 rounded-2xl p-6 mb-6">
          <h3 className="text-sm font-semibold text-gray-300 mb-4">1. Select Account</h3>
          {accounts.length > 0 ? (
            <div className="flex items-center gap-3 flex-wrap">
              {accounts.map((a: Account) => (
                <button key={a.id} onClick={() => setAccountId(a.id)}
                  className={`px-4 py-2 rounded-xl text-sm border transition-all
                    ${accountId === a.id
                      ? 'bg-purple-600/20 border-purple-500 text-purple-300'
                      : 'bg-[#1a1a2e] border-gray-700 text-gray-400 hover:border-gray-500'}`}>
                  {a.name} <span className="text-gray-600 ml-1">· {a.bank_name || a.type}</span>
                </button>
              ))}
              <button onClick={() => setShowNewAccount(true)}
                className="px-4 py-2 rounded-xl text-sm border border-dashed border-gray-700
                           text-gray-500 hover:border-gray-500 hover:text-gray-400 transition-all">
                + New Account
              </button>
            </div>
          ) : (
            <div>
              <p className="text-gray-500 text-sm mb-3">No accounts yet. Create one to get started.</p>
              <button onClick={() => setShowNewAccount(true)}
                className="px-4 py-2 bg-purple-600/20 border border-purple-600/40 rounded-xl text-sm text-purple-400">
                + Create Account
              </button>
            </div>
          )}

          {showNewAccount && (
            <div className="mt-4 grid grid-cols-3 gap-3 p-4 bg-[#1a1a2e] rounded-xl border border-gray-800">
              <input placeholder="Account name (e.g. Chase Checking)"
                value={newAccount.name} onChange={e => setNewAccount({ ...newAccount, name: e.target.value })}
                className="col-span-3 bg-[#070711] border border-gray-700 rounded-lg px-3 py-2 text-sm text-white
                           focus:outline-none focus:border-purple-500" />
              <input placeholder="Bank name"
                value={newAccount.bank_name} onChange={e => setNewAccount({ ...newAccount, bank_name: e.target.value })}
                className="bg-[#070711] border border-gray-700 rounded-lg px-3 py-2 text-sm text-white
                           focus:outline-none focus:border-purple-500" />
              <select value={newAccount.type} onChange={e => setNewAccount({ ...newAccount, type: e.target.value })}
                className="bg-[#070711] border border-gray-700 rounded-lg px-3 py-2 text-sm text-white
                           focus:outline-none focus:border-purple-500">
                <option value="checking">Checking</option>
                <option value="savings">Savings</option>
                <option value="credit_card">Credit Card</option>
              </select>
              <div className="flex gap-2">
                <button onClick={() => createAccount.mutate(newAccount)}
                  className="flex-1 bg-purple-600 hover:bg-purple-500 rounded-lg px-3 py-2 text-sm font-medium transition-colors">
                  Save
                </button>
                <button onClick={() => setShowNewAccount(false)}
                  className="px-3 py-2 border border-gray-700 rounded-lg text-sm text-gray-400 hover:text-white transition-colors">
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Drop zone */}
        <div className="bg-[#0f0f1a] border border-purple-900/20 rounded-2xl p-6 mb-6">
          <h3 className="text-sm font-semibold text-gray-300 mb-4">2. Upload Statement</h3>
          <DropZone onFile={handleFile} loading={upload.isLoading} />
          {uploadError && (
            <p className="mt-3 text-red-400 text-xs bg-red-900/20 border border-red-800/30 rounded-lg px-3 py-2">{uploadError}</p>
          )}
          {upload.isSuccess && (
            <p className="mt-3 text-green-400 text-xs bg-green-900/20 border border-green-800/30 rounded-lg px-3 py-2">
              ✓ Statement uploaded and processed successfully
            </p>
          )}
        </div>

        {/* Statement history */}
        {statements.length > 0 && (
          <div className="bg-[#0f0f1a] border border-purple-900/20 rounded-2xl p-6">
            <h3 className="text-sm font-semibold text-gray-300 mb-4">Upload History</h3>
            <div className="space-y-2">
              {statements.map((s: Statement) => (
                <div key={s.id}
                  className="flex items-center justify-between py-3 px-4 bg-[#1a1a2e] rounded-xl">
                  <div>
                    <p className="text-sm text-white font-medium">{s.filename || 'Statement'}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {s.transaction_count} transactions
                      {s.period_start && ` · ${new Date(s.period_start).toLocaleDateString()}`}
                    </p>
                  </div>
                  <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${STATUS_COLOR[s.status]}`}>
                    {s.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
