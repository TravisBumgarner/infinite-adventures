import { PostHog } from "posthog-node";
import config from "../config.js";

const posthog = new PostHog(config.posthogApiKey, { host: config.posthogHost });

export const logger = {
  // Info logs go to stdout (visible in Heroku logs)
  info(msg: string): void {
    // biome-ignore lint/suspicious/noConsole: intentional — outputs to Heroku logs
    console.log(msg);
  },
  error(msg: string, error?: unknown): void {
    if (config.isProduction) {
      posthog.capture({
        distinctId: "server",
        event: "$exception",
        properties: {
          $exception_message: msg,
          $exception_stack: error instanceof Error ? error.stack : undefined,
        },
      });
    }
  },
};

export function shutdownPosthog(): Promise<void> {
  return posthog.shutdown();
}
