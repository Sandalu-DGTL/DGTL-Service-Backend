import type { Request } from 'express'
import type { RequestUser } from './models.js'

export type RequestWithUser = Request & { user: RequestUser }
