/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** OAuth 2.0 Web client ID for Google sign-in + Drive app-data sync (see .env.example). */
  readonly VITE_GOOGLE_CLIENT_ID?: string;
  /** iOS OAuth client ID, only needed for the native iOS app. */
  readonly VITE_GOOGLE_IOS_CLIENT_ID?: string;
  /** Where the recorded voice clips live (default: the app's own /voice/ folder). */
  readonly VITE_VOICE_BASE?: string;
  /** Where the music library lives (set in .env: the website). */
  readonly VITE_MUSIC_BASE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
