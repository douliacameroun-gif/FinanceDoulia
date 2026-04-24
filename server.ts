import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import dotenv from "dotenv";

// Load environment variables early
dotenv.config();

import airtableRouter from "./api/airtable";
import aiRouter from "./api/ai";
import authRouter from "./api/auth";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Logging middleware for all requests
  app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
  });

  // API Routes - Using modular routers
  app.use("/api/auth", authRouter);
  app.use("/api/ai", aiRouter);
  app.use("/api/airtable", airtableRouter);

  // Status check endpoint
  app.get("/api/status", (req, res) => {
    res.json({ 
      status: "online", 
      version: "1.1.3",
      config: {
        ADMIN_EMAIL: !!process.env.ADMIN_EMAIL,
        MOT_DE_PASSE_ADMIN: !!process.env.MOT_DE_PASSE_ADMIN,
        PAT_AIRTABLE: !!process.env.PAT_AIRTABLE,
        TAVILY_KEY: !!process.env.TAVILY_KEY
      }
    });
  });

  // Health check for Vercel or other platforms
  app.get("/health", (req, res) => res.send("OK"));

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    console.log("Starting in DEVELOPMENT mode with Vite...");
    const vite = await createViteServer({
      server: { 
        middlewareMode: true,
        host: '0.0.0.0',
        port: 3000
      },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Starting in PRODUCTION mode...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error("Failed to start server:", err);
});
