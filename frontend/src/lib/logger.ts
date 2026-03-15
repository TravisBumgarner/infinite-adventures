import posthog from "./posthog.js";

export const logger = {
  info(msg: string): void {
    if (import.meta.env.PROD) {
      posthog.capture("info", { message: msg });
    }
  },
  error(msg: string, error?: unknown): void {
    if (import.meta.env.PROD) {
      posthog.capture("$exception", {
        $exception_message: msg,
        $exception_stack: error instanceof Error ? error.stack : undefined,
      });
    }
  },
};
