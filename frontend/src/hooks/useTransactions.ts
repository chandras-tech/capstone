import { useQuery, useMutation, useQueryClient } from 'react-query';
import api from '../api';

export function useTransactions(month?: number, year?: number, category?: string) {
  const params = new URLSearchParams();
  if (month)    params.set('month', String(month));
  if (year)     params.set('year',  String(year));
  if (category) params.set('category', category);

  return useQuery(['transactions', month, year, category], () =>
    api.get(`/transactions?${params}`).then(r => r.data)
  );
}

export function useUpdateCategory() {
  const qc = useQueryClient();
  return useMutation(
    ({ id, category }: { id: string; category: string }) =>
      api.patch(`/transactions/${id}`, { category }).then(r => r.data),
    { onSuccess: () => qc.invalidateQueries('transactions') }
  );
}

export function useFlagTransaction() {
  const qc = useQueryClient();
  return useMutation(
    ({ id, flagged }: { id: string; flagged: boolean }) =>
      api.patch(`/transactions/${id}/flag`, { flagged }).then(r => r.data),
    { onSuccess: () => { qc.invalidateQueries('transactions'); qc.invalidateQueries('watchlist'); } }
  );
}

export function useWatchlist() {
  return useQuery('watchlist', () => api.get('/transactions/watchlist').then(r => r.data));
}

export function useExcludeTransaction() {
  const qc = useQueryClient();
  return useMutation(
    ({ id, excluded }: { id: string; excluded: boolean }) =>
      api.patch(`/transactions/${id}/exclude`, { excluded }).then(r => r.data),
    {
      onSuccess: () => {
        qc.invalidateQueries('transactions');
        qc.invalidateQueries('summary');
        qc.invalidateQueries('categories');
        qc.invalidateQueries('trends');
      },
    }
  );
}

export function useAccounts() {
  return useQuery('accounts', () => api.get('/accounts').then(r => r.data));
}

export function useStatements() {
  return useQuery('statements', () => api.get('/statements').then(r => r.data));
}
