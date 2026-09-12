import { PrismaClient } from '@prisma/client';
import { createInMemoryPrismaClient } from './inMemoryStore';
import dotenv from 'dotenv';

dotenv.config({ override: true });

const globalForPrisma = global as unknown as { prisma: any };

const isDbConfigured = Boolean(
  process.env.DATABASE_URL &&
  process.env.DATABASE_URL.trim().length > 0 &&
  !process.env.DATABASE_URL.includes('localhost:5432')
);

let client: any;

if (globalForPrisma.prisma) {
  client = globalForPrisma.prisma;
} else if (isDbConfigured) {
  try {
    console.log('[AI Studio] Connecting to live Render PostgreSQL database...');
    client = new PrismaClient({
      log: ['error', 'warn']
    });
    console.log('[AI Studio] Live Render PostgreSQL client initialized.');
  } catch (err) {
    console.warn('[AI Studio] Database initialization failed — using in-memory store', err);
    client = createInMemoryPrismaClient();
  }
} else {
  console.log('[AI Studio] No PostgreSQL connection specified — active in-memory disaster response store');
  client = createInMemoryPrismaClient();
}

export const prisma = client;

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

