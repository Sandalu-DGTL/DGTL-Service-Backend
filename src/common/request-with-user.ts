import type { Request } from 'express'
import type { RequestUser } from './models'

export type RequestWithUser = Request & { user: RequestUser }
