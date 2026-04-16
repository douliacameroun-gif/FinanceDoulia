import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  TrendingUp, 
  Calendar, 
  DollarSign, 
  Zap,
  Printer,
  Download,
  Filter,
  Plus,
  Users, 
  Timer,
  Sparkles,
  Loader2,
  MoreVertical,
  Search
} from 'lucide-react';
import { airtableService } from '../lib/airtable';
import { AIRTABLE_CONFIG } from '../lib/schema';
import { cn } from '../lib/utils';
import { toast } from 'sonner';

interface Task {
  id: string;
  [key: string]: any;
}

export const Tasks: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '',
    projectId: '',
    dueDate: new Date().toISOString().split('T')[0],
    status: 'À faire',
    priority: 'Moyenne'
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [tasksData, projectsData] = await Promise.all([
        airtableService.getTasks(),
        airtableService.getProjects()
      ]);
      setTasks(tasksData as Task[]);
      setProjects(projectsData);
    } catch (error) {
      toast.error("Erreur lors du chargement des tâches");
    } finally {
      setIsLoading(false);
    }
  };

  const calculatePriorityScore = (task: Task) => {
    const project = projects.find(p => p.id === task[AIRTABLE_CONFIG.FIELDS.TASKS.PROJECT]?.[0]);
    const budget = project ? (project[AIRTABLE_CONFIG.FIELDS.PROJECTS.BUDGET] || 0) : 0;
    
    // Budget weight: 1 point per 1M XAF
    const budgetScore = budget / 1000000;
    
    // Urgency weight: Days remaining
    const dueDate = new Date(task[AIRTABLE_CONFIG.FIELDS.TASKS.DUE_DATE]);
    const today = new Date();
    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    // Urgency score: 50 points if due today, decreasing as days increase
    const urgencyScore = Math.max(0, 50 - diffDays);
    
    const totalScore = Math.min(100, budgetScore + urgencyScore);
    return Math.round(totalScore);
  };

  const sortedTasks = [...tasks].sort((a, b) => {
    return calculatePriorityScore(b) - calculatePriorityScore(a);
  });

  const handlePrint = () => {
    window.print();
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.title || !newTask.projectId) {
      toast.error("Veuillez remplir tous les champs obligatoires");
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch(`/api/airtable/${AIRTABLE_CONFIG.TABLES.TASKS}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fields: {
            [AIRTABLE_CONFIG.FIELDS.TASKS.TITLE]: newTask.title,
            [AIRTABLE_CONFIG.FIELDS.TASKS.PROJECT]: [newTask.projectId],
            [AIRTABLE_CONFIG.FIELDS.TASKS.DUE_DATE]: newTask.dueDate,
            [AIRTABLE_CONFIG.FIELDS.TASKS.STATUS]: newTask.status,
            [AIRTABLE_CONFIG.FIELDS.TASKS.PRIORITY]: newTask.priority,
          }
        })
      });

      if (response.ok) {
        toast.success("Tâche créée avec succès !");
        setIsModalOpen(false);
        setNewTask({
          title: '',
          projectId: '',
          dueDate: new Date().toISOString().split('T')[0],
          status: 'À faire',
          priority: 'Moyenne'
        });
        loadData();
      } else {
        throw new Error("Erreur lors de la création");
      }
    } catch (error) {
      toast.error("Échec de la création de la tâche");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8 p-8 max-w-7xl mx-auto print:p-0">
      {/* Print Only Header */}
      <div className="hidden print:block text-center mb-12 border-b-2 border-deep-blue pb-6">
        <h1 className="text-3xl font-black uppercase tracking-widest">Plan d'Action Hebdomadaire</h1>
        <p className="text-sm font-bold text-deep-blue/60 mt-2">Généré par Doulia Finance Hub • {new Date().toLocaleDateString()}</p>
      </div>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 print:hidden">
        <div>
          <h1 className="text-4xl font-black text-deep-blue tracking-tighter uppercase">
            Plan d'Action <span className="text-lime-ia">IA</span>
          </h1>
          <p className="text-deep-blue/40 font-medium mt-1">Gérez vos priorités stratégiques avec l'algorithme Doulia.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={handlePrint}
            className="btn-secondary flex items-center gap-2"
          >
            <Printer size={18} /> Imprimer
          </button>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus size={18} /> Nouvelle Tâche
          </button>
        </div>
      </div>

      {/* New Task Modal */}
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
                <h3 className="text-xl font-black text-deep-blue uppercase tracking-tight">Nouvelle Tâche Stratégique</h3>
                <p className="text-xs text-deep-blue/40 font-medium mt-1">Définissez un nouvel objectif pour l'écosystème Doulia.</p>
              </div>

              <form onSubmit={handleCreateTask} className="p-6 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-deep-blue/40 ml-1">Titre de la mission</label>
                  <input 
                    type="text"
                    required
                    value={newTask.title}
                    onChange={(e) => setNewTask({...newTask, title: e.target.value})}
                    placeholder="Ex: Analyse de marché Douala..."
                    className="w-full bg-cloud-gray/50 border border-deep-blue/10 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-lime-ia transition-all"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-deep-blue/40 ml-1">Projet Associé</label>
                    <select 
                      required
                      value={newTask.projectId}
                      onChange={(e) => setNewTask({...newTask, projectId: e.target.value})}
                      className="w-full bg-cloud-gray/50 border border-deep-blue/10 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-lime-ia transition-all appearance-none"
                    >
                      <option value="">Sélectionner...</option>
                      {projects.map(p => (
                        <option key={p.id} value={p.id}>{p[AIRTABLE_CONFIG.FIELDS.PROJECTS.NAME]}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-deep-blue/40 ml-1">Échéance</label>
                    <input 
                      type="date"
                      required
                      value={newTask.dueDate}
                      onChange={(e) => setNewTask({...newTask, dueDate: e.target.value})}
                      className="w-full bg-cloud-gray/50 border border-deep-blue/10 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-lime-ia transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-deep-blue/40 ml-1">Statut Initial</label>
                    <select 
                      value={newTask.status}
                      onChange={(e) => setNewTask({...newTask, status: e.target.value})}
                      className="w-full bg-cloud-gray/50 border border-deep-blue/10 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-lime-ia transition-all appearance-none"
                    >
                      <option value="À faire">À faire</option>
                      <option value="En cours">En cours</option>
                      <option value="Terminé">Terminé</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-deep-blue/40 ml-1">Priorité</label>
                    <select 
                      value={newTask.priority}
                      onChange={(e) => setNewTask({...newTask, priority: e.target.value})}
                      className="w-full bg-cloud-gray/50 border border-deep-blue/10 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-lime-ia transition-all appearance-none"
                    >
                      <option value="Basse">Basse</option>
                      <option value="Moyenne">Moyenne</option>
                      <option value="Haute">Haute</option>
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
                    className="flex-1 py-3 px-4 rounded-xl text-xs font-bold uppercase tracking-widest bg-lime-ia text-deep-blue hover:brightness-110 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                    {isSaving ? 'Création...' : 'Créer la Tâche'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 print:hidden">
        <div className="premium-card p-6 border-l-4 border-lime-ia">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-lime-ia/10 rounded-lg text-lime-ia">
              <Zap size={20} />
            </div>
            <span className="text-[10px] font-bold text-lime-ia uppercase tracking-widest">Priorité Haute</span>
          </div>
          <h3 className="text-2xl font-bold text-deep-blue">
            {tasks.filter(t => calculatePriorityScore(t) > 70).length}
          </h3>
          <p className="text-xs text-deep-blue/40 font-medium">Tâches à traiter immédiatement</p>
        </div>

        <div className="premium-card p-6 border-l-4 border-deep-blue/20">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-deep-blue/5 rounded-lg text-deep-blue/40">
              <Clock size={20} />
            </div>
            <span className="text-[10px] font-bold text-deep-blue/40 uppercase tracking-widest">En Cours</span>
          </div>
          <h3 className="text-2xl font-bold text-deep-blue">
            {tasks.filter(t => t[AIRTABLE_CONFIG.FIELDS.TASKS.STATUS] === 'En cours').length}
          </h3>
          <p className="text-xs text-deep-blue/40 font-medium">Opérations actives sur le terrain</p>
        </div>

        <div className="premium-card p-6 border-l-4 border-green-500/20">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-green-500/10 rounded-lg text-green-500">
              <CheckCircle2 size={20} />
            </div>
            <span className="text-[10px] font-bold text-green-500 uppercase tracking-widest">Terminé</span>
          </div>
          <h3 className="text-2xl font-bold text-deep-blue">
            {tasks.filter(t => t[AIRTABLE_CONFIG.FIELDS.TASKS.STATUS] === 'Terminé').length}
          </h3>
          <p className="text-xs text-deep-blue/40 font-medium">Objectifs atteints ce mois</p>
        </div>
      </div>

      {/* Task List */}
      <div className="premium-card overflow-hidden ai-glow">
        <div className="p-6 border-b border-deep-blue/5 flex items-center justify-between bg-white/50 backdrop-blur-sm print:hidden">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-deep-blue/30" />
              <input 
                type="text" 
                placeholder="Rechercher une tâche..." 
                className="bg-cloud-gray/50 border border-deep-blue/10 rounded-xl py-2 pl-10 pr-4 text-xs focus:outline-none focus:border-lime-ia/50 w-64"
              />
            </div>
            <div className="flex bg-cloud-gray/50 p-1 rounded-xl border border-deep-blue/10">
              {['all', 'todo', 'done'].map((t) => (
                <button
                  key={t}
                  onClick={() => setFilter(t)}
                  className={cn(
                    "px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all",
                    filter === t ? "bg-white text-deep-blue shadow-sm" : "text-deep-blue/40 hover:text-deep-blue"
                  )}
                >
                  {t === 'all' ? 'Toutes' : t === 'todo' ? 'À faire' : 'Terminées'}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-deep-blue/5 border-b border-deep-blue/5">
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-deep-blue/40">Tâche & Projet</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-deep-blue/40">Échéance</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-deep-blue/40">Score IA</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-deep-blue/40">Statut</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-deep-blue/40 text-right print:hidden">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-deep-blue/5">
              {isLoading ? (
                Array(5).fill(0).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-6 py-6"><div className="h-4 bg-deep-blue/5 rounded w-48" /></td>
                    <td className="px-6 py-6"><div className="h-4 bg-deep-blue/5 rounded w-24" /></td>
                    <td className="px-6 py-6"><div className="h-4 bg-deep-blue/5 rounded w-16" /></td>
                    <td className="px-6 py-6"><div className="h-4 bg-deep-blue/5 rounded w-20" /></td>
                    <td className="px-6 py-6"><div className="h-4 bg-deep-blue/5 rounded w-8 ml-auto" /></td>
                  </tr>
                ))
              ) : sortedTasks.map((task) => {
                const score = calculatePriorityScore(task);
                const project = projects.find(p => p.id === task[AIRTABLE_CONFIG.FIELDS.TASKS.PROJECT]?.[0]);
                
                return (
                  <tr key={task.id} className="hover:bg-deep-blue/[0.02] transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-deep-blue">{task[AIRTABLE_CONFIG.FIELDS.TASKS.TITLE]}</span>
                          {score > 80 && (
                            <span className="flex items-center gap-1 px-2 py-0.5 bg-lime-ia/10 text-lime-ia text-[8px] font-black uppercase rounded-full border border-lime-ia/20">
                              <Sparkles size={8} /> Recommandation IA
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-deep-blue/40 font-medium">
                          Projet: {project ? project[AIRTABLE_CONFIG.FIELDS.PROJECTS.NAME] : 'N/A'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-xs text-deep-blue/60">
                        <Calendar size={12} className="text-lime-ia" />
                        {new Date(task[AIRTABLE_CONFIG.FIELDS.TASKS.DUE_DATE]).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-16 h-1.5 bg-deep-blue/5 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${score}%` }}
                            className={cn(
                              "h-full rounded-full",
                              score > 80 ? "bg-red-500" : score > 50 ? "bg-lime-ia" : "bg-deep-blue/20"
                            )}
                          />
                        </div>
                        <span className="text-[10px] font-black text-deep-blue/40">{score}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                        task[AIRTABLE_CONFIG.FIELDS.TASKS.STATUS] === 'Terminé' ? "bg-green-500/10 text-green-500" :
                        task[AIRTABLE_CONFIG.FIELDS.TASKS.STATUS] === 'En cours' ? "bg-lime-ia/10 text-lime-ia" :
                        "bg-deep-blue/5 text-deep-blue/40"
                      )}>
                        {task[AIRTABLE_CONFIG.FIELDS.TASKS.STATUS]}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right print:hidden">
                      <button className="p-2 hover:bg-deep-blue/5 rounded-lg text-deep-blue/20 hover:text-deep-blue transition-colors">
                        <MoreVertical size={16} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer / Disclaimer */}
      <div className="text-center space-y-2 opacity-30 print:mt-12">
        <p className="text-[10px] font-black uppercase tracking-[0.3em]">Doulia Priority Algorithm v2.4</p>
        <p className="text-[8px] font-medium">Calculé dynamiquement selon le ROI projet et l'urgence temporelle.</p>
      </div>
    </div>
  );
};
