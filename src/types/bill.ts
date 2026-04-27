import { Tenant } from './tenant';

export interface BillCategory {
  id: string;
  name: string;
  icon?: string;
  color?: string;
  created_at: string;
}

export interface BillSplit {
  id: string;
  bill_id: string;
  tenant_id: string;
  amount: number;
  days_stayed: number;
  created_at: string;
  tenant?: Tenant; // Joined data
}

export interface Bill {
  id: string;
  category_id: string;
  amount: number;
  start_date: string;
  end_date: string;
  document_path?: string;
  notes?: string | null;
  created_at: string;
  updated_at: string;
  category?: BillCategory; // Joined data
  splits?: BillSplit[];    // Joined data
}

export interface BillCategoryFormValues {
  name: string;
  icon?: string;
  color?: string;
}

export interface BillFormValues {
  category_id: string;
  amount: number;
  start_date: string;
  end_date: string;
  document_path?: string;
  notes?: string;
}
