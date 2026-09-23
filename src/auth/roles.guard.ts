import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import type { RequestWithUser } from '../common/request-with-user.js'
import type { AppRole } from '../common/models.js'
import { ROLES_KEY } from './roles.decorator.js'

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext) {
    const requiredRoles = this.reflector.getAllAndOverride<AppRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ])

    if (!requiredRoles?.length) return true
    const request = context.switchToHttp().getRequest<RequestWithUser>()
    return requiredRoles.includes(request.user.role)
  }
}
