import { ApiProperty } from '@nestjs/swagger';
import { IsIn } from 'class-validator';

export class UpdateAbTestDto {
  @ApiProperty({
    description: 'New status',
    enum: ['active', 'paused', 'completed'],
  })
  @IsIn(['active', 'paused', 'completed'])
  status!: 'active' | 'paused' | 'completed';
}
