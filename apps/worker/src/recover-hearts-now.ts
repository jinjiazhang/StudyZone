import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { WorkerModule } from './worker.module';
import { RewardsService } from '../../api/src/modules/rewards/rewards.service';

/**
 * One-shot heart regeneration sweep for ops/testing.
 *   pnpm --filter @studyzone/worker recover-hearts:now
 */
async function main() {
  const logger = new Logger('RecoverHeartsNow');
  const app = await NestFactory.createApplicationContext(WorkerModule, {
    logger: ['log', 'warn', 'error'],
  });
  const rewards = app.get(RewardsService);

  const updated = await rewards.recoverAllHearts();
  logger.log(`Heart recovery: topped up ${updated} wallet(s)`);

  await app.close();
  process.exit(0);
}

main().catch((err) => {
  console.error('Heart recovery failed', err);
  process.exit(1);
});
