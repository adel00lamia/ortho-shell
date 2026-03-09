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

export async function initSentry() {
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  if (!dsn || sentryInitialized) return;

  try {
    const Sentry = await import('@sentry/react');
    Sentry.init({
      dsn,
      environment: import.meta.env.MODE,
      tracesSampleRate: import.meta.env.PROD ? 0.1 : 1.0,
      replaysSessionSampleRate: 0,
      replaysOnErrorSampleRate: 1.0,
      integrations: [
        Sentry.browserTracingIntegration(),
        Sentry.replayIntegration({ maskAllText: false, blockAllMedia: false }),
      ],
    });
    sentryInitialized = true;
  } catch {
    // Sentry package not installed — skip silently
  }
}

export async function initPostHog() {
  const key = import.meta.env.VITE_POSTHOG_KEY;
  if (!key || posthogInitialized) return;

  try {
    const { default: posthog } = await import('posthog-js');
    posthog.init(key, {
      api_host: import.meta.env.VITE_POSTHOG_HOST || 'https://app.posthog.com',
      capture_pageview: true,
      capture_pageleave: true,
      autocapture: true,
      persistence: 'localStorage',
    });
    posthogInitialized = true;
  } catch {
    // PostHog package not installed — skip silently
  }
}

export function captureError(error: Error, context?: Record<string, any>) {
  if (!sentryInitialized) {
    console.error('[monitoring]', error, context);
    return;
  }
  import('@sentry/react').then(Sentry => {
    Sentry.captureException(error, { extra: context });
  });
}

export function trackEvent(event: string, properties?: Record<string, any>) {
  if (!posthogInitialized) return;
  import('posthog-js').then(({ default: posthog }) => {
    posthog.capture(event, properties);
  });
}

export function identifyUser(userId: string, traits?: Record<string, any>) {
  if (!posthogInitialized) return;
  import('posthog-js').then(({ default: posthog }) => {
    posthog.identify(userId, traits);
  });
}

export async function initMonitoring() {
  await Promise.all([initSentry(), initPostHog()]);
}
