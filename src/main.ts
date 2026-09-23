import 'reflect-metadata'
import { ValidationPipe } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { NestFactory } from '@nestjs/core'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import helmetModule from 'helmet'
import { AppModule } from './app.module.js'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  const config = app.get(ConfigService)
  const frontendOrigin = config.get<string>('FRONTEND_ORIGIN') ?? 'http://localhost:3000'

  // Helmet's conditional ESM/CJS types are resolved as a module namespace by
  // Vercel's build type-checker even though the ESM default export is callable.
  const helmet = helmetModule as unknown as () => Parameters<typeof app.use>[0]
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
    .setTitle('DGTL Service Backend API')
    .setDescription('Authenticated API for the DGTL client and admin portals.')
    .setVersion('1.0')
    .addBearerAuth()
    .build()
  SwaggerModule.setup('docs', app, SwaggerModule.createDocument(app, swaggerConfig))

  await app.listen(config.get<number>('PORT') ?? 3000)
}

void bootstrap()
