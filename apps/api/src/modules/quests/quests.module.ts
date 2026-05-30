import { Module } from '@nestjs/common';
import { QuestsController } from './quests.controller';
import { QuestsService } from './quests.service';
import { QuestsListener } from './quests.listener';
import { RewardsModule } from '../rewards/rewards.module';

@Module({
  imports: [RewardsModule],
  controllers: [QuestsController],
  providers: [QuestsService, QuestsListener],
  exports: [QuestsService],
})
export class QuestsModule {}
