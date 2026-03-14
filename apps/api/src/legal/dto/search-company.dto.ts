import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class SearchCompanyDto {
  @ApiProperty({
    description: 'Company name or registration number (matični broj)',
    example: 'Telekom Srbija',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  q!: string;
}
