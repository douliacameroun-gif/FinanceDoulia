import { AIRTABLE_CONFIG } from './schema';

/**
 * Generic function to fetch records from an Airtable table via server proxy
 */
export async function fetchAirtableData<T>(tableId: string): Promise<T[]> {
  try {
    console.log(`Fetching data from proxy for table: ${tableId}...`);
    const response = await fetch(`/api/airtable/${tableId}`);
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log(`Successfully fetched ${data.length} records from table ${tableId}`);
    return data as T[];
  } catch (error) {
    console.error(`Error fetching data from table ${tableId}:`, error);
    return [];
  }
}

/**
 * Generic function to update a record in an Airtable table via server proxy
 */
export async function updateAirtableRecord(tableId: string, recordId: string, fields: any): Promise<boolean> {
  try {
    const response = await fetch(`/api/airtable/${tableId}/${recordId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields })
    });
    
    return response.ok;
  } catch (error) {
    console.error(`Error updating record ${recordId} in table ${tableId}:`, error);
    return false;
  }
}

/**
 * Generic function to create a record in an Airtable table via server proxy
 */
export async function createAirtableRecord(tableId: string, fields: any): Promise<string | null> {
  try {
    const response = await fetch(`/api/airtable/${tableId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields })
    });
    
    if (!response.ok) return null;
    const data = await response.json();
    return data.id;
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
  getTasks: () => fetchAirtableData(AIRTABLE_CONFIG.TABLES.TASKS),
  updateBudget: (id: string, fields: any) => updateAirtableRecord(AIRTABLE_CONFIG.TABLES.BUDGETS, id, fields),
  updateInvoice: (id: string, fields: any) => updateAirtableRecord(AIRTABLE_CONFIG.TABLES.INVOICES, id, fields),
  createProject: (fields: any) => createAirtableRecord(AIRTABLE_CONFIG.TABLES.PROJECTS, fields),
  updateProject: (id: string, fields: any) => updateAirtableRecord(AIRTABLE_CONFIG.TABLES.PROJECTS, id, fields),
  createClient: (fields: any) => createAirtableRecord(AIRTABLE_CONFIG.TABLES.CLIENTS, fields),
  updateClient: (id: string, fields: any) => updateAirtableRecord(AIRTABLE_CONFIG.TABLES.CLIENTS, id, fields),
  createSocialPost: (fields: any) => createAirtableRecord(AIRTABLE_CONFIG.TABLES.SOCIAL_POSTS, fields),
  testConnection: async () => {
    try {
      const response = await fetch(`/api/airtable/${AIRTABLE_CONFIG.TABLES.BUDGETS}`);
      if (response.ok) {
        const data = await response.json();
        return { 
          success: true, 
          message: `Connecté via proxy ! ${data.length} enregistrement(s) trouvé(s).` 
        };
      } else {
        const error = await response.json();
        return { success: false, message: `Erreur proxy: ${error.error}` };
      }
    } catch (error: any) {
      return { success: false, message: `Erreur de connexion: ${error.message}` };
    }
  }
};
