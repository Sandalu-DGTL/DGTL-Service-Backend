import { ApiPropertyOptional } from '@nestjs/swagger'
import { ArrayMaxSize, IsArray, IsIn, IsOptional, IsString, Matches, MaxLength } from 'class-validator'

const statuses = ['invited', 'active', 'suspended'] as const

export class UpdateClientDto {
  @ApiPropertyOptional({ example: 'Acme Operations' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  fullName?: string

  @ApiPropertyOptional({ enum: statuses })
  @IsOptional()
  @IsIn(statuses)
  status?: (typeof statuses)[number]

  @ApiPropertyOptional({ type: [String], example: ['cms', 'seo'] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(50)
  @IsString({ each: true })
  @MaxLength(64, { each: true })
  @Matches(/^[a-z0-9][a-z0-9-]*$/, { each: true })
  serviceKeys?: string[]
}
