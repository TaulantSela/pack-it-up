// Runs before `prisma db push` in `npm run db:push`: it exits with an error unless the database
// is marked as a disposable dev database. Production is never marked, so if .env ever points at
// it, the command stops instead of rewriting the production schema (db push can drop columns).
//
// The mark is a comment on the database itself, so it holds whichever connection string leads
// there. To mark a NEW dev database (never production), run this once against it, e.g. in
// Neon's SQL editor:
//   COMMENT ON DATABASE neondb IS 'pack-it-up:disposable';
import prismaClient from "@prisma/client";

const MARK = "pack-it-up:disposable";
const url = process.env.DATABASE_URL;

if (!url) {
  console.error("DATABASE_URL is not set. Put the dev database's URL in .env first (see the README).");
  process.exit(1);
}

const prisma = new prismaClient.PrismaClient({ datasourceUrl: url });
try {
  const [row] = await prisma.$queryRawUnsafe(
    "select datname as name, shobj_description(oid, 'pg_database') as mark from pg_database where datname = current_database()",
  );
  const where = `${new URL(url).hostname.split(".")[0]}/${row?.name ?? "?"}`;
  if (row?.mark !== MARK) {
    console.error(
      `Refusing to touch ${where}: it isn't marked as a disposable dev database, and production never is.\n` +
        ".env should point at the dev database, pack-it-up-dev (see the README).",
    );
    process.exitCode = 1;
  } else {
    console.log(`Dev database: ${where}`);
  }
} finally {
  await prisma.$disconnect();
}
