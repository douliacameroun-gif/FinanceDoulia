import express from "express";
import Airtable from "airtable";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";

dotenv.config();

const router = express.Router();
const tavilyKey = process.env.TAVILY_KEY;
const airtableKey = process.env.PAT_AIRTABLE;
const baseId = process.env.BASE_ID_AIRTABLE || 'appK4PC79CjakwBo8';

// Initialize server-side Gemini client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

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

// Route for deep market intelligence using Tavily as web search & Gemini for synthesis
router.post("/veille-intelligence", async (req, res) => {
  const { sector, keywords } = req.body;
  if (!tavilyKey) return res.status(500).json({ error: "Clé API Tavily absente du serveur. Veuillez l'ajouter dans Settings > Secrets sous TAVILY_KEY." });
  if (!process.env.GEMINI_API_KEY) return res.status(500).json({ error: "Clé API Gemini absente de Doulia." });

  // Intelligent search queries tailored for Cameroon business growth
  let searchQuery = "opportunités d'intégration IA Cameroun affaires économie tech";
  if (sector) {
    searchQuery = `opportunités d'affaires IA informatique technologie secteur ${sector} Cameroun`;
  }
  if (keywords) {
    searchQuery += ` ${keywords}`;
  }

  try {
    // 1. Fetch web search results via Tavily
    const tavilyRes = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: tavilyKey,
        query: searchQuery,
        search_depth: "advanced",
        max_results: 6
      })
    });
    
    if (!tavilyRes.ok) throw new Error("Erreur lors de la recherche internet Tavily.");
    const searchData = await tavilyRes.json();
    const results = searchData.results || [];

    // 2. Format system and user prompts to synthesize the report using Gemini 3.5 Flash
    const systemInstruction = 
      "Vous êtes un analyste sénior d'Intelligence Économique et de Transformation Numérique au sein de DOULIA, un cabinet pionnier de conseil en IA et Tech au Cameroun." +
      "Votre rôle est d'analyser d'authentiques résultats de recherche web sur l'écosystème camerounais pour en dégager des opportunités d'affaires innovantes basées sur le digital.";

    const prompt = 
      `Analyse les résultats de recherche internet récents sur le territoire camerounais.
      
      TERMES REQUIS DE RECHERCHE : "${searchQuery}"
      
      DOCUMENTS ET CONTENUS ISSUS DU WEB :
      ${JSON.stringify(results)}
      
      Génère un rapport d'intelligence et de veille de très haut calibre pour Doulia. Le ton doit être professionnel, précis et constructif.
      Le rapport "reportMarkdown" doit obligatoirement inclure :
      - Une analyse approfondie du développement technologique au Cameroun (contexte actuel basé sur les données lues).
      - Une présentation convaincante de 3 à 4 opportunités business concrètes où l'intégration de services IA de Doulia (automatisation, conseils, chatbots d'entreprise, outils d'évaluation de risques) apporte une valeur immédiate.
      - Des recommandations stratégiques détaillées montrant les étapes concrètes pour que Doulia capture ces parts de marché sur place.
      
      Toutes tes descriptions d'opportunités ("opportunities") doivent être complètes, avec le secteur adapté (ex: Finance, Agriculture, Transports, Santé, Éducation), un niveau d'impact ou potentiel ("Critique", "Élevé", "Moyen"), un type d'opportunité, ainsi que l'URL d'origine issue de la recherche qui appuie cette opportunité.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            reportTitle: { type: Type.STRING },
            reportMarkdown: { type: Type.STRING, description: "Rapport de veille stratégique complet structuré et rédigé en français avec recommandations." },
            opportunities: {
              type: Type.ARRAY,
              description: "Détections d'opportunités d'affaires locales applicables pour le cabinet Doulia.",
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING, description: "Nom commercial accrocheur de l'offre ou de l'opportunité d'affaires" },
                  description: { type: Type.STRING, description: "Explication claire du besoin détecté et de la solution IA proposée." },
                  sector: { type: Type.STRING, description: "Finance, Agriculture, Santé, Énergie, Transport, Éducation, Élevage, ou Administration" },
                  potential: { type: Type.STRING, description: "Valeur ou priorité pour Doulia : 'Critique' ou 'Élevé' ou 'Moyen'" },
                  type: { type: Type.STRING, description: "Article d'analyse, Veille concurrentielle, Appel d'offres mondial, Innovation de rupture" },
                  url: { type: Type.STRING, description: "URL source liée la plus pertinente parmi les résultats Tavily" }
                },
                required: ["title", "description", "sector", "potential", "type"]
              }
            }
          },
          required: ["reportTitle", "reportMarkdown", "opportunities"]
        }
      }
    });

    const parsedData = JSON.parse(response.text || "{}");

    res.json({
      success: true,
      searchQuery,
      sources: results,
      ...parsedData
    });

  } catch (error: any) {
    console.error("Error in /veille-intelligence:", error);
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

// Route for AI Draft Design and Assist Workspace
router.post("/draft-assistant", async (req, res) => {
  const { type, title, currentDraft, action, userInput } = req.body;
  if (!process.env.GEMINI_API_KEY) {
    return res.status(200).json({ 
      success: false, 
      error: "Clé API Gemini absente de Doulia. Veuillez l'ajouter ou configurer Settings > Secrets." 
    });
  }

  try {
    const systemInstruction = 
      "Vous êtes Doulia Conception IA, un assistant d'élite en rédaction, " +
      "ingénierie de spécifications technologiques et cadrage stratégique de projets et de tâches au Cameroun. " +
      "Votre but est d'aider l'utilisateur à structurer un document de travail d'excellence technique et financière.";

    let prompt = "";

    switch (action) {
      case "brainstorm":
        prompt = `Génère une séance de brainstorming structurée et des idées d'implémentation pour le ${type === 'project' ? 'projet' : 'la tâche'} : **${title}**.
        Voici les notes ou brouillons existants de l'utilisateur :
        "${currentDraft || "Aucun brouillon de départ."}"
        
        Fournis :
        1. Une liste de 5 à 7 idées innovantes / fonctionnalités avancées associées.
        2. Des propositions de technologies ou de frameworks d'intégration IA adaptés.
        3. Un découpage en jalons de travail suggérés.`;
        break;
      case "specs":
        prompt = `Rédige un cahier des charges technique ou des Spécifications Techniques détaillées pour le ${type === 'project' ? 'projet' : 'la tâche'} : **${title}**.
        Voici les brouillons / notes existants de l'utilisateur :
        "${currentDraft || "Aucun brouillon de départ."}"
        
        Structure ton document en français avec :
        - **Description générale** et objectifs du système
        - **Spécifications fonctionnelles** clés
        - **Spécifications techniques** (Architecture sous-jacente recommandée, flux de données)
        - **Scénarios d'utilisation (User Stories)** typiques`;
        break;
      case "risks":
        prompt = `Analyse les risques techniques, organisationnels ou algorithmiques pour le ${type === 'project' ? 'projet' : 'la tâche'} : **${title}**.
        Brouillons / notes existants de l'utilisateur :
        "${currentDraft || "Aucun brouillon de départ."}"
        
        Identifie :
        1. Les principaux goulots d'étranglement ou risques de dépassement de budget / temps.
        2. Les risques spécifiques à l'IA ou à la qualité des données si applicables.
        3. Les mesures d'atténuation (stratégies de repli) concrètes pour chaque risque.`;
        break;
      case "pitch":
        prompt = `Rédige un argumentaire commercial percutant (Pitch Client) pour présenter le ${type === 'project' ? 'projet' : 'la tâche'} : **${title}** à un client ou décideur stratégique.
        Brouillons / notes existants de l'utilisateur :
        "${currentDraft || "Aucun brouillon de départ."}"
        
        Inclus de manière ultra-convaincante :
        - Le problème concret résolu et l'alignement business
        - Pourquoi la solution de Doulia (automatisation IA) est unique
        - Rappels de ROI ou de gains de productivité attendus (avec une estimation de gain de temps indicative).`;
        break;
      case "custom-chat":
      default:
        prompt = `Tu es le co-pilote d'écriture IA Doulia pour le ${type === 'project' ? 'projet' : 'la tâche'} : **${title}**.
        L'utilisateur te demande de traiter ou réviser son document avec cette instruction précise :
        "${userInput}"
        
        Voici le contenu actuel de son brouillon / document d'appui :
        "${currentDraft || "Brouillon de départ vide."}"
        
        Réponds de manière constructive. S'il te demande de rédiger, modifie ou enrichis le texte. Donne des conseils précis et propose du texte prêt à être copié/inséré.`;
        break;
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            refinedText: { 
              type: Type.STRING, 
              description: "Le texte rédigé ou restructuré par l'IA en français, structuré en Markdown propre (titres #, listes, gras)." 
            },
            aiSuggestions: {
              type: Type.ARRAY,
              description: "3 à 5 conseils ou étapes futures de réflexion stratégique sous forme de chaînes de caractères courtes.",
              items: { type: Type.STRING }
            }
          },
          required: ["refinedText", "aiSuggestions"]
        }
      }
    });

    const parsedData = JSON.parse(response.text || "{}");
    res.json({
      success: true,
      refinedText: parsedData.refinedText,
      aiSuggestions: parsedData.aiSuggestions
    });

  } catch (error: any) {
    console.error("Error in draft-assistant API:", error);
    res.status(500).json({ error: error.message || "Erreur lors du traitement par l'IA." });
  }
});

// Route for Chat IA Hub
router.post("/chat", async (req, res) => {
  const { messages, context, customInstructions } = req.body;
  if (!process.env.GEMINI_API_KEY) {
    return res.status(200).json({ 
      success: false, 
      error: "Clé API Gemini absente de Doulia. Veuillez l'ajouter dans Settings > Secrets." 
    });
  }

  try {
    const systemInstruction = 
      "Vous êtes l'Assistant IA d'élite de DOULIA, un cabinet pionnier d'intégration tech et de projets innovants au Cameroun. " +
      "Votre but est de fournir des réponses d'excellence d'ingénierie, de gestion de projets et d'accompagnement.\n\n" +
      "RÈGLES DE CONCEPTION EXTRÊMES :\n" +
      "1. RÉPONDEZ DE MANIÈRE TRÈS MICRO-AÉRÉE : Séparez TOUS les paragraphes par au moins 2 retours à la ligne complets.\n" +
      "2. TITRES ET MOTS CLÉS EN GRAS : Utilisez abondamment le gras (**) pour mettre en relief les jalons administratifs, " +
      "les pourcentages de progression, les coûts fiscaux et les livrables d'ingénierie.\n" +
      "3. TABLEAUX COLORÉS ET BARRES DE PROGRESSION DYNAMIQUES : Dès que vous comparez des indicateurs, listez " +
      "des plannings, estimez des budgets ou projetez des pourcentages de réussite, construisez ABSOLUMENT un tableau Markdown standard (avec des entêtes). " +
      "Mettez des valeurs de pourcentage explicites (comme '90%', '75%', '40%') dans les cellules pour que l'interface " +
      "génère automatiquement des barres de progression interactives en temps réel pour l'utilisateur.\n" +
      "4. Pas d'HTML, pas d'astérisques simples pour les puces de liste (utilisez des tirets '- ' pour les listes).\n" +
      (customInstructions ? `DIRECTIVES SUPPLÉMENTAIRES UTILISATEUR : ${customInstructions}\n` : "") +
      (context ? `CONTEXTE RÉEL DOULIA INTERNE : ${context}\n` : "");

    // Format messages safely
    const formattedContents = messages.map((m: any) => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.content }]
    }));

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: formattedContents,
      config: {
        systemInstruction,
        temperature: 0.3,
      }
    });

    res.json({
      success: true,
      text: response.text || "Désolé, je n'ai pas pu formuler de réponse."
    });

  } catch (error: any) {
    console.error("Error in Chat IA API:", error);
    res.status(500).json({ error: error.message || "Erreur de communication avec le serveur de Doulia." });
  }
});

export default router;
