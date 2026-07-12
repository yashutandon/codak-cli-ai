import { vi, beforeEach } from 'vitest';
import { mockReset } from 'vitest-mock-extended';
import { prismaMock } from './mocks/prisma';

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
