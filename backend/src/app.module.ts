import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
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
    PrismaModule,
    ScholarshipsModule,
    IngestModule,
    DepartmentsModule,
    UniversitiesModule,
    AuthModule,
    AdminModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}