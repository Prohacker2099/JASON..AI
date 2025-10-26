/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_USE_UNIFIED_DEVICE_CONTROL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
