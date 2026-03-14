import type { Coordinates } from '@uvidai/shared';

// ---------------------------------------------------------------------------
// GeoSrbija — RGZ cadastral & spatial data services
// ---------------------------------------------------------------------------

/** Parcel info from the GeoSrbija WFS/WMS service */
export interface ParcelInfo {
  parcelNumber: string;
  cadastralMunicipality: string;
  /** Municipality code */
  municipalityCode?: string;
  /** Area in m² */
  area?: number;
  /** Parcel geometry as GeoJSON (Polygon/MultiPolygon) */
  geometry?: GeoJsonGeometry;
  /** Current land use classification */
  landUse?: string;
  /** Encumbrances / zabeležbe registered on the parcel */
  encumbrances?: string[];
  /** Owner name(s) if publicly available */
  owners?: string[];
  /** Centroid of the parcel */
  centroid?: Coordinates;
}

/** Simplified GeoJSON geometry */
export interface GeoJsonGeometry {
  type: 'Polygon' | 'MultiPolygon' | 'Point';
  coordinates: unknown;
}

/** Cadastral data including broader spatial context */
export interface CadastralData {
  parcel: ParcelInfo;
  /** Spatial plan zone the parcel falls in */
  planningZone?: string;
  /** Permitted building use (residential, commercial, mixed, etc.) */
  permittedUse?: string;
  /** Max permitted building height (metres) */
  maxHeight?: number;
  /** Max floor area ratio */
  maxFAR?: number;
}

/** Options for parcel queries */
export interface ParcelQueryOptions {
  /** Search by parcel number + cadastral municipality */
  parcelNumber?: string;
  cadastralMunicipality?: string;
  /** Search by coordinates (find parcel at point) */
  coordinates?: Coordinates;
  /** Search by address */
  address?: string;
}

/**
 * Client interface for GeoSrbija / RGZ spatial services.
 *
 * Implementations query WFS/WMS endpoints provided by
 * the Republic Geodetic Authority (RGZ).
 */
export interface GeoSrbijaClient {
  /** Find a parcel by number or coordinates */
  findParcel(options: ParcelQueryOptions): Promise<ParcelInfo | null>;

  /** Get full cadastral data including planning info */
  getCadastralData(options: ParcelQueryOptions): Promise<CadastralData | null>;

  /** List parcels within a bounding box */
  listParcels(
    bbox: { south: number; west: number; north: number; east: number },
    limit?: number,
  ): Promise<ParcelInfo[]>;
}

export { GeoSrbijaHttpClient } from './geosrbija-client.js';
