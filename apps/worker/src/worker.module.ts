import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

// Reuse the API's canonical implementations so settlement rules live in
// exactly one place.
import { PrismaModule } from '../../api/src/infra/prisma.module';
import { LeagueModule } from '../../api/src/modules/league/league.module';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), PrismaModule, LeagueModule],
})
export class WorkerModule {}
