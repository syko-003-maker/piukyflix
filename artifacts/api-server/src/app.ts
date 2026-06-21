import express, { type Express, type Request, type Response, type NextFunction } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import { clerkMiddleware } from "@clerk/express";
import {
  CLERK_PROXY_PATH,
  clerkProxyMiddleware,
} from "./middlewares/clerkProxyMiddleware";
import path from "node:path";
import { fileURLToPath } from "node:url";
import router from "./routes";
import { logger } from "./lib/logger";
import { rateLimit } from "./middlewares/rateLimit";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);

app.use(CLERK_PROXY_PATH, clerkProxyMiddleware());

// Restrict CORS to known origins. REPLIT_DOMAINS is a comma-separated list of
// the deployment's public hostnames. Non-browser clients (no Origin header) and
// localhost during development are allowed.
const allowedOrigins = new Set(
  (process.env.REPLIT_DOMAINS ?? "")
    .split(",")
    .map((d) => d.trim())
    .filter(Boolean)
    .map((d) => `https://${d}`),
);

app.use(
  cors({
    credentials: true,
    origin(origin, callback) {
      if (!origin) return callback(null, true);
      if (allowedOrigins.has(origin)) return callback(null, true);
      if (
        process.env.NODE_ENV !== "production" &&
        /^http:\/\/localhost(:\d+)?$/.test(origin)
      ) {
        return callback(null, true);
      }
      // Disallowed origin: omit CORS headers so the browser blocks the response
      // (no error thrown, avoids noisy 500s).
      return callback(null, false);
    },
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  clerkMiddleware({
    publishableKey: process.env.CLERK_PUBLISHABLE_KEY,
  }),
);

// Rate limiting. Stricter limits on abuse-sensitive endpoints; a general cap on
// the rest of the API. The Clerk proxy (/api/__clerk) is mounted earlier and
// ends its own requests, so it is not affected by these limiters.
app.use("/api/auth", rateLimit({ windowMs: 60_000, max: 30 }));
app.use("/api/admin/invite", rateLimit({ windowMs: 60_000, max: 10 }));
app.use("/api", rateLimit({ windowMs: 60_000, max: 300 }));

app.use("/api", router);

// Single-service deploy: serve the built frontend and let the SPA router handle
// any non-/api route. Enabled via SERVE_CLIENT=true (off in local dev, where the
// frontend runs on its own Vite server).
if (process.env.SERVE_CLIENT === "true") {
  const clientDir =
    process.env.CLIENT_DIST ||
    path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../streamflix/dist/public");
  app.use(express.static(clientDir));
  app.use((req, res, next) => {
    if (req.method !== "GET" || req.path.startsWith("/api")) return next();
    res.sendFile(path.join(clientDir, "index.html"));
  });
}

// Global error handler. Express 5 forwards rejected promises from async route
// handlers here, so DB/runtime errors return a clean 500 instead of hanging the
// request. Must be the last middleware and take 4 arguments.
app.use((err: unknown, req: Request, res: Response, _next: NextFunction) => {
  req.log.error({ err }, "Unhandled error");
  if (res.headersSent) return;
  res.status(500).json({ error: "Erreur interne du serveur" });
});

export default app;
