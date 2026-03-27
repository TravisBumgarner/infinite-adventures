import type { Ref } from "react";
import { useCallback, useEffect, useImperativeHandle, useRef } from "react";
import config from "../config.js";

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: HTMLElement,
        options: { sitekey: string; callback: (token: string) => void },
      ) => string;
      reset: (widgetId: string) => void;
      remove: (widgetId: string) => void;
    };
  }
}

export interface TurnstileRef {
  reset: () => void;
}

interface TurnstileProps {
  onToken: (token: string) => void;
  ref?: Ref<TurnstileRef>;
}

export default function Turnstile({ onToken, ref }: TurnstileProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);

  const renderWidget = useCallback(() => {
    if (!window.turnstile || !containerRef.current) return;
    if (widgetIdRef.current) {
      window.turnstile.remove(widgetIdRef.current);
    }
    widgetIdRef.current = window.turnstile.render(containerRef.current, {
      sitekey: config.cloudflareSiteKey,
      callback: onToken,
    });
  }, [onToken]);

  useEffect(() => {
    const existing = document.querySelector(
      'script[src="https://challenges.cloudflare.com/turnstile/v0/api.js"]',
    );
    if (existing) {
      renderWidget();
      return;
    }

    const script = document.createElement("script");
    script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js";
    script.async = true;
    script.onload = renderWidget;
    document.head.appendChild(script);
  }, [renderWidget]);

  useImperativeHandle(ref, () => ({
    reset: () => {
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.reset(widgetIdRef.current);
      }
    },
  }));

  return <div ref={containerRef} />;
}
