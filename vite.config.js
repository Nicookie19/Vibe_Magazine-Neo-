import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode, command }) => {
  const env = loadEnv(mode, process.cwd(), ['VITE_', 'SUPABASE_Magazine_URL'])
  const supabaseUrl = env.VITE_SUPABASE_URL || env.SUPABASE_Magazine_URL

  // This URL is public connection information, even when Vercel stores it as
  // a secret. Map only this exact alias; never expose all SUPABASE_* values.
  if (command === 'build' && (!supabaseUrl || !env.VITE_SUPABASE_ANON_KEY)) {
    throw new Error('Set VITE_SUPABASE_URL or SUPABASE_Magazine_URL, and VITE_SUPABASE_ANON_KEY before building.')
  }

  return {
    plugins: [react()],
    define: supabaseUrl ? {
      'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(supabaseUrl),
    } : {},
    optimizeDeps: {
      include: ['pdfjs-dist'],
    },
    build: {
      commonjsOptions: {
        include: [/pdfjs-dist/, /node_modules/],
      },
    },
  }
})
