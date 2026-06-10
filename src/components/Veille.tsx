import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  TrendingUp, 
  Globe, 
  Plus, 
  ExternalLink, 
  Sparkles, 
  AlertCircle, 
  Clock, 
  CheckCircle2, 
  Search, 
  Filter,
  ArrowRight,
  BrainCircuit,
  Loader2,
  Trash2,
  Cpu,
  FileText,
  BookmarkPlus,
  BookOpen,
  Check,
  ChevronRight,
  Zap,
  RotateCcw,
  Building,
  DollarSign
} from 'lucide-react';
import { airtableService } from '../lib/airtable';
import { AIRTABLE_CONFIG } from '../lib/schema';
import { cn } from '../lib/utils';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';

interface VeilleItem {
  id: string;
  [key: string]: any;
}

interface NewScannedOpportunity {
  title: string;
  description: string;
  sector: string;
  potential: string;
  type: string;
  url?: string;
  isSaved?: boolean;
}

export const Veille: React.FC = () => {
  // Navigation / Tabs
  const [activeTab, setActiveTab] = useState<'registered' | 'search'>('registered');
  
  // Existing data
  const [items, setItems] = useState<VeilleItem[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sectorFilter, setSectorFilter] = useState('all');
  
  // Custom new manual item form state
  const [newItem, setNewItem] = useState({
    title: '',
    url: '',
    potential: 'Moyen',
    type: 'Article',
    status: 'À analyser',
    projectId: ''
  });

  // Deep scanner inputs
  const [targetSector, setTargetSector] = useState('Finance & Fintech');
  const [additionalKeywords, setAdditionalKeywords] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [scanStep, setScanStep] = useState(0);
  const [scanResults, setScanResults] = useState<{
    reportTitle: string;
    reportMarkdown: string;
    opportunities: NewScannedOpportunity[];
    searchQuery: string;
    success: boolean;
  } | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [veilleData, projectsData] = await Promise.all([
        airtableService.getVeille(),
        airtableService.getProjects()
      ]);
      setItems(veilleData as VeilleItem[]);
      setProjects(projectsData);
    } catch (error) {
      toast.error("Échec du chargement de la veille");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateVeille = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.title) {
      toast.error("Le titre est obligatoire");
      return;
    }

    setIsSaving(true);
    try {
      const fields = {
        [AIRTABLE_CONFIG.FIELDS.VEILLE.TITLE]: newItem.title,
        [AIRTABLE_CONFIG.FIELDS.VEILLE.URL]: newItem.url,
        [AIRTABLE_CONFIG.FIELDS.VEILLE.POTENTIAL]: newItem.potential,
        [AIRTABLE_CONFIG.FIELDS.VEILLE.TYPE]: newItem.type,
        [AIRTABLE_CONFIG.FIELDS.VEILLE.STATUS]: newItem.status,
        [AIRTABLE_CONFIG.FIELDS.VEILLE.DATE]: new Date().toISOString().split('T')[0],
        [AIRTABLE_CONFIG.FIELDS.VEILLE.SUMMARY]: "Création manuelle de veille."
      };

      if (newItem.projectId) {
        (fields as any)[AIRTABLE_CONFIG.FIELDS.VEILLE.PROJECT] = [newItem.projectId];
      }

      await airtableService.createVeille(fields);
      toast.success("Opportunité ajoutée !");
      setIsModalOpen(false);
      setNewItem({ title: '', url: '', potential: 'Moyen', type: 'Article', status: 'À analyser', projectId: '' });
      loadData();
    } catch (error) {
      toast.error("Erreur lors de la création");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer cette opportunité de la veille ?")) return;
    const success = await airtableService.deleteRecord(AIRTABLE_CONFIG.TABLES.VEILLE, id);
    if (success) {
      setItems(items.filter(i => i.id !== id));
      toast.success("Opportunité supprimée");
    }
  };

  const updateStatus = async (id: string, status: string) => {
    const success = await airtableService.updateVeille(id, {
      [AIRTABLE_CONFIG.FIELDS.VEILLE.STATUS]: status
    });
    if (success) {
      setItems(items.map(i => i.id === id ? { ...i, [AIRTABLE_CONFIG.FIELDS.VEILLE.STATUS]: status } : i));
      toast.success(`Statut mis à jour : ${status}`);
    }
  };

  // Run deep web intelligence scanner
  const handleDeepScan = async () => {
    setIsScanning(true);
    setScanStep(1);
    setScanResults(null);

    // Step animation intervals to keep user updated with professional logs
    const interval1 = setTimeout(() => setScanStep(2), 2500);
    const interval2 = setTimeout(() => setScanStep(3), 5500);
    const interval3 = setTimeout(() => setScanStep(4), 8500);

    try {
      const response = await fetch('/api/ai/veille-intelligence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sector: targetSector,
          keywords: additionalKeywords
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Une erreur est survenue lors de la veille.");
      }

      const data = await response.json();
      setScanResults(data);
      toast.success("Veille intelligence terminée avec succès !");
      setScanStep(5);
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Erreur de connexion avec le serveur.");
      setScanStep(0);
    } finally {
      clearTimeout(interval1);
      clearTimeout(interval2);
      clearTimeout(interval3);
      setIsScanning(false);
    }
  };

  // Save the synthesized opportunity directly into Airtable
  const saveScannedOpportunity = async (opp: NewScannedOpportunity, index: number) => {
    try {
      const fields = {
        [AIRTABLE_CONFIG.FIELDS.VEILLE.TITLE]: opp.title,
        [AIRTABLE_CONFIG.FIELDS.VEILLE.URL]: opp.url || '',
        [AIRTABLE_CONFIG.FIELDS.VEILLE.POTENTIAL]: opp.potential || 'Élevé',
        [AIRTABLE_CONFIG.FIELDS.VEILLE.TYPE]: opp.type || 'Innovation',
        [AIRTABLE_CONFIG.FIELDS.VEILLE.STATUS]: 'À analyser',
        [AIRTABLE_CONFIG.FIELDS.VEILLE.DATE]: new Date().toISOString().split('T')[0],
        [AIRTABLE_CONFIG.FIELDS.VEILLE.SUMMARY]: opp.description
      };

      const recordId = await airtableService.createVeille(fields);
      if (recordId) {
        toast.success(`"${opp.title}" enregistrée dans Airtable !`);
        
        // Update local state to show saved icon
        if (scanResults) {
          const updatedOpps = [...scanResults.opportunities];
          updatedOpps[index] = { ...updatedOpps[index], isSaved: true };
          setScanResults({ ...scanResults, opportunities: updatedOpps });
        }
        
        // Reload main lists
        loadData();
      } else {
        toast.error("Erreur lors de l'enregistrement à Airtable");
      }
    } catch (error) {
      toast.error("Une erreur s'est produite lors de la sauvegarde.");
    }
  };

  // Sector options for easy filtering
  const sectors = [
    "Finance & Fintech",
    "Agriculture & Agrotech",
    "Santé & Healthtech",
    "Énergie & Environnement",
    "Télécoms & Transport",
    "Éducation & Services"
  ];

  const filteredItems = items.filter(item => {
    const title = item[AIRTABLE_CONFIG.FIELDS.VEILLE.TITLE] || '';
    const potential = item[AIRTABLE_CONFIG.FIELDS.VEILLE.POTENTIAL] || '';
    const description = item[AIRTABLE_CONFIG.FIELDS.VEILLE.SUMMARY] || '';
    const matchesSearch = title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          description.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (sectorFilter === 'all') return matchesSearch;
    return matchesSearch && (potential === sectorFilter || (item[AIRTABLE_CONFIG.FIELDS.VEILLE.TYPE] || '').includes(sectorFilter));
  });

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <span className="text-[10px] bg-lime-ia/10 text-lime-ia px-3 py-1 rounded-full font-black uppercase tracking-widest">
            Intelligence d'Affaires Live
          </span>
          <h1 className="text-4xl font-extrabold text-deep-blue tracking-tighter uppercase mt-2">
            VEILLE <span className="text-lime-ia">STRATÉGIQUE</span>
          </h1>
          <p className="text-deep-blue/50 text-sm font-medium mt-1">
            Détectez, analysez et capturez les opportunités de marché camerounais par IA & Web Scraping.
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex bg-white rounded-2xl p-1 border border-deep-blue/5 shadow-sm max-w-md">
          <button
            onClick={() => setActiveTab('registered')}
            className={cn(
              "flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all",
              activeTab === 'registered' 
                ? "bg-deep-blue text-white shadow-lg" 
                : "text-deep-blue/60 hover:text-deep-blue hover:bg-cloud-gray/50"
            )}
          >
            <BookOpen size={14} />
            Opportunités Actives ({items.length})
          </button>
          <button
            onClick={() => setActiveTab('search')}
            className={cn(
              "flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all",
              activeTab === 'search' 
                ? "bg-deep-blue text-white shadow-lg" 
                : "text-deep-blue/60 hover:text-deep-blue hover:bg-cloud-gray/50"
            )}
          >
            <Sparkles size={14} className="text-lime-ia animate-pulse" />
            Scanner de Marché IA
          </button>
        </div>
      </div>

      {/* Main Views */}
      <AnimatePresence mode="wait">
        {activeTab === 'registered' ? (
          <motion.div
            key="registered"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-6"
          >
            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[
                { 
                  label: 'À Analyser', 
                  count: items.filter(i => i[AIRTABLE_CONFIG.FIELDS.VEILLE.STATUS] === 'À analyser').length, 
                  color: 'text-blue-500 border-l-blue-500', 
                  icon: Clock 
                },
                { 
                  label: 'Projets Proposés', 
                  count: items.filter(i => i[AIRTABLE_CONFIG.FIELDS.VEILLE.STATUS] === 'Projet proposé').length, 
                  color: 'text-lime-ia border-l-lime-ia', 
                  icon: Sparkles 
                },
                { 
                  label: 'Opportunités Critiques', 
                  count: items.filter(i => i[AIRTABLE_CONFIG.FIELDS.VEILLE.POTENTIAL] === 'Critique').length, 
                  color: 'text-red-500 border-l-red-500', 
                  icon: TrendingUp 
                },
                { 
                  label: 'Détectées Total', 
                  count: items.length, 
                  color: 'text-purple-500 border-l-purple-500', 
                  icon: Globe 
                },
              ].map((stat, idx) => (
                <div key={idx} className={cn("premium-card p-5 border-l-4 bg-white shadow-sm flex items-center justify-between", stat.color)}>
                  <div>
                    <span className="text-[9px] font-black uppercase tracking-wider text-deep-blue/40">{stat.label}</span>
                    <h3 className="text-3xl font-black text-deep-blue mt-1">{stat.count}</h3>
                  </div>
                  <div className="p-2 rounded-xl bg-cloud-gray/40">
                    <stat.icon size={20} className="stroke-[2.5]" />
                  </div>
                </div>
              ))}
            </div>

            {/* List Controls & New Button */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-deep-blue/5 shadow-sm">
              <div className="flex flex-1 flex-col sm:flex-row items-center gap-3 w-full">
                <div className="relative w-full sm:max-w-xs">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-deep-blue/30" />
                  <input 
                    type="text" 
                    placeholder="Filtrer par mot-clé..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-cloud-gray/40 border border-deep-blue/5 rounded-xl py-2 pl-9 pr-4 text-xs focus:outline-none focus:border-lime-ia/40"
                  />
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <Filter size={12} className="text-deep-blue/40" />
                  <select
                    value={sectorFilter}
                    onChange={(e) => setSectorFilter(e.target.value)}
                    className="bg-cloud-gray/40 border border-deep-blue/5 rounded-xl py-2 px-3 text-xs focus:outline-none focus:border-lime-ia/40 w-full sm:w-44"
                  >
                    <option value="all">Tout Afficher</option>
                    <option value="Critique">Potentiel Critique</option>
                    <option value="Élevé">Potentiel Élevé</option>
                    <option value="Moyen">Potentiel Moyen</option>
                    <option value="Article">Type: Article</option>
                    <option value="Innovation">Type: Innovation</option>
                  </select>
                </div>
              </div>

              <button 
                onClick={() => setIsModalOpen(true)}
                className="btn-primary flex items-center gap-2 text-xs py-2.5 px-4 rounded-xl w-full md:w-auto justify-center"
              >
                <Plus size={16} /> Nouvelle Opportunité Manuelle
              </button>
            </div>

            {/* Items display */}
            {isLoading ? (
              <div className="premium-card p-16 flex flex-col items-center justify-center gap-4 text-center">
                <Loader2 className="animate-spin text-lime-ia" size={40} />
                <div className="space-y-1">
                  <p className="text-sm font-bold text-deep-blue">Chargement de la veille stratégique...</p>
                  <p className="text-xs text-deep-blue/40">Synchronisation des opportunités en temps réel.</p>
                </div>
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="premium-card py-20 text-center max-w-xl mx-auto flex flex-col items-center justify-center bg-white border border-dashed border-deep-blue/10">
                <Globe size={48} className="text-deep-blue/20 mb-4" />
                <h3 className="text-base font-bold text-deep-blue mb-1">Aucune veille trouvée</h3>
                <p className="text-xs text-deep-blue/40 max-w-sm mb-6">
                  Aucun résultat ne correspond à vos filtres de recherche. Utilisez le Scanner de Marché IA pour découvrir des opportunités web.
                </p>
                <button
                  onClick={() => setActiveTab('search')}
                  className="btn-primary text-xs py-2 px-4 shadow-sm flex items-center gap-2"
                >
                  <Sparkles size={14} /> Ouvrir le Scanner Live
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {filteredItems.map((item) => (
                  <motion.div 
                    layout
                    key={item.id} 
                    className="premium-card p-6 bg-white hover:shadow-md transition-all border border-deep-blue/5 hover:border-lime-ia/30 group"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
                      <div className="flex-1 space-y-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={cn(
                            "px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider",
                            item[AIRTABLE_CONFIG.FIELDS.VEILLE.POTENTIAL] === 'Critique' ? "bg-red-500/10 text-red-600" :
                            item[AIRTABLE_CONFIG.FIELDS.VEILLE.POTENTIAL] === 'Élevé' ? "bg-orange-500/10 text-orange-600" :
                            "bg-blue-500/10 text-blue-600"
                          )}>
                            Potentiel : {item[AIRTABLE_CONFIG.FIELDS.VEILLE.POTENTIAL] || 'Moyen'}
                          </span>
                          <span className="text-[9px] text-deep-blue/40 bg-cloud-gray px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                            {item[AIRTABLE_CONFIG.FIELDS.VEILLE.TYPE] || 'Innovation'}
                          </span>
                        </div>
                        
                        <h3 className="text-xl font-bold text-deep-blue group-hover:text-lime-ia transition-colors leading-tight">
                          {item[AIRTABLE_CONFIG.FIELDS.VEILLE.TITLE]}
                        </h3>
                        
                        <p className="text-xs text-deep-blue/60 leading-relaxed max-w-4xl font-medium">
                          {item[AIRTABLE_CONFIG.FIELDS.VEILLE.SUMMARY] || "Analyse IA en attente..."}
                        </p>

                        <div className="flex flex-wrap items-center gap-4 text-[10px] font-bold pt-2">
                          <div className="flex items-center gap-1.5 text-deep-blue/30">
                            <Clock size={12} />
                            Découvert le : {item[AIRTABLE_CONFIG.FIELDS.VEILLE.DATE] ? new Date(item[AIRTABLE_CONFIG.FIELDS.VEILLE.DATE]).toLocaleDateString('fr-FR') : "N/A"}
                          </div>
                          {item[AIRTABLE_CONFIG.FIELDS.VEILLE.URL] && (
                            <a 
                              href={item[AIRTABLE_CONFIG.FIELDS.VEILLE.URL]} 
                              target="_blank" 
                              rel="noreferrer"
                              className="flex items-center gap-1.5 text-lime-ia hover:underline bg-lime-ia/5 px-2.5 py-1 rounded-lg"
                            >
                              <Globe size={12} /> Consulter la Source Web <ExternalLink size={10} />
                            </a>
                          )}
                        </div>
                      </div>

                      {/* Control Panel */}
                      <div className="flex lg:flex-col gap-2 items-end justify-between lg:justify-start w-full lg:w-auto pt-4 lg:pt-0 border-t lg:border-t-0 lg:border-l border-deep-blue/5 lg:pl-6">
                        <div className="flex flex-col gap-1 items-stretch w-full lg:w-32">
                          <span className="text-[8px] text-deep-blue/30 uppercase tracking-widest font-black mb-1">État du dossier</span>
                          <div className="flex bg-cloud-gray p-1 rounded-xl border border-deep-blue/5">
                            <button 
                              onClick={() => updateStatus(item.id, 'À analyser')}
                              className={cn(
                                "flex-1 px-2.5 py-1.5 rounded-lg text-[9px] font-bold transition-all text-center",
                                item[AIRTABLE_CONFIG.FIELDS.VEILLE.STATUS] === 'À analyser' ? "bg-white text-deep-blue shadow-sm" : "opacity-40 hover:opacity-100"
                              )}
                            >
                              Analyse
                            </button>
                            <button 
                              onClick={() => updateStatus(item.id, 'Projet proposé')}
                              className={cn(
                                "flex-1 px-2.5 py-1.5 rounded-lg text-[9px] font-bold transition-all text-center",
                                item[AIRTABLE_CONFIG.FIELDS.VEILLE.STATUS] === 'Projet proposé' ? "bg-white text-lime-ia shadow-sm" : "opacity-40 hover:opacity-100"
                              )}
                            >
                              Proposer
                            </button>
                          </div>
                        </div>

                        <button 
                          onClick={() => handleDelete(item.id)}
                          className="p-2 text-deep-blue/20 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all self-end"
                          title="Supprimer la veille"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="search"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-8"
          >
            {/* Custom Interactive Sector Scanner Dashboard */}
            <div className="premium-card p-6 md:p-8 bg-white border border-deep-blue/5 shadow-md flex flex-col md:flex-row gap-8 items-center">
              <div className="flex-1 space-y-4">
                <div className="flex items-center gap-2 text-lime-ia">
                  <BrainCircuit size={24} className="animate-pulse" />
                  <span className="text-xs uppercase font-extrabold tracking-widest">Technologie Doulia DeepScan &trade;</span>
                </div>
                <h2 className="text-2xl font-black text-deep-blue tracking-tight leading-tight">
                  SCANNER LES OPPORTUNITÉS STRATÉGIQUES EN TEMPS RÉEL
                </h2>
                <p className="text-xs text-deep-blue/60 leading-relaxed font-medium">
                  Notre moteur d'intelligence utilise l'API Tavily pour indexer instantanément articles, annonces de régulation financière, innovations locales et appels d'offres au Cameroun. Notre algorithme basé sur Gemini 3.5 Flash s'occupe de synthétiser les données et de générer un rapport ultra-détaillé et des fiches d'opportunités prêtes pour de futures propositions de projets.
                </p>

                {/* Form Inputs */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black uppercase tracking-widest text-deep-blue/40 ml-1">Secteur Cible</label>
                    <select
                      value={targetSector}
                      onChange={(e) => setTargetSector(e.target.value)}
                      disabled={isScanning}
                      className="premium-input bg-cloud-gray/50 border border-deep-blue/10 rounded-xl py-2 px-3 text-xs w-full disabled:opacity-50"
                    >
                      {sectors.map((sec, i) => (
                        <option key={i} value={sec}>{sec}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black uppercase tracking-widest text-deep-blue/40 ml-1">Mots-clés Personnalisés (Optionnel)</label>
                    <input
                      type="text"
                      placeholder="Ex: Orange Money, CEMAC, Douala, Fintech..."
                      value={additionalKeywords}
                      onChange={(e) => setAdditionalKeywords(e.target.value)}
                      disabled={isScanning}
                      className="premium-input bg-cloud-gray/50 border border-deep-blue/10 rounded-xl py-2 px-3 text-xs w-full disabled:opacity-50"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    onClick={handleDeepScan}
                    disabled={isScanning}
                    className="btn-primary w-full sm:w-auto flex items-center justify-center gap-2 py-3 px-6 shadow-md shadow-lime-ia/20"
                  >
                    {isScanning ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        Recherche en cours...
                      </>
                    ) : (
                      <>
                        <Zap size={16} className="fill-current" />
                        Lancer la Recherche Strategic-Scan
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Decorative Visual Right */}
              <div className="w-full md:w-80 h-48 bg-gradient-to-br from-deep-blue to-slate-900 rounded-2xl p-6 flex flex-col justify-between relative overflow-hidden text-white shadow-xl">
                <div className="absolute top-0 right-0 w-32 h-32 bg-lime-ia/20 rounded-full blur-2xl" />
                <div className="flex justify-between items-start z-10">
                  <Building size={28} className="text-lime-ia" />
                  <span className="text-[9px] bg-white/10 opacity-80 px-2 py-0.5 rounded font-bold uppercase tracking-wider">Cameroun HQ</span>
                </div>
                <div className="space-y-1 z-10">
                  <p className="text-[10px] text-white/50 font-bold uppercase tracking-wider">Gisement Marché</p>
                  <p className="text-lg font-black tracking-tight leading-none">CEMAC & Afrique Centrale</p>
                  <p className="text-[10px] text-lime-ia font-bold">100% Connecté aux flux réels</p>
                </div>
              </div>
            </div>

            {/* Scanning Status Animation with logs */}
            {isScanning && (
              <div className="premium-card p-8 bg-white border border-deep-blue/5 text-center flex flex-col items-center justify-center gap-6 shadow-sm">
                <Loader2 className="animate-spin text-lime-ia stroke-[3]" size={48} />
                <div className="space-y-2 max-w-md">
                  <h3 className="text-lg font-bold text-deep-blue uppercase tracking-tight">Scanner Doulia en Action</h3>
                  
                  {/* Step indicators */}
                  <div className="space-y-2 pt-2">
                    {[
                      { step: 1, text: "Lancement du robot de recherche sur le web camerounais..." },
                      { step: 2, text: "Collecte de l'API web Tavily et extraction des contenus récents..." },
                      { step: 3, text: "Analyse sémantique et stratégique par Gemini 3.5-Flash..." },
                      { step: 4, text: "Formatting du rapport stratégique et calcul des scores d'impact..." }
                    ].map((stepObj) => (
                      <div 
                        key={stepObj.step}
                        className={cn(
                          "flex items-center gap-2.5 text-left text-xs font-medium pl-4 py-1 rounded-xl transition-all",
                          scanStep === stepObj.step ? "text-lime-ia bg-lime-ia/5 font-bold" :
                          scanStep > stepObj.step ? "text-deep-blue/50 line-through" : "text-deep-blue/20"
                        )}
                      >
                        {scanStep > stepObj.step ? (
                          <CheckCircle2 size={12} className="text-lime-ia" />
                        ) : scanStep === stepObj.step ? (
                          <Loader2 size={12} className="animate-spin" />
                        ) : (
                          <div className="w-3 h-3 rounded-full border border-current flex items-center justify-center text-[8px]" />
                        )}
                        <span>{stepObj.text}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Beautiful, High-Design Presentation of Scan Results */}
            {scanResults && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left Column: The Markdown Report */}
                <div className="lg:col-span-7 premium-card p-6 md:p-8 bg-white shadow-md border border-deep-blue/5 space-y-6">
                  <div className="flex items-center justify-between border-b border-deep-blue/5 pb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-lime-ia/10 text-lime-ia">
                        <FileText size={20} />
                      </div>
                      <div>
                        <span className="text-[8px] bg-cloud-gray px-2 py-0.5 rounded font-black text-deep-blue/40 uppercase tracking-widest">Rapport Expert</span>
                        <h3 className="text-lg font-black text-deep-blue leading-none mt-1">
                          {scanResults.reportTitle || "SYNTHÈSE DE VEILLE IA"}
                        </h3>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-deep-blue/40">
                      Cameroun - {new Date().toLocaleDateString('fr-FR')}
                    </span>
                  </div>

                  {/* Markdown content with styled components for stunning presentation */}
                  <div className="prose prose-slate max-w-none text-sm leading-relaxed text-deep-blue/80 scrollbar-thin max-h-[600px] overflow-y-auto pr-2">
                    <ReactMarkdown
                      components={{
                        h1: ({node, ...props}) => <h1 className="text-lg font-black text-deep-blue tracking-tight mt-6 mb-3 border-l-4 border-l-lime-ia pl-3" {...props} />,
                        h2: ({node, ...props}) => <h2 className="text-base font-black text-deep-blue tracking-tight mt-5 mb-2 border-b border-deep-blue/10 pb-1" {...props} />,
                        h3: ({node, ...props}) => <h3 className="text-sm font-bold text-deep-blue mt-4 mb-1" {...props} />,
                        p: ({node, ...props}) => <p className="text-xs text-deep-blue/75 leading-relaxed mb-3 font-medium" {...props} />,
                        ul: ({node, ...props}) => <ul className="list-disc pl-5 space-y-1 mb-3 text-deep-blue/70 text-xs font-semibold" {...props} />,
                        ol: ({node, ...props}) => <ol className="list-decimal pl-5 space-y-1 mb-3 text-deep-blue/70 text-xs font-semibold" {...props} />,
                        li: ({node, ...props}) => <li className="pl-1 leading-normal" {...props} />,
                        code: ({node, ...props}) => <code className="bg-cloud-gray px-1.5 py-0.5 rounded text-[10px] font-mono text-pink-600" {...props} />,
                        strong: ({node, ...props}) => <strong className="font-extrabold text-deep-blue" {...props} />,
                      }}
                    >
                      {scanResults.reportMarkdown}
                    </ReactMarkdown>
                  </div>
                </div>

                {/* Right Column: Detected Opportunities list */}
                <div className="lg:col-span-5 space-y-4">
                  <div className="flex items-center gap-2 px-1">
                    <TrendingUp size={16} className="text-lime-ia" />
                    <span className="text-xs font-black uppercase tracking-wider text-deep-blue">
                      Opportunités Identifiées ({scanResults.opportunities.length})
                    </span>
                  </div>

                  {scanResults.opportunities.map((opp, idx) => (
                    <div 
                      key={idx}
                      className="premium-card p-5 bg-gradient-to-r from-white to-cloud-gray/30 border border-deep-blue/5 hover:border-lime-ia/40 transition-all flex flex-col justify-between gap-4"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[8px] bg-deep-blue/5 text-deep-blue/70 font-black uppercase px-2 py-0.5 rounded">
                            {opp.sector}
                          </span>
                          <span className={cn(
                            "text-[8px] font-black uppercase px-2 py-0.5 rounded",
                            opp.potential === 'Critique' ? "bg-red-500/10 text-red-600" :
                            opp.potential === 'Élevé' ? "bg-orange-500/10 text-orange-600" :
                            "bg-blue-500/10 text-blue-600"
                          )}>
                            Impact : {opp.potential}
                          </span>
                        </div>
                        
                        <h4 className="text-sm font-bold text-deep-blue leading-tight">
                          {opp.title}
                        </h4>
                        
                        <p className="text-[11px] text-deep-blue/60 leading-normal font-medium">
                          {opp.description}
                        </p>

                        {opp.url && (
                          <a 
                            href={opp.url} 
                            target="_blank" 
                            rel="noreferrer" 
                            className="text-[9px] text-lime-ia hover:underline inline-flex items-center gap-1 font-bold"
                          >
                            <Globe size={10} /> Voir la source du Scan
                          </a>
                        )}
                      </div>

                      <div className="pt-2 border-t border-deep-blue/5 flex justify-end">
                        {opp.isSaved ? (
                          <div className="flex items-center gap-1.5 text-[10px] font-bold text-lime-ia bg-lime-ia/10 px-3 py-1.5 rounded-xl">
                            <Check size={12} className="stroke-[3]" /> Capture effectuée !
                          </div>
                        ) : (
                          <button
                            onClick={() => saveScannedOpportunity(opp, idx)}
                            className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider bg-deep-blue text-white hover:bg-lime-ia hover:text-deep-blue transition-all px-3 py-1.5 rounded-xl"
                          >
                            <BookmarkPlus size={12} /> Capturer Opportunité
                          </button>
                        )}
                      </div>
                    </div>
                  ))}

                  {/* Scan stats banner */}
                  <div className="premium-card p-5 bg-deep-blue text-white rounded-2xl flex items-center justify-between overflow-hidden relative">
                    <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-lime-ia/10 rounded-full blur-xl" />
                    <div className="space-y-1 z-10">
                      <p className="text-xs font-black uppercase tracking-wider text-lime-ia">Flux du Scan Actif</p>
                      <p className="text-[10px] opacity-70 font-medium">
                        Indexation : {scanResults.searchQuery}<br/>
                        Sources traitées : {(scanResults as any).sources?.length || 0} articles camerounais
                      </p>
                    </div>
                    <Globe size={32} className="text-white/10 z-10 animate-spin-slow" />
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Manual Opportunity Insertion Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-deep-blue/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-deep-blue/5"
            >
              <div className="p-6 border-b border-deep-blue/5 bg-cloud-gray/30">
                <div className="flex items-center gap-2">
                  <BookmarkPlus size={20} className="text-lime-ia" />
                  <h3 className="text-lg font-black text-deep-blue uppercase tracking-tight">Ajout Manuel d'Opportunité</h3>
                </div>
                <p className="text-xs text-deep-blue/40 font-medium mt-1">Insérez un nouvel événement ou opportunité détectée manuellement sur le terrain.</p>
              </div>

              <form onSubmit={handleCreateVeille} className="p-6 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-deep-blue/40 ml-1">Titre de l'Opportunité / Offre</label>
                  <input 
                    type="text"
                    required
                    value={newItem.title}
                    onChange={(e) => setNewItem({...newItem, title: e.target.value})}
                    placeholder="Ex: Refonte IA du système CRM de la SABC..."
                    className="premium-input bg-cloud-gray/30 border border-deep-blue/5 focus:border-lime-ia"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-deep-blue/40 ml-1">Lien Web Source</label>
                  <input 
                    type="url"
                    value={newItem.url}
                    onChange={(e) => setNewItem({...newItem, url: e.target.value})}
                    placeholder="https://"
                    className="premium-input bg-cloud-gray/30 border border-deep-blue/5 focus:border-lime-ia"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-deep-blue/40 ml-1">Potentiel Impact</label>
                    <select 
                      value={newItem.potential}
                      onChange={(e) => setNewItem({...newItem, potential: e.target.value})}
                      className="premium-input bg-cloud-gray/30 border border-deep-blue/5"
                    >
                      <option value="Faible">Faible</option>
                      <option value="Moyen">Moyen</option>
                      <option value="Élevé">Élevé</option>
                      <option value="Critique">Critique</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-deep-blue/40 ml-1">Type d'Opportunité</label>
                    <select 
                      value={newItem.type}
                      onChange={(e) => setNewItem({...newItem, type: e.target.value})}
                      className="premium-input bg-cloud-gray/30 border border-deep-blue/5"
                    >
                      <option value="Article">Article</option>
                      <option value="Veille concurrentielle">Veille de marché</option>
                      <option value="Appel d'offres">Appel d'offres</option>
                      <option value="Innovation">Innovation globale</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-4">
                  <button 
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 py-3 px-4 rounded-xl text-xs font-bold uppercase tracking-widest text-deep-blue/40 hover:bg-cloud-gray transition-all"
                  >
                    Annuler
                  </button>
                  <button 
                    type="submit"
                    disabled={isSaving}
                    className="btn-primary flex-1 flex items-center justify-center gap-2"
                  >
                    {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                    Enregistrer
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
