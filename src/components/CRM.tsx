import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  Filter, 
  Plus, 
  MoreVertical, 
  Mail, 
  Phone, 
  Globe, 
  Share2, 
  Calendar, 
  Zap,
  Facebook,
  Instagram,
  Linkedin,
  Twitter,
  Clock,
  MessageSquare,
  Layout,
  Send,
  Sparkles,
  TrendingUp,
  BrainCircuit,
  Smile,
  Frown,
  Meh,
  Eye,
  FileCheck,
  BarChart3
} from 'lucide-react';
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
  const [activeTab, setActiveTab] = useState<'clients' | 'veille' | 'social' | 'insights'>('clients');
  const [clients, setClients] = useState<any[]>([]);
  const [isLoadingClients, setIsLoadingClients] = useState(false);
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [brief, setBrief] = useState('');
  const [generatedContent, setGeneratedContent] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(['linkedin']);

  // Fetch clients from Airtable
  React.useEffect(() => {
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

  const handleGenerate = async () => {
    if (!brief.trim()) return;
    setIsGenerating(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.DOULIA_GEMINI_KEY || process.env.GEMINI_API_KEY || '' });
      
      const prompt = `Tu es un expert en marketing digital pour le marché camerounais. 
      Rédige un post de réseau social percutant basé sur ce brief : "${brief}".
      Le ton doit être professionnel, innovant et engageant. 
      Inclus des emojis pertinents et des hashtags adaptés au contexte camerounais et tech.`;

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

  const handleAddClient = async () => {
    const name = prompt('Nom de l\'entreprise :');
    const contact = prompt('Contact (Email/Tel) :');
    const value = prompt('Valeur estimée (XAF) :');

    if (name && contact && value) {
      setIsLoadingClients(true);
      try {
        const fields: any = {};
        fields[AIRTABLE_CONFIG.FIELDS.CLIENTS.NAME] = name;
        fields[AIRTABLE_CONFIG.FIELDS.CLIENTS.CONTACT] = contact;
        fields[AIRTABLE_CONFIG.FIELDS.CLIENTS.TOTAL_VALUE] = parseInt(value);
        fields[AIRTABLE_CONFIG.FIELDS.CLIENTS.AI_SCORE] = 50;
        fields[AIRTABLE_CONFIG.FIELDS.CLIENTS.SENTIMENT] = 'neutral';
        
        await airtableService.createClient(fields);
        
        // Reload clients
        const data = await airtableService.getClients();
        setClients(data);
      } catch (error) {
        console.error("Error creating client:", error);
        alert("Erreur lors de la création du client sur Airtable.");
      } finally {
        setIsLoadingClients(false);
      }
    }
  };

  const handleViewClient = (client: any) => {
    setSelectedClient(client);
  };

  const handleSendMail = (client: any) => {
    const email = client[AIRTABLE_CONFIG.FIELDS.CLIENTS.CONTACT];
    if (email && email.includes('@')) {
      window.location.href = `mailto:${email}?subject=Doulia Strategy Hub - Contact`;
    } else {
      alert(`Envoi d'email à ${client[AIRTABLE_CONFIG.FIELDS.CLIENTS.NAME]}... (Simulation)`);
    }
  };

  const handlePublish = () => {
    if (!generatedContent) return;
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      alert("Publication réussie sur les plateformes sélectionnées via l'agent Doulia !");
    }, 1500);
  };

  const togglePlatform = (id: string) => {
    setSelectedPlatforms(prev => 
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1>Gestion CRM & Social Media</h1>
          <p className="text-deep-blue/40 text-[12px]">Centralisez vos relations et votre présence numérique.</p>
        </div>
        
        <div className="flex bg-deep-blue/5 p-1 rounded-lg border border-deep-blue/10">
          <button 
            onClick={() => setActiveTab('clients')}
            className={cn(
              "px-3 py-1.5 rounded-md text-[11px] font-bold transition-all",
              activeTab === 'clients' ? "bg-lime-ia text-deep-blue shadow-lg shadow-lime-ia/20" : "text-deep-blue/40 hover:text-deep-blue"
            )}
          >
            Fiches Clients
          </button>
          <button 
            onClick={() => setActiveTab('veille')}
            className={cn(
              "px-3 py-1.5 rounded-md text-[11px] font-bold transition-all",
              activeTab === 'veille' ? "bg-lime-ia text-deep-blue shadow-lg shadow-lime-ia/20" : "text-deep-blue/40 hover:text-deep-blue"
            )}
          >
            Veille & Automatisation
          </button>
          <button 
            onClick={() => setActiveTab('social')}
            className={cn(
              "px-3 py-1.5 rounded-md text-[11px] font-bold transition-all",
              activeTab === 'social' ? "bg-lime-ia text-deep-blue shadow-lg shadow-lime-ia/20" : "text-deep-blue/40 hover:text-deep-blue"
            )}
          >
            Social Media Agent
          </button>
          <button 
            onClick={() => setActiveTab('insights')}
            className={cn(
              "px-3 py-1.5 rounded-md text-[11px] font-bold transition-all",
              activeTab === 'insights' ? "bg-lime-ia text-deep-blue shadow-lg shadow-lime-ia/20" : "text-deep-blue/40 hover:text-deep-blue"
            )}
          >
            Predictive Insights
          </button>
        </div>
      </div>

      {activeTab === 'clients' && (
        <div className="space-y-6">
          {/* Scoring & Sentiment Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="premium-card p-4 flex items-center gap-4">
              <div className="p-3 bg-lime-ia/10 rounded-xl text-lime-ia">
                <BrainCircuit size={24} />
              </div>
              <div>
                <p className="text-[10px] font-bold text-deep-blue/40 uppercase">Scoring Moyen</p>
                <h4 className="text-xl font-bold text-deep-blue">79.2%</h4>
              </div>
            </div>
            <div className="premium-card p-4 flex items-center gap-4">
              <div className="p-3 bg-blue-500/10 rounded-xl text-blue-500">
                <Smile size={24} />
              </div>
              <div>
                <p className="text-[10px] font-bold text-deep-blue/40 uppercase">Sentiment Global</p>
                <h4 className="text-xl font-bold text-deep-blue">Positif</h4>
              </div>
            </div>
            <div className="premium-card p-4 flex items-center gap-4">
              <div className="p-3 bg-lime-ia/10 rounded-xl text-lime-ia">
                <TrendingUp size={24} />
              </div>
              <div>
                <p className="text-[10px] font-bold text-deep-blue/40 uppercase">Conversion Prédite</p>
                <h4 className="text-xl font-bold text-deep-blue">+12% (Q2)</h4>
              </div>
            </div>
          </div>
          {/* Search & Filter */}
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-deep-blue/20" size={16} />
              <input 
                type="text" 
                placeholder="Rechercher un client..."
                className="w-full bg-pure-white border border-deep-blue/10 rounded-lg py-2 pl-10 pr-4 text-[12px] focus:border-lime-ia/50 outline-none transition-colors text-deep-blue"
              />
            </div>
            <button className="btn-secondary">
              <Filter size={16} />
            </button>
            <button 
              onClick={handleAddClient}
              className="btn-primary flex items-center gap-2"
            >
              <Plus size={16} /> Nouveau Client
            </button>
          </div>

          {/* Client Table */}
          <div className="premium-card overflow-hidden ai-glow">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-deep-blue/5 border-b border-deep-blue/5">
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-deep-blue/40">Entreprise</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-deep-blue/40">IA Score</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-deep-blue/40">Sentiment</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-deep-blue/40">Valeur (XAF)</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-deep-blue/40 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-deep-blue/5">
                {isLoadingClients ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <Clock className="animate-spin text-lime-ia" size={24} />
                        <p className="text-xs text-deep-blue/40 font-bold uppercase">Synchronisation Airtable...</p>
                      </div>
                    </td>
                  </tr>
                ) : clients.map((client) => (
                  <tr 
                    key={client.id} 
                    onClick={() => setSelectedClient(client)}
                    className={cn(
                      "hover:bg-deep-blue/[0.02] transition-colors group cursor-pointer",
                      selectedClient?.id === client.id && "bg-deep-blue/[0.05]"
                    )}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-lime-ia/10 flex items-center justify-center text-lime-ia font-bold text-xs">
                          {client[AIRTABLE_CONFIG.FIELDS.CLIENTS.NAME]?.[0] || 'C'}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-deep-blue">{client[AIRTABLE_CONFIG.FIELDS.CLIENTS.NAME] || 'Client Inconnu'}</span>
                          <span className="text-[10px] text-deep-blue/20">{client[AIRTABLE_CONFIG.FIELDS.CLIENTS.CONTACT] || 'Pas de contact'}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1 bg-deep-blue/5 rounded-full overflow-hidden w-12">
                          <div 
                            className={cn(
                              "h-full rounded-full",
                              (client[AIRTABLE_CONFIG.FIELDS.CLIENTS.AI_SCORE] as number) > 80 ? "bg-lime-ia" : (client[AIRTABLE_CONFIG.FIELDS.CLIENTS.AI_SCORE] as number) > 50 ? "bg-amber-500" : "bg-red-500"
                            )}
                            style={{ width: `${client[AIRTABLE_CONFIG.FIELDS.CLIENTS.AI_SCORE] || 0}%` }}
                          />
                        </div>
                        <span className="text-[10px] font-bold text-deep-blue/60">{client[AIRTABLE_CONFIG.FIELDS.CLIENTS.AI_SCORE] || 0}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5">
                        {client[AIRTABLE_CONFIG.FIELDS.CLIENTS.SENTIMENT] === 'positive' && <Smile size={14} className="text-green-500" />}
                        {client[AIRTABLE_CONFIG.FIELDS.CLIENTS.SENTIMENT] === 'neutral' && <Meh size={14} className="text-amber-500" />}
                        {client[AIRTABLE_CONFIG.FIELDS.CLIENTS.SENTIMENT] === 'negative' && <Frown size={14} className="text-red-500" />}
                        <span className={cn(
                          "text-[10px] font-bold uppercase",
                          client[AIRTABLE_CONFIG.FIELDS.CLIENTS.SENTIMENT] === 'positive' ? "text-green-500" : client[AIRTABLE_CONFIG.FIELDS.CLIENTS.SENTIMENT] === 'neutral' ? "text-amber-500" : "text-red-500"
                        )}>
                          {client[AIRTABLE_CONFIG.FIELDS.CLIENTS.SENTIMENT] || 'Neutre'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-bold text-lime-ia">{(client[AIRTABLE_CONFIG.FIELDS.CLIENTS.TOTAL_VALUE] as number || 0).toLocaleString()}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleViewClient(client); }}
                          className="p-2 hover:bg-deep-blue/5 rounded-lg text-deep-blue/20 hover:text-lime-ia transition-colors"
                        >
                          <Eye size={14} />
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleSendMail(client); }}
                          className="p-2 hover:bg-deep-blue/5 rounded-lg text-deep-blue/20 hover:text-lime-ia transition-colors"
                        >
                          <Mail size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Client 360 View Modal/Panel */}
          <AnimatePresence>
            {selectedClient && (
              <motion.div 
                initial={{ opacity: 0, x: 100 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 100 }}
                className="fixed top-0 right-0 w-[400px] h-screen bg-pure-white border-l border-deep-blue/10 z-[100] p-6 shadow-2xl overflow-y-auto"
              >
                <div className="flex justify-between items-center mb-8">
                  <h3 className="text-xl font-bold text-deep-blue">Vision Client 360°</h3>
                  <button onClick={() => setSelectedClient(null)} className="p-2 hover:bg-deep-blue/5 rounded-full text-deep-blue/40">
                    <Plus size={20} className="rotate-45" />
                  </button>
                </div>

                <div className="space-y-6">
                  <div className="flex items-center gap-4 p-4 bg-cloud-gray/50 rounded-2xl border border-deep-blue/5">
                    <div className="w-16 h-16 rounded-2xl bg-lime-ia/10 flex items-center justify-center text-lime-ia text-2xl font-bold">
                      {selectedClient[AIRTABLE_CONFIG.FIELDS.CLIENTS.NAME][0]}
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-deep-blue">{selectedClient[AIRTABLE_CONFIG.FIELDS.CLIENTS.NAME]}</h4>
                      <p className="text-xs text-deep-blue/40">{selectedClient.sector}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-cloud-gray/30 rounded-xl border border-deep-blue/5">
                      <p className="text-[10px] font-bold text-deep-blue/20 uppercase mb-1">IA Score</p>
                      <p className="text-lg font-bold text-lime-ia">{selectedClient[AIRTABLE_CONFIG.FIELDS.CLIENTS.AI_SCORE]}%</p>
                    </div>
                    <div className="p-3 bg-cloud-gray/30 rounded-xl border border-deep-blue/5">
                      <p className="text-[10px] font-bold text-deep-blue/20 uppercase mb-1">Sentiment</p>
                      <p className="text-lg font-bold capitalize text-deep-blue">{selectedClient.sentiment}</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h5 className="text-[10px] font-bold uppercase text-deep-blue/40 tracking-widest">Dernières Activités</h5>
                    <div className="space-y-3">
                      {[
                        { type: 'Email', date: 'Hier', desc: 'Analyse de sentiment : Besoin en automatisation OCR détecté.' },
                        { type: 'Devis', date: 'Il y a 3 jours', desc: 'Devis #IA-2026-04 généré (12.5M XAF).' },
                        { type: 'Support', date: 'Il y a 1 semaine', desc: 'Ticket résolu : Optimisation des temps de réponse API.' },
                      ].map((activity, i) => (
                        <div key={i} className="p-3 bg-cloud-gray/20 rounded-xl border border-deep-blue/5 relative pl-8">
                          <div className="absolute left-3 top-4 w-1.5 h-1.5 rounded-full bg-lime-ia" />
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-[10px] font-bold text-lime-ia uppercase">{activity.type}</span>
                            <span className="text-[9px] text-deep-blue/20">{activity.date}</span>
                          </div>
                          <p className="text-[11px] text-deep-blue/60 leading-relaxed">{activity.desc}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-6 border-t border-deep-blue/5 space-y-3">
                    <button className="btn-primary w-full py-3 flex items-center justify-center gap-2">
                      <FileCheck size={18} /> Convertir en Projet (ERP)
                    </button>
                    <button className="btn-secondary w-full py-3">
                      Générer Rapport IA
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {activeTab === 'insights' && (
        <div className="space-y-6">
          <div className="premium-card p-6 ai-glow">
            <h3 className="text-xl font-bold text-deep-blue mb-6 flex items-center gap-2">
              <BrainCircuit size={24} className="text-lime-ia" />
              Analyse Prédictive de Croissance
            </h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className="p-5 bg-cloud-gray/30 rounded-2xl border border-deep-blue/5">
                  <h4 className="text-sm font-bold text-deep-blue mb-4">Scoring de Conversion (Machine Learning)</h4>
                  <div className="space-y-4">
                    {[...clients].sort((a, b) => (b[AIRTABLE_CONFIG.FIELDS.CLIENTS.AI_SCORE] as number) - (a[AIRTABLE_CONFIG.FIELDS.CLIENTS.AI_SCORE] as number)).map(client => (
                      <div key={client.id} className="flex items-center gap-4">
                        <span className="text-xs text-deep-blue/60 w-32 truncate">{client[AIRTABLE_CONFIG.FIELDS.CLIENTS.NAME] as string}</span>
                        <div className="flex-1 h-2 bg-deep-blue/5 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${client[AIRTABLE_CONFIG.FIELDS.CLIENTS.AI_SCORE] || 0}%` }}
                            className="h-full bg-lime-ia"
                          />
                        </div>
                        <span className="text-xs font-bold text-lime-ia">{client[AIRTABLE_CONFIG.FIELDS.CLIENTS.AI_SCORE] || 0}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="space-y-6">
                <div className="p-5 bg-lime-ia/5 rounded-2xl border border-lime-ia/10">
                  <h4 className="text-sm font-bold text-lime-ia mb-3 flex items-center gap-2">
                    <Sparkles size={18} /> Recommandation Stratégique
                  </h4>
                  <p className="text-xs text-deep-blue/60 leading-relaxed mb-4">
                    Basé sur l'analyse de sentiment des 30 derniers jours, **Afriland First Bank** présente un signal d'achat fort pour le module **Doulia Insight**. 
                    Leur satisfaction actuelle est de 92% mais ils mentionnent des goulots d'étranglement dans le traitement des factures.
                  </p>
                  <button className="btn-primary w-full py-2 text-xs">
                    Générer Proposition Personnalisée
                  </button>
                </div>
                <div className="p-5 bg-cloud-gray/30 rounded-2xl border border-deep-blue/5">
                  <h4 className="text-sm font-bold text-deep-blue mb-4">Pipeline "Quote-to-Cash"</h4>
                  <div className="flex items-center justify-between p-3 bg-deep-blue/5 rounded-xl">
                    <div className="flex items-center gap-3">
                      <BarChart3 size={18} className="text-blue-500" />
                      <span className="text-xs text-deep-blue/80">Devis Acceptés</span>
                    </div>
                    <span className="text-sm font-bold text-deep-blue">4.2M XAF</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {activeTab === 'veille' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Social Connect */}
          <div className="lg:col-span-2 space-y-6">
            <div className="premium-card p-6">
              <h3 className="text-lg font-bold mb-6 flex items-center gap-2 text-deep-blue">
                <Share2 size={20} className="text-lime-ia" />
                Connecteurs Sociaux
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { name: 'Facebook', icon: Facebook, color: '#1877F2' },
                  { name: 'Instagram', icon: Instagram, color: '#E4405F' },
                  { name: 'LinkedIn', icon: Linkedin, color: '#0A66C2' },
                  { name: 'Twitter', icon: Twitter, color: '#1DA1F2' },
                ].map((platform) => (
                  <div key={platform.name} className="p-4 bg-cloud-gray/30 rounded-xl border border-deep-blue/5 flex flex-col items-center gap-3">
                    <platform.icon size={24} className="text-deep-blue/40" />
                    <span className="text-xs font-medium text-deep-blue">{platform.name}</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" />
                      <div className="w-9 h-5 bg-deep-blue/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-lime-ia"></div>
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div className="premium-card p-6">
              <h3 className="text-lg font-bold mb-6 flex items-center gap-2 text-deep-blue">
                <Calendar size={20} className="text-lime-ia" />
                Programmateur de Posts
              </h3>
              <div className="space-y-4">
                <textarea 
                  placeholder="Que voulez-vous annoncer au monde ?"
                  className="w-full bg-cloud-gray/30 border border-deep-blue/10 rounded-xl p-4 min-h-[120px] outline-none focus:border-lime-ia/50 text-sm text-deep-blue"
                />
                <div className="flex items-center justify-between">
                  <div className="flex gap-2">
                    <button className="p-2 bg-cloud-gray/50 rounded-lg text-deep-blue/40 hover:text-deep-blue transition-colors"><Globe size={18} /></button>
                    <button className="p-2 bg-cloud-gray/50 rounded-lg text-deep-blue/40 hover:text-deep-blue transition-colors"><Clock size={18} /></button>
                  </div>
                  <button className="btn-primary">
                    Programmer
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Media Monitoring */}
          <div className="space-y-6">
            <div className="premium-card p-6 h-full">
              <h3 className="text-lg font-bold mb-6 flex items-center gap-2 text-deep-blue">
                <Zap size={20} className="text-lime-ia" />
                Veille Médiatique
              </h3>
              <div className="space-y-6">
                {[
                  { title: "Hausse du taux directeur BEAC", source: "EcoMatin", time: "Il y a 2h" },
                  { title: "Nouvelle régulation Fintech", source: "Investir au Cameroun", time: "Il y a 5h" },
                  { title: "Doulia Connect v2.0 lancé", source: "Doulia News", time: "Hier" },
                ].map((news, i) => (
                  <div key={i} className="relative pl-4 border-l-2 border-lime-ia/30">
                    <p className="text-sm font-medium text-deep-blue hover:text-lime-ia cursor-pointer transition-colors">{news.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] font-bold uppercase text-deep-blue/20">{news.source}</span>
                      <span className="text-[10px] text-deep-blue/20">•</span>
                      <span className="text-[10px] text-deep-blue/20">{news.time}</span>
                    </div>
                  </div>
                ))}
                <button className="w-full py-2 text-xs font-bold text-lime-ia hover:bg-lime-ia/5 rounded-lg transition-colors">
                  Voir tout le flux
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'social' && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Agent Interface */}
          <div className="lg:col-span-3 space-y-6">
            {/* Briefing Zone */}
            <div className="premium-card p-6 ai-glow">
              <div className="flex items-center gap-2 mb-4">
                <MessageSquare size={20} className="text-lime-ia" />
                <h3 className="text-lg font-bold text-deep-blue">Zone de Briefing</h3>
              </div>
              <div className="relative">
                <textarea 
                  value={brief}
                  onChange={(e) => setBrief(e.target.value)}
                  placeholder='Ex: "Prépare une pub pour le service DouliaMed"'
                  className="w-full bg-cloud-gray/30 border border-deep-blue/10 rounded-xl p-4 min-h-[100px] outline-none focus:border-lime-ia/50 text-sm pr-12 text-deep-blue"
                />
                <button 
                  onClick={handleGenerate}
                  disabled={isGenerating || !brief.trim()}
                  className="absolute bottom-4 right-4 p-2 bg-lime-ia text-deep-blue rounded-lg hover:scale-110 transition-transform disabled:opacity-50 shadow-lg shadow-lime-ia/20"
                >
                  {isGenerating ? <Clock className="animate-spin" size={20} /> : <Sparkles size={20} />}
                </button>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <div className="flex gap-4">
                  {[
                    { id: 'facebook', icon: Facebook, color: '#1877F2' },
                    { id: 'linkedin', icon: Linkedin, color: '#0A66C2' },
                    { id: 'instagram', icon: Instagram, color: '#E4405F' },
                  ].map((p) => (
                    <button 
                      key={p.id}
                      onClick={() => togglePlatform(p.id)}
                      className={cn(
                        "p-2 rounded-lg border transition-all flex items-center gap-2",
                        selectedPlatforms.includes(p.id) 
                          ? "border-lime-ia bg-lime-ia/10 text-deep-blue" 
                          : "border-deep-blue/5 bg-cloud-gray/30 text-deep-blue/20 grayscale"
                      )}
                    >
                      <p.icon size={18} style={{ color: selectedPlatforms.includes(p.id) ? p.color : undefined }} />
                      <span className="text-[10px] font-bold uppercase">{p.id}</span>
                    </button>
                  ))}
                </div>
                <button 
                  onClick={handleGenerate}
                  disabled={isGenerating || !brief.trim()}
                  className="btn-primary flex items-center gap-2"
                >
                  <Sparkles size={16} />
                  {isGenerating ? "Génération..." : "Générer avec l'IA"}
                </button>
              </div>
            </div>

            {/* Preview Zone */}
            <div className="premium-card p-6 border-dashed border-deep-blue/10">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <Layout size={20} className="text-lime-ia" />
                  <h3 className="text-lg font-bold text-deep-blue">Générateur de Contenu</h3>
                </div>
                {generatedContent && (
                  <div className="flex gap-3">
                    <button 
                      onClick={() => {
                        alert("Publication envoyée vers Webhook Make.com !");
                      }}
                      className="btn-secondary flex items-center gap-2 border-lime-ia/50 text-lime-ia"
                    >
                      <Zap size={16} />
                      Envoyer vers Webhook
                    </button>
                    <button 
                      onClick={handlePublish}
                      className="btn-primary flex items-center gap-2"
                    >
                      <Send size={16} />
                      Lancer la Publication
                    </button>
                  </div>
                )}
              </div>

              <AnimatePresence mode="wait">
                {generatedContent ? (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-xl overflow-hidden shadow-2xl max-w-md mx-auto border border-slate-100"
                  >
                    {/* Mock Social Header */}
                    <div className="p-4 flex items-center gap-3 border-b border-gray-100">
                      <div className="w-10 h-10 rounded-full bg-deep-blue flex items-center justify-center">
                        <img src="https://i.postimg.cc/Y0nJdHW3/DOULIA_LOGO.jpg" alt="D" className="w-8 h-8 rounded-full" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900">Doulia Finance Hub</p>
                        <p className="text-[10px] text-gray-500">Sponsorisé • À l'instant</p>
                      </div>
                    </div>
                    {/* Content */}
                    <div className="p-4">
                      <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
                        {generatedContent}
                      </p>
                    </div>
                    {/* Mock Image */}
                    <div className="aspect-video bg-gray-100 flex items-center justify-center relative overflow-hidden">
                      <img 
                        src={`https://picsum.photos/seed/${brief.length}/800/450`} 
                        alt="Preview" 
                        className="w-full h-full object-cover opacity-80"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-4">
                        <p className="text-white font-bold text-lg">Doulia : L'IA au service de votre croissance.</p>
                      </div>
                    </div>
                    {/* Footer */}
                    <div className="p-3 bg-gray-50 flex justify-between items-center">
                      <div className="flex gap-4 text-gray-400">
                        <Facebook size={18} />
                        <Instagram size={18} />
                        <Linkedin size={18} />
                      </div>
                      <button className="text-xs font-bold text-blue-600 uppercase tracking-wider">En savoir plus</button>
                    </div>
                  </motion.div>
                ) : (
                  <div className="h-[300px] flex flex-col items-center justify-center text-center space-y-4 border-2 border-dashed border-deep-blue/5 rounded-2xl">
                    <div className="w-16 h-16 bg-deep-blue/5 rounded-full flex items-center justify-center text-deep-blue/10">
                      <Sparkles size={32} />
                    </div>
                    <div>
                      <p className="text-deep-blue/40 font-bold">En attente de votre brief...</p>
                      <p className="text-[10px] text-deep-blue/20">Utilisez la zone ci-dessus pour commencer.</p>
                    </div>
                  </div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Strategic Watch Sidebar */}
          <div className="space-y-6">
            <div className="premium-card p-6 ai-glow">
              <div className="flex items-center gap-2 mb-6">
                <TrendingUp size={20} className="text-lime-ia" />
                <h3 className="text-sm font-bold uppercase tracking-widest text-deep-blue/60">Tendances du jour</h3>
              </div>
              <div className="space-y-6">
                {TRENDS.map((trend, i) => (
                  <div key={i} className="group cursor-pointer">
                    <p className="text-xs font-bold text-deep-blue/80 group-hover:text-lime-ia transition-colors leading-tight mb-1">
                      {trend.title}
                    </p>
                    <span className="text-[9px] text-deep-blue/20 uppercase font-bold">{trend.time}</span>
                  </div>
                ))}
              </div>
              <div className="mt-8 p-4 bg-lime-ia/5 rounded-xl border border-lime-ia/10">
                <p className="text-[10px] text-lime-ia font-bold uppercase mb-2">Conseil IA</p>
                <p className="text-[11px] text-deep-blue/60 italic">
                  "Les publications incluant des données chiffrées sur le ROI au Cameroun génèrent 40% d'engagement supplémentaire."
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
