import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { AuthModule } from './auth/auth.module'
import { ClientsModule } from './clients/clients.module'
import { HealthModule } from './health/health.module'
import { ProfileModule } from './profile/profile.module'
import { ServicesModule } from './services/services.module'

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
