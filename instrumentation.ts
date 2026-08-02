/**
 * Faro (RUM) + Sentry/Urgentry (JS errors). Import first from index.tsx.
 * No-op when VITE_SENTRY_DSN / VITE_FARO_URL are unset.
 */
import * as Sentry from '@sentry/react';
import {
  createReactRouterV7Options,
  getWebInstrumentations,
  initializeFaro,
  ReactIntegration,
} from '@grafana/faro-react';
import { TracingInstrumentation } from '@grafana/faro-web-tracing';
import {
  createRoutesFromChildren,
  matchRoutes,
  Routes,
  useLocation,
  useNavigationType,
} from 'react-router-dom';

const env = (import.meta as ImportMeta & { env: Record<string, string | undefined> }).env;
const sentryDsn = (env.VITE_SENTRY_DSN || env.VITE_URGENTRY_DSN || '').trim();
const faroUrl = (env.VITE_FARO_URL || '').trim();
const environment = (env.VITE_ENVIRONMENT || env.MODE || 'development').trim();
const release = (env.VITE_RELEASE || '').trim() || undefined;
const faroAppName = (env.VITE_FARO_APP_NAME || 'csi-webapp').trim();

const SENSITIVE_KEY = /^(authorization|cookie|password|token|otp|secret|access_token|refresh_token)$/i;

function scrubValue(key: string, value: unknown): unknown {
  if (SENSITIVE_KEY.test(key)) return '[Filtered]';
  return value;
}

function scrubAttributes(attrs: Record<string, unknown> | undefined): Record<string, unknown> | undefined {
  if (!attrs) return attrs;
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(attrs)) {
    out[k] = scrubValue(k, v);
  }
  return out;
}

/** Group HashRouter pages by path pattern (strip numeric / UUID segments). */
export function generatePageIdFromLocation(location: Location): string {
  const raw = (location.hash || '').replace(/^#/, '') || location.pathname || '/';
  const path = raw.split('?')[0] || '/';
  return path
    .replace(/\/\d+(?=\/|$)/g, '/:id')
    .replace(
      /\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}(?=\/|$)/gi,
      '/:id',
    );
}

if (faroUrl) {
  initializeFaro({
    url: faroUrl,
    app: {
      name: faroAppName,
      version: release,
      environment,
    },
    instrumentations: [
      ...getWebInstrumentations(),
      new TracingInstrumentation(),
      new ReactIntegration({
        router: createReactRouterV7Options({
          createRoutesFromChildren,
          matchRoutes,
          Routes,
          useLocation,
          useNavigationType,
        }),
      }),
    ],
    pageTracking: {
      generatePageId: generatePageIdFromLocation,
    },
    beforeSend: (item) => {
      const anyItem = item as { attributes?: Record<string, unknown> };
      if (anyItem.attributes) {
        anyItem.attributes = scrubAttributes(anyItem.attributes);
      }
      return item;
    },
  });
}

if (sentryDsn) {
  Sentry.init({
    dsn: sentryDsn,
    environment,
    release,
    sendDefaultPii: false,
    beforeSend(event) {
      const headers = event.request?.headers;
      if (headers) {
        for (const key of Object.keys(headers)) {
          if (SENSITIVE_KEY.test(key)) {
            headers[key] = '[Filtered]';
          }
        }
      }
      if (event.request) {
        delete event.request.data;
        delete event.request.cookies;
      }
      if (event.user) {
        delete event.user.email;
        delete event.user.ip_address;
        delete event.user.username;
      }
      return event;
    },
  });
}
