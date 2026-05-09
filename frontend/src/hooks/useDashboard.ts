import { useQuery } from 'react-query';
import api from '../api';

export function useSummary(month: number, year: number, fromMonth?: number, fromYear?: number) {
  const params = new URLSearchParams({ month: String(month), year: String(year) });
  if (fromMonth) params.set('from_month', String(fromMonth));
  if (fromYear)  params.set('from_year',  String(fromYear));
  return useQuery(['summary', month, year, fromMonth, fromYear], () =>
    api.get(`/dashboard/summary?${params}`).then(r => r.data)
  );
}

export function useCategories(month: number, year: number) {
  return useQuery(['categories', month, year], () =>
    api.get(`/dashboard/categories?month=${month}&year=${year}`).then(r => r.data)
  );
}

export function useTrends(months = 6) {
  return useQuery(['trends', months], () =>
    api.get(`/dashboard/trends?months=${months}`).then(r => r.data)
  );
}

export function useRecurring(months = 12) {
  return useQuery(['recurring', months], () =>
    api.get(`/dashboard/recurring?months=${months}`).then(r => r.data)
  );
}
