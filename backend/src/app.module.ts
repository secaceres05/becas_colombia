import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { ScholarshipsModule } from './scholarships/scholarships.module';
import { IngestModule } from './ingest/ingest.module';
import { DepartmentsModule } from './departments/departments.module';
import { UniversitiesModule } from './universities/universities.module';
import { AuthModule } from './auth/auth.module';
import { AdminModule } from './admin/admin.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 60000,
        limit: 10,
      },
      {
        name: 'medium',
        ttl: 300000,
        limit: 50,
      },
      {
        name: 'long',
        ttl: 3600000,
        limit: 100,
      },
    ]),
    PrismaModule,
    ScholarshipsModule,
    IngestModule,
    DepartmentsModule,
    UniversitiesModule,
    AuthModule,
    AdminModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}