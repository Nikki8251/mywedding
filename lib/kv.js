import { Redis } from '@upstash/redis';

// Works with either the Vercel Marketplace "Upstash Redis" integration
// (UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN) or the older
// Vercel KV naming (KV_REST_API_URL / KV_REST_API_TOKEN) — whichever
// env vars Vercel injected when you linked the store.
const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
const hasRedis = !!(url && token);

const redis = hasRedis ? new Redis({ url, token }) : null;

// Falls back to an in-memory store during local `next dev` if no database
// is configured yet, so the app still runs before you've linked one.
// NOTE: the in-memory fallback resets on every deploy/cold start and is
// NOT shared across visitors — only real for local testing.
const memory = globalThis.__WEDDING_MEMORY__ || (globalThis.__WEDDING_MEMORY__ = {});

export async function kvGet(key) {
  if (redis) return (await redis.get(key)) ?? null;
  return memory[key] ?? null;
}

export async function kvSet(key, value) {
  if (redis) return redis.set(key, value);
  memory[key] = value;
  return true;
}

export const usingRealKv = hasRedis;
