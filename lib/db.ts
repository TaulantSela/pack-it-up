import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Neon suspends a database after a few idle minutes, and waking it can take longer than Prisma's
// default 5 s connect timeout: the first request after a quiet spell then failed with "Can't reach
// database server". Allow 15 s, unless the URL sets its own connect_timeout.
export function withConnectTimeout(url: string | undefined): string | undefined {
  if (!url) return url;
  try {
    const parsed = new URL(url);
    if (parsed.searchParams.has('connect_timeout')) return url;
    parsed.searchParams.set('connect_timeout', '15');
    return parsed.toString();
  } catch {
    return url;
  }
}

export const prisma =
  globalForPrisma.prisma ?? new PrismaClient({ datasourceUrl: withConnectTimeout(process.env.DATABASE_URL) });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
