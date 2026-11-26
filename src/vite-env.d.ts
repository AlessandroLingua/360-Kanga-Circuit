/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** OAuth 2.0 Web client ID for Google sign-in + Drive app-data sync (see .env.example). */
  readonly VITE_GOOGLE_CLIENT_ID?: string;
  /** iOS OAuth client ID, only needed for the native iOS app. */
  readonly VITE_GOOGLE_IOS_CLIENT_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
