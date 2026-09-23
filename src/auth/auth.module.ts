import { Global, Module } from '@nestjs/common'
import { RolesGuard } from './roles.guard.js'
import { SupabaseAuthGuard } from './supabase-auth.guard.js'

@Global()
@Module({
  providers: [SupabaseAuthGuard, RolesGuard],
  exports: [SupabaseAuthGuard, RolesGuard],
})
export class AuthModule {}
