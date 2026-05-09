import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function Login() {
  const { login, loading, error } = useAuth();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    login(email, password);
  };

  return (
    <div className="min-h-screen bg-[#070711] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="text-2xl font-black gradient-text">FinSight</Link>
          <p className="text-gray-400 mt-2 text-sm">Sign in to your account</p>
        </div>
        <div className="bg-[#0f0f1a] border border-purple-900/30 rounded-2xl p-8">
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="block text-xs text-gray-400 mb-1.5 font-medium">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                className="w-full bg-[#1a1a2e] border border-gray-700 rounded-xl px-4 py-3 text-sm
                           text-white placeholder-gray-600 focus:outline-none focus:border-purple-500 transition-colors"
                placeholder="you@example.com" />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1.5 font-medium">Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} required
                className="w-full bg-[#1a1a2e] border border-gray-700 rounded-xl px-4 py-3 text-sm
                           text-white placeholder-gray-600 focus:outline-none focus:border-purple-500 transition-colors"
                placeholder="••••••••" />
            </div>
            {error && <p className="text-red-400 text-xs bg-red-900/20 border border-red-800/30 rounded-lg px-3 py-2">{error}</p>}
            <button type="submit" disabled={loading}
              className="w-full py-3 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 rounded-xl
                         font-semibold text-sm transition-colors shadow-lg shadow-purple-900/30 mt-2">
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
          <p className="text-center text-xs text-gray-500 mt-6">
            Don't have an account?{' '}
            <Link to="/register" className="text-purple-400 hover:text-purple-300 transition-colors">Create one</Link>
          </p>
        </div>
        <p className="text-center text-xs text-gray-600 mt-4">
          Demo: demo@finsight.com / password123
        </p>
      </div>
    </div>
  );
}
