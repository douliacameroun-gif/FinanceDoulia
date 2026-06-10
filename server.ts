import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import airtableApp from "./api/airtable";
import aiRouter from "./api/ai";
import supabaseRouter from "./api/supabase";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Use the proxy apps
  app.use(airtableApp);
  app.use(aiRouter);
  app.use(supabaseRouter);

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
