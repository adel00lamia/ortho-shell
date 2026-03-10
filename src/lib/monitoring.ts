/**
 * Monitoring integration for Sentry (errors) and PostHog (analytics).
 * Both are loaded lazily to avoid impacting initial bundle size.
 *
 * Configure via environment variables:
 *   VITE_SENTRY_DSN - Sentry DSN for error tracking
 *   VITE_POSTHOG_KEY - PostHog project API key
 *   VITE_POSTHOG_HOST - PostHog host (defaults to app.posthog.com)
 */

let sentryInitialized = false;
let posthogInitialized = false;
let _sentry: any = null;
let _posthog: any = null;

async function tryImport(module: string): Promise<any> {
  try {
    return await (Function('m', 'return import(m)')(module));
  } catch {
    return null;
  }
}

export async function initSentry() {
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  if (!dsn || sentryInitialized) return;

  _sentry = await tryImport('@sentry/react');
  if (!_sentry) return;

  _sentry.init({
    dsn,
    environment: import.meta.env.MODE,
    tracesSampleRate: import.meta.env.PROD ? 0.1 : 1.0,
  });
  sentryInitialized = true;
}

export async function initPostHog() {
  const key = import.meta.env.VITE_POSTHOG_KEY;
  if (!key || posthogInitialized) return;

  const mod = await tryImport('posthog-js');
  if (!mod) return;

  _posthog = mod.default || mod;
  _posthog.init(key, {
    api_host: import.meta.env.VITE_POSTHOG_HOST || 'https://app.posthog.com',
    capture_pageview: true,
    capture_pageleave: true,
    autocapture: true,
    persistence: 'localStorage',
  });
  posthogInitialized = true;
}

export function captureError(error: Error, context?: Record<string, any>) {
  if (!sentryInitialized || !_sentry) {
    console.error('[monitoring]', error, context);
    return;
  }
  _sentry.captureException(error, { extra: context });
}

export function trackEvent(event: string, properties?: Record<string, any>) {
  if (!posthogInitialized || !_posthog) return;
  _posthog.capture(event, properties);
}

export function identifyUser(userId: string, traits?: Record<string, any>) {
  if (!posthogInitialized || !_posthog) return;
  _posthog.identify(userId, traits);
}

export async function initMonitoring() {
  await Promise.all([initSentry(), initPostHog()]);
}