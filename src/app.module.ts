import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { AuthModule } from './auth/auth.module.js'
import { ClientsModule } from './clients/clients.module.js'
import { HealthModule } from './health/health.module.js'
import { ProfileModule } from './profile/profile.module.js'
import { ServicesModule } from './services/services.module.js'

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ServicesModule,
    AuthModule,
    HealthModule,
    ProfileModule,
    ClientsModule,
  ],
})
export class AppModule {}
