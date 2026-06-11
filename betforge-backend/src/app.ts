import express from "express";

import helmetPkg from "helmet";
const helmet = helmetPkg as any as (
  options?: Record<string, unknown>,
) => import("express").RequestHandler;

import cors from "cors";
import morgan from "morgan";
import "express-async-errors";

import { env } from "./config/env.js";
import { logger } from "./utils/logger.js";
import { globalRateLimit } from "./middlewares/rateLimit.js";
import { errorHandler } from "./middlewares/errorHandler.js";
import routes from "./routes/index.js";

export function createApp() {
  const app = express();

  // ─── Segurança ───────────────────────────────────────────────────────────────
  app.use(
    helmet({
      crossOriginEmbedderPolicy: false,
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
        },
      },
    }),
  );

  // ─── CORS ────────────────────────────────────────────────────────────────────
  const allowedOrigins = env.ALLOWED_ORIGINS.split(",");
  app.use(
    cors({
      origin: (origin, cb) => {
        if (!origin || allowedOrigins.includes(origin)) {
          cb(null, true);
        } else {
          cb(new Error(`CORS: origem não permitida → ${origin}`));
        }
      },
      credentials: true,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
      allowedHeaders: ["Content-Type", "Authorization"],
    }),
  );

  // ─── Rate Limit Global ───────────────────────────────────────────────────────
  app.use(globalRateLimit);

  // ─── Parsers ─────────────────────────────────────────────────────────────────
  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: true, limit: "1mb" }));

  // ─── Logs HTTP ───────────────────────────────────────────────────────────────
  app.use(
    morgan("combined", {
      stream: { write: (msg) => logger.http(msg.trim()) },
      skip: (req) => req.url === "/api/v1/health",
    }),
  );

  // ─── Rotas ───────────────────────────────────────────────────────────────────
  app.use(`/api/${env.API_VERSION}`, routes);

  // 404 handler
  app.use((_req, res) => {
    res.status(404).json({
      success: false,
      message: "Rota não encontrada",
      code: "ROUTE_NOT_FOUND",
    });
  });

  // ─── Error Handler ───────────────────────────────────────────────────────────
  app.use(errorHandler);

  return app;
}
