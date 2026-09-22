import 'reflect-metadata'
import { ValidationPipe } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { NestFactory } from '@nestjs/core'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import helmet from 'helmet'
import { AppModule } from './app.module'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  const config = app.get(ConfigService)
  const frontendOrigin = config.get<string>('FRONTEND_ORIGIN') ?? 'http://localhost:3000'

  app.use(helmet())
  app.enableCors({
    origin: frontendOrigin.split(',').map((origin) => origin.trim()),
    methods: ['GET', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['content-type', 'authorization'],
  })
  app.setGlobalPrefix('v1')
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
  )

  const swaggerConfig = new DocumentBuilder()
    .setTitle('DGTL Backend API')
    .setDescription('Authenticated API for the DGTL client and admin portals.')
    .setVersion('1.0')
    .addBearerAuth()
    .build()
  SwaggerModule.setup('docs', app, SwaggerModule.createDocument(app, swaggerConfig))

  await app.listen(config.get<number>('PORT') ?? 4000)
}

void bootstrap()
