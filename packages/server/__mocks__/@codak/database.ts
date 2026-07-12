import { mockDeep } from 'vitest-mock-extended';
import type { PrismaClient } from '../../../database/generated/prisma';

export const db = mockDeep<PrismaClient>();
