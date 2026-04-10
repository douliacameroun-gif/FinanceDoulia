/**
 * Airtable Schema Definitions for Doulia Finance Hub
 */

export interface Client {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company: string;
  address?: string;
  status: 'active' | 'prospect' | 'inactive';
  createdAt: string;
}

export interface Project {
  id: string;
  clientId: string;
  name: string;
  description: string;
  budget: number;
  status: 'planning' | 'in-progress' | 'completed' | 'on-hold';
  startDate: string;
  endDate?: string;
}

export interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
  type: 'fixed' | 'variable';
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  clientId: string;
  projectId?: string;
  date: string;
  dueDate: string;
  items: InvoiceItem[];
  subtotal: number;
  tax: number;
  total: number;
  status: 'draft' | 'sent' | 'paid' | 'overdue';
  notes?: string;
}

export interface SocialPost {
  id: string;
  platform: 'facebook' | 'instagram' | 'linkedin' | 'twitter';
  content: string;
  scheduledDate: string;
  status: 'draft' | 'scheduled' | 'published';
  mediaUrls?: string[];
}

export interface CRMContact {
  id: string;
  clientId: string;
  firstName: string;
  lastName: string;
  role: string;
  email: string;
  phone?: string;
  lastContactDate?: string;
}
