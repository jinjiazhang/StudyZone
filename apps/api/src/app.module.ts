import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { EventEmitterModule } from '@nestjs/event-emitter';

import { PrismaModule } from './infra/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { AccountModule } from './modules/account/account.module';
import { CurriculumModule } from './modules/curriculum/curriculum.module';
import { LearningModule } from './modules/learning/learning.module';
import { GamificationModule } from './modules/gamification/gamification.module';
import { SocialModule } from './modules/social/social.module';
import { LeagueModule } from './modules/league/league.module';
import { AdminModule } from './modules/admin/admin.module';
import { HealthController } from './common/health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 120 }]),
    EventEmitterModule.forRoot(),
    PrismaModule,
    AuthModule,
    AccountModule,
    CurriculumModule,
    LearningModule,
    GamificationModule,
    SocialModule,
    LeagueModule,
    AdminModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
