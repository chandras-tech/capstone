import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { User } from '../types';

export function useAuth() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  const login = async (email: string, password: string) => {
    setLoading(true); setError(null);
    try {
      const { data } = await api.post('/auth/login', { email, password });
      localStorage.setItem('token', data.access_token);
      localStorage.setItem('user', JSON.stringify(data.user));
      navigate('/dashboard');
    } catch (e: any) {
      setError(e.response?.data?.detail || 'Login failed');
    } finally { setLoading(false); }
  };

  const register = async (name: string, email: string, password: string) => {
    setLoading(true); setError(null);
    try {
      const { data } = await api.post('/auth/register', { name, email, password });
      localStorage.setItem('token', data.access_token);
      localStorage.setItem('user', JSON.stringify(data.user));
      navigate('/dashboard');
    } catch (e: any) {
      setError(e.response?.data?.detail || 'Registration failed');
    } finally { setLoading(false); }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  const getUser = (): User | null => {
    const u = localStorage.getItem('user');
    return u ? JSON.parse(u) : null;
  };

  return { login, register, logout, getUser, loading, error };
}
