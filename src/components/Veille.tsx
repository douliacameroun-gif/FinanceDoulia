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
  Trash2
} from 'lucide-react';
import { airtableService } from '../lib/airtable';
import { AIRTABLE_CONFIG } from '../lib/schema';
import { cn } from '../lib/utils';
import { toast } from 'sonner';

interface VeilleItem {
  id: string;
  [key: string]: any;
}

export const Veille: React.FC = () => {
  const [items, setItems] = useState<VeilleItem[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [filter, setFilter] = useState('all');
  
  const [newItem, setNewItem] = useState({
    title: '',
    url: '',
    potential: 'Moyen',
    type: 'Article',
    status: 'À analyser',
    projectId: ''
  });

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
        [AIRTABLE_CONFIG.FIELDS.VEILLE.DATE]: new Date().toISOString().split('T')[0]
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
    if (!confirm("Supprimer cette opportunité ?")) return;
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

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-deep-blue tracking-tighter uppercase">
            Veille <span className="text-lime-ia">Stratégique</span>
          </h1>
          <p className="text-deep-blue/40 font-medium mt-1">Identifiez et capturez les opportunités business du marché camerounais.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={18} /> Nouvelle Veille
        </button>
      </div>

      {/* Grid Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'À Analyser', count: items.filter(i => i[AIRTABLE_CONFIG.FIELDS.VEILLE.STATUS] === 'À analyser').length, color: 'bg-blue-500', icon: Clock },
          { label: 'Projets Proposés', count: items.filter(i => i[AIRTABLE_CONFIG.FIELDS.VEILLE.STATUS] === 'Projet proposé').length, color: 'bg-lime-ia', icon: Sparkles },
          { label: 'Haut Potentiel', count: items.filter(i => i[AIRTABLE_CONFIG.FIELDS.VEILLE.POTENTIAL] === 'Critique' || i[AIRTABLE_CONFIG.FIELDS.VEILLE.POTENTIAL] === 'Élevé').length, color: 'bg-red-500', icon: TrendingUp },
        ].map((stat, idx) => (
          <div key={idx} className="premium-card p-6 border-l-4 border-l-current" style={{ color: stat.color.replace('bg-', '') }}>
            <div className="flex justify-between items-center mb-4">
              <div className={cn("p-2 rounded-lg bg-opacity-10", stat.color)}>
                <stat.icon size={20} />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest opacity-40">{stat.label}</span>
            </div>
            <h3 className="text-3xl font-black text-deep-blue">{stat.count}</h3>
          </div>
        ))}
      </div>

      {/* Items List */}
      <div className="premium-card overflow-hidden ai-glow">
        <div className="p-6 border-b border-deep-blue/5 bg-white/50 backdrop-blur-sm flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-deep-blue/30" />
              <input 
                type="text" 
                placeholder="Rechercher une opportunité..." 
                className="bg-cloud-gray/50 border border-deep-blue/10 rounded-xl py-2 pl-10 pr-4 text-xs focus:outline-none focus:border-lime-ia/50 w-64"
              />
            </div>
          </div>
        </div>

        <div className="divide-y divide-deep-blue/5">
          {isLoading ? (
             <div className="p-12 flex flex-col items-center justify-center gap-4 text-deep-blue/20">
               <Loader2 className="animate-spin" size={32} />
               <p className="text-xs font-bold uppercase tracking-widest">Initialisation de la veille...</p>
             </div>
          ) : items.length === 0 ? (
            <div className="p-20 text-center opacity-20">
              <Globe size={48} className="mx-auto mb-4" />
              <p className="font-bold">Aucune veille enregistrée.</p>
            </div>
          ) : items.map((item) => (
            <div key={item.id} className="p-6 hover:bg-cloud-gray/30 transition-all group">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-3">
                    <span className={cn(
                      "px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider",
                      item[AIRTABLE_CONFIG.FIELDS.VEILLE.POTENTIAL] === 'Critique' ? "bg-red-500 text-white" :
                      item[AIRTABLE_CONFIG.FIELDS.VEILLE.POTENTIAL] === 'Élevé' ? "bg-orange-500 text-white" :
                      "bg-blue-500/10 text-blue-600"
                    )}>
                      {item[AIRTABLE_CONFIG.FIELDS.VEILLE.POTENTIAL]}
                    </span>
                    <span className="text-[10px] text-deep-blue/40 font-bold uppercase tracking-widest">
                      {item[AIRTABLE_CONFIG.FIELDS.VEILLE.TYPE]}
                    </span>
                  </div>
                  
                  <h3 className="text-lg font-bold text-deep-blue group-hover:text-lime-ia transition-colors">
                    {item[AIRTABLE_CONFIG.FIELDS.VEILLE.TITLE]}
                  </h3>
                  
                  <p className="text-sm text-deep-blue/60 leading-relaxed max-w-3xl">
                    {item[AIRTABLE_CONFIG.FIELDS.VEILLE.SUMMARY] || "Analyse IA en attente..."}
                  </p>

                  <div className="flex flex-wrap items-center gap-4 text-[10px] font-bold">
                    <div className="flex items-center gap-1 text-deep-blue/30">
                      <Clock size={12} />
                      Détecté le {new Date(item[AIRTABLE_CONFIG.FIELDS.VEILLE.DATE]).toLocaleDateString()}
                    </div>
                    {item[AIRTABLE_CONFIG.FIELDS.VEILLE.URL] && (
                      <a 
                        href={item[AIRTABLE_CONFIG.FIELDS.VEILLE.URL]} 
                        target="_blank" 
                        rel="noreferrer"
                        className="flex items-center gap-1 text-lime-ia hover:underline"
                      >
                        <Globe size={12} /> Voir la source
                      </a>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-2 items-end">
                   <div className="flex bg-cloud-gray p-1 rounded-xl border border-deep-blue/5">
                      <button 
                        onClick={() => updateStatus(item.id, 'À analyser')}
                        className={cn(
                          "px-3 py-1.5 rounded-lg text-[9px] font-bold transition-all",
                          item[AIRTABLE_CONFIG.FIELDS.VEILLE.STATUS] === 'À analyser' ? "bg-white text-deep-blue shadow-sm" : "opacity-40 hover:opacity-100"
                        )}
                      >
                        Analyser
                      </button>
                      <button 
                        onClick={() => updateStatus(item.id, 'Projet proposé')}
                        className={cn(
                          "px-3 py-1.5 rounded-lg text-[9px] font-bold transition-all",
                          item[AIRTABLE_CONFIG.FIELDS.VEILLE.STATUS] === 'Projet proposé' ? "bg-white text-lime-ia shadow-sm" : "opacity-40 hover:opacity-100"
                        )}
                      >
                        Proposer
                      </button>
                   </div>
                   <button 
                    onClick={() => handleDelete(item.id)}
                    className="p-2 text-deep-blue/10 hover:text-red-500 transition-colors"
                   >
                     <Trash2 size={16} />
                   </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal */}
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
                <h3 className="text-xl font-black text-deep-blue uppercase tracking-tight">Nouvelle Exploration Business</h3>
                <p className="text-xs text-deep-blue/40 font-medium mt-1">Capturez une nouvelle opportunité pour l'écosystème Doulia.</p>
              </div>

              <form onSubmit={handleCreateVeille} className="p-6 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-deep-blue/40 ml-1">Titre de l'Opportunité</label>
                  <input 
                    type="text"
                    required
                    value={newItem.title}
                    onChange={(e) => setNewItem({...newItem, title: e.target.value})}
                    placeholder="Ex: Lancement fibre optique Douala..."
                    className="premium-input"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-deep-blue/40 ml-1">URL Source (Optionnel)</label>
                  <input 
                    type="url"
                    value={newItem.url}
                    onChange={(e) => setNewItem({...newItem, url: e.target.value})}
                    placeholder="https://"
                    className="premium-input"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-deep-blue/40 ml-1">Potentiel</label>
                    <select 
                      value={newItem.potential}
                      onChange={(e) => setNewItem({...newItem, potential: e.target.value})}
                      className="premium-input appearance-none"
                    >
                      <option value="Faible">Faible</option>
                      <option value="Moyen">Moyen</option>
                      <option value="Élevé">Élevé</option>
                      <option value="Critique">Critique</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-deep-blue/40 ml-1">Type</label>
                    <select 
                      value={newItem.type}
                      onChange={(e) => setNewItem({...newItem, type: e.target.value})}
                      className="premium-input appearance-none"
                    >
                      <option value="Article">Article</option>
                      <option value="Veille concurrentielle">Veille</option>
                      <option value="Appel d'offres">Appel d'offres</option>
                      <option value="Innovation">Innovation</option>
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
