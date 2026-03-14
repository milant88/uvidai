import type { CompanyLegalForm, CompanyStatus } from '@uvidai/shared';
import type {
  APRClient,
  APRSearchOptions,
  CompanyInfo,
  BlockRecord,
} from './index.js';

const APR_BASE = 'https://pretraga2.apr.gov.rs/APRWebSearch/Api';
const USER_AGENT = 'UvidAI/0.1.0 (uvidai.rs; legal-check)';
const MIN_REQUEST_INTERVAL_MS = 1000;
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour
const DEFAULT_RETRIES = 3;
const BASE_DELAY_MS = 500;

// ---------------------------------------------------------------------------
// APR API response types (inferred from API structure)
// ---------------------------------------------------------------------------

interface AprSearchResultItem {
  id?: string;
  maticniBroj?: string;
  pib?: string;
  naziv?: string;
  pravnaForma?: string;
  status?: string;
  sediste?: string;
  datumOsnivanja?: string;
  sifraDelatnosti?: string;
  opisDelatnosti?: string;
  zastupnik?: string;
  blokirano?: boolean;
  brojDanaBlokade?: number;
}

interface AprDetailsResponse {
  maticniBroj?: string;
  pib?: string;
  naziv?: string;
  pravnaForma?: string;
  status?: string;
  sediste?: string;
  datumOsnivanja?: string;
  sifraDelatnosti?: string;
  opisDelatnosti?: string;
  zastupnik?: string;
  blokirano?: boolean;
  brojDanaBlokade?: number;
  blokade?: Array<{
    datumOd?: string;
    datumDo?: string | null;
    poverilac?: string;
    iznos?: number;
  }>;
}

// ---------------------------------------------------------------------------
// Status / legal form mapping
// ---------------------------------------------------------------------------

const STATUS_MAP: Record<string, CompanyStatus> = {
  aktivno: 'active',
  aktivan: 'active',
  u_stečaju: 'in_bankruptcy',
  u_likvidaciji: 'in_liquidation',
  obrisan: 'deleted',
  blokiran: 'blocked',
};

const LEGAL_FORM_MAP: Record<string, CompanyLegalForm> = {
  doo: 'doo',
  ad: 'ad',
  preduzetnik: 'preduzetnik',
  zd: 'zd',
  kd: 'kd',
  od: 'od',
};

function mapStatus(raw?: string): CompanyStatus {
  if (!raw) return 'active';
  const key = raw.toLowerCase().replace(/\s+/g, '_');
  return STATUS_MAP[key] ?? 'active';
}

function mapLegalForm(raw?: string): CompanyLegalForm {
  if (!raw) return 'other';
  const key = raw.toLowerCase().replace(/\s+/g, '');
  return LEGAL_FORM_MAP[key] ?? 'other';
}

function mapAprItemToCompanyInfo(item: AprSearchResultItem): CompanyInfo {
  return {
    registrationNumber: String(item.maticniBroj ?? ''),
    taxId: String(item.pib ?? ''),
    name: String(item.naziv ?? ''),
    legalForm: mapLegalForm(item.pravnaForma),
    status: mapStatus(item.status),
    address: item.sediste ? String(item.sediste) : undefined,
    foundedAt: item.datumOsnivanja ? String(item.datumOsnivanja) : undefined,
    activityCode: item.sifraDelatnosti ? String(item.sifraDelatnosti) : undefined,
    activityDescription: item.opisDelatnosti
      ? String(item.opisDelatnosti)
      : undefined,
    isBlocked: Boolean(item.blokirano),
    blockedDaysLastYear: item.brojDanaBlokade,
    representative: item.zastupnik ? String(item.zastupnik) : undefined,
  };
}

function mapDetailsToCompanyInfo(d: AprDetailsResponse): CompanyInfo {
  return {
    registrationNumber: String(d.maticniBroj ?? ''),
    taxId: String(d.pib ?? ''),
    name: String(d.naziv ?? ''),
    legalForm: mapLegalForm(d.pravnaForma),
    status: mapStatus(d.status),
    address: d.sediste ? String(d.sediste) : undefined,
    foundedAt: d.datumOsnivanja ? String(d.datumOsnivanja) : undefined,
    activityCode: d.sifraDelatnosti ? String(d.sifraDelatnosti) : undefined,
    activityDescription: d.opisDelatnosti ? String(d.opisDelatnosti) : undefined,
    isBlocked: Boolean(d.blokirano),
    blockedDaysLastYear: d.brojDanaBlokade,
    representative: d.zastupnik ? String(d.zastupnik) : undefined,
  };
}

function mapBlockadeToRecord(b: {
  datumOd?: string;
  datumDo?: string | null;
  poverilac?: string;
  iznos?: number;
}): BlockRecord {
  return {
    blockedFrom: b.datumOd ?? '',
    blockedUntil: b.datumDo ?? null,
    creditor: b.poverilac,
    amount: b.iznos,
  };
}

// ---------------------------------------------------------------------------
// Fetch with rate limit and retry
// ---------------------------------------------------------------------------

async function fetchWithRetry(
  url: string,
  retries = DEFAULT_RETRIES
): Promise<Response> {
  let lastError: Error | null = null;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent': USER_AGENT,
          Accept: 'application/json',
        },
      });
      if (res.ok) return res;
      lastError = new Error(`HTTP ${res.status}: ${url}`);
    } catch (e) {
      lastError = e instanceof Error ? e : new Error(String(e));
    }
    if (attempt < retries) {
      const delay = BASE_DELAY_MS * Math.pow(2, attempt);
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  throw lastError ?? new Error('Fetch failed');
}

// ---------------------------------------------------------------------------
// AprHttpClient
// ---------------------------------------------------------------------------

export class AprHttpClient implements APRClient {
  private lastRequestTime = 0;
  private readonly searchCache = new Map<string, { data: CompanyInfo[]; ts: number }>();
  private readonly detailsCache = new Map<string, { data: CompanyInfo; ts: number }>();
  private readonly blockCache = new Map<string, { data: BlockRecord[]; ts: number }>();

  private async throttle(): Promise<void> {
    const now = Date.now();
    const elapsed = now - this.lastRequestTime;
    if (elapsed < MIN_REQUEST_INTERVAL_MS) {
      await new Promise((r) =>
        setTimeout(r, MIN_REQUEST_INTERVAL_MS - elapsed)
      );
    }
    this.lastRequestTime = Date.now();
  }

  private async fetchWithThrottle(url: string): Promise<Response> {
    await this.throttle();
    return fetchWithRetry(url);
  }

  private getCached<K>(
    cache: Map<string, { data: K; ts: number }>,
    key: string
  ): K | null {
    const entry = cache.get(key);
    if (!entry) return null;
    if (Date.now() - entry.ts > CACHE_TTL_MS) {
      cache.delete(key);
      return null;
    }
    return entry.data;
  }

  private setCache<K>(
    cache: Map<string, { data: K; ts: number }>,
    key: string,
    data: K
  ): void {
    cache.set(key, { data, ts: Date.now() });
  }

  async search(options: APRSearchOptions): Promise<CompanyInfo[]> {
    const query =
      options.name ?? options.registrationNumber ?? options.taxId ?? '';
    if (!query.trim()) return [];

    const cacheKey = `search:${query}:${options.limit ?? 20}`;
    const cached = this.getCached(this.searchCache, cacheKey);
    if (cached) return cached;

    try {
      const params = new URLSearchParams({ SearchTerm: query.trim() });
      const url = `${APR_BASE}/Company/Search?${params.toString()}`;
      const res = await this.fetchWithThrottle(url);

      if (!res.ok) return [];

      const data = (await res.json()) as AprSearchResultItem[] | { items?: AprSearchResultItem[] };
      const items = Array.isArray(data)
        ? data
        : Array.isArray((data as { items?: AprSearchResultItem[] }).items)
          ? (data as { items: AprSearchResultItem[] }).items
          : [];

      const limit = options.limit ?? 20;
      const results = items
        .slice(0, limit)
        .filter((i) => i.maticniBroj || i.naziv)
        .map(mapAprItemToCompanyInfo);

      this.setCache(this.searchCache, cacheKey, results);
      return results;
    } catch {
      return [];
    }
  }

  async getByRegistrationNumber(regNumber: string): Promise<CompanyInfo | null> {
    const key = regNumber.replace(/\D/g, '');
    if (!key) return null;

    const cached = this.getCached(this.detailsCache, key);
    if (cached) return cached;

    try {
      const params = new URLSearchParams({ CompanyId: key });
      const url = `${APR_BASE}/Company/Details?${params.toString()}`;
      const res = await this.fetchWithThrottle(url);

      if (!res.ok) return null;

      const data = (await res.json()) as AprDetailsResponse | null;
      if (!data || !data.maticniBroj) return null;

      const info = mapDetailsToCompanyInfo(data);
      this.setCache(this.detailsCache, key, info);
      return info;
    } catch {
      return null;
    }
  }

  async getBlockHistory(regNumber: string): Promise<BlockRecord[]> {
    const key = regNumber.replace(/\D/g, '');
    if (!key) return [];

    const cached = this.getCached(this.blockCache, key);
    if (cached) return cached;

    try {
      const params = new URLSearchParams({ CompanyId: key });
      const url = `${APR_BASE}/Company/Details?${params.toString()}`;
      const res = await this.fetchWithThrottle(url);

      if (!res.ok) return [];

      const data = (await res.json()) as AprDetailsResponse | null;
      const blocks = data?.blokade ?? [];
      const records = blocks.map(mapBlockadeToRecord);

      if (data) {
        this.setCache(this.detailsCache, key, mapDetailsToCompanyInfo(data));
      }
      this.setCache(this.blockCache, key, records);
      return records;
    } catch {
      return [];
    }
  }
}
