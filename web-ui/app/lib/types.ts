export interface Transaction {
  id?: number;
  date: string;
  description: string;
  amount: number;
  payee?: string;
  category?: string;
  subcategory?: string;
  notes?: string;
}

export interface SpendingCategory {
    id: string;
    name: string;
    percentage?: number;
    balance?: number;
}
