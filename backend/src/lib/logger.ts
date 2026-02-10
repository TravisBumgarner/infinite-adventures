import * as Sentry from "@sentry/node";
import config from "../config.js";

export const logger = {
  info(msg: string): void {
    if (config.isProduction) {
      Sentry.captureMessage(msg, "info");
    }
  },
  error(msg: string, error?: unknown): void {
    if (config.isProduction) {
      Sentry.captureException(error ?? new Error(msg));
    }
  },
};
