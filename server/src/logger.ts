/* ============================================================
   Central logger — Pino. Import this instead of console.log.

   Dev: human-readable output via pino-pretty.
   Prod: raw JSON (pipe to a file / jq / lnav later).

   Levels: trace debug info warn error fatal.
   LOG_LEVEL overrides (default: debug in dev, info in prod).

   Usage:
     logger.info("App started");
     logger.error({ err }, "Failed to load data");
     logger.debug({ userId, page }, "Loaded page data");
   ============================================================ */
import pino from "pino";

const isProd = process.env.NODE_ENV === "production";

export const logger = pino({
  level: process.env.LOG_LEVEL ?? (isProd ? "info" : "debug"),
  transport: isProd
    ? undefined
    : {
        target: "pino-pretty",
        options: { colorize: true, translateTime: "SYS:standard", ignore: "pid,hostname" },
      },
});
