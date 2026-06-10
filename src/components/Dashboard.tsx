import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { 
  TrendingUp, Users, Briefcase, Wallet, ArrowUpRight, ArrowDownRight, FileText, 
  Clock, Calendar as CalendarIcon, RefreshCw, Sparkles, X, Coins, ShieldCheck, 
  BarChart3, ChevronRight, FileSpreadsheet, Percent, Info, Lightbulb, Activity
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '../lib/utils';
import { AIRTABLE_CONFIG } from '../lib/schema';
import { airtableService } from '../lib/airtable';

const REVENUE_DATA = [
  { name: 'Jan', value: 4000000 },
  { name: 'Fév', value: 5500000 },
  { name: 'Mar', value: 4500000 },
  { name: 'Avr', value: 7000000 },
  { name: 'Mai', value: 6500000 },
  { name: 'Juin', value: 8500000 },
  { name: 'Juil', value: 9500000 },
  { name: 'Août', value: 8000000 },
  { name: 'Sept', value: 10000000 },
  { name: 'Oct', value: 11000000 },
  { name: 'Nov', value: 10500000 },
  { name: 'Déc', value: 12000000 },
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-slate-900/95 backdrop-blur-md p-4 rounded-xl border border-slate-700 shadow-2xl"
      >
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">{label}</p>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-lime-400 shadow-[0_0_10px_rgba(163,230,53,0.5)]" />
          <p className="text-base font-black text-white">{payload[0].value.toLocaleString()} XAF</p>
        </div>
      </motion.div>
    );
  }
  return null;
};

const StatCard = ({ title, value, change, icon: Icon, trend, isLoading, onClick, delay = 0 }: any) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.4, ease: "easeOut" }}
    whileHover={{ y: -4, scale: 1.01 }}
    whileTap={{ scale: 0.98 }}
    onClick={onClick}
    className="group relative p-5 rounded-2xl bg-white border border-slate-200/60 shadow-sm hover:shadow-xl hover:border-lime-500/30 transition-all duration-300 cursor-pointer overflow-hidden"
  >
    <div className="absolute inset-0 bg-gradient-to-br from-lime-500/0 to-lime-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
    <div className="relative z-10">
      <div className="flex justify-between items-start mb-4">
        <div className="p-2.5 bg-slate-50 text-slate-700 rounded-xl group-hover:bg-lime-500/10 group-hover:text-lime-600 transition-colors duration-300">
          <Icon size={20} strokeWidth={2.5} />
        </div>
        <div className={cn(
          "flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded-full shadow-sm",
          trend === 'up' ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-rose-50 text-rose-600 border border-rose-100"
        )}>
          {trend === 'up' ? <ArrowUpRight size={14} strokeWidth={2.5} /> : <ArrowDownRight size={14} strokeWidth={2.5} />}
          {change}
        </div>
      </div>
      <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1">{title}</p>
      <h3 className="text-2xl font-black text-slate-800 tracking-tight">
        {isLoading ? (
          <span className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full border-2 border-slate-200 border-t-lime-500 animate-spin" />
          </span>
        ) : value}
      </h3>
    </div>
  </motion.div>
);

export const Dashboard: React.FC = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [stats, setStats] = useState({
    mrr: 0,
    clients: 0,
    invoices: 0,
    projects: 0,
    expenses: 0,
    totalIncome: 0
  });
  const [chartData, setChartData] = useState(REVENUE_DATA);
  const [isLoading, setIsLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<{success: boolean, message: string} | null>(null);

  // Modal interaction states
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [recentInvoices, setRecentInvoices] = useState<any[]>([]);
  const [recentExpenses, setRecentExpenses] = useState<any[]>([]);

  // Real Airtable integration state arrays
  const [airtableInvoices, setAirtableInvoices] = useState<any[]>([]);
  const [airtableExpenses, setAirtableExpenses] = useState<any[]>([]);
  const [airtableBudgets, setAirtableBudgets] = useState<any[]>([]);
  const [airtableOptimizations, setAirtableOptimizations] = useState<any[]>([]);

  // Complètement opérationnel pour Airtable - Mapping direct des colonnes
  const fetchTotalIncomeFromAirtable = async () => {
    try {
      console.log("Lecture dynamique de 'TOTAL ENTRANTS (LOCAL)' depuis Airtable");
      const data = await airtableService.getInvoices() as any[];
      const total = data.reduce((acc: number, current: any) => acc + (Number(current['Montant Total']) || 0), 0);
      return total;
    } catch (err) {
      console.error("Échec du fetch de l'indicateur Entrants :", err);
      return 0;
    }
  };

  const fetchExpensesFromAirtable = async () => {
    try {
      console.log("Lecture dynamique de 'TOTAL DEPENSES' depuis Airtable");
      const data = await airtableService.getExpenses() as any[];
      const total = data.reduce((acc: number, current: any) => {
        return acc + (Number(current['fldExpAmount']) || Number(current['Montant']) || 0);
      }, 0);
      return total;
    } catch (err) {
      console.error("Échec du fetch de l'indicateur Dépenses :", err);
      return 0;
    }
  };

  const fetchAIOptimizationsFromAirtable = async () => {
    try {
      console.log("Lecture dynamique de 'OPTIMISATION IA' depuis Airtable");
      const data = await airtableService.getAIOptimizations();
      return data;
    } catch (err) {
      console.error("Échec du fetch de l'optimisation IA :", err);
      return [];
    }
  };

  const fetchRevenueTrendsFromAirtable = async () => {
    try {
      console.log("Lecture dynamique de 'TENDANCE DES REVENUS' depuis Airtable");
      const data = await airtableService.getBudgets();
      return data;
    } catch (err) {
      console.error("Échec du fetch de la tendance des revenus :", err);
      return [];
    }
  };

  useEffect(() => {
    const loadDashboardData = async () => {
      setIsLoading(true);
      
      try {
        // 1. Load from localStorage (Offline-first / Latest local data)
        const savedHistory = localStorage.getItem('doulia_doc_history');
        let localInvoices = 0;
        let localExpenses = 0;
        let localIncome = 0;
        let historyData: any[] = [];
        const invoicesList: any[] = [];
        const expensesList: any[] = [];

        if (savedHistory) {
          historyData = JSON.parse(savedHistory);
          historyData.forEach((entry: any) => {
            if (entry.type === 'invoice') {
              localInvoices++;
              localIncome += entry.total;
              invoicesList.push(entry);
            } else if (entry.type === 'expense') {
              localExpenses += entry.total;
              expensesList.push(entry);
            }
          });
        }

        setRecentInvoices(invoicesList);
        setRecentExpenses(expensesList);

        // 2. Load from Airtable
        const status = await airtableService.testConnection();
        setConnectionStatus(status);
        
        let clients: any[] = [];
        let projects: any[] = [];
        let dbInvoices: any[] = [];
        let dbExpenses: any[] = [];
        let budgets: any[] = [];
        let optimizations: any[] = [];

        if (status.success) {
          try {
            [clients, projects, dbInvoices, budgets, dbExpenses, optimizations] = await Promise.all([
              airtableService.getClients(),
              airtableService.getProjects(),
              airtableService.getInvoices(),
              airtableService.getBudgets(),
              airtableService.getExpenses(),
              airtableService.getAIOptimizations()
            ]);
            
            setAirtableInvoices(dbInvoices);
            setAirtableExpenses(dbExpenses);
            setAirtableBudgets(budgets);
            setAirtableOptimizations(optimizations);
          } catch (e) {
            console.error("Error loading Airtable collections:", e);
          }
        }

        const latestBudget = budgets[0] || {};
        
        setStats({
          mrr: Number(latestBudget[AIRTABLE_CONFIG.FIELDS.BUDGETS.TOTAL_REVENUE]) || localIncome,
          clients: clients.length || 12, // fallback for demo if empty
          invoices: dbInvoices.length || localInvoices,
          projects: projects.filter(p => p[AIRTABLE_CONFIG.FIELDS.PROJECTS.STATUS] === 'En cours').length || 5,
          expenses: localExpenses,
          totalIncome: localIncome
        });

        // 3. Update Chart Data with real history if possible
        if (historyData.length > 0) {
          const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sept', 'Oct', 'Nov', 'Déc'];
          const currentMonth = months[new Date().getMonth()];
          
          const newChartData = REVENUE_DATA.map(d => {
            if (d.name === currentMonth) {
              return { ...d, value: d.value + localIncome };
            }
            return d;
          });
          setChartData(newChartData);
        }

      } catch (error) {
        console.error("Dashboard data load error:", error);
      } finally {
        setIsLoading(false);
      }
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
    <div className="p-4 md:p-8 space-y-8 bg-slate-50/50 min-h-screen">
      {/* Welcome Section */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col xl:flex-row xl:items-end justify-between gap-6"
      >
        <div className="space-y-1">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-8 w-1 bg-lime-500 rounded-full" />
            <h1 className="text-3xl font-black text-slate-800 tracking-tight">Tableau de Bord Stratégique</h1>
            {connectionStatus && (
              <span className={cn(
                "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest shadow-sm border",
                connectionStatus.success ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-rose-50 text-rose-600 border-rose-100"
              )}>
                <div className={cn("w-1.5 h-1.5 rounded-full", connectionStatus.success ? "bg-emerald-500 animate-pulse" : "bg-rose-500")} />
                {connectionStatus.success ? "Airtable Connecté" : "Erreur Airtable"}
              </span>
            )}
          </div>
          <div className="flex items-center gap-4 text-slate-500 text-xs font-semibold uppercase tracking-wider pl-4">
            <span className="flex items-center gap-1.5 text-lime-600">
              <CalendarIcon size={14} />
              <span className="capitalize">{formatDate(currentTime)}</span>
            </span>
            <span className="w-1 h-1 bg-slate-300 rounded-full" />
            <span className="flex items-center gap-1.5">
              <Clock size={14} className="text-slate-400" />
              <span>{formatTime(currentTime)}</span>
            </span>
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <button 
            onClick={() => {
              const loadDashboardData = async () => {
                setIsLoading(true);
                const status = await airtableService.testConnection();
                setConnectionStatus(status);
                const [clients, projects, dbInvoices, budgets] = await Promise.all([
                  airtableService.getClients(),
                  airtableService.getProjects(),
                  airtableService.getInvoices(),
                  airtableService.getBudgets()
                ]);
                const latestBudget = budgets[0] || {};
                setStats({
                  mrr: Number(latestBudget[AIRTABLE_CONFIG.FIELDS.BUDGETS.TOTAL_REVENUE]) || 0,
                  clients: clients.length,
                  invoices: dbInvoices.length,
                  projects: projects.filter(p => p[AIRTABLE_CONFIG.FIELDS.PROJECTS.STATUS] === 'En cours').length,
                  expenses: 0, 
                  totalIncome: 0
                });
                setIsLoading(false);
              };
              loadDashboardData();
              toast.success("Synchronisation forcée effectuée !");
            }}
            className="flex items-center justify-center w-10 h-10 bg-white border border-slate-200 rounded-xl text-slate-500 hover:text-slate-800 hover:border-slate-300 hover:shadow-md transition-all"
            title="Forcer la lecture Airtable"
          >
            <RefreshCw size={18} className={cn(isLoading && "animate-spin text-lime-500")} />
          </button>
          <button 
            onClick={() => setActiveModal('monthly_report')}
            className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-700 text-sm font-bold hover:shadow-md hover:border-slate-300 transition-all"
          >
            <FileSpreadsheet size={18} className="text-slate-400" />
            Rapport Mensuel
          </button>
          <button 
            onClick={() => {
              toast.loading("Analyse des flux Airtable & prévisions IA...", { duration: 1500 });
              setTimeout(() => {
                setActiveModal('ai_optimization');
              }, 1500);
            }}
            className="group relative flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-bold overflow-hidden shadow-lg hover:shadow-xl transition-all"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-lime-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <Sparkles size={18} className="text-lime-400" /> Nouvelle Analyse
          </button>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard 
          title="Total Entrants (Local)" 
          value={`${stats.totalIncome.toLocaleString()} XAF`} 
          change="+15.2%" 
          icon={Wallet} 
          trend="up" 
          isLoading={isLoading}
          onClick={() => setActiveModal('income')}
          delay={0.1}
        />
        <StatCard 
          title="Total Dépenses" 
          value={`${stats.expenses.toLocaleString()} XAF`} 
          change="-5.4%" 
          icon={ArrowDownRight} 
          trend="down" 
          isLoading={isLoading}
          onClick={() => setActiveModal('expenses')}
          delay={0.2}
        />
        <StatCard 
          title="Factures Générées" 
          value={stats.invoices.toString()} 
          change="+2" 
          icon={FileText} 
          trend="up" 
          isLoading={isLoading}
          onClick={() => setActiveModal('invoices')}
          delay={0.3}
        />
        <StatCard 
          title="Marge Nette Estimée" 
          value={`${(stats.totalIncome - stats.expenses).toLocaleString()} XAF`} 
          change="+8.1%" 
          icon={TrendingUp} 
          trend="up" 
          isLoading={isLoading}
          onClick={() => setActiveModal('margin')}
          delay={0.4}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Trend Chart */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          onClick={() => setActiveModal('revenue_trend')}
          className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/60 p-6 shadow-sm hover:shadow-lg transition-all cursor-pointer group"
          title="Cliquez pour agrandir et voir la tendance"
        >
          <div className="flex justify-between items-center mb-8">
            <div>
              <h3 className="text-sm font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
                Tendance des Revenus (XAF)
                <span className="p-1 bg-slate-100 rounded-md text-slate-400 group-hover:text-lime-600 transition-colors"><Activity size={14} /></span>
              </h3>
            </div>
            <div className="flex gap-4">
              <span className="flex items-center gap-1.5 text-xs text-slate-600 font-bold">
                <div className="w-2.5 h-2.5 rounded-full bg-lime-400 shadow-[0_0_8px_rgba(163,230,53,0.6)]" />
                Revenu IA
              </span>
              <span className="flex items-center gap-1.5 text-xs text-slate-400 font-bold">
                <div className="w-2.5 h-2.5 rounded-full bg-slate-200" />
                Services
              </span>
            </div>
          </div>
          
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#84cc16" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#84cc16" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.5} />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 600 }}
                  dy={10}
                />
                <YAxis hide />
                <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '4 4' }} />
                <Area 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#84cc16" 
                  strokeWidth={4}
                  fillOpacity={1} 
                  fill="url(#colorValue)" 
                  animationDuration={2000}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Quick Insights */}
        <div className="space-y-6">
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
            className="relative bg-slate-900 rounded-2xl p-6 overflow-hidden shadow-xl"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-lime-500/20 rounded-full blur-3xl -mr-10 -mt-10" />
            <h3 className="text-xs font-bold mb-4 text-lime-400 uppercase tracking-widest flex items-center gap-2">
              <Lightbulb size={16} /> Optimisation IA
            </h3>
            <p className="text-sm text-slate-300 mb-6 leading-relaxed">
              L'IA Doulia suggère une réallocation de <strong className="text-white">15%</strong> du budget API vers le module <strong>Insight</strong> pour maximiser le ROI du trimestre prochain.
            </p>
            <button 
              onClick={() => setActiveModal('ai_optimization')}
              className="w-full py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl text-sm font-bold transition-all border border-white/10 backdrop-blur-sm"
            >
              Consulter Optimisation
            </button>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.7 }}
            className="bg-white rounded-2xl p-6 border border-slate-200/60 shadow-sm"
          >
            <h3 className="text-xs font-bold mb-5 uppercase tracking-widest text-slate-500">Objectif Annuel</h3>
            <div className="space-y-3">
              <div className="flex justify-between text-sm font-black">
                <span className="text-slate-700">Progression</span>
                <span className="text-lime-600">68%</span>
              </div>
              <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: '68%' }}
                  transition={{ duration: 1.5, delay: 0.8, ease: "easeOut" }}
                  className="h-full bg-lime-500 relative"
                >
                  <div className="absolute inset-0 bg-white/20 w-full animate-[shimmer_2s_infinite]" />
                </motion.div>
              </div>
              <p className="text-xs text-slate-400 font-medium italic">En avance de 1.2M XAF sur l'objectif initial.</p>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Interactive Detail Modals */}
      <AnimatePresence>
        {activeModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
              onClick={() => setActiveModal(null)}
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl relative z-10 overflow-hidden"
            >
              {/* Close Button */}
              <button 
                onClick={() => setActiveModal(null)}
                className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 rounded-full transition-all z-20"
              >
                <X size={20} strokeWidth={2.5} />
              </button>

              {/* Modal Header */}
              <div className="flex-none p-6 sm:p-8 border-b border-slate-100 bg-slate-50/50">
                <div className="flex items-center gap-4">
                  <div className="p-3.5 bg-white shadow-sm border border-slate-100 text-lime-600 rounded-2xl">
                    {activeModal === 'income' && <Wallet size={28} />}
                    {activeModal === 'expenses' && <ArrowDownRight size={28} />}
                    {activeModal === 'invoices' && <FileText size={28} />}
                    {activeModal === 'margin' && <TrendingUp size={28} />}
                    {activeModal === 'ai_optimization' && <Sparkles size={28} />}
                    {activeModal === 'revenue_trend' && <BarChart3 size={28} />}
                    {activeModal === 'monthly_report' && <FileSpreadsheet size={28} />}
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-slate-800 tracking-tight">
                      {activeModal === 'income' && 'Total Entrants (Local)'}
                      {activeModal === 'expenses' && 'Dépenses Totales'}
                      {activeModal === 'invoices' && 'Factures & Devis Générés'}
                      {activeModal === 'margin' && 'Marge Nette Estimée'}
                      {activeModal === 'ai_optimization' && 'Analyse & Optimisation IA'}
                      {activeModal === 'revenue_trend' && 'Analyse des Tendances Annuelles'}
                      {activeModal === 'monthly_report' && 'Rapport Mensuel Consolidé'}
                    </h3>
                    <p className="text-sm text-slate-500 font-medium mt-1">DOULIA Strategic Financial Hub</p>
                  </div>
                </div>
              </div>

              {/* Modal Body (Scrollable) */}
              <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6">
                
                {/* Strategic Explanations & Airtable Mapping */}
                <div className="grid md:grid-cols-2 gap-4 mb-6">
                  <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-2">
                      <ShieldCheck size={16} className="text-lime-600" /> Signification & Intérêt
                    </h4>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      {activeModal === 'income' && 'Représente le montant cumulé de toutes vos factures payées et dues enregistrées localement dans votre navigateur. Cela permet une visibilité immédiate hors-ligne sur votre chiffre d’affaires brut, avant réconciliation sur Airtable.'}
                      {activeModal === 'expenses' && 'Suivi global de toutes les sorties financières (salaires, abonnements API IA, matériel). Une gestion optimisée des dépenses assure la pérennité financière de DOULIA.'}
                      {activeModal === 'invoices' && 'Indicateur clé d’activité commerciale. Le décompte précis des documents de ventes émis permet d’évaluer le taux de transformation des devis en factures actives.'}
                      {activeModal === 'margin' && 'Le véritable baromètre de rentabilité. Calculé en soustrayant le total des dépenses de vos entrées. Une marge élevée certifie l’efficacité de nos intégrations logicielles IA.'}
                      {activeModal === 'ai_optimization' && 'Moteur cognitif de DOULIA. Notre IA analyse vos dépenses récurrentes de serveurs Cloud et d’API pour vous suggérer des réallocations de budget à haute valeur ajoutée.'}
                      {activeModal === 'revenue_trend' && 'Évolution chronologique de l’activité financière de l’entreprise comparée mensuellement pour dégager des schémas de saisonnalité commerciale.'}
                      {activeModal === 'monthly_report' && 'Génération de fichiers d’audits financier mensuels consolidés incluant les marges opérationnelles et les tableaux d’amortissements.'}
                    </p>
                  </div>

                  <div className="bg-slate-900 rounded-2xl p-5 border border-slate-800 text-slate-300">
                    <h4 className="text-xs font-bold text-lime-400 uppercase tracking-widest mb-3">
                      📂 Mapping Airtable
                    </h4>
                    <div className="space-y-3 text-xs font-mono">
                      <div>
                        <span className="text-slate-500 block mb-1">Table cible Airtable :</span> 
                        <span className="text-white font-semibold">
                          {activeModal === 'income' && 'tblFacturesVentes'}
                          {activeModal === 'expenses' && 'tblSortiesDépenses'}
                          {activeModal === 'invoices' && 'tblDocumentsCommerciaux'}
                          {activeModal === 'margin' && 'tblBudgetsAnnuels / Formule'}
                          {activeModal === 'ai_optimization' && 'tblOptimisationsRecommandées'}
                          {activeModal === 'revenue_trend' && 'tblBudgetsRevenusMensuels'}
                          {activeModal === 'monthly_report' && 'tblRapportsAuditsPdf'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 block mb-1">Champs & Types exigés :</span> 
                        <span className="text-lime-200">
                          {activeModal === 'income' && 'MontantTotal [Currency XAF], Statut [SingleSelect], Pièce_Jointe [Attachment]'}
                          {activeModal === 'expenses' && 'TotalDépense [Currency], Categorie [SingleSelect], Bénéficiaire [SingleLineText]'}
                          {activeModal === 'invoices' && 'NuméroDoc [Autonumbering], DateÉmission [Date], ClientName [Link]'}
                          {activeModal === 'margin' && 'Formule de calcul : {RevenusCumulés} - {TotalDépensesEncourues}'}
                          {activeModal === 'ai_optimization' && 'RecommandationText [LongText], StatutApplication [Checkbox]'}
                          {activeModal === 'revenue_trend' && 'Mois [SingleSelect], ObjectifAtteint [Currency], Projections [Number]'}
                          {activeModal === 'monthly_report' && 'FichierRapport [Attachment], DateEdition [CreatedTime]'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Dynamic Data Table Details */}
                <div className="border border-slate-200 rounded-2xl overflow-hidden">
                  <div className="bg-slate-50 px-5 py-3 border-b border-slate-200 flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Aperçu en temps réel</span>
                    <span className="flex h-2 w-2 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-lime-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-lime-500"></span>
                    </span>
                  </div>
                  <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto bg-white">
                    {activeModal === 'income' && (
                      (() => {
                        const allInvs = [
                          ...recentInvoices.map(inv => ({
                            id: inv.id,
                            client: inv.clientName,
                            date: inv.date,
                            number: inv.invoiceNumber,
                            total: inv.total,
                            source: 'Local (Hors-ligne)'
                          })),
                          ...airtableInvoices.map(inv => ({
                            id: inv.id,
                            client: inv['Client'] || 'Client',
                            date: inv['Date Émission'],
                            number: inv['ID Facture'] || 'FACT',
                            total: Number(inv['Montant Total']) || 0,
                            source: 'Airtable Sync'
                          }))
                        ];
                        
                        return allInvs.length > 0 ? (
                          allInvs.map((inv, idx) => (
                            <div key={idx} className="p-4 flex justify-between items-center hover:bg-slate-50 transition-colors">
                              <div>
                                <p className="font-black text-sm text-slate-800">
                                  {Array.isArray(inv.client) ? inv.client.join(', ') : inv.client || 'Client'}
                                </p>
                                <div className="flex items-center gap-2 mt-1 text-xs text-slate-400">
                                  <span>Date: {inv.date ? new Date(inv.date).toLocaleDateString() : 'N/A'}</span>
                                  <span>•</span>
                                  <span className="font-medium text-slate-500">{inv.number}</span>
                                  <span>•</span>
                                  <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-100 text-slate-500 rounded-md uppercase">{inv.source}</span>
                                </div>
                              </div>
                              <span className="font-black text-lime-600 text-lg">{inv.total.toLocaleString()} FCFA</span>
                            </div>
                          ))
                        ) : (
                          <div className="p-8 text-center text-sm text-slate-400 font-medium">Aucun revenu enregistré.</div>
                        );
                      })()
                    )}

                    {activeModal === 'expenses' && (
                      (() => {
                        const allExps = [
                          ...recentExpenses.map(exp => ({
                            id: exp.id,
                            name: exp.clientName,
                            date: exp.date,
                            number: exp.invoiceNumber,
                            total: exp.total,
                            source: 'Local (Hors-ligne)'
                          })),
                          ...airtableExpenses.map(exp => ({
                            id: exp.id,
                            name: exp['fldExpName'] || exp['Nom'] || 'Dépense',
                            date: exp['fldExpDate'] || exp['Date'],
                            number: exp['fldExpId'] || exp['ID'] || 'DEP',
                            total: Number(exp['fldExpAmount']) || Number(exp['Montant']) || 0,
                            source: 'Airtable Sync'
                          }))
                        ];
                        
                        return allExps.length > 0 ? (
                          allExps.map((exp, idx) => (
                            <div key={idx} className="p-4 flex justify-between items-center hover:bg-slate-50 transition-colors">
                              <div>
                                <p className="font-black text-sm text-slate-800">{exp.name || 'Bénéficiaire indirect'}</p>
                                <div className="flex items-center gap-2 mt-1 text-xs text-slate-400">
                                  <span>Date: {exp.date ? new Date(exp.date).toLocaleDateString() : 'N/A'}</span>
                                  <span>•</span>
                                  <span className="font-medium text-slate-500">{exp.number}</span>
                                  <span>•</span>
                                  <span className="text-[10px] font-bold px-2 py-0.5 bg-rose-50 text-rose-600 rounded-md uppercase">{exp.source}</span>
                                </div>
                              </div>
                              <span className="font-black text-rose-600 text-lg">-{exp.total.toLocaleString()} FCFA</span>
                            </div>
                          ))
                        ) : (
                          <div className="p-8 text-center text-sm text-slate-400 font-medium">Aucune dépense enregistrée.</div>
                        );
                      })()
                    )}

                    {activeModal === 'invoices' && (
                      (() => {
                        const localDocs = [...recentInvoices, ...recentExpenses].map(doc => ({
                          number: doc.invoiceNumber,
                          type: doc.type === 'invoice' ? 'Facture de vente' : doc.type === 'quote' ? 'Devis commercial' : 'Dépense / Sortie',
                          total: doc.total,
                          isExpense: doc.type === 'expense',
                          source: 'Local'
                        }));
                        const airtableDocs = [
                          ...airtableInvoices.map(inv => ({
                            number: inv['ID Facture'] || 'FACT',
                            type: inv['Type de Document'] || 'Facture',
                            total: Number(inv['Montant Total']) || 0,
                            isExpense: false,
                            source: 'Airtable'
                          })),
                          ...airtableExpenses.map(exp => ({
                            number: exp['fldExpId'] || 'DEP',
                            type: exp['Type de Dépense'] || 'Dépense',
                            total: Number(exp['fldExpAmount']) || Number(exp['Montant']) || 0,
                            isExpense: true,
                            source: 'Airtable'
                          }))
                        ];
                        
                        const allDocs = [...localDocs, ...airtableDocs];
                        
                        return allDocs.length > 0 ? (
                          allDocs.map((doc, idx) => (
                            <div key={idx} className="p-4 flex justify-between items-center hover:bg-slate-50 transition-colors">
                              <div>
                                <p className="font-black text-sm text-slate-800">{doc.number}</p>
                                <div className="flex items-center gap-2 mt-1 text-xs text-slate-400">
                                  <span>Type : {doc.type}</span>
                                  <span>•</span>
                                  <span className="text-[10px] font-bold px-2 py-0.5 bg-blue-50 text-blue-600 rounded-md uppercase">{doc.source}</span>
                                </div>
                              </div>
                              <span className={cn("font-black text-lg", doc.isExpense ? "text-rose-600" : "text-lime-600")}>
                                {doc.total.toLocaleString()} FCFA
                              </span>
                            </div>
                          ))
                        ) : (
                          <div className="p-8 text-center text-sm text-slate-400 font-medium">Aucun document enregistré.</div>
                        );
                      })()
                    )}

                    {activeModal === 'margin' && (
                      <div className="p-6 space-y-4 bg-white">
                        <div className="flex justify-between items-center p-4 bg-slate-50 rounded-xl border border-slate-100">
                          <span className="font-bold text-slate-600 text-sm">Brut cumulé (Ventes)</span>
                          <span className="font-black text-lime-600 text-lg">+{stats.totalIncome.toLocaleString()} FCFA</span>
                        </div>
                        <div className="flex justify-between items-center p-4 bg-slate-50 rounded-xl border border-slate-100">
                          <span className="font-bold text-slate-600 text-sm">Dépenses opérationnelles déduites</span>
                          <span className="font-black text-rose-600 text-lg">-{stats.expenses.toLocaleString()} FCFA</span>
                        </div>
                        <div className="flex justify-between items-center p-6 bg-slate-900 rounded-xl shadow-lg mt-2">
                          <span className="font-black text-white text-lg">Marge bénéficiaire nette</span>
                          <span className="font-black text-lime-400 text-2xl">{(stats.totalIncome - stats.expenses).toLocaleString()} FCFA</span>
                        </div>
                      </div>
                    )}

                    {activeModal === 'ai_optimization' && (
                      airtableOptimizations.length > 0 ? (
                        airtableOptimizations.map((opt, idx) => (
                          <div key={idx} className="p-5 hover:bg-slate-50 transition-colors">
                            <div className="flex justify-between items-start gap-4 mb-3">
                              <p className="font-black text-slate-800 text-sm leading-relaxed">{opt['Texte Recommandation'] || opt['TexteRecommandation'] || 'Optimisation'}</p>
                              <span className="shrink-0 text-[10px] bg-lime-100 text-lime-700 px-3 py-1 rounded-full font-bold shadow-sm border border-lime-200">
                                ROI: {opt['ROI Estimé'] || 'N/A'}
                              </span>
                            </div>
                            <div className="flex justify-between items-center text-xs text-slate-500">
                              <span className="flex items-center gap-1.5">
                                Statut : <span className="font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded-md">{opt['Statut Application'] || 'Non Appliqué'}</span>
                              </span>
                              <span>Créé : {opt['Date Génération'] ? new Date(opt['Date Génération']).toLocaleDateString() : 'Auto'}</span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="p-6 space-y-4">
                          <div className="p-5 bg-indigo-50/80 border border-indigo-100 rounded-2xl shadow-sm">
                            <p className="font-black text-indigo-900 mb-2">Optimisation d'Infrastructure Client</p>
                            <p className="text-sm leading-relaxed text-indigo-800/80 mb-4">Le diagnostic indique que 450,000 XAF ont été alloués à des serveurs d'API de test inactifs. Nous vous recommandons de désactiver la route de dev inusitée.</p>
                            <button onClick={() => toast.success("Routeurs mis au repos !")} className="text-xs font-black bg-indigo-600 text-white px-5 py-2.5 rounded-xl hover:bg-indigo-700 transition-colors shadow-md">Désactiver & Économiser</button>
                          </div>
                          <div className="p-5 bg-amber-50/80 border border-amber-100 rounded-2xl shadow-sm">
                            <p className="font-black text-amber-900 mb-2">Renouvellement Anticipé des Accords</p>
                            <p className="text-sm leading-relaxed text-amber-800/80">En renouvelant le contrat annuel de l'API Vision avec OpenAI avant le 15, vous économiserez 12% des frais variables (économie estimée à 120,000 XAF).</p>
                          </div>
                        </div>
                      )
                    )}

                    {activeModal === 'revenue_trend' && (
                      airtableBudgets.length > 0 ? (
                        <div className="p-6">
                          <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-4">Tableau Comparatif Projections vs Réel (Airtable Budgets)</p>
                          <div className="border border-slate-200 rounded-xl overflow-hidden">
                            <table className="w-full text-left text-sm bg-white">
                              <thead>
                                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs uppercase tracking-wider">
                                  <th className="p-4 font-bold">Période</th>
                                  <th className="p-4 text-right font-bold">Revenus (XAF)</th>
                                  <th className="p-4 text-right font-bold">Dépenses (XAF)</th>
                                  <th className="p-4 text-right font-bold text-lime-600">Marge Nette</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                                {airtableBudgets.map((b, idx) => (
                                  <tr key={idx} className="hover:bg-slate-50 transition-colors">
                                    <td className="p-4 font-black">{b['Mois/Année'] || 'N/A'}</td>
                                    <td className="p-4 text-right text-lime-600 font-black">{(Number(b['Revenus Totaux']) || 0).toLocaleString()}</td>
                                    <td className="p-4 text-right text-rose-500">{(Number(b['Dépenses Totales']) || 0).toLocaleString()}</td>
                                    <td className="p-4 text-right text-emerald-600 font-black bg-emerald-50/30">{(Number(b['Marge Nette 2']) || 0).toLocaleString()}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      ) : (
                        <div className="p-6">
                          <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-4">Tableau Comparatif Projections vs Réel</p>
                          <div className="border border-slate-200 rounded-xl overflow-hidden">
                            <table className="w-full text-left text-sm bg-white">
                              <thead>
                                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs uppercase tracking-wider">
                                  <th className="p-4 font-bold">Trimestre</th>
                                  <th className="p-4 font-bold">Objectif minimal (XAF)</th>
                                  <th className="p-4 text-right font-bold">Réalisé (XAF)</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                                <tr className="hover:bg-slate-50">
                                  <td className="p-4 font-black">T1 (Jan - Mar)</td>
                                  <td className="p-4">14,000,000</td>
                                  <td className="p-4 text-right text-lime-600 font-black">14,200,000</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                  <td className="p-4 font-black">T2 (Avr - Juin)</td>
                                  <td className="p-4">22,000,000</td>
                                  <td className="p-4 text-right text-lime-600 font-black">{(22000000 + stats.totalIncome).toLocaleString()}</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                  <td className="p-4 font-black text-slate-400">T3 (Juil - Sept)</td>
                                  <td className="p-4 text-slate-400">27,500,000</td>
                                  <td className="p-4 text-right text-slate-400 font-bold bg-slate-50/50">À venir</td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )
                    )}

                    {activeModal === 'monthly_report' && (
                      <div className="p-6 space-y-4">
                        <div className="flex items-center justify-between p-4 border border-slate-200 rounded-2xl hover:border-lime-500/30 hover:shadow-md transition-all bg-white group">
                          <div className="flex items-center gap-4">
                            <div className="p-3 bg-slate-50 text-lime-600 rounded-xl group-hover:bg-lime-50 transition-colors">
                              <FileSpreadsheet size={24} />
                            </div>
                            <div>
                              <p className="text-sm font-black text-slate-800">AUDIT_FINANCIER_MAI_2026.pdf</p>
                              <p className="text-xs text-slate-500 font-medium mt-0.5">Généré le 31-05-2026 • 2.4 Mo • <span className="text-emerald-600">Validé</span></p>
                            </div>
                          </div>
                          <button onClick={() => toast.success("Téléchargement du rapport de Mai...")} className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-sm transition-colors">Télécharger</button>
                        </div>
                        <div className="flex items-center justify-between p-4 border border-slate-200 rounded-2xl hover:border-lime-500/30 hover:shadow-md transition-all bg-white group">
                          <div className="flex items-center gap-4">
                            <div className="p-3 bg-slate-50 text-lime-600 rounded-xl group-hover:bg-lime-50 transition-colors">
                              <FileSpreadsheet size={24} />
                            </div>
                            <div>
                              <p className="text-sm font-black text-slate-800">PREVISION_BUDGETAIRE_AVRIL_2026.pdf</p>
                              <p className="text-xs text-slate-500 font-medium mt-0.5">Généré le 30-04-2026 • 1.9 Mo • <span className="text-emerald-600">Audité</span></p>
                            </div>
                          </div>
                          <button onClick={() => toast.success("Téléchargement du rapport d'Avril...")} className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-sm transition-colors">Télécharger</button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex-none p-6 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3 z-20">
                <button 
                  onClick={() => setActiveModal(null)}
                  className="px-6 py-2.5 rounded-xl font-bold text-sm text-slate-600 hover:bg-slate-200/50 transition-colors"
                >
                  Fermer l'aperçu
                </button>
                <button 
                  onClick={() => toast.success("Synchronisation en cours avec Airtable...")}
                  className="flex items-center gap-2 px-6 py-2.5 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-slate-800 shadow-md hover:shadow-lg transition-all"
                >
                  <RefreshCw size={16} /> Synchroniser
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};