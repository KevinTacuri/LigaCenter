import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // __dirname del archivo vite.config.ts (importante: process.cwd() puede ser
  // /app en Docker, no el dir del frontend)
  const __filename = fileURLToPath(import.meta.url)
  const __dirname = dirname(__filename)
  const root = resolve(__dirname)

  // 1) Lee .env, .env.local, .env.{mode} desde el dir del frontend
  const env = loadEnv(mode, root, '')
  // 2) Si VITE_API_URL no está, usa process.env (que viene del ARG del Dockerfile)
  const API_URL_DEFAULT = 'https://api.compose-connect-primary-bandwidth-elym5d-9de16a-144-126-134-104.sslip.io/api'
  const apiUrl = env.VITE_API_URL || process.env.VITE_API_URL || API_URL_DEFAULT

  return {
    define: {
      __VITE_API_URL__: JSON.stringify(apiUrl),
    },
    plugins: [
      react(),
      tailwindcss()
    ],
  }
})
