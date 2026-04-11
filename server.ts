import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import Airtable from "airtable";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Airtable Proxy Routes
  app.get("/api/airtable/:tableId", async (req, res) => {
    const { tableId } = req.params;
    const apiKey = process.env.PAT_AIRTABLE;
    const baseId = process.env.BASE_ID_AIRTABLE || 'appK4PC79CjakwBo8';

    if (!apiKey) {
      return res.status(500).json({ error: "Airtable API key is missing on server" });
    }

    try {
      const base = new Airtable({ apiKey }).base(baseId);
      const records = await base(tableId).select({
        returnFieldsByFieldId: true
      }).all();

      const data = records.map((record) => ({
        id: record.id,
        ...record.fields
      }));

      res.json(data);
    } catch (error: any) {
      console.error(`Airtable Proxy Error (${tableId}):`, error);
      res.status(500).json({ error: error.message || "Failed to fetch from Airtable" });
    }
  });

  app.post("/api/airtable/:tableId", async (req, res) => {
    const { tableId } = req.params;
    const { fields } = req.body;
    const apiKey = process.env.PAT_AIRTABLE;
    const baseId = process.env.BASE_ID_AIRTABLE || 'appK4PC79CjakwBo8';

    if (!apiKey) return res.status(500).json({ error: "Airtable API key is missing" });

    try {
      const base = new Airtable({ apiKey }).base(baseId);
      const records = await base(tableId).create([{ fields }], { typecast: true });
      res.json({ id: records[0].id });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.patch("/api/airtable/:tableId/:recordId", async (req, res) => {
    const { tableId, recordId } = req.params;
    const { fields } = req.body;
    const apiKey = process.env.PAT_AIRTABLE;
    const baseId = process.env.BASE_ID_AIRTABLE || 'appK4PC79CjakwBo8';

    if (!apiKey) return res.status(500).json({ error: "Airtable API key is missing" });

    try {
      const base = new Airtable({ apiKey }).base(baseId);
      await base(tableId).update(recordId, fields, { typecast: true });
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

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
