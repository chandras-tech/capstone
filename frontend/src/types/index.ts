export interface User {
  id: string;
  email: string;
  name: string;
  created_at: string;
}

export interface Account {
  id: string;
  user_id: string;
  name: string;
  type: string;
  bank_name: string | null;
  currency: string;
}

export interface Statement {
  id: string;
  account_id: string;
  filename: string | null;
  period_start: string | null;
  period_end: string | null;
  status: "pending" | "processing" | "completed" | "failed";
  error_message: string | null;
  created_at: string;
  transaction_count: number;
}

export interface Transaction {
  id: string;
  account_id: string;
  statement_id: string;
  date: string;
  description: string;
  amount: number;
  type: "credit" | "debit";
  category: string;
  merchant: string | null;
  is_recurring: boolean;
  excluded: boolean;
  flagged: boolean;
  created_at: string;
}

export interface DashboardSummary {
  total_income: number;
  total_expenses: number;
  savings: number;
  savings_rate: number;
  dti_ratio: number;
  transaction_count: number;
  month: number;
  year: number;
}

export interface CategoryBreakdown {
  category: string;
  amount: number;
  percentage: number;
  count: number;
}

export interface TrendPoint {
  month: number;
  year: number;
  label: string;
  income: number;
  expenses: number;
  savings: number;
}

export interface Recommendation {
  id: string;
  type: string;
  title: string;
  body: string;
  potential_saving: number;
  created_at: string;
}
