import express from "express";
import Airtable from "airtable";
import dotenv from "dotenv";

dotenv.config();

const app = express();
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
    
    // Only use field IDs if the table ID looks like a real 17-char Airtable ID
    const isRealDataTableId = tableId.startsWith('tbl') && tableId.length === 17;
    
    const records = await base(tableId).select({
      returnFieldsByFieldId: isRealDataTableId
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

app.delete("/api/airtable/:tableId/:recordId", async (req, res) => {
  const { tableId, recordId } = req.params;
  const apiKey = process.env.PAT_AIRTABLE;
  const baseId = process.env.BASE_ID_AIRTABLE || 'appK4PC79CjakwBo8';

  if (!apiKey) return res.status(500).json({ error: "Airtable API key is missing" });

  try {
    const base = new Airtable({ apiKey }).base(baseId);
    await base(tableId).destroy(recordId);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default app;
