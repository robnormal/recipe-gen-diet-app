import {Pool, PoolClient, PoolConfig} from "pg";

declare global {
  // allow global caching in dev
  var __PG_POOL__: Pool | undefined;
}

const config: PoolConfig = {
  connectionString: process.env.DATABASE_URL,
  max: Number(process.env.PG_POOL_MAX ?? 10),
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
  ssl:
    process.env.PG_SSL === "true" ||
    (process.env.NODE_ENV === "production" ? { rejectUnauthorized: true } : false),
};

// Reuse across hot reloads in dev; singleton in prod.
export const pool: Pool =
  globalThis.__PG_POOL__ ?? new Pool(config);

if (process.env.NODE_ENV !== "production") {
  globalThis.__PG_POOL__ = pool;
}

// Convenience wrapper so callers don't import Pool everywhere.
export const query = pool.query.bind(pool);

export async function withClient<T>(fn: (client: PoolClient) => T) {
  const client = await pool.connect();
  const result = await fn(client);
  client.release();
  return result;
}

// Optional: attach shutdown hooks once.
let hooksAttached = false;
function attachShutdownHooks() {
  if (hooksAttached) return;
  hooksAttached = true;

  const shutdown = async (signal: NodeJS.Signals) => {
    try { await pool.end(); }
    finally { process.exit(signal === "SIGINT" ? 0 : 0); }
  };

  process.once("SIGINT", () => void shutdown("SIGINT"));
  process.once("SIGTERM", () => void shutdown("SIGTERM"));
}
attachShutdownHooks();
