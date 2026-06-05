import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { Queue, Worker, type JobsOptions } from 'bullmq';
import IORedis from 'ioredis';

import { WorkerModule } from './worker.module';
import { LeagueService } from '../../api/src/modules/league/league.service';
import { RewardsService } from '../../api/src/modules/rewards/rewards.service';

const QUEUE_NAME = 'league';
const SETTLE_JOB = 'settle-weekly';

const HEARTS_QUEUE_NAME = 'hearts';
const HEARTS_JOB = 'recover-hearts';

/**
 * Cron for weekly league settlement: Mondays at 00:05 UTC, a few minutes after
 * the new league week begins, so the just-finished week is settled.
 */
const SETTLE_CRON = process.env.LEAGUE_SETTLE_CRON ?? '5 0 * * 1';

/**
 * Cron for the heart regeneration sweep. The per-heart cadence is enforced by
 * the `heartsUpdatedAt` math; this only bounds how stale hearts can get.
 */
const HEARTS_CRON = process.env.HEART_RECOVERY_CRON ?? '*/5 * * * *';

async function bootstrap() {
  const logger = new Logger('Worker');

  const app = await NestFactory.createApplicationContext(WorkerModule, {
    logger: ['log', 'warn', 'error'],
  });
  const league = app.get(LeagueService);
  const rewards = app.get(RewardsService);

  const redisUrl = process.env.REDIS_URL ?? 'redis://localhost:6379';
  const connection = new IORedis(redisUrl, { maxRetriesPerRequest: null });

  // League settlement queue + repeatable schedule.
  const queue = new Queue(QUEUE_NAME, { connection });
  await queue.add(
    SETTLE_JOB,
    {},
    {
      repeat: { pattern: SETTLE_CRON, tz: 'UTC' },
      jobId: SETTLE_JOB, // stable id so we don't stack duplicate schedules
      removeOnComplete: 50,
      removeOnFail: 100,
    } satisfies JobsOptions,
  );
  logger.log(`Scheduled "${SETTLE_JOB}" with cron "${SETTLE_CRON}" (UTC)`);

  // Heart regeneration queue + repeatable schedule.
  const heartsQueue = new Queue(HEARTS_QUEUE_NAME, { connection });
  await heartsQueue.add(
    HEARTS_JOB,
    {},
    {
      repeat: { pattern: HEARTS_CRON },
      jobId: HEARTS_JOB,
      removeOnComplete: 50,
      removeOnFail: 100,
    } satisfies JobsOptions,
  );
  logger.log(`Scheduled "${HEARTS_JOB}" with cron "${HEARTS_CRON}"`);

  // Processors.
  const worker = new Worker(
    QUEUE_NAME,
    async (job) => {
      if (job.name !== SETTLE_JOB) return;
      logger.log('Running weekly league settlement…');
      const result = await league.settlePreviousWeek();
      logger.log(`Settlement done: ${JSON.stringify(result)}`);
      return result;
    },
    { connection },
  );

  const heartsWorker = new Worker(
    HEARTS_QUEUE_NAME,
    async (job) => {
      if (job.name !== HEARTS_JOB) return;
      const updated = await rewards.recoverAllHearts();
      if (updated > 0) logger.log(`Heart recovery: topped up ${updated} wallet(s)`);
      return { updated };
    },
    { connection },
  );

  for (const w of [worker, heartsWorker]) {
    w.on('failed', (job, err) => {
      logger.error(`Job ${job?.id} failed: ${err?.message}`, err?.stack);
    });
  }

  const shutdown = async () => {
    logger.log('Shutting down worker…');
    await worker.close();
    await heartsWorker.close();
    await queue.close();
    await heartsQueue.close();
    await connection.quit();
    await app.close();
    process.exit(0);
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);

  logger.log('Worker is up and processing jobs.');
}

bootstrap().catch((err) => {
  console.error('Failed to start worker', err);
  process.exit(1);
});
