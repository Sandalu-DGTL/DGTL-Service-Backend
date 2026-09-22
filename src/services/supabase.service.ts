import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

@Injectable()
export class SupabaseService {
  readonly admin: SupabaseClient

  constructor(config: ConfigService) {
    const url = config.get<string>('SUPABASE_URL')
    const secretKey = config.get<string>('SUPABASE_SECRET_KEY')

    if (!url || !secretKey) {
      throw new Error('SUPABASE_URL and SUPABASE_SECRET_KEY are required.')
    }

    this.admin = createClient(url, secretKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
  }

  async verifyAccessToken(accessToken: string) {
    return this.admin.auth.getUser(accessToken)
  }
}
