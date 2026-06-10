import express from "express";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json());

let supabaseClient: any = null;

// Lazy client getter
function getSupabaseClient() {
  const url = process.env.SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error("SUPABASE_CONFIG_MISSING");
  }

  if (!supabaseClient) {
    supabaseClient = createClient(url, anonKey);
  }
  return supabaseClient;
}

// GET all contacts from Supabase
app.get("/api/supabase/contacts", async (req, res) => {
  try {
    const client = getSupabaseClient();
    
    // Attempt querying the contacts table
    // Fetch latest first if created_at is available
    const { data, error } = await client
      .from("contacts")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      // If order fails because created_at is missing, retry without ordering
      if (error.code === "PGRST202" || error.message.includes("column") || error.message.includes("created_at")) {
        const fallbackQuery = await client.from("contacts").select("*");
        if (fallbackQuery.error) throw fallbackQuery.error;
        return res.json({ success: true, contacts: fallbackQuery.data });
      }
      throw error;
    }

    res.json({ success: true, contacts: data });
  } catch (error: any) {
    console.error("Supabase contacts API error:", error);
    
    if (error.message === "SUPABASE_CONFIG_MISSING") {
      return res.status(200).json({
        success: false,
        errorType: "CONFIG_MISSING",
        message: "Les variables d'environnement SUPABASE_URL et SUPABASE_ANON_KEY sont manquantes sur le serveur.",
        sqlHelp: `-- Pour configurer l'application, veuillez saisir les secrets dans Settings > Secrets :
-- SUPABASE_URL = VOTRE_URL_PROJET_SUPABASE
-- SUPABASE_ANON_KEY = VOTRE_CLE_ANONYME_SUPABASE`
      });
    }

    // Handles table missing, RLS policy errors or connection errors gracefully
    return res.status(200).json({
      success: false,
      errorType: "DATABASE_ERROR",
      message: `Erreur Supabase: ${error.message || "Impossible d'accéder à la table 'contacts'."}`,
      code: error.code || "UNKNOWN",
      sqlHelp: `-- SQL pour créer la table 'contacts' dans Supabase si nécessaire :
CREATE TABLE IF NOT EXISTS contacts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  message TEXT,
  subject TEXT,
  status TEXT DEFAULT 'Nouveau'
);

-- Activez le Row Level Security (RLS) :
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

-- Variante 1 : Lecture publique anonyme (Anons & Authenticated)
CREATE POLICY "Lecture publique pour tous" 
ON contacts FOR SELECT 
USING (true);

-- Variante 2 : Lecture réservée aux utilisateurs connectés (authenticated uniquement)
-- CREATE POLICY "Lecture réservée aux admins" 
-- ON contacts FOR SELECT 
-- TO authenticated
-- USING (true);

-- Politique d'insertion publique pour le formulaire de contact du site de Doulia :
CREATE POLICY "Insertion publique pour tous" 
ON contacts FOR INSERT 
WITH CHECK (true);`
    });
  }
});

// PATCH endpoint to update contact status in Supabase
app.patch("/api/supabase/contacts/:id", async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  
  try {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from("contacts")
      .update({ status })
      .eq("id", id)
      .select();

    if (error) {
      throw error;
    }

    res.json({ success: true, contact: data?.[0] });
  } catch (error: any) {
    console.error("Error updating contact status in Supabase:", error);
    res.status(500).json({ error: error.message });
  }
});

// GET all messages from Supabase
app.get("/api/supabase/messages", async (req, res) => {
  try {
    const client = getSupabaseClient();
    
    // Attempt querying the messages table
    const { data, error } = await client
      .from("messages")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      // If order fails because created_at/createdAt is missing, retry without ordering
      if (error.code === "PGRST202" || error.message.includes("column") || error.message.includes("created_at")) {
        const fallbackQuery = await client.from("messages").select("*");
        if (fallbackQuery.error) throw fallbackQuery.error;
        return res.json({ success: true, messages: fallbackQuery.data });
      }
      throw error;
    }

    res.json({ success: true, messages: data });
  } catch (error: any) {
    console.error("Supabase messages API error:", error);
    
    if (error.message === "SUPABASE_CONFIG_MISSING") {
      return res.status(200).json({
        success: false,
        errorType: "CONFIG_MISSING",
        message: "Les variables d'environnement SUPABASE_URL et SUPABASE_ANON_KEY sont manquantes sur le serveur.",
        sqlHelp: `-- Pour configurer l'application, veuillez saisir les secrets dans Settings > Secrets :
-- SUPABASE_URL = VOTRE_URL_PROJET_SUPABASE
-- SUPABASE_ANON_KEY = VOTRE_CLE_ANONYME_SUPABASE`
      });
    }

    return res.status(200).json({
      success: false,
      errorType: "DATABASE_ERROR",
      message: `Erreur Supabase: ${error.message || "Impossible d'accéder à la table 'messages'."}`,
      code: error.code || "UNKNOWN",
      sqlHelp: `-- SQL pour créer la table 'messages' dans Supabase si nécessaire :
CREATE TABLE IF NOT EXISTS messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  name TEXT,
  email TEXT,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'Nouveau'
);

-- Activez le Row Level Security (RLS) :
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Politique d'accès SELECT public anonyme pour tous (Lecture) :
CREATE POLICY "Lecture publique des messages" 
ON messages FOR SELECT 
USING (true);

-- Politique d'accès INSERT public pour le formulaire de contact de Doulia.com :
CREATE POLICY "Insertion publique de messages" 
ON messages FOR INSERT 
WITH CHECK (true);`
    });
  }
});

// PATCH endpoint to update message status in Supabase
app.patch("/api/supabase/messages/:id", async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  
  try {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from("messages")
      .update({ status })
      .eq("id", id)
      .select();

    if (error) {
      throw error;
    }

    res.json({ success: true, messageRecord: data?.[0] });
  } catch (error: any) {
    console.error("Error updating message status in Supabase:", error);
    res.status(500).json({ error: error.message });
  }
});

export default app;
