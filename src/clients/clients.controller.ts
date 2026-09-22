import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Req, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import { Roles } from '../auth/roles.decorator'
import { RolesGuard } from '../auth/roles.guard'
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard'
import type { RequestWithUser } from '../common/request-with-user'
import { ClientsService } from './clients.service'
import { UpdateClientDto } from './dto/update-client.dto'

@ApiTags('Admin clients')
@ApiBearerAuth()
@Controller('admin/clients')
@UseGuards(SupabaseAuthGuard, RolesGuard)
@Roles('admin')
export class ClientsController {
  constructor(private readonly clients: ClientsService) {}

  @Get()
  @ApiOperation({ summary: 'List client profiles and their assigned services' })
  listClients() {
    return this.clients.listClients()
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a client and replace assigned services' })
  updateClient(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateClientDto,
    @Req() request: RequestWithUser,
  ) {
    return this.clients.updateClient(id, dto, request.user.id)
  }
}
