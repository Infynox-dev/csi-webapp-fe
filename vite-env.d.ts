/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_SENTRY_DSN?: string;
  readonly VITE_URGENTRY_DSN?: string;
  readonly VITE_FARO_URL?: string;
  readonly VITE_FARO_APP_NAME?: string;
  readonly VITE_ENVIRONMENT?: string;
  readonly VITE_RELEASE?: string;
  readonly VITE_USE_LOCAL_API?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
