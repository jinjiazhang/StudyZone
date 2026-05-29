import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { Queue, Worker, type JobsOptions } from 'bullmq';
import IORedis from 'ioredis';

import { WorkerModule } from './worker.module';
import { LeagueService } from '../../api/src/modules/league/league.service';

const QUEUE_NAME = 'league';
const SETTLE_JOB = 'settle-weekly';

/**
 * Cron for weekly league settlement: Mondays at 00:05 UTC, a few minutes after
 * the new league week begins, so the just-finished week is settled.
 */
const SETTLE_CRON = process.env.LEAGUE_SETTLE_CRON ?? '5 0 * * 1';

async function bootstrap() {
  const logger = new Logger('Worker');

  const app = await NestFactory.createApplicationContext(WorkerModule, {
    logger: ['log', 'warn', 'error'],
  });
  const league = app.get(LeagueService);

  const redisUrl = process.env.REDIS_URL ?? 'redis://localhost:6379';
  const connection = new IORedis(redisUrl, { maxRetriesPerRequest: null });

  // Queue + repeatable schedule.
  const queue = new Queue(QUEUE_NAME, { connection });
  const repeat: JobsOptions = {
    repeat: { pattern: SETTLE_CRON, tz: 'UTC' },
    jobId: SETTLE_JOB, // stable id so we don't stack duplicate schedules
    removeOnComplete: 50,
    removeOnFail: 100,
  };
  await queue.add(SETTLE_JOB, {}, repeat);
  logger.log(`Scheduled "${SETTLE_JOB}" with cron "${SETTLE_CRON}" (UTC)`);

  // Processor.
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

  worker.on('failed', (job, err) => {
    logger.error(`Job ${job?.id} failed: ${err?.message}`, err?.stack);
  });

  const shutdown = async () => {
    logger.log('Shutting down worker…');
    await worker.close();
    await queue.close();
    await connection.quit();
    await app.close();
    process.exit(0);
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);

  logger.log('League worker is up and processing jobs.');
}

bootstrap().catch((err) => {
  console.error('Failed to start worker', err);
  process.exit(1);
});
