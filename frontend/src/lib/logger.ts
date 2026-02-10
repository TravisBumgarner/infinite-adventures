import * as Sentry from "@sentry/react";

export const logger = {
  info(msg: string): void {
    if (import.meta.env.PROD) {
      Sentry.captureMessage(msg, "info");
    }
  },
  error(msg: string, error?: unknown): void {
    if (import.meta.env.PROD) {
      Sentry.captureException(error ?? new Error(msg));
    }
  },
};
