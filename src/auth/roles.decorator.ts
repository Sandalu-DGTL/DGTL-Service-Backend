import { SetMetadata } from '@nestjs/common'
import type { AppRole } from '../common/models'

export const ROLES_KEY = 'roles'
export const Roles = (...roles: AppRole[]) => SetMetadata(ROLES_KEY, roles)
