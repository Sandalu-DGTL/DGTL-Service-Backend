import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

@Injectable()
export class SupabaseService {
  readonly admin: SupabaseClient

  constructor(config: ConfigService) {
    const url = config.get<string>('SUPABASE_URL')
    // Vercel's Supabase integration provisions SUPABASE_SERVICE_ROLE_KEY.
    // Keep SUPABASE_SECRET_KEY as a compatible fallback for manual setups.
    const secretKey =
      config.get<string>('SUPABASE_SERVICE_ROLE_KEY') ??
      config.get<string>('SUPABASE_SECRET_KEY')

    if (!url || !secretKey) {
      throw new Error(
        'SUPABASE_URL and either SUPABASE_SERVICE_ROLE_KEY or SUPABASE_SECRET_KEY are required.',
      )
    }

    this.admin = createClient(url, secretKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
  }

  async verifyAccessToken(accessToken: string) {
    return this.admin.auth.getUser(accessToken)
  }
}
