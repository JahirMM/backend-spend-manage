export interface Expense {
  id: string;
  user_id: string;
  commerce: string;
  count: string; // formato moneda en BD: "S1.150"
  name: string;
  account_id: string | null;
  created_at: string;
}
