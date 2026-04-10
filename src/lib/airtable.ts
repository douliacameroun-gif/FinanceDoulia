import Airtable from 'airtable';
import { AIRTABLE_CONFIG } from './schema';

// Lazy initialization of Airtable base
let baseInstance: any = null;

function getBase() {
  if (!baseInstance) {
    let apiKey = process.env.PAT_AIRTABLE;
    let baseId = process.env.BASE_ID_AIRTABLE;

    // Handle stringified "undefined" or "null" from some environments
    if (apiKey === 'undefined' || apiKey === 'null' || apiKey === '') apiKey = undefined;
    if (baseId === 'undefined' || baseId === 'null' || !baseId || baseId === '') baseId = AIRTABLE_CONFIG.BASE_ID;

    if (!apiKey) {
      console.warn("Airtable API key (PAT_AIRTABLE) is missing or invalid. Airtable features will be disabled.");
      return null;
    }
    try {
      baseInstance = new Airtable({ 
        apiKey 
      }).base(baseId);
      console.log(`Airtable initialized successfully with Base ID: ${baseId}`);
    } catch (e) {
      console.error("Failed to initialize Airtable:", e);
      return null;
    }
  }
  return baseInstance;
}

/**
 * Generic function to fetch records from an Airtable table
 */
export async function fetchAirtableData<T>(tableId: string): Promise<T[]> {
  try {
    const base = getBase();
    if (!base) {
      console.warn(`Airtable base not initialized. Skipping fetch for table ${tableId}`);
      return [];
    }
    
    console.log(`Fetching data from Airtable table: ${tableId}...`);
    const records = await base(tableId).select({
      returnFieldsByFieldId: true
    }).all();
    
    console.log(`Successfully fetched ${records.length} records from table ${tableId}`);
    if (records.length > 0) {
      console.log(`Field IDs found in ${tableId}:`, Object.keys(records[0].fields));
    }
    
    return records.map((record: any) => ({
      id: record.id,
      ...record.fields
    })) as T[];
  } catch (error) {
    console.error(`Error fetching data from table ${tableId}:`, error);
    return [];
  }
}

/**
 * Generic function to update a record in an Airtable table
 */
export async function updateAirtableRecord(tableId: string, recordId: string, fields: any): Promise<boolean> {
  try {
    const base = getBase();
    if (!base) return false;
    
    await base(tableId).update(recordId, fields, { typecast: true });
    return true;
  } catch (error) {
    console.error(`Error updating record ${recordId} in table ${tableId}:`, error);
    return false;
  }
}

/**
 * Generic function to create a record in an Airtable table
 */
export async function createAirtableRecord(tableId: string, fields: any): Promise<string | null> {
  try {
    const base = getBase();
    if (!base) return null;
    
    const records = await base(tableId).create([{ fields }], { typecast: true });
    return records[0].id;
  } catch (error) {
    console.error(`Error creating record in table ${tableId}:`, error);
    return null;
  }
}

/**
 * Specific fetchers for Doulia Finance Hub
 */
export const airtableService = {
  getClients: () => fetchAirtableData(AIRTABLE_CONFIG.TABLES.CLIENTS),
  getProjects: () => fetchAirtableData(AIRTABLE_CONFIG.TABLES.PROJECTS),
  getInvoices: () => fetchAirtableData(AIRTABLE_CONFIG.TABLES.INVOICES),
  getBudgets: () => fetchAirtableData(AIRTABLE_CONFIG.TABLES.BUDGETS),
  getServices: () => fetchAirtableData(AIRTABLE_CONFIG.TABLES.SERVICES),
  getSocialPosts: () => fetchAirtableData(AIRTABLE_CONFIG.TABLES.SOCIAL_POSTS),
  updateBudget: (id: string, fields: any) => updateAirtableRecord(AIRTABLE_CONFIG.TABLES.BUDGETS, id, fields),
  updateInvoice: (id: string, fields: any) => updateAirtableRecord(AIRTABLE_CONFIG.TABLES.INVOICES, id, fields),
  createProject: (fields: any) => createAirtableRecord(AIRTABLE_CONFIG.TABLES.PROJECTS, fields),
  createClient: (fields: any) => createAirtableRecord(AIRTABLE_CONFIG.TABLES.CLIENTS, fields),
  testConnection: async () => {
    try {
      const base = getBase();
      if (!base) return { success: false, message: "Airtable non initialisé (Clé API manquante)" };
      
      console.log("Testing Airtable connection...");
      const records = await base(AIRTABLE_CONFIG.TABLES.BUDGETS).select({ maxRecords: 1 }).all();
      return { 
        success: true, 
        message: `Connecté ! ${records.length} enregistrement(s) trouvé(s) dans la table Budgets.`,
        baseId: AIRTABLE_CONFIG.BASE_ID
      };
    } catch (error: any) {
      console.error("Airtable Connection Test Failed:", error);
      return { success: false, message: `Erreur: ${error.message || "Inconnue"}` };
    }
  }
};
