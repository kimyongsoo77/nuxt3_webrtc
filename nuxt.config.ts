// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },
  devServer: {
    https: {
      key: './cert/key.pem',
      cert: './cert/cert.pem'
    },
    port: 4000,
    host: '0.0.0.0'
  }
})
