import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsString, IsIn } from 'class-validator';

export class CreateDatasetItemDto {
  @ApiProperty({
    description: 'Input messages as JSON (array of {role, content})',
    example: [
      { role: 'system', content: 'You are a helpful assistant.' },
      { role: 'user', content: 'What is the capital of France?' },
    ],
  })
  @IsArray()
  inputMessagesJson!: unknown[];

  @ApiProperty({ description: 'Ideal assistant response' })
  @IsString()
  idealOutput!: string;

  @ApiProperty({
    description: 'Source of the item',
    enum: ['ADMIN_REWRITE', 'HIGH_RATED', 'USER_APPROVED'],
  })
  @IsString()
  @IsIn(['ADMIN_REWRITE', 'HIGH_RATED', 'USER_APPROVED'])
  source!: string;
}
