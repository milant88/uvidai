import { Injectable, Logger } from '@nestjs/common';
import {
  AprHttpClient,
  GeoSrbijaHttpClient,
} from '@uvidai/data-connectors';
import type { Company, Parcel } from '@uvidai/shared';

// ---------------------------------------------------------------------------
// Legal health check response
// ---------------------------------------------------------------------------

export interface LegalHealthCheck {
  company: Company | null;
  parcel: Parcel | null;
  companyBlockages: { blocked: boolean; daysLastYear?: number };
  parcelEncumbrances: string[];
  summary: string;
}

// ---------------------------------------------------------------------------
// Map CompanyInfo to Company (shared type)
// ---------------------------------------------------------------------------

function toCompanyInfo(company: {
  registrationNumber: string;
  taxId: string;
  name: string;
  legalForm: string;
  status: string;
  address?: string;
  foundedAt?: string;
  activityCode?: string;
  activityDescription?: string;
  isBlocked: boolean;
  blockedDaysLastYear?: number;
  representative?: string;
}): Company {
  return {
    registrationNumber: company.registrationNumber,
    taxId: company.taxId,
    name: company.name,
    legalForm: company.legalForm as Company['legalForm'],
    status: company.status as Company['status'],
    address: company.address,
    foundedAt: company.foundedAt,
    activityCode: company.activityCode,
    activityDescription: company.activityDescription,
    isBlocked: company.isBlocked,
    blockedDaysLastYear: company.blockedDaysLastYear,
    representative: company.representative,
  };
}

function toParcelInfo(parcel: {
  parcelNumber: string;
  cadastralMunicipality: string;
  area?: number;
  landUse?: string;
  encumbrances?: string[];
  owners?: string[];
}): Parcel {
  return {
    parcelNumber: parcel.parcelNumber,
    cadastralMunicipality: parcel.cadastralMunicipality,
    area: parcel.area,
    landUse: parcel.landUse,
    encumbrances: parcel.encumbrances,
    owners: parcel.owners,
  };
}

// ---------------------------------------------------------------------------
// LegalService
// ---------------------------------------------------------------------------

@Injectable()
export class LegalService {
  private readonly logger = new Logger(LegalService.name);
  private readonly apr = new AprHttpClient();
  private readonly geosrbija = new GeoSrbijaHttpClient();

  async searchCompanies(query: string): Promise<Company[]> {
    this.logger.debug(`APR search: "${query}"`);
    const results = await this.apr.search({
      name: query,
      registrationNumber: query,
      taxId: query,
      limit: 20,
    });
    return results.map(toCompanyInfo);
  }

  async getCompanyDetails(registrationNumber: string): Promise<Company | null> {
    this.logger.debug(`APR details: ${registrationNumber}`);
    const company = await this.apr.getByRegistrationNumber(registrationNumber);
    return company ? toCompanyInfo(company) : null;
  }

  async getParcelAtCoordinates(
    lat: number,
    lng: number
  ): Promise<Parcel | null> {
    this.logger.debug(`GeoSrbija parcel: ${lat}, ${lng}`);
    const parcel = await this.geosrbija.getParcelByCoordinates(lat, lng);
    return parcel ? toParcelInfo(parcel) : null;
  }

  async getLegalHealthCheck(
    companyQuery?: string,
    registrationNumber?: string,
    lat?: number,
    lng?: number
  ): Promise<LegalHealthCheck> {
    let company: Company | null = null;
    let parcel: Parcel | null = null;

    if (registrationNumber) {
      company = await this.getCompanyDetails(registrationNumber);
    } else if (companyQuery) {
      const results = await this.searchCompanies(companyQuery);
      company = results[0] ?? null;
    }

    if (lat != null && lng != null) {
      parcel = await this.getParcelAtCoordinates(lat, lng);
    }

    const companyBlockages = company
      ? {
          blocked: company.isBlocked,
          daysLastYear: company.blockedDaysLastYear,
        }
      : { blocked: false };

    const parcelEncumbrances = parcel?.encumbrances ?? [];

    const summary = this.buildSummary(company, parcel, companyBlockages, parcelEncumbrances);

    return {
      company,
      parcel,
      companyBlockages,
      parcelEncumbrances,
      summary,
    };
  }

  private buildSummary(
    company: Company | null,
    parcel: Parcel | null,
    companyBlockages: { blocked: boolean; daysLastYear?: number },
    parcelEncumbrances: string[]
  ): string {
    const parts: string[] = [];

    if (company) {
      parts.push(`Company: ${company.name} (${company.registrationNumber})`);
      parts.push(`Status: ${company.status}`);
      if (companyBlockages.blocked) {
        parts.push(
          `Account blocked: ${companyBlockages.daysLastYear ?? '?'} days in last year`
        );
      } else {
        parts.push('Account not blocked');
      }
    } else {
      parts.push('No company data found');
    }

    if (parcel) {
      parts.push(`Parcel: ${parcel.parcelNumber} (${parcel.cadastralMunicipality})`);
      if (parcelEncumbrances.length > 0) {
        parts.push(`Encumbrances: ${parcelEncumbrances.join(', ')}`);
      } else {
        parts.push('No encumbrances registered');
      }
    } else {
      parts.push('No parcel data found');
    }

    return parts.join('. ');
  }
}
