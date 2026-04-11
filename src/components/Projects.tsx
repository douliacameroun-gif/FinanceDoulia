import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Briefcase, MoreHorizontal, ExternalLink, CheckCircle2, Clock, AlertCircle, Users, Timer, BarChart4, Zap, Plus, Sparkles, FileText, DollarSign } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '../lib/utils';

import { AIRTABLE_CONFIG } from '../lib/schema';
import { airtableService } from '../lib/airtable';

const StatusBadge = ({ status }: { status: string }) => {
  switch (status) {
    case 'Terminé':
      return <span className="flex items-center gap-1 text-[10px] font-bold text-green-500 bg-green-500/10 px-2 py-0.5 rounded-full"><CheckCircle2 size={10} /> {status}</span>;
    case 'Bloqué':
      return <span className="flex items-center gap-1 text-[10px] font-bold text-red-500 bg-red-500/10 px-2 py-0.5 rounded-full"><AlertCircle size={10} /> {status}</span>;
    default:
      return <span className="flex items-center gap-1 text-[10px] font-bold text-lime-ia bg-lime-ia/10 px-2 py-0.5 rounded-full"><Clock size={10} /> {status}</span>;
  }
};

export const Projects: React.FC = () => {
  const [activeTab, setActiveTab] = React.useState<'list' | 'resources'>('list');
  const [projects, setProjects] = React.useState<any[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);

  // Fetch projects from Airtable
  React.useEffect(() => {
    const loadProjects = async () => {
      setIsLoading(true);
      const data = await airtableService.getProjects();
      if (data.length > 0) {
        setProjects(data);
      }
      setIsLoading(false);
    };
    loadProjects();
  }, []);

  const [isAddModalOpen, setIsAddModalOpen] = React.useState(false);
  const [newProject, setNewProject] = React.useState({
    name: '',
    client: '',
    type: 'Développement IA',
    budget: '',
    description: ''
  });

  const handleAddProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProject.name || !newProject.client || !newProject.budget) {
      toast.error("Veuillez remplir tous les champs obligatoires");
      return;
    }

    setIsLoading(true);
    const promise = new Promise(async (resolve, reject) => {
      try {
        const fields: any = {};
        fields[AIRTABLE_CONFIG.FIELDS.PROJECTS.NAME] = newProject.name;
        fields[AIRTABLE_CONFIG.FIELDS.PROJECTS.CLIENT] = [newProject.client];
        fields[AIRTABLE_CONFIG.FIELDS.PROJECTS.TYPE] = newProject.type;
        fields[AIRTABLE_CONFIG.FIELDS.PROJECTS.STATUS] = 'En cours';
        fields[AIRTABLE_CONFIG.FIELDS.PROJECTS.AI_PROGRESS] = 0;
        
        await airtableService.createProject(fields);
        const data = await airtableService.getProjects();
        setProjects(data);
        setIsAddModalOpen(false);
        setNewProject({ name: '', client: '', type: 'Développement IA', budget: '', description: '' });
        resolve(true);
      } catch (error) {
        reject(error);
      } finally {
        setIsLoading(false);
      }
    });

    toast.promise(promise, {
      loading: 'Initialisation du projet...',
      success: 'Projet créé avec succès !',
      error: 'Erreur lors de la création du projet',
    });
  };

  const handleMagicFill = () => {
    setNewProject({
      name: "Automatisation OCR & IA Générative",
      client: "recX...", // This should ideally be a real client ID from the list
      type: "Intelligence Artificielle",
      budget: "15000000",
      description: "Mise en place d'un système de lecture automatique de factures avec scoring de risque."
    });
    toast.success("Remplissage magique IA effectué ✨");
  };

  const handleViewDetails = (project: any) => {
    toast.info(`Détails : ${project[AIRTABLE_CONFIG.FIELDS.PROJECTS.NAME]} (${project[AIRTABLE_CONFIG.FIELDS.PROJECTS.AI_PROGRESS]}%)`);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1>Gestion des Projets</h1>
          <p className="text-deep-blue/40 text-[12px]">Suivi en temps réel des cycles de vie et de l'intégration IA.</p>
        </div>
        <div className="flex bg-deep-blue/5 p-1 rounded-lg border border-deep-blue/10">
          <button 
            onClick={() => setActiveTab('list')}
            className={cn(
              "px-3 py-1.5 rounded-md text-[11px] font-bold transition-all",
              activeTab === 'list' ? "bg-lime-ia text-deep-blue" : "text-deep-blue/40 hover:text-deep-blue"
            )}
          >
            Liste des Projets
          </button>
          <button 
            onClick={() => setActiveTab('resources')}
            className={cn(
              "px-3 py-1.5 rounded-md text-[11px] font-bold transition-all",
              activeTab === 'resources' ? "bg-lime-ia text-deep-blue" : "text-deep-blue/40 hover:text-deep-blue"
            )}
          >
            Allocation Ressources
          </button>
        </div>
      </div>

      {activeTab === 'list' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button 
              onClick={() => setIsAddModalOpen(true)}
              className="btn-primary flex items-center gap-2"
            >
              <Briefcase size={18} /> Nouveau Projet
            </button>
          </div>

          {/* Add Project Modal */}
          <AnimatePresence>
            {isAddModalOpen && (
              <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-deep-blue/40 backdrop-blur-sm">
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="premium-card w-full max-w-lg p-8 shadow-2xl relative"
                >
                  <button 
                    onClick={() => setIsAddModalOpen(false)}
                    className="absolute top-6 right-6 p-2 hover:bg-deep-blue/5 rounded-full text-deep-blue/40"
                  >
                    <Plus size={20} className="rotate-45" />
                  </button>

                  <div className="flex items-center gap-3 mb-8">
                    <div className="p-3 bg-lime-ia/10 rounded-2xl text-lime-ia">
                      <Briefcase size={24} />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-deep-blue">Lancer un Projet</h3>
                      <p className="text-xs text-deep-blue/40">Définissez les paramètres de votre nouvelle mission IA.</p>
                    </div>
                  </div>

                  <form onSubmit={handleAddProject} className="space-y-6">
                    <div className="grid grid-cols-1 gap-6">
                      <div>
                        <label className="premium-label">Nom du Projet *</label>
                        <input 
                          type="text"
                          value={newProject.name}
                          onChange={(e) => setNewProject({...newProject, name: e.target.value})}
                          className="premium-input"
                          placeholder="Ex: Optimisation Supply Chain IA"
                          required
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="premium-label">Client (Lien Airtable) *</label>
                          <input 
                            type="text"
                            value={newProject.client}
                            onChange={(e) => setNewProject({...newProject, client: e.target.value})}
                            className="premium-input"
                            placeholder="ID du client"
                            required
                          />
                        </div>
                        <div>
                          <label className="premium-label">Type de Projet</label>
                          <select 
                            value={newProject.type}
                            onChange={(e) => setNewProject({...newProject, type: e.target.value})}
                            className="premium-input appearance-none"
                          >
                            <option>Développement IA</option>
                            <option>Audit Stratégique</option>
                            <option>Cloud & Infra</option>
                            <option>Formation</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="premium-label">Budget Estimé (XAF) *</label>
                          <div className="relative">
                            <DollarSign size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-deep-blue/30" />
                            <input 
                              type="number"
                              value={newProject.budget}
                              onChange={(e) => setNewProject({...newProject, budget: e.target.value})}
                              className="premium-input pl-10"
                              placeholder="0"
                              required
                            />
                          </div>
                        </div>
                        <div>
                          <label className="premium-label">Priorité</label>
                          <div className="flex bg-cloud-gray/50 p-1 rounded-lg border border-deep-blue/10">
                            <button type="button" className="flex-1 py-1.5 rounded-md text-[10px] font-bold bg-lime-ia text-deep-blue">Haute</button>
                            <button type="button" className="flex-1 py-1.5 rounded-md text-[10px] font-bold text-deep-blue/40">Moyenne</button>
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="premium-label">Description / Brief</label>
                        <div className="relative">
                          <FileText size={14} className="absolute left-4 top-4 text-deep-blue/30" />
                          <textarea 
                            value={newProject.description}
                            onChange={(e) => setNewProject({...newProject, description: e.target.value})}
                            className="premium-input pl-10 min-h-[80px] resize-none"
                            placeholder="Objectifs principaux du projet..."
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-3 pt-4">
                      <button 
                        type="button"
                        onClick={handleMagicFill}
                        className="btn-secondary flex-1 flex items-center justify-center gap-2"
                      >
                        <Sparkles size={16} /> Magic Fill
                      </button>
                      <button 
                        type="submit"
                        disabled={isLoading}
                        className="btn-primary flex-1"
                      >
                        {isLoading ? "Initialisation..." : "Lancer le Projet"}
                      </button>
                    </div>
                  </form>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          <div className="premium-card overflow-hidden ai-glow">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-deep-blue/5 border-b border-deep-blue/5">
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-deep-blue/40">Nom du Projet</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-deep-blue/40">Client</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-deep-blue/40">Statut</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-deep-blue/40">Equipe / Temps</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-deep-blue/40">Progression IA</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-deep-blue/40 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-deep-blue/5">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <Clock className="animate-spin text-lime-ia" size={24} />
                        <p className="text-xs text-deep-blue/40 font-bold uppercase">Synchronisation Airtable...</p>
                      </div>
                    </td>
                  </tr>
                ) : projects.map((project) => (
                  <tr key={project.id} className="hover:bg-deep-blue/[0.02] transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-deep-blue">{project[AIRTABLE_CONFIG.FIELDS.PROJECTS.NAME] || 'Projet sans nom'}</span>
                      <span className="text-[10px] text-deep-blue/20">{project[AIRTABLE_CONFIG.FIELDS.PROJECTS.TYPE] || 'Standard'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-deep-blue/60">{project[AIRTABLE_CONFIG.FIELDS.PROJECTS.CLIENT]?.[0] || 'Client non lié'}</td>
                  <td className="px-6 py-4">
                    <StatusBadge status={project[AIRTABLE_CONFIG.FIELDS.PROJECTS.STATUS] || 'En attente'} />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1.5 text-deep-blue/40">
                        <Users size={12} className="text-lime-ia/60" />
                        <span className="text-[10px] font-bold">{project.team || 0}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-deep-blue/40">
                        <Timer size={12} className="text-lime-ia/60" />
                        <span className="text-[10px] font-bold">{project.hours || 0}h</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3 w-32">
                      <div className="flex-1 h-1 bg-deep-blue/5 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${project[AIRTABLE_CONFIG.FIELDS.PROJECTS.AI_PROGRESS] || 0}%` }}
                          className={cn(
                            "h-full rounded-full",
                            project[AIRTABLE_CONFIG.FIELDS.PROJECTS.AI_PROGRESS] === 100 ? "bg-green-500" : "bg-lime-ia"
                          )}
                        />
                      </div>
                      <span className="text-[10px] font-bold text-deep-blue/40">{project[AIRTABLE_CONFIG.FIELDS.PROJECTS.AI_PROGRESS] || 0}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button 
                        onClick={() => handleViewDetails(project)}
                        className="p-2 hover:bg-deep-blue/5 rounded-lg text-deep-blue/20 hover:text-lime-ia transition-colors"
                      >
                        <ExternalLink size={16} />
                      </button>
                      <button 
                        onClick={() => handleViewDetails(project)}
                        className="p-2 hover:bg-deep-blue/5 rounded-lg text-deep-blue/20 hover:text-deep-blue transition-colors"
                      >
                        <MoreHorizontal size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      )}

      {activeTab === 'resources' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 premium-card p-6 ai-glow">
            <h3 className="text-lg font-bold text-deep-blue mb-8 flex items-center gap-2">
              <BarChart4 size={20} className="text-lime-ia" />
              Charge de Travail par Expert IA
            </h3>
            <div className="space-y-6">
              {[
                { name: 'Dr. Samuel Eto\'o (Data Scientist)', load: 85, tasks: 4 },
                { name: 'Ing. Marie Curie (ML Engineer)', load: 45, tasks: 2 },
                { name: 'Dev. Steve Jobs (Fullstack)', load: 95, tasks: 6 },
                { name: 'Arch. Nikola Tesla (Cloud)', load: 20, tasks: 1 },
              ].map((expert, i) => (
                <div key={i} className="p-4 bg-cloud-gray/30 rounded-xl border border-deep-blue/5 group hover:border-lime-ia/30 transition-all">
                  <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-lime-ia/10 flex items-center justify-center text-lime-ia font-bold text-[10px]">
                        {expert.name.split(' ')[1][0]}
                      </div>
                      <span className="text-sm font-bold text-deep-blue">{expert.name}</span>
                    </div>
                    <span className={cn(
                      "text-[10px] font-bold px-2 py-0.5 rounded-full",
                      expert.load > 90 ? "bg-red-500/10 text-red-500" : expert.load > 70 ? "bg-amber-500/10 text-amber-500" : "bg-green-500/10 text-green-500"
                    )}>
                      {expert.load}% Charge
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-deep-blue/5 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${expert.load}%` }}
                      className={cn(
                        "h-full rounded-full",
                        expert.load > 90 ? "bg-red-500" : expert.load > 70 ? "bg-amber-500" : "bg-lime-ia"
                      )}
                    />
                  </div>
                  <div className="mt-2 flex justify-between text-[9px] text-deep-blue/20 font-bold uppercase">
                    <span>{expert.tasks} Projets Actifs</span>
                    <span>Disponibilité : {100 - expert.load}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="premium-card p-6 bg-lime-ia/5 border-lime-ia/20 ai-glow">
            <h3 className="text-xs font-bold mb-6 text-lime-ia uppercase tracking-widest">Rentabilité Projets</h3>
            <div className="space-y-6">
              <div className="text-center py-6">
                <div className="text-3xl font-bold text-deep-blue mb-1">24.5M XAF</div>
                <p className="text-[10px] text-deep-blue/40 uppercase font-bold">Valeur Totale du Pipeline</p>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-deep-blue/5 rounded-xl">
                  <div className="flex items-center gap-2">
                    <Zap size={14} className="text-lime-ia" />
                    <span className="text-[11px] text-deep-blue/60">Marge Moyenne</span>
                  </div>
                  <span className="text-[11px] font-bold text-deep-blue">42%</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-deep-blue/5 rounded-xl">
                  <div className="flex items-center gap-2">
                    <Clock size={14} className="text-lime-ia" />
                    <span className="text-[11px] text-deep-blue/60">Temps Moyen / Phase</span>
                  </div>
                  <span className="text-[11px] font-bold text-deep-blue">14j</span>
                </div>
              </div>
              <p className="text-[10px] text-deep-blue/40 italic text-center">
                Optimisation IA suggérée pour réduire le temps de dev de 15%.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
