import { mockDeep, mockReset } from 'vitest-mock-extended';
import type { PrismaClient } from '../../../../database/generated/prisma';

export const prismaMock = mockDeep<PrismaClient>();
