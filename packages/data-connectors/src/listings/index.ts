import type { Coordinates } from '@uvidai/shared';

export interface RealEstateListing {
  id: string;
  source: 'halooglasi' | 'nekretnine' | 'manual';
  title: string;
  price: number;
  currency: 'EUR' | 'RSD';
  pricePerSqm?: number;
  area?: number; // in m²
  rooms?: number;
  type: 'apartment' | 'house' | 'land' | 'commercial';
  transactionType: 'sale' | 'rent';
  address?: string;
  municipality?: string;
  city: string;
  coordinates?: Coordinates;
  url?: string;
  scrapedAt: string;
  publishedAt?: string;
  features?: string[];
}

export interface ListingSearchParams {
  city: string;
  type?: RealEstateListing['type'];
  transactionType?: RealEstateListing['transactionType'];
  minPrice?: number;
  maxPrice?: number;
  minArea?: number;
  maxArea?: number;
  municipality?: string;
  page?: number;
  limit?: number;
}

export interface PriceEstimate {
  estimatedPricePerSqm: number;
  currency: 'EUR';
  confidenceLevel: 'high' | 'medium' | 'low';
  sampleSize: number;
  medianPrice: number;
  avgPrice: number;
  minPrice: number;
  maxPrice: number;
  municipality: string;
  city: string;
  computedAt: string;
}

export interface ListingsClient {
  searchListings(params: ListingSearchParams): Promise<RealEstateListing[]>;
  estimatePrice(
    coordinates: Coordinates,
    type: RealEstateListing['type'],
    area?: number
  ): Promise<PriceEstimate>;
}

export { HaloOglasiClient } from './halooglasi-client.js';
