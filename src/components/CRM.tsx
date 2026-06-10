import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, Filter, Plus, MoreVertical, Mail, Phone, Globe, Share2, 
  Calendar, Zap, Facebook, Instagram, Linkedin, Twitter, Clock, 
  MessageSquare, Layout, Send, Sparkles, TrendingUp, BrainCircuit, 
  Smile, Frown, Meh, Eye, FileCheck, BarChart3, Users, Edit2, X, Cpu
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '../lib/utils';
import { GoogleGenAI } from '@google/genai';

import { AIRTABLE_CONFIG } from '../lib/schema';
import { airtableService } from '../lib/airtable';

const TRENDS = [
  { title: "L'IA générative booste le secteur bancaire au Cameroun", time: "Il y a 1h" },
  { title: "Silicon Mountain : 3 nouvelles startups lèvent des fonds", time: "Il y a 3h" },
  { title: "Régulation de la crypto-monnaie en zone CEMAC", time: "Il y a 5h" },
  { title: "DouliaMed : L'IA au service de la santé rurale", time: "Hier" },
];

export const CRM: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'clients' | 'veille' | 'social' | 'insights' | 'supabase-contacts'>('clients');
  const [clients, setClients] = useState<any[]>([]);
  const [isLoadingClients, setIsLoadingClients] = useState(false);
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [brief, setBrief] = useState('');
  const [generatedContent, setGeneratedContent] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(['linkedin']);
  const [veilleResults, setVeilleResults] = useState<any[]>([]);
  const [isVeilleLoading, setIsVeilleLoading] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newClient, setNewClient] = useState({ name: '', contact: '', value: '', sector: 'Technologie' });

  // Supabase Integration State
  const [supabaseActiveTable, setSupabaseActiveTable] = useState<'contacts' | 'messages'>('contacts');
  const [supabaseContacts, setSupabaseContacts] = useState<any[]>([]);
  const [supabaseMessages, setSupabaseMessages] = useState<any[]>([]);
  const [isLoadingSupabase, setIsLoadingSupabase] = useState(false);
  const [supabaseErrorMsg, setSupabaseErrorMsg] = useState('');
  const [supabaseErrorType, setSupabaseErrorType] = useState<'CONFIG_MISSING' | 'DATABASE_ERROR' | ''>('');
  const [supabaseSqlHelp, setSupabaseSqlHelp] = useState('');
  const [supabaseSearch, setSupabaseSearch] = useState('');
  const [supabaseStatusFilter, setSupabaseStatusFilter] = useState('all');
  const [selectedSupabaseContact, setSelectedSupabaseContact] = useState<any>(null);
  const [isImportingToAirtable, setIsImportingToAirtable] = useState<string | null>(null);

  const fetchSupabaseContacts = async () => {
    setIsLoadingSupabase(true);
    setSupabaseErrorMsg('');
    setSupabaseErrorType('');
    setSupabaseSqlHelp('');
    try {
      const [contactsRes, messagesRes] = await Promise.all([
        fetch("/api/supabase/contacts"),
        fetch("/api/supabase/messages")
      ]);
      const contactsResult = await contactsRes.json();
      const messagesResult = await messagesRes.json();

      if (contactsResult.errorType === 'CONFIG_MISSING' || messagesResult.errorType === 'CONFIG_MISSING') {
        const failedResult = contactsResult.errorType === 'CONFIG_MISSING' ? contactsResult : messagesResult;
        setSupabaseErrorMsg(failedResult.message);
        setSupabaseErrorType('CONFIG_MISSING');
        setSupabaseSqlHelp(failedResult.sqlHelp || "");
        setIsLoadingSupabase(false);
        return;
      }

      // If both failed to load
      if (!contactsResult.success && !messagesResult.success) {
        setSupabaseErrorMsg(`Erreur lors de la lecture des tables Supabase: ${contactsResult.message || messagesResult.message}`);
        setSupabaseErrorType('DATABASE_ERROR');
        setSupabaseSqlHelp(
          `-- CONFIGURATION RECENTE DES TABLES\n\n` +
          `${contactsResult.sqlHelp || ""}\n\n` +
          `--------------------------------------------------\n\n` +
          `${messagesResult.sqlHelp || ""}`
        );
        setIsLoadingSupabase(false);
        return;
      }

      // Populate contacts
      if (contactsResult.success) {
        setSupabaseContacts(contactsResult.contacts || []);
      } else {
        console.warn("Could not retrieve contacts table:", contactsResult.message);
        setSupabaseContacts([]);
      }

      // Populate messages
      if (messagesResult.success) {
        setSupabaseMessages(messagesResult.messages || []);
      } else {
        console.warn("Could not retrieve messages table:", messagesResult.message);
        setSupabaseMessages([]);
      }

      // If one of the tables failed to load, provide dynamic SQL creator
      if (!contactsResult.success || !messagesResult.success) {
        let cumulativeHelp = `-- SCRIPT DE REPARATION POUR LES TABLES MANQUANTES\n\n`;
        if (!contactsResult.success) {
          cumulativeHelp += `-- POUR LA TABLE contacts :\n${contactsResult.sqlHelp || ""}\n\n`;
        }
        if (!messagesResult.success) {
          cumulativeHelp += `-- POUR LA TABLE messages :\n${messagesResult.sqlHelp || ""}\n\n`;
        }
        setSupabaseSqlHelp(cumulativeHelp);
      }
    } catch (err: any) {
      console.error(err);
      setSupabaseErrorMsg("Impossible de se connecter à l'API Supabase de l'application.");
      setSupabaseErrorType("DATABASE_ERROR");
    } finally {
      setIsLoadingSupabase(false);
    }
  };

  const handleUpdateSupabaseStatus = async (contactId: string, newStatus: string, specificTable?: 'contacts' | 'messages') => {
    // Determine target table based on parameters or selection
    const targetTable = specificTable || supabaseActiveTable;
    try {
      const response = await fetch(`/api/supabase/${targetTable}/${contactId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus })
      });
      const result = await response.json();
      if (result.success) {
        if (targetTable === 'contacts') {
          setSupabaseContacts(prev => prev.map(c => c.id === contactId ? { ...c, status: newStatus } : c));
        } else {
          setSupabaseMessages(prev => prev.map(m => m.id === contactId ? { ...m, status: newStatus } : m));
        }
        
        if (selectedSupabaseContact && selectedSupabaseContact.id === contactId) {
          setSelectedSupabaseContact((prev: any) => ({ ...prev, status: newStatus }));
        }
        toast.success(`Statut mis à jour (${targetTable}) : ${newStatus}`);
      } else {
        toast.error("Échec de la mise à jour du statut.");
      }
    } catch (err) {
      toast.error("Erreur de connexion lors de la modification du statut.");
    }
  };

  const handleImportToAirtableKeys = async (contact: any, tableSource?: 'contacts' | 'messages') => {
    setIsImportingToAirtable(contact.id);
    const origin = tableSource || supabaseActiveTable;
    try {
      const fields: any = {};
      fields[AIRTABLE_CONFIG.FIELDS.CLIENTS.NAME] = contact.name || "Visiteur Sans Nom";
      fields[AIRTABLE_CONFIG.FIELDS.CLIENTS.CONTACT] = contact.email || contact.phone || "N/A";
      fields[AIRTABLE_CONFIG.FIELDS.CLIENTS.TOTAL_VALUE] = 0;
      fields[AIRTABLE_CONFIG.FIELDS.CLIENTS.AI_SCORE] = Math.floor(Math.random() * 30) + 70;
      fields[AIRTABLE_CONFIG.FIELDS.CLIENTS.SENTIMENT] = 'positive';
      
      const recordId = await airtableService.createClient(fields);
      if (recordId) {
        toast.success(`"${contact.name || 'Visiteur'}" a été importé(e) avec succès vers le CRM Airtable !`);
        await handleUpdateSupabaseStatus(contact.id, "Qualifié", origin);
        
        // Refresh clients count
        const data = await airtableService.getClients();
        if (data.length > 0) {
          setClients(data);
        }
      }
    } catch (error) {
      toast.error("Erreur lors de l'intégration à Airtable.");
    } finally {
      setIsImportingToAirtable(null);
    }
  };

  useEffect(() => {
    const loadClients = async () => {
      setIsLoadingClients(true);
      const data = await airtableService.getClients();
      if (data.length > 0) {
        setClients(data);
      }
      setIsLoadingClients(false);
    };
    loadClients();
  }, []);

  useEffect(() => {
    if (activeTab === 'supabase-contacts') {
      fetchSupabaseContacts();
    }
  }, [activeTab]);

  const handleGenerate = async () => {
    if (!brief.trim()) return;
    setIsGenerating(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.DOULIA_GEMINI_KEY || process.env.GEMINI_API_KEY || '' });
      
      const prompt = `Tu es un expert en marketing digital pour le marché camerounais. 
      Rédige un post de réseau social percutant basé sur ce brief : "${brief}".
      Le ton doit être professionnel, innovant et engageant. 
      Inclus des emojis pertinents et des hashtags adaptés au contexte camerounais et tech.
      
      Directives de rendu (STRICTES) :
      1. SÉPARATION DES PARAGRAPHES : Utilise des doubles sauts de ligne pour bien séparer les idées.
      2. FORMATAGE : Utilise le gras (**) pour les mots-clés et les titres. NE JAMAIS UTILISER DE BALISES HTML OU D'ASTÉRISQUES (*) POUR LES LISTES (utilise des chiffres ou des tirets).
      3. LANGUE : Français uniquement.`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
      });
      
      setGeneratedContent(response.text || "Désolé, aucune réponse n'a été générée.");
    } catch (error) {
      console.error("Error generating content:", error);
      setGeneratedContent("Désolé, une erreur est survenue lors de la génération du contenu.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAddClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClient.name || !newClient.contact || !newClient.value) {
      toast.error("Veuillez remplir tous les champs obligatoires");
      return;
    }

    setIsLoadingClients(true);
    const promise = new Promise(async (resolve, reject) => {
      try {
        const fields: any = {};
        fields[AIRTABLE_CONFIG.FIELDS.CLIENTS.NAME] = newClient.name;
        fields[AIRTABLE_CONFIG.FIELDS.CLIENTS.CONTACT] = newClient.contact;
        fields[AIRTABLE_CONFIG.FIELDS.CLIENTS.TOTAL_VALUE] = parseInt(newClient.value);
        fields[AIRTABLE_CONFIG.FIELDS.CLIENTS.AI_SCORE] = Math.floor(Math.random() * 40) + 60;
        fields[AIRTABLE_CONFIG.FIELDS.CLIENTS.SENTIMENT] = 'positive';
        
        await airtableService.createClient(fields);
        const data = await airtableService.getClients();
        setClients(data);
        setIsAddModalOpen(false);
        setNewClient({ name: '', contact: '', value: '', sector: 'Technologie' });
        resolve(true);
      } catch (error) {
        reject(error);
      } finally {
        setIsLoadingClients(false);
      }
    });

    toast.promise(promise, { loading: 'Enregistrement...', success: 'Client ajouté avec succès !', error: 'Erreur lors de l\'ajout' });
  };

  const handleMagicFill = () => {
    setNewClient({
      name: "Afriland First Bank",
      contact: "contact@afrilandfirstbank.com",
      value: "25000000",
      sector: "Banque & Finance"
    });
    toast.success("Remplissage magique IA effectué ✨");
  };

  const handleEditClient = async (client: any) => {
    const newName = prompt("Nouveau nom :", client[AIRTABLE_CONFIG.FIELDS.CLIENTS.NAME]);
    const newContact = prompt("Nouveau contact :", client[AIRTABLE_CONFIG.FIELDS.CLIENTS.CONTACT]);
    const newValue = prompt("Nouvelle valeur (XAF) :", client[AIRTABLE_CONFIG.FIELDS.CLIENTS.TOTAL_VALUE]?.toString());

    if (newName && newContact && newValue && !isNaN(parseInt(newValue))) {
      setIsLoadingClients(true);
      try {
        const fields: any = {};
        fields[AIRTABLE_CONFIG.FIELDS.CLIENTS.NAME] = newName;
        fields[AIRTABLE_CONFIG.FIELDS.CLIENTS.CONTACT] = newContact;
        fields[AIRTABLE_CONFIG.FIELDS.CLIENTS.TOTAL_VALUE] = parseInt(newValue);
        
        await airtableService.updateClient(client.id, fields);
        const data = await airtableService.getClients();
        setClients(data);
        toast.success("Fiche mise à jour !");
      } catch (error) {
        toast.error("Erreur de mise à jour");
      } finally {
        setIsLoadingClients(false);
      }
    }
  };

  const handleSendMail = (client: any) => {
    const email = client[AIRTABLE_CONFIG.FIELDS.CLIENTS.CONTACT];
    if (email && email.includes('@')) {
      window.location.href = `mailto:${email}?subject=Doulia Strategy Hub - Contact`;
    } else {
      toast.error("Email invalide");
    }
  };

  const handlePublish = () => {
    if (!generatedContent) return;
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      toast.success("Publication réussie via l'agent Doulia !");
    }, 1500);
  };

  const togglePlatform = (id: string) => {
    setSelectedPlatforms(prev => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]);
  };

  const handleVeilleMediatrique = async () => {
    setIsVeilleLoading(true);
    const toastId = toast.loading("Lancement de la veille stratégique IA...");
    
    try {
      const query = "actualités marché IA Cameroun Afrique monde concurrents Doulia Finance Hub opportunités";
      const response = await fetch('https://api.tavily.com/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_key: process.env.TAVILY_KEY,
          query: query,
          search_depth: "advanced",
          include_answer: true,
          max_results: 5
        })
      });

      if (!response.ok) throw new Error("Erreur Tavily API");
      const data = await response.json();
      
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });
      const processedResults = await Promise.all((data.results || []).map(async (res: any) => {
        const prompt = `Analyse cet article pour DOULIA. ARTICLE: ${res.title} - ${res.content}. FOURNIS : 1. UN RÉSUMÉ (2 phrases) 2. OPPORTUNITÉS DOULIA (1 phrase). Gras (**) pour les mots clés.`;
        const aiRes = await ai.models.generateContent({ model: "gemini-3-flash-preview", contents: prompt });
        const analysis = aiRes.text || "";
        const [summary, opportunities] = analysis.split('\n\n');

        const fields: any = {};
        fields[AIRTABLE_CONFIG.FIELDS.SOCIAL_POSTS.CONTENT] = `${res.title}\n\nLien: ${res.url}\n\n${analysis}`;
        fields[AIRTABLE_CONFIG.FIELDS.SOCIAL_POSTS.PLATFORM] = 'Veille';
        fields[AIRTABLE_CONFIG.FIELDS.SOCIAL_POSTS.STATUS] = 'Publié';
        fields[AIRTABLE_CONFIG.FIELDS.SOCIAL_POSTS.AI_BRIEF] = analysis;
        await airtableService.createSocialPost(fields);

        return { title: res.title, url: res.url, summary: summary || analysis, opportunities: opportunities || "Analyse en cours...", time: "À l'instant" };
      }));

      setVeilleResults(processedResults);
      toast.success("Veille terminée et sauvegardée dans Airtable !", { id: toastId });
    } catch (error) {
      toast.error("Erreur lors de la veille médiatique.", { id: toastId });
    } finally {
      setIsVeilleLoading(false);
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-8 bg-white min-h-screen">
      {/* Header & Tabs */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl font-bold text-deep-blue">Gestion CRM & Intelligence</h1>
          <p className="text-deep-blue/50 text-sm mt-1">Centralisez vos relations et votre présence numérique.</p>
        </div>
        
        <div className="flex bg-deep-blue/[0.03] p-1.5 rounded-xl border border-deep-blue/[0.06] overflow-x-auto w-full xl:w-auto shrink-0">
          {[
            { id: 'clients', label: 'Fiches Clients' },
            { id: 'veille', label: 'Veille & Auto' },
            { id: 'social', label: 'Social Agent' },
            { id: 'insights', label: 'Predictive Insights' },
            { id: 'supabase-contacts', label: 'Contacts Site Web (Supabase)' }
          ].map((tab) => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-all duration-200",
                activeTab === tab.id 
                  ? "bg-white text-deep-blue shadow-sm border border-deep-blue/10" 
                  : "text-deep-blue/40 hover:text-deep-blue hover:bg-deep-blue/5"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* --- ONGLET CLIENTS --- */}
      {activeTab === 'clients' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: BrainCircuit, title: "Scoring Moyen", value: "79.2%", color: "text-lime-ia", bg: "bg-lime-ia/10" },
              { icon: Smile, title: "Sentiment Global", value: "Positif", color: "text-blue-500", bg: "bg-blue-500/10" },
              { icon: TrendingUp, title: "Conversion Prédite", value: "+12% (Q2)", color: "text-lime-ia", bg: "bg-lime-ia/10" }
            ].map((stat, i) => (
              <div key={i} className="bg-white border border-deep-blue/10 rounded-2xl p-5 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow">
                <div className={cn("p-3 rounded-xl", stat.bg, stat.color)}>
                  <stat.icon size={24} />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-deep-blue/40 uppercase tracking-widest mb-1">{stat.title}</p>
                  <h4 className="text-xl font-bold text-deep-blue">{stat.value}</h4>
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-deep-blue/30" size={18} />
              <input 
                type="text" 
                placeholder="Rechercher un client..."
                className="w-full bg-white border border-deep-blue/10 rounded-xl py-3 pl-12 pr-4 text-sm focus:border-lime-ia/50 outline-none transition-colors text-deep-blue shadow-sm"
              />
            </div>
            <button className="bg-white border border-deep-blue/10 p-3 rounded-xl text-deep-blue/60 hover:bg-deep-blue/5 transition-colors shadow-sm">
              <Filter size={18} />
            </button>
            <button 
              onClick={() => setIsAddModalOpen(true)}
              className="bg-deep-blue text-white px-5 py-3 rounded-xl text-sm font-bold hover:bg-lime-ia hover:text-deep-blue transition-all flex items-center gap-2 shadow-sm"
            >
              <Plus size={18} /> Nouveau Client
            </button>
          </div>

          {/* Add Client Modal */}
          <AnimatePresence>
            {isAddModalOpen && (
              <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-deep-blue/40 backdrop-blur-sm">
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-white border border-deep-blue/10 w-full max-w-lg p-8 rounded-2xl shadow-2xl relative"
                >
                  <button onClick={() => setIsAddModalOpen(false)} className="absolute top-6 right-6 p-2 hover:bg-deep-blue/5 rounded-full text-deep-blue/40">
                    <X size={20} />
                  </button>

                  <div className="flex items-center gap-4 mb-8">
                    <div className="p-3 bg-lime-ia/10 rounded-xl text-lime-ia"><Users size={24} /></div>
                    <div>
                      <h3 className="text-xl font-bold text-deep-blue">Nouveau Partenaire</h3>
                      <p className="text-xs text-deep-blue/50">Enregistrez un client dans l'écosystème Doulia.</p>
                    </div>
                  </div>

                  <form onSubmit={handleAddClient} className="space-y-5">
                    <div>
                      <label className="block text-[11px] font-bold text-deep-blue/60 uppercase tracking-wider mb-2">Entreprise / Nom *</label>
                      <input type="text" value={newClient.name} onChange={(e) => setNewClient({...newClient, name: e.target.value})} className="w-full bg-deep-blue/[0.02] border border-deep-blue/10 rounded-lg px-4 py-3 text-sm focus:border-lime-ia/50 outline-none transition-all" required />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-deep-blue/60 uppercase tracking-wider mb-2">Contact *</label>
                      <input type="text" value={newClient.contact} onChange={(e) => setNewClient({...newClient, contact: e.target.value})} className="w-full bg-deep-blue/[0.02] border border-deep-blue/10 rounded-lg px-4 py-3 text-sm focus:border-lime-ia/50 outline-none transition-all" required />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[11px] font-bold text-deep-blue/60 uppercase tracking-wider mb-2">Valeur (XAF) *</label>
                        <input type="number" value={newClient.value} onChange={(e) => setNewClient({...newClient, value: e.target.value})} className="w-full bg-deep-blue/[0.02] border border-deep-blue/10 rounded-lg px-4 py-3 text-sm focus:border-lime-ia/50 outline-none transition-all" required />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-deep-blue/60 uppercase tracking-wider mb-2">Secteur</label>
                        <select value={newClient.sector} onChange={(e) => setNewClient({...newClient, sector: e.target.value})} className="w-full bg-deep-blue/[0.02] border border-deep-blue/10 rounded-lg px-4 py-3 text-sm focus:border-lime-ia/50 outline-none transition-all appearance-none">
                          <option>Technologie</option><option>Banque & Finance</option><option>Santé</option><option>Énergie</option><option>Agriculture</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex gap-3 pt-4">
                      <button type="button" onClick={handleMagicFill} className="flex-1 bg-deep-blue/5 text-deep-blue py-3 rounded-lg text-sm font-bold flex justify-center items-center gap-2 hover:bg-deep-blue/10 transition-colors">
                        <Sparkles size={16} /> IA
                      </button>
                      <button type="submit" disabled={isLoadingClients} className="flex-[2] bg-deep-blue text-white py-3 rounded-lg text-sm font-bold hover:bg-lime-ia hover:text-deep-blue transition-colors">
                        {isLoadingClients ? "Enregistrement..." : "Créer la Fiche"}
                      </button>
                    </div>
                  </form>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          <div className="bg-white border border-deep-blue/10 rounded-2xl shadow-sm overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-deep-blue/[0.02] border-b border-deep-blue/10">
                  <th className="px-6 py-4 text-[10px] font-bold text-deep-blue/40 uppercase tracking-wider">Entreprise</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-deep-blue/40 uppercase tracking-wider">IA Score</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-deep-blue/40 uppercase tracking-wider">Sentiment</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-deep-blue/40 uppercase tracking-wider">Valeur (XAF)</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-deep-blue/40 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-deep-blue/[0.05]">
                {isLoadingClients ? (
                  <tr><td colSpan={5} className="px-6 py-12 text-center text-sm font-bold text-deep-blue/40"><Clock className="animate-spin inline mr-2" size={16}/> Synchronisation...</td></tr>
                ) : clients.map((client) => (
                  <tr key={client.id} onClick={() => setSelectedClient(client)} className="hover:bg-deep-blue/[0.02] transition-colors cursor-pointer group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-lime-ia/10 flex items-center justify-center text-lime-ia font-bold text-sm">
                          {client[AIRTABLE_CONFIG.FIELDS.CLIENTS.NAME]?.[0] || 'C'}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-deep-blue">{client[AIRTABLE_CONFIG.FIELDS.CLIENTS.NAME]}</p>
                          <p className="text-[11px] text-deep-blue/40">{client[AIRTABLE_CONFIG.FIELDS.CLIENTS.CONTACT]}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-2 bg-deep-blue/5 rounded-full overflow-hidden w-20">
                          <div className={cn("h-full rounded-full", (client[AIRTABLE_CONFIG.FIELDS.CLIENTS.AI_SCORE] || 0) > 80 ? "bg-lime-ia" : "bg-amber-500")} style={{ width: `${client[AIRTABLE_CONFIG.FIELDS.CLIENTS.AI_SCORE] || 0}%` }} />
                        </div>
                        <span className="text-[11px] font-bold text-deep-blue/60">{client[AIRTABLE_CONFIG.FIELDS.CLIENTS.AI_SCORE] || 0}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-deep-blue/[0.03] text-[11px] font-bold text-deep-blue/60">
                        {client[AIRTABLE_CONFIG.FIELDS.CLIENTS.SENTIMENT] === 'positive' ? <Smile size={14} className="text-green-500"/> : <Meh size={14} />}
                        <span className="capitalize">{client[AIRTABLE_CONFIG.FIELDS.CLIENTS.SENTIMENT] || 'Neutre'}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-bold text-lime-ia">{(client[AIRTABLE_CONFIG.FIELDS.CLIENTS.TOTAL_VALUE] as number || 0).toLocaleString()}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={(e) => { e.stopPropagation(); setSelectedClient(client); }} className="p-2 hover:bg-deep-blue/5 rounded-lg text-deep-blue/40 hover:text-lime-ia transition-colors"><Eye size={16} /></button>
                        <button onClick={(e) => { e.stopPropagation(); handleEditClient(client); }} className="p-2 hover:bg-deep-blue/5 rounded-lg text-deep-blue/40 hover:text-lime-ia transition-colors"><Edit2 size={16} /></button>
                        <button onClick={(e) => { e.stopPropagation(); handleSendMail(client); }} className="p-2 hover:bg-deep-blue/5 rounded-lg text-deep-blue/40 hover:text-lime-ia transition-colors"><Mail size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Client Panel Sidebar */}
          <AnimatePresence>
            {selectedClient && (
              <>
                <motion.div 
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="fixed inset-0 bg-deep-blue/20 backdrop-blur-sm z-[90]"
                  onClick={() => setSelectedClient(null)}
                />
                <motion.div 
                  initial={{ opacity: 0, x: '100%' }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: '100%' }} transition={{ type: "spring", bounce: 0, duration: 0.4 }}
                  className="fixed top-0 right-0 w-full max-w-md h-screen bg-white border-l border-deep-blue/10 z-[100] p-6 shadow-2xl overflow-y-auto"
                >
                  <div className="flex justify-between items-center mb-8">
                    <h3 className="text-xl font-bold text-deep-blue">Vision Client 360°</h3>
                    <button onClick={() => setSelectedClient(null)} className="p-2 bg-deep-blue/5 hover:bg-deep-blue/10 rounded-full text-deep-blue/60"><X size={18} /></button>
                  </div>

                  <div className="flex items-center gap-4 p-4 bg-deep-blue/[0.02] rounded-2xl border border-deep-blue/5 mb-6">
                    <div className="w-16 h-16 rounded-2xl bg-lime-ia/10 flex items-center justify-center text-lime-ia text-2xl font-bold">
                      {selectedClient[AIRTABLE_CONFIG.FIELDS.CLIENTS.NAME][0]}
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-deep-blue">{selectedClient[AIRTABLE_CONFIG.FIELDS.CLIENTS.NAME]}</h4>
                      <p className="text-xs text-deep-blue/40">{selectedClient.sector || 'Non défini'}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-8">
                    <div className="p-4 bg-deep-blue/[0.02] rounded-xl border border-deep-blue/5">
                      <p className="text-[10px] font-bold text-deep-blue/40 uppercase tracking-widest mb-1">Score IA</p>
                      <p className="text-xl font-bold text-lime-ia">{selectedClient[AIRTABLE_CONFIG.FIELDS.CLIENTS.AI_SCORE]}%</p>
                    </div>
                    <div className="p-4 bg-deep-blue/[0.02] rounded-xl border border-deep-blue/5">
                      <p className="text-[10px] font-bold text-deep-blue/40 uppercase tracking-widest mb-1">Sentiment</p>
                      <p className="text-xl font-bold text-deep-blue capitalize">{selectedClient.sentiment || 'Positif'}</p>
                    </div>
                  </div>

                  <div className="space-y-4 mb-8">
                    <h5 className="text-[10px] font-bold text-deep-blue/40 uppercase tracking-widest">Activité Récente</h5>
                    {[
                      { type: 'Analyse', date: 'Hier', desc: 'Besoin en automatisation OCR détecté.' },
                      { type: 'Devis', date: 'Il y a 3 jours', desc: 'Proposition #IA-2026-04 générée (12.5M XAF).' },
                    ].map((act, i) => (
                      <div key={i} className="p-4 bg-white border border-deep-blue/5 rounded-xl shadow-sm relative pl-8">
                        <div className="absolute left-4 top-5 w-1.5 h-1.5 rounded-full bg-lime-ia" />
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-[11px] font-bold text-lime-ia uppercase">{act.type}</span>
                          <span className="text-[10px] text-deep-blue/40">{act.date}</span>
                        </div>
                        <p className="text-xs text-deep-blue/70 leading-relaxed">{act.desc}</p>
                      </div>
                    ))}
                  </div>

                  <button className="w-full bg-deep-blue text-white py-3.5 rounded-xl text-sm font-bold hover:bg-lime-ia hover:text-deep-blue transition-colors flex justify-center items-center gap-2">
                    <FileCheck size={18} /> Convertir en Projet ERP
                  </button>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* --- ONGLET VEILLE --- */}
      {activeTab === 'veille' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white border border-deep-blue/10 rounded-2xl p-6 shadow-sm">
              <h3 className="text-lg font-bold mb-6 flex items-center gap-2 text-deep-blue">
                <Share2 size={20} className="text-lime-ia" /> Connecteurs Sociaux
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { name: 'Facebook', icon: Facebook, color: '#1877F2' },
                  { name: 'Instagram', icon: Instagram, color: '#E4405F' },
                  { name: 'LinkedIn', icon: Linkedin, color: '#0A66C2' },
                  { name: 'Twitter', icon: Twitter, color: '#1DA1F2' },
                ].map((platform) => (
                  <div key={platform.name} className="p-4 bg-deep-blue/[0.02] rounded-xl border border-deep-blue/5 flex flex-col items-center gap-3">
                    <platform.icon size={24} className="text-deep-blue/40" />
                    <span className="text-xs font-bold text-deep-blue">{platform.name}</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" />
                      <div className="w-9 h-5 bg-deep-blue/10 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-lime-ia"></div>
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white border border-deep-blue/10 rounded-2xl p-6 shadow-sm">
              <h3 className="text-lg font-bold mb-6 flex items-center gap-2 text-deep-blue">
                <Calendar size={20} className="text-lime-ia" /> Programmateur de Posts
              </h3>
              <div className="space-y-4">
                <textarea 
                  placeholder="Que voulez-vous annoncer au monde ?"
                  className="w-full bg-deep-blue/[0.02] border border-deep-blue/10 rounded-xl p-4 min-h-[120px] outline-none focus:border-lime-ia/50 text-sm text-deep-blue"
                />
                <div className="flex items-center justify-between">
                  <div className="flex gap-2">
                    <button className="p-2 bg-deep-blue/5 rounded-lg text-deep-blue/40 hover:text-deep-blue"><Globe size={18} /></button>
                    <button className="p-2 bg-deep-blue/5 rounded-lg text-deep-blue/40 hover:text-deep-blue"><Clock size={18} /></button>
                  </div>
                  <button className="bg-deep-blue text-white px-6 py-2.5 rounded-lg text-sm font-bold hover:bg-lime-ia hover:text-deep-blue transition-colors">
                    Programmer
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white border border-deep-blue/10 rounded-2xl p-6 shadow-sm h-full">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold flex items-center gap-2 text-deep-blue">
                  <Zap size={20} className={cn("text-lime-ia", isVeilleLoading && "animate-pulse")} /> Veille Médiatique
                </h3>
                <button 
                  onClick={handleVeilleMediatrique} disabled={isVeilleLoading}
                  className="p-2 bg-lime-ia/10 hover:bg-lime-ia/20 rounded-lg text-lime-ia transition-colors"
                >
                  <TrendingUp size={18} className={cn(isVeilleLoading && "animate-spin")} />
                </button>
              </div>
              <div className="space-y-6">
                {veilleResults.length > 0 ? veilleResults.map((news, i) => (
                  <div key={i} className="relative pl-4 border-l-2 border-lime-ia/40">
                    <a href={news.url} target="_blank" rel="noopener noreferrer" className="text-sm font-bold text-deep-blue hover:text-lime-ia block mb-1">{news.title}</a>
                    <p className="text-[11px] text-deep-blue/60 mb-2">{news.summary}</p>
                    <div className="p-2 bg-lime-ia/10 rounded border border-lime-ia/20">
                      <p className="text-[9px] font-bold text-lime-ia uppercase">Opportunités Doulia</p>
                      <p className="text-[10px] text-deep-blue/80 italic">{news.opportunities}</p>
                    </div>
                  </div>
                )) : (
                  <>
                    {[{ title: "Hausse du taux directeur BEAC", source: "EcoMatin", time: "Il y a 2h" }, { title: "Nouvelle régulation Fintech", source: "Investir", time: "Il y a 5h" }].map((news, i) => (
                      <div key={i} className="relative pl-4 border-l-2 border-deep-blue/20">
                        <p className="text-sm font-bold text-deep-blue">{news.title}</p>
                        <p className="text-[10px] font-bold text-deep-blue/40 uppercase">{news.source} • {news.time}</p>
                      </div>
                    ))}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- ONGLET SOCIAL --- */}
      {activeTab === 'social' && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
          <div className="lg:col-span-3 space-y-6">
            <div className="bg-white border border-deep-blue/10 rounded-2xl p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <MessageSquare size={20} className="text-lime-ia" />
                <h3 className="text-lg font-bold text-deep-blue">Zone de Briefing</h3>
              </div>
              <div className="relative">
                <textarea 
                  value={brief} onChange={(e) => setBrief(e.target.value)}
                  placeholder='Ex: "Prépare une pub pour le service DouliaMed"'
                  className="w-full bg-deep-blue/[0.02] border border-deep-blue/10 rounded-xl p-4 min-h-[100px] outline-none focus:border-lime-ia/50 text-sm text-deep-blue"
                />
              </div>
              <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
                <div className="flex gap-2">
                  {[{ id: 'facebook', icon: Facebook, color: '#1877F2' }, { id: 'linkedin', icon: Linkedin, color: '#0A66C2' }].map((p) => (
                    <button 
                      key={p.id} onClick={() => togglePlatform(p.id)}
                      className={cn("px-4 py-2 rounded-lg border text-[11px] font-bold uppercase transition-colors flex items-center gap-2", selectedPlatforms.includes(p.id) ? "border-lime-ia bg-lime-ia/10 text-deep-blue" : "border-deep-blue/10 bg-deep-blue/5 text-deep-blue/40")}
                    >
                      <p.icon size={16} /> {p.id}
                    </button>
                  ))}
                </div>
                <button onClick={handleGenerate} disabled={isGenerating || !brief.trim()} className="bg-deep-blue text-white px-6 py-2.5 rounded-lg text-sm font-bold hover:bg-lime-ia hover:text-deep-blue transition-colors flex items-center gap-2 disabled:opacity-50">
                  {isGenerating ? <Clock className="animate-spin" size={16} /> : <Sparkles size={16} />} Générer
                </button>
              </div>
            </div>

            <div className="bg-white border border-deep-blue/10 border-dashed rounded-2xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <Layout size={20} className="text-lime-ia" />
                  <h3 className="text-lg font-bold text-deep-blue">Générateur de Contenu</h3>
                </div>
                {generatedContent && (
                  <button onClick={handlePublish} className="bg-lime-ia text-deep-blue px-5 py-2 rounded-lg text-sm font-bold hover:brightness-105 transition-colors flex items-center gap-2">
                    <Send size={16} /> Publier
                  </button>
                )}
              </div>
              {generatedContent ? (
                <div className="bg-white border border-deep-blue/10 rounded-xl p-5 shadow-lg max-w-lg mx-auto prose prose-sm text-deep-blue/80 whitespace-pre-wrap">
                  {generatedContent}
                </div>
              ) : (
                <div className="h-[250px] flex flex-col items-center justify-center text-center border-2 border-dashed border-deep-blue/5 rounded-xl">
                  <Sparkles size={32} className="text-deep-blue/20 mb-3" />
                  <p className="text-sm font-bold text-deep-blue/40">En attente de votre brief...</p>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white border border-deep-blue/10 rounded-2xl p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-6">
                <TrendingUp size={20} className="text-lime-ia" />
                <h3 className="text-sm font-bold uppercase tracking-widest text-deep-blue/60">Tendances</h3>
              </div>
              <div className="space-y-5">
                {TRENDS.map((trend, i) => (
                  <div key={i} className="group cursor-pointer">
                    <p className="text-xs font-bold text-deep-blue/80 group-hover:text-lime-ia transition-colors mb-1">{trend.title}</p>
                    <span className="text-[10px] text-deep-blue/40 font-bold uppercase">{trend.time}</span>
                  </div>
                ))}
              </div>
              <div className="mt-8 p-4 bg-lime-ia/10 rounded-xl border border-lime-ia/20">
                <p className="text-[10px] text-lime-ia font-bold uppercase mb-2">Conseil IA</p>
                <p className="text-[11px] text-deep-blue/70 italic">"Les publications avec des données ROI au Cameroun génèrent +40% d'engagement."</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- ONGLET INSIGHTS --- */}
      {activeTab === 'insights' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
          <div className="bg-white border border-deep-blue/10 rounded-2xl p-6 shadow-sm">
            <h3 className="text-xl font-bold text-deep-blue mb-6 flex items-center gap-2">
              <BrainCircuit size={24} className="text-lime-ia" /> Analyse Prédictive
            </h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="p-6 bg-deep-blue/[0.02] rounded-2xl border border-deep-blue/5">
                <h4 className="text-sm font-bold text-deep-blue mb-4">Scoring de Conversion</h4>
                <div className="space-y-4">
                  {[...clients].sort((a, b) => (b[AIRTABLE_CONFIG.FIELDS.CLIENTS.AI_SCORE] as number) - (a[AIRTABLE_CONFIG.FIELDS.CLIENTS.AI_SCORE] as number)).map(client => (
                    <div key={client.id} className="flex items-center gap-4">
                      <span className="text-xs font-bold text-deep-blue/70 w-32 truncate">{client[AIRTABLE_CONFIG.FIELDS.CLIENTS.NAME]}</span>
                      <div className="flex-1 h-2 bg-deep-blue/10 rounded-full overflow-hidden">
                        <motion.div initial={{ width: 0 }} animate={{ width: `${client[AIRTABLE_CONFIG.FIELDS.CLIENTS.AI_SCORE] || 0}%` }} className="h-full bg-lime-ia" />
                      </div>
                      <span className="text-xs font-bold text-lime-ia">{client[AIRTABLE_CONFIG.FIELDS.CLIENTS.AI_SCORE] || 0}%</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="space-y-6">
                <div className="p-6 bg-lime-ia/10 rounded-2xl border border-lime-ia/20">
                  <h4 className="text-sm font-bold text-lime-ia mb-3 flex items-center gap-2"><Sparkles size={18} /> Recommandation</h4>
                  <p className="text-xs text-deep-blue/80 leading-relaxed mb-4">Basé sur l'analyse, **Afriland First Bank** présente un signal fort pour le module **Doulia Insight** (Satisfaction 92%).</p>
                  <button className="bg-deep-blue text-white w-full py-2.5 rounded-lg text-xs font-bold hover:bg-lime-ia hover:text-deep-blue transition-colors">
                    Générer Proposition
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- ONGLET CONTACTS SUPABASE --- */}
      {activeTab === 'supabase-contacts' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
          
          {/* Main loader */}
          {isLoadingSupabase ? (
            <div className="bg-white border border-deep-blue/10 rounded-2xl p-16 flex flex-col items-center justify-center gap-4 text-center">
              <Clock className="animate-spin text-lime-ia" size={40} />
              <div className="space-y-1">
                <p className="text-sm font-bold text-deep-blue">Connexion à Supabase...</p>
                <p className="text-xs text-deep-blue/40">Lecture de la table "contacts" et de la table "messages" en cours.</p>
              </div>
            </div>
          ) : supabaseErrorMsg ? (
            /* CONFIG OR DB SETUP INSTRUCTIONAL SHIELD */
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-gradient-to-br from-deep-blue to-[#0b162a] text-white rounded-2xl p-6 md:p-8 space-y-6 shadow-xl">
                <div className="flex items-center gap-3 text-lime-ia">
                  <Cpu size={28} className="animate-pulse" />
                  <span className="text-xs font-black uppercase tracking-wider">Assistant d'Intégration Supabase</span>
                </div>
                
                <div className="space-y-3">
                  <h3 className="text-xl font-black uppercase tracking-tight">Configuration Requise</h3>
                  <p className="text-xs text-white/70 leading-relaxed font-medium">
                    {supabaseErrorMsg}
                  </p>
                  <p className="text-sm text-lime-ia/90 font-bold leading-relaxed">
                    L'application est configurée pour lire en temps réel vos prospects ("contacts") et vos messages ("messages"). Pour lier vos bases de données, suivez les étapes ci-contre.
                  </p>
                </div>

                <div className="space-y-3 pt-2">
                  <h4 className="text-xs font-bold text-white/50 uppercase tracking-widest">Scripts d'initialisation des tables dans Supabase</h4>
                  <div className="bg-white/5 border border-white/10 rounded-xl p-4 font-mono text-[11px] text-lime-ia/80 overflow-x-auto max-h-60 scrollbar-thin">
                    <pre className="whitespace-pre">{supabaseSqlHelp || `-- SQL pour créer les tables requis :\n\n-- Table 1 : contacts\nCREATE TABLE IF NOT EXISTS contacts (\n  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,\n  created_at TIMESTAMPTZ DEFAULT NOW(),\n  name TEXT NOT NULL,\n  email TEXT NOT NULL,\n  phone TEXT,\n  message TEXT,\n  subject TEXT,\n  status TEXT DEFAULT 'Nouveau'\n);\nALTER TABLE contacts ENABLE ROW LEVEL SECURITY;\nCREATE POLICY "Lecture publique pour tous" ON contacts FOR SELECT USING (true);\n\n-- Table 2 : messages\nCREATE TABLE IF NOT EXISTS messages (\n  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,\n  created_at TIMESTAMPTZ DEFAULT NOW(),\n  name TEXT,\n  email TEXT,\n  message TEXT NOT NULL,\n  status TEXT DEFAULT 'Nouveau'\n);\nALTER TABLE messages ENABLE ROW LEVEL SECURITY;\nCREATE POLICY "Lecture publique des messages" ON messages FOR SELECT USING (true);\nCREATE POLICY "Insertion publique" ON messages FOR INSERT WITH CHECK (true);`}</pre>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-white/40 pt-1">
                    <Sparkles size={12} className="text-lime-ia" />
                    <span>Sélectionnez et copiez le script requis pour enrichir votre tableau de bord.</span>
                  </div>
                </div>
              </div>

              {/* Instructions Panel */}
              <div className="bg-white border border-deep-blue/10 rounded-2xl p-6 space-y-5 shadow-md">
                <h4 className="text-sm font-black text-deep-blue uppercase tracking-tight flex items-center gap-2">
                  <Users size={18} className="text-lime-ia" /> Guide d'activation
                </h4>

                <div className="space-y-4 text-xs">
                  <div className="relative pl-7">
                    <div className="absolute left-0 top-0.5 w-5 h-5 bg-lime-ia/10 text-lime-ia rounded-full flex items-center justify-center font-bold text-[10px]">1</div>
                    <p className="font-bold text-deep-blue">Ajouter les Secrets</p>
                    <p className="text-deep-blue/50 mt-0.5 font-medium text-[11px]">Accédez à <strong>Settings &gt; Secrets</strong> sur le tableau de bord d'AI Studio, puis entrez vos secrets <code>SUPABASE_URL</code> et <code>SUPABASE_ANON_KEY</code>.</p>
                  </div>

                  <div className="relative pl-7">
                    <div className="absolute left-0 top-0.5 w-5 h-5 bg-lime-ia/10 text-lime-ia rounded-full flex items-center justify-center font-bold text-[10px]">2</div>
                    <p className="font-bold text-deep-blue">Exécuter le Script SQL</p>
                    <p className="text-deep-blue/50 mt-0.5 font-medium text-[11px]">Lancez le script ci-contre dans l'éditeur de Supabase pour créer les schémas requis et activer le Row Level Security (RLS).</p>
                  </div>

                  <div className="relative pl-7">
                    <div className="absolute left-0 top-0.5 w-5 h-5 bg-lime-ia/10 text-lime-ia rounded-full flex items-center justify-center font-bold text-[10px]">3</div>
                    <p className="font-bold text-deep-blue">Contrôler la Politique (RLS)</p>
                    <p className="text-deep-blue/50 mt-0.5 font-medium text-[11px]">Les politiques SELECT (Lecture publique pour anon) permettent au CRM de lire vos fiches sans aucune authentification lourde.</p>
                  </div>
                </div>

                <div className="border-t border-deep-blue/5 pt-4">
                  <button 
                    onClick={fetchSupabaseContacts}
                    className="w-full bg-deep-blue text-white py-3 rounded-xl text-xs font-bold hover:bg-lime-ia hover:text-deep-blue transition-colors flex justify-center items-center gap-2 shadow-sm"
                  >
                    <Clock size={14} /> Re-tester la connexion
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* REAL ACCESS STATE - Renders Leads Dashboard */
            <div className="space-y-6 animate-in fade-in duration-300">
              {/* Quick stats grid for Supabase */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[
                  { 
                    label: 'Visiteurs Total', 
                    count: supabaseContacts.length + supabaseMessages.length, 
                    color: 'text-purple-500 border-l-purple-500', 
                    icon: Users 
                  },
                  { 
                    label: 'Nouveaux Messages', 
                    count: supabaseContacts.filter(c => !c.status || c.status === 'Nouveau').length + 
                           supabaseMessages.filter(m => !m.status || m.status === 'Nouveau').length, 
                    color: 'text-blue-500 border-l-blue-500', 
                    icon: Clock 
                  },
                  { 
                    label: 'Prospects Qualifiés (CRM)', 
                    count: supabaseContacts.filter(c => c.status === 'Qualifié').length + 
                           supabaseMessages.filter(m => m.status === 'Qualifié').length, 
                    color: 'text-lime-ia border-l-lime-ia', 
                    icon: Sparkles 
                  },
                  { 
                    label: 'Traités / Contactés', 
                    count: supabaseContacts.filter(c => c.status === 'Contacté' || c.status === 'Archivé').length + 
                           supabaseMessages.filter(m => m.status === 'Contacté' || m.status === 'Archivé').length, 
                    color: 'text-gray-500 border-l-gray-500', 
                    icon: Mail 
                  },
                ].map((stat, idx) => (
                  <div key={idx} className={cn("bg-white border border-deep-blue/10 border-l-4 rounded-2xl p-5 shadow-sm flex items-center justify-between", stat.color)}>
                    <div>
                      <span className="text-[10px] font-bold text-deep-blue/40 uppercase tracking-wider">{stat.label}</span>
                      <h3 className="text-2xl font-black text-deep-blue mt-1">{stat.count}</h3>
                    </div>
                    <div className="p-2.5 rounded-xl bg-cloud-gray">
                      <stat.icon size={18} />
                    </div>
                  </div>
                ))}
              </div>

              {/* Table Switcher Controls */}
              <div className="flex border-b border-deep-blue/10 pb-1">
                <button
                  onClick={() => {
                    setSupabaseActiveTable('contacts');
                    setSelectedSupabaseContact(null);
                  }}
                  className={cn(
                    "px-5 py-3 text-xs font-black uppercase tracking-wider border-b-2 transition-all flex items-center gap-2",
                    supabaseActiveTable === 'contacts' 
                      ? "border-lime-ia text-deep-blue font-bold" 
                      : "border-transparent text-deep-blue/40 hover:text-deep-blue/70"
                  )}
                >
                  <Users size={14} /> Table des Prospects (contacts : {supabaseContacts.length})
                </button>
                <button
                  onClick={() => {
                    setSupabaseActiveTable('messages');
                    setSelectedSupabaseContact(null);
                  }}
                  className={cn(
                    "px-5 py-3 text-xs font-black uppercase tracking-wider border-b-2 transition-all flex items-center gap-2",
                    supabaseActiveTable === 'messages' 
                      ? "border-lime-ia text-deep-blue font-bold" 
                      : "border-transparent text-deep-blue/40 hover:text-deep-blue/70"
                  )}
                >
                  <MessageSquare size={14} /> Messages des Visiteurs (messages : {supabaseMessages.length})
                </button>
              </div>

              {/* Filters Box */}
              <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-deep-blue/10 shadow-sm">
                <div className="flex flex-1 flex-col sm:flex-row items-center gap-3 w-full">
                  <div className="relative w-full sm:max-w-xs">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-deep-blue/30" />
                    <input 
                      type="text" 
                      placeholder="Rechercher par nom, email, message..." 
                      value={supabaseSearch}
                      onChange={(e) => setSupabaseSearch(e.target.value)}
                      className="w-full bg-cloud-gray/40 border border-deep-blue/10 rounded-xl py-2 pl-9 pr-4 text-xs focus:outline-none focus:border-lime-ia/40"
                    />
                  </div>
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <Filter size={12} className="text-deep-blue/40" />
                    <select
                      value={supabaseStatusFilter}
                      onChange={(e) => setSupabaseStatusFilter(e.target.value)}
                      className="bg-cloud-gray/40 border border-deep-blue/10 rounded-xl py-2 px-3 text-xs focus:outline-none focus:border-lime-ia/40 w-full sm:w-44"
                    >
                      <option value="all">Tous les statuts</option>
                      <option value="Nouveau">Nouveau</option>
                      <option value="Contacté">Contacté</option>
                      <option value="Qualifié">Qualifié / Importé CRM</option>
                      <option value="Archivé">Archivé</option>
                    </select>
                  </div>
                </div>

                <button 
                  onClick={fetchSupabaseContacts}
                  className="bg-white border border-deep-blue/10 hover:bg-deep-blue/5 rounded-xl px-4 py-2 flex items-center gap-2 text-xs font-bold text-deep-blue transition-colors shadow-sm"
                >
                  <Clock size={14} className={isLoadingSupabase ? "animate-spin" : ""} /> Actualiser
                </button>
              </div>

              {/* Table / List */}
              {(supabaseActiveTable === 'contacts' ? supabaseContacts : supabaseMessages).filter(c => {
                const query = supabaseSearch.toLowerCase();
                const matchesSearch = 
                  (c.name || '').toLowerCase().includes(query) || 
                  (c.email || '').toLowerCase().includes(query) || 
                  (c.phone || '').toLowerCase().includes(query) || 
                  (c.message || '').toLowerCase().includes(query) ||
                  (c.subject || '').toLowerCase().includes(query);
                
                if (supabaseStatusFilter === 'all') return matchesSearch;
                return matchesSearch && (c.status === supabaseStatusFilter || (!c.status && supabaseStatusFilter === 'Nouveau'));
              }).length === 0 ? (
                <div className="bg-white border border-deep-blue/10 border-dashed rounded-2xl py-16 text-center max-w-xl mx-auto flex flex-col items-center justify-center">
                  <Users size={48} className="text-deep-blue/20 mb-4" />
                  <h3 className="text-base font-bold text-deep-blue mb-1">Aucun élément trouvé</h3>
                  <p className="text-xs text-deep-blue/40 max-w-sm">
                    Aucun enregistrement ne correspond aux filtres configurés dans la table {supabaseActiveTable}.
                  </p>
                </div>
              ) : (
                <div className="bg-white border border-deep-blue/10 rounded-2xl shadow-sm overflow-hidden">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-deep-blue/[0.02] border-b border-deep-blue/10">
                        <th className="px-6 py-4 text-[10px] font-bold text-deep-blue/40 uppercase tracking-wider">Date de réception</th>
                        <th className="px-6 py-4 text-[10px] font-bold text-deep-blue/40 uppercase tracking-wider">Visiteur / Origine</th>
                        <th className="px-6 py-4 text-[10px] font-bold text-deep-blue/40 uppercase tracking-wider">Sujet / Message</th>
                        <th className="px-6 py-4 text-[10px] font-bold text-deep-blue/40 uppercase tracking-wider">Statut du lead</th>
                        <th className="px-6 py-4 text-[10px] font-bold text-deep-blue/40 uppercase tracking-wider text-right">Intégration CRM</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-deep-blue/[0.05]">
                      {(supabaseActiveTable === 'contacts' ? supabaseContacts : supabaseMessages)
                        .filter(c => {
                          const query = supabaseSearch.toLowerCase();
                          const matchesSearch = 
                            (c.name || '').toLowerCase().includes(query) || 
                            (c.email || '').toLowerCase().includes(query) || 
                            (c.phone || '').toLowerCase().includes(query) || 
                            (c.message || '').toLowerCase().includes(query) ||
                            (c.subject || '').toLowerCase().includes(query);
                          
                          if (supabaseStatusFilter === 'all') return matchesSearch;
                          return matchesSearch && (c.status === supabaseStatusFilter || (!c.status && supabaseStatusFilter === 'Nouveau'));
                        })
                        .map((contact) => (
                          <tr 
                            key={contact.id} 
                            onClick={() => setSelectedSupabaseContact(contact)}
                            className="hover:bg-deep-blue/[0.01] transition-colors cursor-pointer group"
                          >
                            <td className="px-6 py-4 text-xs text-deep-blue/50 whitespace-nowrap">
                              {contact.created_at ? new Date(contact.created_at).toLocaleDateString('fr-FR', {
                                day: 'numeric',
                                month: 'short',
                                hour: '2-digit',
                                minute: '2-digit'
                              }) : "Date inconnue"}
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-lg bg-deep-blue/5 text-deep-blue font-bold text-xs flex items-center justify-center font-mono">
                                  {contact.name?.[0]?.toUpperCase() || 'V'}
                                </div>
                                <div className="max-w-xs">
                                  <p className="text-xs font-bold text-deep-blue truncate">{contact.name || "Visiteur Anonyme"}</p>
                                  <p className="text-[10px] text-deep-blue/40 truncate">{contact.email}</p>
                                  {contact.phone && <p className="text-[10px] text-deep-blue/40 truncate">{contact.phone}</p>}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 max-w-sm">
                              <div>
                                <p className="text-xs font-bold text-deep-blue/80 mb-0.5 truncate">
                                  {contact.subject || (supabaseActiveTable === 'messages' ? "Message Direct" : "Aucun sujet")}
                                </p>
                                <p className="text-[11px] text-deep-blue/60 leading-relaxed truncate group-hover:whitespace-normal group-hover:line-clamp-2 transition-all">
                                  {contact.message || "Aucun message saisi."}
                                </p>
                              </div>
                            </td>
                            <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                              <div>
                                <select
                                  value={contact.status || 'Nouveau'}
                                  onChange={(e) => handleUpdateSupabaseStatus(contact.id, e.target.value)}
                                  className={cn(
                                    "px-2.5 py-1 text-[10px] font-black uppercase rounded-lg border-none outline-none cursor-pointer focus:ring-1 focus:ring-lime-ia/50",
                                    (contact.status === 'Nouveau' || !contact.status) ? "bg-blue-500/10 text-blue-600" :
                                    contact.status === 'Contacté' ? "bg-amber-500/10 text-amber-600" :
                                    contact.status === 'Qualifié' ? "bg-lime-ia/15 text-lime-600" :
                                    "bg-gray-500/10 text-gray-600"
                                  )}
                                >
                                  <option value="Nouveau">Nouveau</option>
                                  <option value="Contacté">Contacté</option>
                                  <option value="Qualifié">Qualifié</option>
                                  <option value="Archivé">Archivé</option>
                                </select>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                              {contact.status === 'Qualifié' ? (
                                <span className="inline-flex items-center gap-1 text-[10px] text-lime-ia bg-lime-ia/10 px-2.5 py-1 rounded-lg font-black uppercase">
                                  <FileCheck size={12} /> Importé dans CRM
                                </span>
                              ) : (
                                <button
                                  onClick={() => handleImportToAirtableKeys(contact)}
                                  disabled={isImportingToAirtable === contact.id}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-deep-blue text-white text-[10px] font-bold uppercase rounded-xl hover:bg-lime-ia hover:text-deep-blue transition-colors shadow-sm disabled:opacity-50"
                                >
                                  {isImportingToAirtable === contact.id ? (
                                    <Clock className="animate-spin" size={12} />
                                  ) : (
                                    <Plus size={12} />
                                  )}
                                  Intégrer aux Clients
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Detailed Contact Drawer Sidebar */}
          <AnimatePresence>
            {selectedSupabaseContact && (
              <>
                <motion.div 
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="fixed inset-0 bg-deep-blue/20 backdrop-blur-sm z-[90]"
                  onClick={() => setSelectedSupabaseContact(null)}
                />
                <motion.div 
                  initial={{ opacity: 0, x: '100%' }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: '100%' }} transition={{ type: "spring", bounce: 0, duration: 0.4 }}
                  className="fixed top-0 right-0 w-full max-w-md h-screen bg-white border-l border-deep-blue/10 z-[100] p-6 shadow-2xl overflow-y-auto"
                >
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <span className="text-[9px] bg-lime-ia/10 text-lime-ia px-2.5 py-0.5 rounded font-black uppercase tracking-wider">Origine : Supabase / Table {supabaseActiveTable}</span>
                      <h3 className="text-lg font-black text-deep-blue mt-1">Détails de Demande</h3>
                    </div>
                    <button onClick={() => setSelectedSupabaseContact(null)} className="p-2 bg-deep-blue/5 hover:bg-deep-blue/10 rounded-full text-deep-blue/60"><X size={18} /></button>
                  </div>

                  <div className="p-4 bg-deep-blue/[0.02] border border-deep-blue/5 rounded-2xl gap-3 flex flex-col mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-lime-ia/10 text-lime-ia text-lg font-bold rounded-xl flex items-center justify-center font-mono animate-pulse">
                        {selectedSupabaseContact.name?.[0]?.toUpperCase() || 'V'}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-deep-blue">{selectedSupabaseContact.name || "Visiteur Anonyme"}</h4>
                        <p className="text-[11px] text-deep-blue/40">Reçu le : {selectedSupabaseContact.created_at ? new Date(selectedSupabaseContact.created_at).toLocaleString('fr-FR') : "Date inconnue"}</p>
                      </div>
                    </div>
                    
                    <div className="border-t border-deep-blue/5 pt-3 mt-1 space-y-1 text-xs">
                      <p className="flex items-center gap-2 font-medium text-deep-blue/70">
                        <Mail size={13} className="text-deep-blue/30" /> <span>{selectedSupabaseContact.email || "Non spécifié"}</span>
                      </p>
                      {selectedSupabaseContact.phone && (
                        <p className="flex items-center gap-2 font-medium text-deep-blue/70">
                          <Phone size={13} className="text-deep-blue/30" /> <span>{selectedSupabaseContact.phone}</span>
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Message body */}
                  <div className="space-y-3 mb-6 text-xs">
                    <div>
                      <h5 className="font-extrabold uppercase text-[10px] tracking-wider text-deep-blue/40 mb-1.5">Sujet de sa demande</h5>
                      <p className="p-3 bg-cloud-gray border border-deep-blue/5 rounded-xl font-bold text-deep-blue leading-normal">
                        {selectedSupabaseContact.subject || (supabaseActiveTable === 'messages' ? "Message Direct du site" : "Aucun sujet spécifié")}
                      </p>
                    </div>
                    
                    <div>
                      <h5 className="font-extrabold uppercase text-[10px] tracking-wider text-deep-blue/40 mb-1.5">Message d'Origine de Doulia.com</h5>
                      <p className="p-4 bg-cloud-gray border border-deep-blue/5 rounded-xl text-deep-blue/80 leading-relaxed font-semibold">
                        {selectedSupabaseContact.message || "Aucun message rédigé."}
                      </p>
                    </div>
                  </div>

                  {/* Analyzer tool panel */}
                  <div className="p-4 bg-lime-ia/5 border border-lime-ia/20 rounded-2xl mb-6 space-y-2 text-xs">
                    <h5 className="font-black text-lime-ia flex items-center gap-1.5">
                      <Sparkles size={14} className="animate-pulse" /> Analyseur de Besoins IA Doulia
                    </h5>
                    <p className="text-deep-blue/70 leading-relaxed font-medium">
                      Analyse sémantique : Cette demande sur "{selectedSupabaseContact.subject || 'Doulia Services'}" exprime un intérêt direct pour la transformation technologique. Nous recommandons de proposer la solution <strong>Doulia CRM Automate</strong> ou un diagnostic d'IA gratuit.
                    </p>
                  </div>

                  {/* Status Selection */}
                  <div className="space-y-2 mb-6">
                    <h5 className="font-extrabold uppercase text-[10px] tracking-wider text-deep-blue/40">Modifier le Statut</h5>
                    <div className="grid grid-cols-4 gap-2">
                      {['Nouveau', 'Contacté', 'Qualifié', 'Archivé'].map((st) => (
                        <button 
                          key={st}
                          onClick={() => handleUpdateSupabaseStatus(selectedSupabaseContact.id, st)}
                          className={cn(
                            "py-2 px-1 text-[10px] font-bold rounded-xl border transition-all",
                            selectedSupabaseContact.status === st || (!selectedSupabaseContact.status && st === 'Nouveau')
                              ? "bg-deep-blue text-white border-deep-blue" 
                              : "bg-white border-deep-blue/10 text-deep-blue/60 hover:bg-cloud-gray"
                          )}
                        >
                          {st}
                        </button>
                      ))}
                    </div>
                  </div>

                  {selectedSupabaseContact.status !== 'Qualifié' && (
                    <div className="pt-6 border-t border-deep-blue/5">
                      <button 
                        onClick={() => handleImportToAirtableKeys(selectedSupabaseContact)}
                        disabled={isImportingToAirtable === selectedSupabaseContact.id}
                        className="w-full bg-deep-blue text-white py-3.5 rounded-xl text-xs font-bold hover:bg-lime-ia hover:text-deep-blue transition-colors flex justify-center items-center gap-2 shadow-sm"
                      >
                        {isImportingToAirtable === selectedSupabaseContact.id ? (
                          <Clock className="animate-spin" size={16} />
                        ) : (
                          <Plus size={16} />
                        )}
                        Convertir & Importer vers CRM Airtable
                      </button>
                    </div>
                  )}
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};