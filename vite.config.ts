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
        runtimeCaching: [
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
