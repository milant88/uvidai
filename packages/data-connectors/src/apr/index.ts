import type { CompanyLegalForm, CompanyStatus } from '@uvidai/shared';

// ---------------------------------------------------------------------------
// APR — Agencija za privredne registre (Serbian Business Registers Agency)
// ---------------------------------------------------------------------------

/** Company info as returned from the APR data source */
export interface CompanyInfo {
  registrationNumber: string;
  taxId: string;
  name: string;
  legalForm: CompanyLegalForm;
  status: CompanyStatus;
  address?: string;
  foundedAt?: string;
  activityCode?: string;
  activityDescription?: string;
  isBlocked: boolean;
  blockedDaysLastYear?: number;
  representative?: string;
  /** Capital in RSD */
  capital?: number;
  /** Number of employees (latest report) */
  employeeCount?: number;
}

/** Options for searching APR */
export interface APRSearchOptions {
  /** Search by company name (partial match) */
  name?: string;
  /** Search by registration number (matični broj) */
  registrationNumber?: string;
  /** Search by PIB */
  taxId?: string;
  /** Filter by status */
  status?: CompanyStatus;
  /** Max results */
  limit?: number;
}

/** Account block record from APR */
export interface BlockRecord {
  /** Start of block (ISO-8601) */
  blockedFrom: string;
  /** End of block (ISO-8601), null if still active */
  blockedUntil: string | null;
  /** Blocking creditor */
  creditor?: string;
  /** Amount in RSD */
  amount?: number;
}

/**
 * Client interface for APR data.
 *
 * Implementations may scrape the APR web portal or consume
 * structured data dumps from data.gov.rs.
 */
export interface APRClient {
  /** Search companies by various criteria */
  search(options: APRSearchOptions): Promise<CompanyInfo[]>;

  /** Get detailed company info by registration number */
  getByRegistrationNumber(regNumber: string): Promise<CompanyInfo | null>;

  /** Get block history for a company */
  getBlockHistory(regNumber: string): Promise<BlockRecord[]>;
}

export { AprHttpClient } from './apr-client.js';
