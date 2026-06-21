/**
 * Lightweight in-memory rate limiter.
 *
 * Dependency-free fixed-window limiter keyed by client IP (X-Forwarded-For
 * first, since the app runs behind the Replit proxy). Good enough as a first
 * line of defense against brute-force / abuse on sensitive endpoints.
 *
 * LIMITATION: state is per-process. On an autoscale deployment with multiple
 * instances the effective limit is `max × instanceCount`. For strict global
 * limits, back this with a shared store (e.g. Redis) later.
 */

import type { Request, Response, NextFunction, RequestHandler } from "express";

interface RateLimitOptions {
  /** Window length in milliseconds. */
  windowMs: number;
  /** Max requests allowed per IP within the window. */
  max: number;
  /** Optional message returned with the 429 response. */
  message?: string;
}

function clientIp(req: Request): string {
  const xff = req.headers["x-forwarded-for"];
  const forwarded = (Array.isArray(xff) ? xff[0] : xff)?.split(",")[0]?.trim();
  return forwarded || req.socket?.remoteAddress || "unknown";
}

export function rateLimit({
  windowMs,
  max,
  message = "Trop de requêtes, réessayez plus tard.",
}: RateLimitOptions): RequestHandler {
  const hits = new Map<string, { count: number; resetAt: number }>();

  // Periodically drop expired buckets so the map doesn't grow unbounded.
  const purge = setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of hits) {
      if (entry.resetAt <= now) hits.delete(key);
    }
  }, windowMs);
  if (typeof purge.unref === "function") purge.unref();

  return (req: Request, res: Response, next: NextFunction) => {
    const now = Date.now();
    const key = clientIp(req);
    const entry = hits.get(key);

    if (!entry || entry.resetAt <= now) {
      hits.set(key, { count: 1, resetAt: now + windowMs });
      next();
      return;
    }

    entry.count += 1;
    if (entry.count > max) {
      res.setHeader("Retry-After", String(Math.ceil((entry.resetAt - now) / 1000)));
      res.status(429).json({ error: message });
      return;
    }

    next();
  };
}
