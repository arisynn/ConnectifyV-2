import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const noCachePlugin = () => ({
  name: 'no-cache',
  configureServer(server) {
    server.middlewares.use((req, res, next) => {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      next();
    });
  }
});

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    server: { host: '0.0.0.0', port: 3000, allowedHosts: true },
    plugins: [react(), tailwindcss(), noCachePlugin()],
    define: {
      'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || env.VITE_SUPABASE_URL || env.SUPABASE_URL || ''),
      'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || env.VITE_SUPABASE_ANON_KEY || env.SUPABASE_ANON_KEY || '')
    }
  };
})