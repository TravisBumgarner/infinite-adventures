import * as Sentry from "@sentry/node";
import config from "../config.js";

export const logger = {
  // Info logs go to stdout (visible in Heroku logs)
  info(msg: string): void {
    // biome-ignore lint/suspicious/noConsole: intentional — outputs to Heroku logs
    console.log(msg);
  },
  error(msg: string, error?: unknown): void {
    if (config.isProduction) {
      Sentry.captureException(error ?? new Error(msg));
    }
  },
};
