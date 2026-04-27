// ============================================================
// Roofly — Domain Types
// ============================================================

export interface TenantDocument {
  id: string;
  tenant_id: string;
  name: string;
  file_path: string;
  size: number | null;
  mime_type: string | null;
  created_at: string;
  /** Signed URL — populated after fetching from Storage */
  url?: string;
}

export interface Tenant {
  id: string;
  name: string;
  move_in_date: string;    // ISO date string  e.g. "2024-01-15"
  move_out_date: string | null;  // null = currently living
  phone: string | null;
  email: string | null;
  property_id: string | null;
  created_at: string;
  updated_at: string;
  /** Joined from tenant_documents — populated in list/detail queries */
  documents?: TenantDocument[];
}

// ---- Form types (used in add/edit) ----

export interface TenantFormValues {
  name: string;
  move_in_date: string;
  currently_living: boolean;
  move_out_date: string | null;
  phone: string;
  email: string;
  new_documents: File[];   // files to upload
  removed_document_ids: string[];  // existing doc IDs to remove
}
