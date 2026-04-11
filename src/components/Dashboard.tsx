import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { TrendingUp, Users, Briefcase, Wallet, ArrowUpRight, ArrowDownRight, FileText, Clock, Calendar as CalendarIcon, RefreshCw, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '../lib/utils';

import { AIRTABLE_CONFIG } from '../lib/schema';
import { airtableService } from '../lib/airtable';

const StatCard = ({ title, value, change, icon: Icon, trend, isLoading }: any) => (
  <motion.div 
    whileHover={{ y: -5 }}
    className="premium-card p-4 ai-glow"
  >
    <div className="flex justify-between items-start mb-3">
      <div className="p-2 bg-lime-ia/10 rounded-lg text-lime-ia">
        <Icon size={20} />
      </div>
      <div className={cn(
        "flex items-center gap-1 text-[11px] font-medium px-1.5 py-0.5 rounded",
        trend === 'up' ? "bg-green-500/10 text-green-600" : "bg-red-500/10 text-red-600"
      )}>
        {trend === 'up' ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
        {change}
      </div>
    </div>
    <p className="text-deep-blue/40 text-[11px] font-medium uppercase tracking-wider mb-1">{title}</p>
    <h3 className="text-xl font-bold text-deep-blue">{isLoading ? '...' : value}</h3>
  </motion.div>
);

export const Dashboard: React.FC = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [stats, setStats] = useState({
    mrr: 0,
    clients: 0,
    invoices: 0,
    projects: 0
  });
  const [isLoading, setIsLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<{success: boolean, message: string} | null>(null);

  useEffect(() => {
    const loadDashboardData = async () => {
      setIsLoading(true);
      
      // Test connection first
      const status = await airtableService.testConnection();
      setConnectionStatus(status);
      
      const [clients, projects, invoices, budgets] = await Promise.all([
        airtableService.getClients(),
        airtableService.getProjects(),
        airtableService.getInvoices(),
        airtableService.getBudgets()
      ]);

      const latestBudget = budgets[0] || {};
      
      setStats({
        mrr: latestBudget[AIRTABLE_CONFIG.FIELDS.BUDGETS.TOTAL_REVENUE] as number || 0,
        clients: clients.length,
        invoices: invoices.filter(inv => inv[AIRTABLE_CONFIG.FIELDS.INVOICES.STATUS] === 'Brouillon').length,
        projects: projects.filter(p => p[AIRTABLE_CONFIG.FIELDS.PROJECTS.STATUS] === 'En cours').length
      });
      setIsLoading(false);
    };

    loadDashboardData();
    
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).format(date);
  };

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).format(date);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Welcome Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1>Tableau de Bord Stratégique</h1>
            {connectionStatus && (
              <div className={cn(
                "flex items-center gap-2 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider",
                connectionStatus.success ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"
              )}>
                <div className={cn("w-1 h-1 rounded-full", connectionStatus.success ? "bg-green-500 animate-pulse" : "bg-red-500")} />
                {connectionStatus.success ? "Airtable Connecté" : "Erreur Airtable"}
              </div>
            )}
          </div>
          <div className="flex items-center gap-4 mt-1">
            <div className="flex items-center gap-2 text-lime-ia text-[11px] font-medium">
              <CalendarIcon size={14} />
              <span className="capitalize">{formatDate(currentTime)}</span>
            </div>
            <div className="flex items-center gap-2 text-deep-blue/40 text-[11px] font-mono">
              <Clock size={14} className="text-lime-ia/40" />
              <span>{formatTime(currentTime)}</span>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => {
              const loadDashboardData = async () => {
                setIsLoading(true);
                const status = await airtableService.testConnection();
                setConnectionStatus(status);
                const [clients, projects, invoices, budgets] = await Promise.all([
                  airtableService.getClients(),
                  airtableService.getProjects(),
                  airtableService.getInvoices(),
                  airtableService.getBudgets()
                ]);
                const latestBudget = budgets[0] || {};
                setStats({
                  mrr: latestBudget[AIRTABLE_CONFIG.FIELDS.BUDGETS.TOTAL_REVENUE] as number || 0,
                  clients: clients.length,
                  invoices: invoices.filter(inv => inv[AIRTABLE_CONFIG.FIELDS.INVOICES.STATUS] === 'Brouillon').length,
                  projects: projects.filter(p => p[AIRTABLE_CONFIG.FIELDS.PROJECTS.STATUS] === 'En cours').length
                });
                setIsLoading(false);
              };
              loadDashboardData();
            }}
            className="p-2 bg-deep-blue/5 hover:bg-deep-blue/10 rounded-lg text-deep-blue/40 hover:text-deep-blue transition-all ai-glow"
            title="Forcer la lecture Airtable"
          >
            <RefreshCw size={16} className={cn(isLoading && "animate-spin")} />
          </button>
          <button 
            onClick={() => {
              toast.info("Génération du rapport mensuel consolidé...");
              window.print();
            }}
            className="btn-secondary"
          >
            Rapport Mensuel
          </button>
          <button 
            onClick={() => {
              toast.loading("Lancement d'une nouvelle analyse stratégique IA...", { duration: 2000 });
              setTimeout(() => {
                toast.success("Analyse terminée : 3 opportunités de croissance identifiées.");
              }, 2000);
            }}
            className="btn-primary flex items-center gap-2"
          >
            <Sparkles size={16} /> Nouvelle Analyse
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="MRR (Revenu Récurrent)" value={`${stats.mrr.toLocaleString()} XAF`} change="+15.2%" icon={Wallet} trend="up" isLoading={isLoading} />
        <StatCard title="Clients Actifs" value={stats.clients.toString()} change="+4" icon={Users} trend="up" isLoading={isLoading} />
        <StatCard title="Devis en Attente" value={stats.invoices.toString()} change="-2" icon={FileText} trend="down" isLoading={isLoading} />
        <StatCard title="Projets en Cours" value={stats.projects.toString()} change="+3" icon={Briefcase} trend="up" isLoading={isLoading} />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Trend Chart (Mock) */}
        <div className="lg:col-span-2 premium-card p-5 ai-glow">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-[13px] font-medium uppercase tracking-wider text-deep-blue/60">Tendance des Revenus (XAF)</h3>
            <div className="flex gap-2">
              <span className="flex items-center gap-1 text-[11px] text-lime-ia font-medium">
                <div className="w-2 h-2 rounded-full bg-lime-ia" />
                Revenu IA
              </span>
              <span className="flex items-center gap-1 text-[11px] text-deep-blue/20 font-medium">
                <div className="w-2 h-2 rounded-full bg-deep-blue/20" />
                Services
              </span>
            </div>
          </div>
          
          <div className="h-[200px] w-full flex items-end justify-between gap-2 px-2">
            {[40, 55, 45, 70, 65, 85, 95, 80, 100, 110, 105, 120].map((height, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                <div className="w-full relative">
                  <motion.div 
                    initial={{ height: 0 }}
                    animate={{ height: `${height}%` }}
                    className="w-full bg-lime-ia/10 group-hover:bg-lime-ia/20 rounded-t-sm transition-colors relative"
                  >
                    <div className="absolute top-0 left-0 w-full h-1 bg-lime-ia shadow-[0_0_10px_rgba(131,197,1,0.3)]" />
                  </motion.div>
                </div>
                <span className="text-[9px] text-deep-blue/20 font-medium">{['J','F','M','A','M','J','J','A','S','O','N','D'][i]}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Insights */}
        <div className="space-y-4">
          <div className="premium-card p-5 bg-lime-ia/5 border-lime-ia/20 ai-glow">
            <h3 className="text-[11px] font-bold mb-3 text-lime-ia uppercase tracking-widest">Optimisation IA</h3>
            <p className="text-[13px] text-deep-blue/70 mb-4 leading-relaxed">
              L'IA Doulia suggère une réallocation de 15% du budget API vers le module **Insight** pour maximiser le ROI du trimestre prochain.
            </p>
            <button 
              onClick={() => toast.success("Stratégie d'optimisation appliquée avec succès !")}
              className="btn-primary w-full"
            >
              Appliquer la Stratégie
            </button>
          </div>
          
          <div className="premium-card p-5 ai-glow">
            <h3 className="text-[11px] font-bold mb-4 uppercase tracking-widest text-deep-blue/60">Objectif Annuel</h3>
            <div className="space-y-3">
              <div className="flex justify-between text-[11px] font-medium uppercase">
                <span className="text-deep-blue/40">Progression</span>
                <span className="text-lime-ia">68%</span>
              </div>
              <div className="w-full h-1.5 bg-deep-blue/5 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: '68%' }}
                  className="h-full bg-lime-ia shadow-[0_0_10px_rgba(131,197,1,0.3)]"
                />
              </div>
              <p className="text-[11px] text-deep-blue/40 italic">En avance de 1.2M XAF sur l'objectif initial.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
