/**
 * Airtable Configuration and IDs for Doulia Finance Hub
 */

export const AIRTABLE_CONFIG = {
  BASE_ID: 'appK4PC79CjakwBo8',
  TABLES: {
    INVOICES: 'tblX7ykfY4DwtMwx3',
    CLIENTS: 'tblH7L934XOqS31dc',
    BUDGETS: 'tblLu4T3lvaXAoZfi',
    PROJECTS: 'Projets', 
    SERVICES: 'tblOwFayoP73fMUHo',
    SOCIAL_POSTS: 'tblJhwTFYaTpgWOJH',
    TASKS: 'Task_Manager',
    VEILLE: 'Veille_Stratégique',
    CHAT_LOGS: 'Chat_Logs',
  },
  FIELDS: {
    CLIENTS: {
      NAME: 'fldn2cShZ3MzzI2lc',
      CONTACT: 'fldaimzKu1Hnkj73D',
      EMAIL: 'fld2nx5p6cYtwvnf0',
      SECTOR: 'fldt3wE2wbhaT7US6',
      STATUS: 'fld7GQBiEFw3WfFyL',
      AI_SCORE: 'fld4hnVSICC0fAMbX',
      SENTIMENT: 'fldAgNkrk6jwEkkdo',
      TOTAL_VALUE: 'fldCH8LcedPBvS14Q',
    },
    TASKS: {
      TITLE: 'Task_Name',
      DESCRIPTION: 'Description',
      PRIORITY: 'Priority',
      STATUS: 'Status',
      DUE_DATE: 'Due_Date',
      PROJECT: 'Related_Project',
      CLIENT: 'Related_Client',
      AI_ADVICE: 'AI_Advice',
    },
    VEILLE: {
      TITLE: 'Titre Actualité',
      URL: 'URL Source',
      SUMMARY: 'Résumé IA',
      POTENTIAL: 'Potentiel Business',
      STATUS: 'Statut',
      PROJECT: 'Lien Projet',
      DATE: 'Date de Découverte',
      TYPE: 'Type d\'Opportunité',
      SHORT_SUMMARY: 'Résumé Court IA',
      IMPACT_SCORE: 'Score d\'Impact AI',
    },
    PROJECTS: {
      NAME: 'Nom Projet',
      CLIENT: 'Client',
      STATUS: 'Statut',
      TYPE: 'Type',
      BUDGET: 'Budget',
      PROGRESS: 'Progrès IA (%)',
      INVOICES: 'Factures',
      CHAT_LOGS: 'Chat_Logs',
      TASKS: 'Task_Manager',
      VEILLE: 'Veille_Stratégique',
    },
    CHAT_LOGS: {
      SESSION_ID: 'Session_ID',
      ROLE: 'Role',
      CONTENT: 'Content',
      PROJECT: 'Context_Projet',
      CLIENT: 'Context_Client',
      TIMESTAMP: 'Timestamp',
    },
    SERVICES: {
      NAME: 'fldApWaMmmZz8HFpK',
      DESCRIPTION: 'fldl5wmGfnom1k8vf',
      TYPE: 'fldL67dsnKTqqpEpk',
      SETUP_PRICE: 'fldf3klk8Ae0oiiFV',
      MAINTENANCE_PRICE: 'fld3hQvyMrHF4Kbox',
    },
    BUDGETS: {
      MONTH: 'fldIFImUYwtM9uKAc',
      TOTAL_REVENUE: 'fldwgHL7o3iqsKd3u',
      TOTAL_EXPENSES: 'fldtRAxE0LdMCZCzJ',
      NET_MARGIN: 'fldxCqNFsG8nqg6k6',
    },
    INVOICES: {
      ID: 'fld4xZH4q6fzCbytr',
      CLIENT: 'fldyErgUvg9AYkUNn',
      EMISSION_DATE: 'fldgRgKeG2tR1Ap67',
      DUE_DATE: 'fldgsD0aCGfwMGQRl',
      TOTAL_AMOUNT: 'fld0VEXg1rUNBzg1L',
      STATUS: 'fldleYK02VHJUNt3Y',
    },
    SOCIAL_POSTS: {
      CONTENT: 'fldWfOYnsvIBIIXba',
      PLATFORM: 'fldwq32dmqOSzmiHM',
      STATUS: 'fldFc8mFdiM7uLKgF',
      SCHEDULED_DATE: 'fldKXTTY0cHyN5bjc',
      AI_BRIEF: 'fldydoEuHAJQDJYF4',
    }
  }
};

export interface AirtableRecord<T> {
  id: string;
  fields: T;
  createdTime: string;
}
