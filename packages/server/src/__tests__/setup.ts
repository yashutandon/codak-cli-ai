import { vi, beforeEach } from 'vitest';
import { mockReset } from 'vitest-mock-extended';
import { prismaMock } from './mocks/prisma';

// Mock ioredis globally to prevent connection errors during tests
vi.mock('ioredis', () => {
  class RedisMock {
    on = vi.fn();
    get = vi.fn().mockResolvedValue(null);
    set = vi.fn().mockResolvedValue('OK');
    setex = vi.fn().mockResolvedValue('OK');
    del = vi.fn().mockResolvedValue(1);
    exists = vi.fn().mockResolvedValue(0);
    ping = vi.fn().mockResolvedValue('PONG');
    quit = vi.fn().mockResolvedValue('OK');
  }
  return { default: RedisMock };
});

// Mock BullMQ to prevent workers/queues from attempting real Redis connections
vi.mock('bullmq', () => {
  class QueueMock {
    add = vi.fn().mockResolvedValue({ id: 'mock-job-id' });
    on = vi.fn();
    close = vi.fn();
  }
  class WorkerMock {
    on = vi.fn();
    close = vi.fn();
  }
  return { Queue: QueueMock, Worker: WorkerMock };
});

// vi.doMock is NOT hoisted. Since setup.ts runs before test files,
// this will successfully mock the module for all subsequent imports!
vi.doMock('@codak/database', () => {
  return {
    db: prismaMock
  };
});

beforeEach(() => {
  mockReset(prismaMock);
});
