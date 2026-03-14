import { Controller, Get, Query, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiOkResponse } from '@nestjs/swagger';
import { LegalService } from './legal.service';
import { SearchCompanyDto } from './dto/search-company.dto';
import { ParcelQueryDto } from './dto/parcel-query.dto';

@ApiTags('Legal')
@Controller('legal')
export class LegalController {
  constructor(private readonly legalService: LegalService) {}

  @Get('company/search')
  @ApiOperation({ summary: 'Search companies in APR by name or registration number' })
  @ApiOkResponse({ description: 'List of matching companies' })
  async searchCompanies(@Query() dto: SearchCompanyDto) {
    const results = await this.legalService.searchCompanies(dto.q);
    return { success: true, data: results };
  }

  @Get('company/:registrationNumber')
  @ApiOperation({ summary: 'Get company details by registration number' })
  @ApiOkResponse({ description: 'Company details from APR' })
  async getCompanyDetails(@Param('registrationNumber') registrationNumber: string) {
    const result = await this.legalService.getCompanyDetails(registrationNumber);
    return { success: true, data: result };
  }

  @Get('parcel')
  @ApiOperation({ summary: 'Get parcel info at coordinates' })
  @ApiOkResponse({ description: 'Parcel data from GeoSrbija' })
  async getParcel(@Query() dto: ParcelQueryDto) {
    const result = await this.legalService.getParcelAtCoordinates(dto.lat, dto.lng);
    return { success: true, data: result };
  }
}
