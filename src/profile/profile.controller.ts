import { Controller, Get, Req, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard.js'
import type { RequestWithUser } from '../common/request-with-user.js'
import { ProfileService } from './profile.service.js'

@ApiTags('Profile')
@ApiBearerAuth()
@Controller('me')
@UseGuards(SupabaseAuthGuard)
export class ProfileController {
  constructor(private readonly profiles: ProfileService) {}

  @Get()
  @ApiOperation({ summary: 'Return the signed-in user and assigned services' })
  getMe(@Req() request: RequestWithUser) {
    return this.profiles.getViewer(request.user)
  }
}
