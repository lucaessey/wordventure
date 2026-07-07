import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  // Served from GitHub Pages under /wordventure/
  base: '/wordventure/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Wordventure',
        short_name: 'Wordventure',
        description: 'A Wordle-derived word game with Normal, Infinite, and Adventure modes.',
        theme_color: '#1a1a2e',
        background_color: '#1a1a2e',
        display: 'standalone',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
        ],
      },
      workbox: {
        // Word data is static JSON committed to the repo; precache everything for full offline play
        globPatterns: ['**/*.{js,css,html,json,png,svg,ico}'],
      },
    }),
  ],
})
