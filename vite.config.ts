import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: './',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: false,
      includeAssets: ['icon.svg'],
      manifest: {
        name: 'Kanga Circuit 360',
        short_name: 'Kanga 360',
        description: 'Generative yoga, pilates, HIIT and meditation',
        theme_color: '#14211d',
        background_color: '#14211d',
        display: 'standalone',
        start_url: './',
        icons: [{ src: 'icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any maskable' }],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,json,woff2}'],
        // recorded voices are large: cached on use (per language and voice), not installed up front
        globIgnores: ['**/voice/**', '**/music/**'],
        runtimeCaching: [
          {
            // 3D instructor models and the floor/mat photo textures
            urlPattern: ({ url }) => /\/(models|textures)\//.test(url.pathname),
            handler: 'CacheFirst',
            options: { cacheName: 'kanga-3d', expiration: { maxEntries: 20 } },
          },
          {
            urlPattern: ({ url }) => url.pathname.includes('/music/') && url.pathname.endsWith('.mp3'),
            handler: 'CacheFirst',
            options: { cacheName: 'kanga-music', expiration: { maxEntries: 60 } },
          },
          {
            urlPattern: ({ url }) => url.pathname.endsWith('/music/library.json'),
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'kanga-music-index' },
          },
          {
            urlPattern: ({ url }) => url.pathname.includes('/voice/') && url.pathname.endsWith('.mp3'),
            handler: 'CacheFirst',
            options: { cacheName: 'kanga-voice', expiration: { maxEntries: 12000 } },
          },
          {
            urlPattern: ({ url }) => url.pathname.includes('/voice/') && url.pathname.endsWith('.json'),
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'kanga-voice-index' },
          },
          {
            urlPattern: ({ url }) => url.pathname.includes('/clips/'),
            handler: 'CacheFirst',
            options: { cacheName: 'kanga-clips', expiration: { maxEntries: 2000 } },
          },
        ],
      },
    }),
  ],
});
