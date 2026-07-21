import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // loadEnv lee .env, .env.local, .env.{mode}, etc.
  // Pasamos el tercer argumento '' para que VITE_API_URL sea accesible.
  const env = loadEnv(mode, process.cwd(), '')
  return {
    define: {
      // Expone VITE_API_URL al runtime del bundle
      __VITE_API_URL__: JSON.stringify(env.VITE_API_URL),
    },
    plugins: [
      react(),
      tailwindcss()
    ],
  }
})
