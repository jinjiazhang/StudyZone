import { Module } from '@nestjs/common';
import { LeagueController } from './league.controller';
import { LeagueService } from './league.service';
import { LeagueListener } from './league.listener';

@Module({
  controllers: [LeagueController],
  providers: [LeagueService, LeagueListener],
  exports: [LeagueService],
})
export class LeagueModule {}
