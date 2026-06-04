/**
 * Airtable Configuration and IDs for Doulia Finance Hub
 */

export const AIRTABLE_CONFIG = {
  BASE_ID: 'appK4PC79CjakwBo8',
  TABLES: {
    INVOICES: 'tblFupyayeHLl7Ubg', // Correct table ID for Factures
    CLIENTS: 'tblH7L934XOqS31dc',
    BUDGETS: 'tblLu4T3lvaXAoZfi',
    PROJECTS: 'Projets', 
    SERVICES: 'tblOwFayoP73fMUHo',
    SOCIAL_POSTS: 'tblJhwTFYaTpgWOJH',
    TASKS: 'Task_Manager',
    VEILLE: 'Veille_Stratégique',
    CHAT_LOGS: 'Chat_Logs',
    EXPENSES: 'tblExpensesDoulia', // Table for tracking expenses
    AI_OPTIMIZATIONS: 'Optimisations IA', // Table for AI Recommendations
  },
  FIELDS: {
    EXPENSES: {
      ID: 'fldExpId',
      NAME: 'fldExpName',
      AMOUNT: 'fldExpAmount',
      DATE: 'fldExpDate',
      CATEGORY: 'fldExpCategory',
      STATUS: 'fldExpStatus',
      TYPE: 'Type de Dépense',
      ATTACHMENT: 'Fichier Joint Dépense',
    },
    CLIENTS: {
      NAME: 'Nom',
      CONTACT: 'Contact',
      EMAIL: 'Email',
      SECTOR: 'Secteur',
      STATUS: 'Statut',
      AI_SCORE: 'Score IA',
      SENTIMENT: 'Sentiment',
      TOTAL_VALUE: 'Valeur Totale',
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
      PERIOD: 'Mois/Année',
      TOTAL_REVENUE: 'Revenus Totaux',
      TOTAL_EXPENSES: 'Dépenses Totales',
      NET_MARGIN: 'Marge Nette 2',
      TOTAL_INFLOW_LOCAL: 'Total Entrants Local',
      TRENDS: 'Tendance Revenus',
      REPORT_FILE: 'Fichier Rapport Mensuel',
    },
    INVOICES: {
      ID: 'ID Facture',
      CLIENT: 'Client',
      EMISSION_DATE: 'Date Émission',
      DUE_DATE: 'Date Échéance',
      TOTAL_AMOUNT: 'Montant Total',
      STATUS: 'Statut',
      DOC_TYPE: 'Type de Document',
      ATTACHMENTS: 'Fichiers Joints',
      SIGNATURE: 'Signature Électronique',
    },
    AI_OPTIMIZATIONS: {
      RECOMMENDATION: 'Texte Recommandation',
      ROI: 'ROI Estimé',
      STATUS: 'Statut Application',
      CREATED_TIME: 'Date Génération',
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
