import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common'
import type { Request } from 'express'
import { SupabaseService } from '../services/supabase.service'
import type { RequestWithUser } from '../common/request-with-user'
import type { AppRole, ClientStatus } from '../common/models'

@Injectable()
export class SupabaseAuthGuard implements CanActivate {
  constructor(private readonly supabase: SupabaseService) {}

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<Request>()
    const accessToken = this.extractBearerToken(request)
    const { data, error } = await this.supabase.verifyAccessToken(accessToken)

    if (error || !data.user) {
      throw new UnauthorizedException('The access token is invalid or expired.')
    }

    const { data: profile, error: profileError } = await this.supabase.admin
      .from('profiles')
      .select('id, email, full_name, role, status')
      .eq('id', data.user.id)
      .single()

    if (profileError || !profile) {
      throw new UnauthorizedException('No DGTL profile exists for this account.')
    }

    ;(request as RequestWithUser).user = {
      id: profile.id as string,
      email: (profile.email as string) || data.user.email || '',
      fullName: (profile.full_name as string) || '',
      role: profile.role as AppRole,
      status: profile.status as ClientStatus,
      accessToken,
    }

    return true
  }

  private extractBearerToken(request: Request) {
    const [type, token] = request.headers.authorization?.split(' ') ?? []
    if (type !== 'Bearer' || !token) {
      throw new UnauthorizedException('A Bearer access token is required.')
    }
    return token
  }
}
