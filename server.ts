import "dotenv/config";
import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import multiplayerHandler from "./api/multiplayer.js";
import cdeHandler from "./api/cde.js";
import challengeHandler from './api/challenges.js';

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT);
  if (!PORT) throw new Error('PORT is required');

  app.use(express.json());

  // API routes
    app.all("/api/multiplayer", multiplayerHandler);
  app.all("/api/cde", cdeHandler);
  app.all('/api/challenges', challengeHandler);

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { 
        middlewareMode: true,
        hmr: { server: undefined } // Let vite create its own WS server on default port, not 3000
      },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath, { index: false }));
    
    // Inject runtime environment variables into index.html
    app.get('*', async (req, res) => {
      try {
        const fs = await import('fs');
        let html = await fs.promises.readFile(path.join(distPath, 'index.html'), 'utf-8');
        
        const envScript = `<script>
          window.ENV = {
            VITE_SUPABASE_URL: ${JSON.stringify(process.env.SUPABASE_URL || '')},
            VITE_SUPABASE_ANON_KEY: ${JSON.stringify(process.env.SUPABASE_ANON_KEY || '')}
          };
        </script>`;
        
        html = html.replace('</head>', `${envScript}</head>`);
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.send(html);
      } catch (err) {
        console.error('Error serving index.html:', err);
        res.status(500).send('Server Error');
      }
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });

  // Optional: expose the API on a second port (preview environments route /api/* to a separate port)
  const apiPort = Number(process.env.API_PORT);
  if (apiPort && apiPort !== PORT) {
    const apiApp = express();
    apiApp.use(express.json());
    apiApp.all("/api/multiplayer", multiplayerHandler);
    apiApp.all("/api/cde", cdeHandler);
    apiApp.all('/api/challenges', challengeHandler);
    apiApp.listen(apiPort, "0.0.0.0", () => {
      console.log(`API also listening on http://localhost:${apiPort}`);
    });
  }
}

startServer();
