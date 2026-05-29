import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { WorkerModule } from './worker.module';
import { LeagueService } from '../../api/src/modules/league/league.service';

/**
 * One-shot settlement for ops/testing.
 *   pnpm --filter @studyzone/worker settle:now            # previous week
 *   pnpm --filter @studyzone/worker settle:now 2026-05-25 # explicit week start
 */
async function main() {
  const logger = new Logger('SettleNow');
  const app = await NestFactory.createApplicationContext(WorkerModule, {
    logger: ['log', 'warn', 'error'],
  });
  const league = app.get(LeagueService);

  const arg = process.argv[2];
  const result = arg
    ? await league.settleWeek(new Date(arg))
    : await league.settlePreviousWeek();

  logger.log(`Settlement result: ${JSON.stringify(result, null, 2)}`);
  await app.close();
  process.exit(0);
}

main().catch((err) => {
  console.error('Settlement failed', err);
  process.exit(1);
});
