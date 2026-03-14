import type { Coordinates } from '@uvidai/shared';
import type {
  RealEstateListing,
  ListingSearchParams,
  PriceEstimate,
  ListingsClient,
} from './index.js';
import { NominatimClient } from '../geocoder/nominatim-client.js';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const BASE_URL = 'https://www.halooglasi.com';
const USER_AGENT =
  'Mozilla/5.0 (compatible; UvidAI/0.1.0; +https://uvidai.rs)';
const RATE_LIMIT_MS = 2000;
const CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours

/** City slug mapping for halooglasi URL paths */
const CITY_SLUGS: Record<string, string> = {
  beograd: 'beograd',
  'novi-sad': 'novi-sad',
  nis: 'nis',
  subotica: 'subotica',
  kragujevac: 'kragujevac',
};

/** Transaction type → halooglasi path segment */
const TRANSACTION_PATHS: Record<string, string> = {
  sale: 'prodaja',
  rent: 'iznajmljivanje',
};

/** Listing type → halooglasi path segment */
const TYPE_PATHS: Record<string, string> = {
  apartment: 'stanova',
  house: 'kuca',
  land: 'zemljista',
  commercial: 'poslovnog-prostora',
};

// ---------------------------------------------------------------------------
// Cache entry
// ---------------------------------------------------------------------------

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

// ---------------------------------------------------------------------------
// HaloOglasiClient
// ---------------------------------------------------------------------------

export class HaloOglasiClient implements ListingsClient {
  private readonly geocoder = new NominatimClient();
  private lastRequestTime = 0;
  private listingsCache = new Map<string, CacheEntry<RealEstateListing[]>>();
  private readonly cacheTtlMs = CACHE_TTL_MS;

  private async throttle(): Promise<void> {
    const now = Date.now();
    const elapsed = now - this.lastRequestTime;
    if (elapsed < RATE_LIMIT_MS) {
      await new Promise((r) => setTimeout(r, RATE_LIMIT_MS - elapsed));
    }
    this.lastRequestTime = Date.now();
  }

  private getCacheKey(params: ListingSearchParams): string {
    const parts = [
      params.city,
      params.type ?? 'all',
      params.transactionType ?? 'sale',
      params.page ?? 1,
      params.municipality ?? '',
    ];
    return parts.join('|');
  }

  private getCachedListings(params: ListingSearchParams): RealEstateListing[] | null {
    const key = this.getCacheKey(params);
    const entry = this.listingsCache.get(key);
    if (!entry || Date.now() > entry.expiresAt) {
      return null;
    }
    return entry.data;
  }

  private setCachedListings(params: ListingSearchParams, listings: RealEstateListing[]): void {
    const key = this.getCacheKey(params);
    this.listingsCache.set(key, {
      data: listings,
      expiresAt: Date.now() + this.cacheTtlMs,
    });
  }

  /** Build search URL for halooglasi */
  private buildSearchUrl(params: ListingSearchParams): string {
    const citySlug = CITY_SLUGS[params.city.toLowerCase()] ?? params.city.toLowerCase().replace(/\s+/g, '-');
    const tx = params.transactionType ?? 'sale';
    const type = params.type ?? 'apartment';
    const txPath = TRANSACTION_PATHS[tx] ?? 'prodaja';
    const typePath = TYPE_PATHS[type] ?? 'stanova';
    const page = params.page ?? 1;
    return `${BASE_URL}/nekretnine/${txPath}-${typePath}/${citySlug}?page=${page}`;
  }

  /** Fetch HTML with rate limiting and User-Agent */
  private async fetchHtml(url: string): Promise<string> {
    await this.throttle();
    const res = await fetch(url, {
      headers: { 'User-Agent': USER_AGENT },
    });
    if (!res.ok) {
      throw new Error(`HaloOglasi fetch failed: HTTP ${res.status}`);
    }
    return res.text();
  }

  /** Parse listings from HTML using regex/string extraction */
  private parseListingsFromHtml(
    html: string,
    city: string,
    type: RealEstateListing['type'],
    transactionType: RealEstateListing['transactionType']
  ): RealEstateListing[] {
    const listings: RealEstateListing[] = [];
    const scrapedAt = new Date().toISOString();

    // Match listing links: /nekretnine/prodaja-stanova/... or /nekretnine/...
    // Match listing detail links (exclude category pages like /nekretnine/prodaja-stanova/beograd)
    const linkRegex = /href="(\/nekretnine\/[^"]+)"[^>]*>/gi;
    const priceRegex = /(\d{1,3}(?:\.\d{3})*)\s*(?:€|EUR|eur)/;
    const areaRegex = /(\d+(?:[.,]\d+)?)\s*(?:m²|m2|kvadrata|kv\.?)/i;
    const roomsRegex = /(\d+)\+?(\d*)\s*(?:soba|sobe|sobi)/i;
    const seenUrls = new Set<string>();
    let linkMatch: RegExpExecArray | null;

    while ((linkMatch = linkRegex.exec(html)) !== null) {
      const path = linkMatch[1];
      if (path.includes('/postavite-oglas') || path.includes('/pretraga')) continue;
      // Skip category index pages (e.g. /nekretnine/prodaja-stanova/beograd with no extra segment)
      const segments = path.replace(/\/$/, '').split('/');
      if (segments.length <= 4) continue;

      const fullUrl = path.startsWith('http') ? path : `${BASE_URL}${path}`;
      const urlKey = fullUrl.split('?')[0];
      if (seenUrls.has(urlKey)) continue;
      seenUrls.add(urlKey);

      // Extract context around the link (next ~500 chars for price/area)
      const start = Math.max(0, linkMatch.index - 200);
      const end = Math.min(html.length, linkMatch.index + 800);
      const block = html.slice(start, end);

      // Try to extract title from link text or nearby
      const titleMatch = block.match(/<a[^>]*>([^<]{5,120})<\/a>/);
      const title = titleMatch ? titleMatch[1].trim().replace(/\s+/g, ' ') : 'Nekretnina';

      // Extract price (first EUR match in block)
      const priceMatch = block.match(priceRegex);
      const price = priceMatch ? parseInt(priceMatch[1].replace(/\./g, ''), 10) : 0;
      if (price <= 0) continue;

      // Extract area
      const areaMatch = block.match(areaRegex);
      const area = areaMatch
        ? parseFloat(areaMatch[1].replace(',', '.'))
        : undefined;

      // Extract rooms
      const roomsMatch = block.match(roomsRegex);
      const rooms = roomsMatch
        ? parseInt(roomsMatch[1], 10) + (roomsMatch[2] ? parseInt(roomsMatch[2], 10) : 0)
        : undefined;

      const pricePerSqm = area && area > 0 ? Math.round(price / area) : undefined;

      const id = `halo-${Buffer.from(urlKey).toString('base64url').slice(0, 24)}`;

      listings.push({
        id,
        source: 'halooglasi',
        title,
        price,
        currency: 'EUR',
        pricePerSqm,
        area,
        rooms,
        type,
        transactionType,
        city,
        url: fullUrl,
        scrapedAt,
      });
    }

    return listings;
  }

  async searchListings(params: ListingSearchParams): Promise<RealEstateListing[]> {
    const cached = this.getCachedListings(params);
    if (cached) return cached;

    const city = params.city;
    const type = params.type ?? 'apartment';
    const transactionType = params.transactionType ?? 'sale';

    try {
      const url = this.buildSearchUrl(params);
      const html = await this.fetchHtml(url);
      let listings = this.parseListingsFromHtml(html, city, type, transactionType);

      // Apply client-side filters
      if (params.minPrice != null) {
        listings = listings.filter((l) => l.price >= params.minPrice!);
      }
      if (params.maxPrice != null) {
        listings = listings.filter((l) => l.price <= params.maxPrice!);
      }
      if (params.minArea != null) {
        listings = listings.filter((l) => (l.area ?? 0) >= params.minArea!);
      }
      if (params.maxArea != null) {
        listings = listings.filter((l) => (l.area ?? 0) <= params.maxArea!);
      }
      if (params.municipality) {
        listings = listings.filter(
          (l) =>
            l.municipality?.toLowerCase() === params.municipality!.toLowerCase()
        );
      }

      const limit = params.limit ?? 50;
      listings = listings.slice(0, limit);

      this.setCachedListings(params, listings);
      return listings;
    } catch (err) {
      // Return empty on scrape failure; cache miss will retry next time
      return [];
    }
  }

  async estimatePrice(
    coordinates: Coordinates,
    type: RealEstateListing['type'],
    area?: number
  ): Promise<PriceEstimate> {
    // Reverse geocode to get municipality and city
    const geo = await this.geocoder.reverse(coordinates);
    const municipality = geo?.address?.municipality ?? geo?.address?.suburb ?? 'Nepoznata';
    const city =
      geo?.address?.city ?? geo?.address?.municipality ?? geo?.address?.state ?? 'Beograd';

    // Map city name to halooglasi slug
    const citySlug =
      city.toLowerCase().includes('beograd') || city.toLowerCase().includes('belgrade')
        ? 'beograd'
        : city.toLowerCase().includes('novi sad')
          ? 'novi-sad'
          : city.toLowerCase().replace(/\s+/g, '-');

    // Fetch listings to aggregate (use cached when possible)
    const listings = await this.searchListings({
      city: citySlug,
      type,
      transactionType: 'sale',
      page: 1,
      limit: 100,
    });

    // Filter by municipality if we have it
    const filtered =
      municipality !== 'Nepoznata'
        ? listings.filter(
            (l) =>
              l.municipality?.toLowerCase().includes(municipality.toLowerCase()) ||
              l.address?.toLowerCase().includes(municipality.toLowerCase())
          )
        : listings;

    // Use filtered or fallback to all if no municipality match
    const withArea = (filtered.length > 0 ? filtered : listings).filter(
      (l) => l.pricePerSqm != null && l.pricePerSqm > 0
    );

    const pricesPerSqm = withArea.map((l) => l.pricePerSqm!);
    const sampleSize = pricesPerSqm.length;

    if (sampleSize === 0) {
      return {
        estimatedPricePerSqm: 0,
        currency: 'EUR',
        confidenceLevel: 'low',
        sampleSize: 0,
        medianPrice: 0,
        avgPrice: 0,
        minPrice: 0,
        maxPrice: 0,
        municipality,
        city,
        computedAt: new Date().toISOString(),
      };
    }

    const sorted = [...pricesPerSqm].sort((a, b) => a - b);
    const medianPrice =
      sampleSize % 2 === 0
        ? (sorted[sampleSize / 2 - 1]! + sorted[sampleSize / 2]!) / 2
        : sorted[Math.floor(sampleSize / 2)]!;
    const avgPrice =
      pricesPerSqm.reduce((s, p) => s + p, 0) / sampleSize;
    const minPrice = sorted[0]!;
    const maxPrice = sorted[sampleSize - 1]!;

    const confidenceLevel: PriceEstimate['confidenceLevel'] =
      sampleSize >= 20 ? 'high' : sampleSize >= 5 ? 'medium' : 'low';

    const estimatedPricePerSqm = medianPrice;

    return {
      estimatedPricePerSqm,
      currency: 'EUR',
      confidenceLevel,
      sampleSize,
      medianPrice,
      avgPrice,
      minPrice,
      maxPrice,
      municipality,
      city,
      computedAt: new Date().toISOString(),
    };
  }
}
