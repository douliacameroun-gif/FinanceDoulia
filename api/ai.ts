import express from "express";
import Airtable from "airtable";
import dotenv from "dotenv";

dotenv.config();

const router = express.Router();
const tavilyKey = process.env.TAVILY_KEY;
const airtableKey = process.env.PAT_AIRTABLE;
const baseId = process.env.BASE_ID_AIRTABLE || 'appK4PC79CjakwBo8';

// Route to check API health
router.get("/health", (req, res) => {
  res.json({
    gemini: !!process.env.GEMINI_API_KEY,
    tavily: !!process.env.TAVILY_KEY,
    airtable: !!process.env.PAT_AIRTABLE
  });
});

// Route for AI Research (Tavily only, synthesis in frontend)
router.post("/research", async (req, res) => {
  const { query } = req.body;
  if (!tavilyKey) return res.status(500).json({ error: "Tavily API key missing" });

  try {
    const tavilyRes = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: tavilyKey,
        query: query,
        search_depth: "advanced",
        max_results: 5
      })
    });
    
    if (!tavilyRes.ok) throw new Error("Tavily API error");
    const searchData = await tavilyRes.json();
    res.json(searchData);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Route to create a project from a veille idea
router.post("/create-project-from-veille", async (req, res) => {
  const { title, description, budget } = req.body;
  if (!airtableKey) return res.status(500).json({ error: "Airtable API key missing" });

  try {
    const base = new Airtable({ apiKey: airtableKey }).base(baseId);
    const record = await base('tblgX9gqTUCrWd1SU').create([
      {
        fields: {
          'fldl7TzK5MTL94uP8': title,
          'fldsUlqBL0r8jLMcB': 'Développement IA',
          'fldn1SrjT8zMGIE2w': 'Prospect',
          'fldvR8hnEAObXC5R5': parseInt(budget) || 0,
          // Description field ID might be needed if it exists in schema
        }
      }
    ], { typecast: true });

    res.json({ success: true, id: record[0].id });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
