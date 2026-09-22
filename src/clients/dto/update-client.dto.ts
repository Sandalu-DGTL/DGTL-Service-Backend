import { ApiPropertyOptional } from '@nestjs/swagger'
import { IsArray, IsIn, IsOptional, IsString, MaxLength } from 'class-validator'

const serviceKeys = ['cms', 'crm', 'seo', 'hr'] as const
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

  @ApiPropertyOptional({ enum: serviceKeys, isArray: true })
  @IsOptional()
  @IsArray()
  @IsIn(serviceKeys, { each: true })
  serviceKeys?: (typeof serviceKeys)[number][]
}
