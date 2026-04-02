// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: ['@nuxt/eslint', '@nuxt/ui', '@vueuse/nuxt'],
  devtools: {
    enabled: true,
  },

  css: ['~/assets/css/main.css'],

  runtimeConfig: {
    apiBaseUrl: process.env.API_BASE_URL || 'http://localhost:3000/api/v1',
  },

  vite: {
    optimizeDeps: {
      include: ['zod'],
    },
  },

  compatibilityDate: '2025-01-15',
});
