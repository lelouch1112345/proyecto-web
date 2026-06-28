import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import { SvelteKitPWA } from '@vite-pwa/sveltekit';

export default defineConfig({
  plugins: [
    tailwindcss(),
    sveltekit(),
    SvelteKitPWA({
      registerType: 'prompt',
      base: '/proyecto-web/',
      includeAssets: ['favicon.png', 'icons/*.png', 'offline.html'],
      manifest: {
        name: 'Third-Life — Gamified Study Plan',
        short_name: 'Third-Life',
        description: 'Anti-procrastination gamified study plan tracker',
        theme_color: '#1a0000',
        background_color: '#0a0a0a',
        display: 'standalone',
        scope: '/proyecto-web/',
        start_url: '/proyecto-web/',
        icons: [
          {
            src: '/proyecto-web/icons/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: '/proyecto-web/icons/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webmanifest}'],
        navigateFallback: '/proyecto-web/offline.html',
        navigateFallbackAllowlist: [/^\/[^.]*$/]
      }
    })
  ]
});
