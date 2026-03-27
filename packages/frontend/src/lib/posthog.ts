import posthog from "posthog-js";
import config from "../config.js";

posthog.init(config.posthogApiKey, {
  api_host: config.posthogHost,
});

export default posthog;
