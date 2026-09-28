import type { MiddlewareHandler } from 'hono';
import { getConnInfo } from '@hono/node-server/conninfo';

/**
 * /server is a development server: anything baked into the app would be public, so there is no
 * secret to check. Instead each client address gets a small budget of provider calls, which
 * bounds what a stranger on the network could spend.
 */
export function rateLimit({ max, windowMs }: { max: number; windowMs: number }): MiddlewareHandler {
  const hits = new Map<string, number[]>();
  return async (c, next) => {
    let key = 'unknown';
    try {
      key = getConnInfo(c).remote.address ?? key;
    } catch {
      // Not running under @hono/node-server (tests): everyone shares one budget.
    }
    const now = Date.now();
    const recent = (hits.get(key) ?? []).filter((at) => now - at < windowMs);
    if (recent.length >= max) {
      return c.json({ error: 'Too many requests. Wait a few minutes and try again.' }, 429);
    }
    hits.set(key, [...recent, now]);
    await next();
  };
}
