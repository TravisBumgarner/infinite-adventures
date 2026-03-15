import posthog from "posthog-js";
import config from "../config.js";

posthog.init(config.posthogApiKey, {
  api_host: config.posthogHost,
  capture_pageview: false, // We capture manually via router
});

export default posthog;
