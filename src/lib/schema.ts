/**
 * Airtable Configuration and IDs for Doulia Finance Hub
 */

export const AIRTABLE_CONFIG = {
  BASE_ID: 'appK4PC79CjakwBo8',
  TABLES: {
    INVOICES: 'tblX7ykfY4DwtMwx3',
    CLIENTS: 'tblH7L934XOqS31dc',
    BUDGETS: 'tblLu4T3lvaXAoZfi',
    PROJECTS: 'tblgX9gqTUCrWd1SU',
    SERVICES: 'tblOwFayoP73fMUHo',
    SOCIAL_POSTS: 'tblJhwTFYaTpgWOJH',
    TASKS: 'tblTasks', // Task_Manager
    VEILLE: 'tblVeille', // Veille_Stratégique
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
      TITLE: 'fldTaskTitle',
      PROJECT: 'fldTaskProject',
      DUE_DATE: 'fldTaskDueDate',
      STATUS: 'fldTaskStatus',
      PRIORITY: 'fldTaskPriority',
    },
    VEILLE: {
      TITLE: 'fldVeilleTitle',
      CONTENT: 'fldVeilleContent',
      SOURCE: 'fldVeilleSource',
      DATE: 'fldVeilleDate',
      OPPORTUNITIES: 'fldVeilleOpp',
    },
    PROJECTS: {
      NAME: 'fldl7TzK5MTL94uP8',
      CLIENT: 'fldYCgfcDKVwM1Afq',
      STATUS: 'fldn1SrjT8zMGIE2w',
      TYPE: 'fldsUlqBL0r8jLMcB',
      BUDGET: 'fldvR8hnEAObXC5R5',
      AI_PROGRESS: 'fldec08geolbZw6U5',
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
