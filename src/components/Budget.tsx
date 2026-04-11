import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Wallet, PieChart, ArrowUpRight, ArrowDownRight, Server, Globe, Zap, Building2, Truck, ScanLine, TrendingUp, History, AlertCircle, FileText, Plus, Edit2, RefreshCw, DollarSign } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '../lib/utils';

const EXPENSES = [
  { label: 'API (Gemini / Tavily)', amount: 1250000, category: 'Technologie', icon: Zap, trend: 'up' },
  { label: 'Loyer Bureau Douala', amount: 450000, category: 'Infrastructure', icon: Building2, trend: 'stable' },
  { label: 'Internet Fibre Optique', amount: 85000, category: 'Infrastructure', icon: Globe, trend: 'stable' },
  { label: 'Transport & Logistique', amount: 120000, category: 'Opérations', icon: Truck, trend: 'down' },
  { label: 'Hébergement Cloud (AWS)', amount: 350000, category: 'Technologie', icon: Server, trend: 'up' },
  { label: 'Marketing & Ads', amount: 200000, category: 'Croissance', icon: ArrowUpRight, trend: 'up' },
];

const RECENT_INVOICES = [
  { id: 'INV-001', provider: 'Camtel', amount: 85000, status: 'processed', date: '10/04/2026' },
  { id: 'INV-002', provider: 'AWS Cameroon', amount: 350000, status: 'processed', date: '08/04/2026' },
  { id: 'INV-003', provider: 'Eneo', amount: 120000, status: 'pending', date: '09/04/2026' },
];

import { AIRTABLE_CONFIG } from '../lib/schema';
import { airtableService } from '../lib/airtable';

export const Budget: React.FC = () => {
  const [isScanning, setIsScanning] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<'overview' | 'ocr' | 'forecast'>('overview');
  const [budgets, setBudgets] = React.useState<any[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [connectionStatus, setConnectionStatus] = React.useState<{success: boolean, message: string} | null>(null);
  const [expenses, setExpenses] = React.useState(EXPENSES);
  const [invoices, setInvoices] = React.useState(RECENT_INVOICES);

  const loadBudgets = async () => {
    setIsLoading(true);
    try {
      const status = await airtableService.testConnection();
      setConnectionStatus(status);
      
      const data = await airtableService.getBudgets();
      if (data && data.length > 0) {
        setBudgets(data);
      }
    } catch (error) {
      console.error("Error loading budgets from Airtable:", error);
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    loadBudgets();
  }, []);

  const currentBudget = budgets[0] || {};
  const totalExpenses = currentBudget[AIRTABLE_CONFIG.FIELDS.BUDGETS.TOTAL_EXPENSES] as number || expenses.reduce((acc, curr) => acc + curr.amount, 0);
  const estimatedRevenue = currentBudget[AIRTABLE_CONFIG.FIELDS.BUDGETS.TOTAL_REVENUE] as number || 8450000;
  const netMargin = currentBudget[AIRTABLE_CONFIG.FIELDS.BUDGETS.NET_MARGIN] as number || (estimatedRevenue - totalExpenses);
  const marginPercentage = estimatedRevenue > 0 ? (netMargin / estimatedRevenue) * 100 : 0;

  const [isAddModalOpen, setIsAddModalOpen] = React.useState(false);
  const [newExpense, setNewExpense] = React.useState({
    label: '',
    amount: '',
    category: 'Technologie'
  });

  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExpense.label || !newExpense.amount) {
      toast.error("Veuillez remplir tous les champs");
      return;
    }

    setExpenses(prev => [
      ...prev,
      { 
        label: newExpense.label, 
        amount: parseInt(newExpense.amount), 
        category: newExpense.category, 
        icon: Wallet, 
        trend: 'stable' 
      }
    ]);
    
    setIsAddModalOpen(false);
    setNewExpense({ label: '', amount: '', category: 'Technologie' });
    toast.success("Dépense ajoutée au budget local");
  };

  const [allocation, setAllocation] = React.useState([
    { label: 'GPU / Cloud', value: 45 },
    { label: 'Talents IA', value: 35 },
    { label: 'Marketing', value: 15 },
    { label: 'Autres', value: 5 },
  ]);

  const handleEditAllocation = (index: number) => {
    const item = allocation[index];
    const newValue = prompt(`Nouvelle valeur pour ${item.label} (%) :`, item.value.toString());
    if (newValue && !isNaN(parseInt(newValue))) {
      const newAlloc = [...allocation];
      newAlloc[index] = { ...item, value: parseInt(newValue) };
      setAllocation(newAlloc);
      toast.success("Allocation mise à jour");
    }
  };

  const handleEditExpenseLine = (index: number) => {
    const exp = expenses[index];
    const newLabel = prompt("Nouveau libellé :", exp.label);
    const newAmount = prompt("Nouveau montant (XAF) :", exp.amount.toString());
    
    if (newLabel && newAmount && !isNaN(parseInt(newAmount))) {
      const newExp = [...expenses];
      newExp[index] = { ...exp, label: newLabel, amount: parseInt(newAmount) };
      setExpenses(newExp);
      toast.success("Charge mise à jour");
    }
  };

  const handleEditExpense = (index: number) => {
    handleEditExpenseLine(index);
  };

  const handleEditInvoice = (index: number) => {
    const inv = invoices[index];
    toast.info(`Modification facture : ${inv.provider} (Simulation)`);
  };

  const handleEditBudgetField = async (field: string, currentVal: number) => {
    toast.info(`Modification du champ ${field} (Simulation)`);
  };

  const handleOCRScan = () => {
    setIsScanning(true);
    const toastId = toast.loading("Analyse OCR en cours...", { 
      duration: 10000,
      action: {
        label: "Annuler",
        onClick: () => handleStopOCR(toastId)
      }
    });
    
    const timeoutId = setTimeout(() => {
      setIsScanning(false);
      toast.dismiss(toastId);
      toast.success("Facture analysée avec succès !");
      setInvoices(prev => [
        { id: `INV-00${prev.length + 1}`, provider: 'Orange Cameroon', amount: 45000, status: 'processed', date: '11/04/2026' },
        ...prev
      ]);
    }, 2500);

    (window as any).ocrTimeoutId = timeoutId;
  };

  const handleStopOCR = (toastId?: string | number) => {
    setIsScanning(false);
    if (toastId) toast.dismiss(toastId);
    if ((window as any).ocrTimeoutId) {
      clearTimeout((window as any).ocrTimeoutId);
    }
    toast.error("Analyse OCR interrompue");
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <div className="flex items-center gap-3">
            <h1>Analyse Budgétaire</h1>
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
          <p className="text-deep-blue/40 text-[12px]">Optimisation des coûts opérationnels et marges nettes.</p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={loadBudgets}
            className="p-2 bg-deep-blue/5 hover:bg-deep-blue/10 rounded-lg text-deep-blue/40 hover:text-deep-blue transition-all ai-glow"
            title="Forcer la lecture Airtable"
          >
            <RefreshCw size={16} className={cn(isLoading && "animate-spin")} />
          </button>
          <div className="flex bg-deep-blue/5 p-1 rounded-lg border border-deep-blue/10">
          <button 
            onClick={() => setActiveTab('overview')}
            className={cn(
              "px-3 py-1.5 rounded-md text-[11px] font-bold transition-all",
              activeTab === 'overview' ? "bg-lime-ia text-deep-blue" : "text-deep-blue/40 hover:text-deep-blue"
            )}
          >
            Vue d'ensemble
          </button>
          <button 
            onClick={() => setActiveTab('ocr')}
            className={cn(
              "px-3 py-1.5 rounded-md text-[11px] font-bold transition-all",
              activeTab === 'ocr' ? "bg-lime-ia text-deep-blue" : "text-deep-blue/40 hover:text-deep-blue"
            )}
          >
            OCR & Back-office
          </button>
          <button 
            onClick={() => setActiveTab('forecast')}
            className={cn(
              "px-3 py-1.5 rounded-md text-[11px] font-bold transition-all",
              activeTab === 'forecast' ? "bg-lime-ia text-deep-blue" : "text-deep-blue/40 hover:text-deep-blue"
            )}
          >
            Prévisions IA
          </button>
        </div>
      </div>
    </div>

      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Summary Cards */}
          <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="premium-card p-6 ai-glow relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-5 text-deep-blue">
                <ArrowDownRight size={80} />
              </div>
              <p className="text-[10px] font-bold uppercase text-deep-blue/40 mb-1">Dépenses Totales / Mois</p>
              <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold text-deep-blue">{isLoading ? '...' : totalExpenses.toLocaleString()} XAF</h2>
                <button 
                  onClick={() => handleEditBudgetField(AIRTABLE_CONFIG.FIELDS.BUDGETS.TOTAL_EXPENSES, totalExpenses)}
                  className="p-1.5 hover:bg-deep-blue/10 rounded text-deep-blue/20 hover:text-deep-blue transition-colors"
                >
                  <Edit2 size={14} />
                </button>
              </div>
              <div className="mt-4 flex items-center gap-2 text-[10px] text-red-500 font-bold">
                <ArrowUpRight size={12} /> +4.2% vs mois dernier
              </div>
            </div>

            <div className="premium-card p-6 ai-glow relative overflow-hidden border-lime-ia/20">
              <div className="absolute top-0 right-0 p-4 opacity-5 text-lime-ia">
                <PieChart size={80} />
              </div>
              <p className="text-[10px] font-bold uppercase text-deep-blue/40 mb-1">Revenu Total Estimé</p>
              <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold text-lime-ia">{isLoading ? '...' : estimatedRevenue.toLocaleString()} XAF</h2>
                <button 
                  onClick={() => handleEditBudgetField(AIRTABLE_CONFIG.FIELDS.BUDGETS.TOTAL_REVENUE, estimatedRevenue)}
                  className="p-1.5 hover:bg-lime-ia/10 rounded text-lime-ia/20 hover:text-lime-ia transition-colors"
                >
                  <Edit2 size={14} />
                </button>
              </div>
              <div className="mt-4 flex items-center gap-2 text-[10px] text-lime-ia font-bold">
                <Zap size={12} /> {marginPercentage.toFixed(1)}% de rentabilité
              </div>
            </div>

          {/* Detailed Expenses List */}
          <div className="md:col-span-2 premium-card p-6 ai-glow">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-sm font-bold uppercase tracking-widest text-deep-blue/60">Détails des Charges</h3>
              <button 
                onClick={() => setIsAddModalOpen(true)}
                className="btn-primary flex items-center gap-2 text-[11px]"
              >
                <Plus size={14} /> Ajouter une ligne
              </button>
            </div>

            {/* Add Expense Modal */}
            <AnimatePresence>
              {isAddModalOpen && (
                <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-deep-blue/40 backdrop-blur-sm">
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="premium-card w-full max-w-md p-8 shadow-2xl relative"
                  >
                    <button 
                      onClick={() => setIsAddModalOpen(false)}
                      className="absolute top-6 right-6 p-2 hover:bg-deep-blue/5 rounded-full text-deep-blue/40"
                    >
                      <Plus size={20} className="rotate-45" />
                    </button>

                    <div className="flex items-center gap-3 mb-8">
                      <div className="p-3 bg-lime-ia/10 rounded-2xl text-lime-ia">
                        <Wallet size={24} />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-deep-blue">Nouvelle Charge</h3>
                        <p className="text-xs text-deep-blue/40">Ajoutez une dépense prévisionnelle ou réelle.</p>
                      </div>
                    </div>

                    <form onSubmit={handleAddExpense} className="space-y-6">
                      <div className="space-y-4">
                        <div>
                          <label className="premium-label">Libellé de la dépense *</label>
                          <input 
                            type="text"
                            value={newExpense.label}
                            onChange={(e) => setNewExpense({...newExpense, label: e.target.value})}
                            className="premium-input"
                            placeholder="Ex: Abonnement ChatGPT Team"
                            required
                          />
                        </div>
                        <div>
                          <label className="premium-label">Montant (XAF) *</label>
                          <div className="relative">
                            <DollarSign size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-deep-blue/30" />
                            <input 
                              type="number"
                              value={newExpense.amount}
                              onChange={(e) => setNewExpense({...newExpense, amount: e.target.value})}
                              className="premium-input pl-10"
                              placeholder="0"
                              required
                            />
                          </div>
                        </div>
                        <div>
                          <label className="premium-label">Catégorie</label>
                          <select 
                            value={newExpense.category}
                            onChange={(e) => setNewExpense({...newExpense, category: e.target.value})}
                            className="premium-input appearance-none"
                          >
                            <option>Technologie</option>
                            <option>Infrastructure</option>
                            <option>Opérations</option>
                            <option>Croissance</option>
                          </select>
                        </div>
                      </div>

                      <div className="flex gap-3 pt-4">
                        <button 
                          type="submit"
                          className="btn-primary flex-1"
                        >
                          Enregistrer la dépense
                        </button>
                      </div>
                    </form>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>

            <div className="space-y-4">
              {expenses.map((exp, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-deep-blue/5 rounded-xl border border-deep-blue/5 hover:border-lime-ia/20 transition-colors group">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-deep-blue flex items-center justify-center text-lime-ia group-hover:scale-110 transition-transform">
                      <exp.icon size={20} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-deep-blue">{exp.label}</p>
                      <p className="text-[10px] text-deep-blue/20 uppercase font-bold">{exp.category}</p>
                    </div>
                  </div>
                  <div className="text-right flex items-center gap-3">
                    <div>
                      <p className="text-sm font-bold text-deep-blue">{exp.amount.toLocaleString()} XAF</p>
                      <div className={cn(
                        "text-[9px] font-bold flex items-center justify-end gap-1",
                        exp.trend === 'up' ? "text-red-500" : exp.trend === 'down' ? "text-green-500" : "text-deep-blue/20"
                      )}>
                        {exp.trend === 'up' ? <ArrowUpRight size={10} /> : exp.trend === 'down' ? <ArrowDownRight size={10} /> : null}
                        {exp.trend === 'stable' ? 'Stable' : exp.trend === 'up' ? 'Hausse' : 'Baisse'}
                      </div>
                    </div>
                    <button 
                      onClick={() => handleEditExpense(i)}
                      className="p-1.5 hover:bg-deep-blue/10 rounded text-deep-blue/10 hover:text-deep-blue transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Edit2 size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Budget Allocation Chart (Mock) */}
        <div className="premium-card p-6 ai-glow flex flex-col">
          <h3 className="text-sm font-bold uppercase tracking-widest mb-8 text-deep-blue/60">Allocation par Secteur</h3>
          <div className="flex-1 flex items-center justify-center relative">
            <div className="w-48 h-48 rounded-full border-[16px] border-deep-blue/5 relative flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-[16px] border-lime-ia border-t-transparent border-r-transparent rotate-45" />
              <div className="absolute inset-0 rounded-full border-[16px] border-lime-ia/40 border-b-transparent border-l-transparent -rotate-12" />
              <div className="text-center">
                <p className="text-2xl font-bold text-deep-blue">65%</p>
                <p className="text-[10px] text-deep-blue/40 uppercase font-bold">Tech</p>
              </div>
            </div>
          </div>
          <div className="mt-8 space-y-3">
            {[
              { label: 'Technologie', color: 'bg-lime-ia', value: '65%' },
              { label: 'Infrastructure', color: 'bg-lime-ia/60', value: '20%' },
              { label: 'Opérations', color: 'bg-lime-ia/30', value: '10%' },
              { label: 'Croissance', color: 'bg-deep-blue/10', value: '5%' },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-2">
                  <div className={cn("w-2 h-2 rounded-full", item.color)} />
                  <span className="text-deep-blue/60">{item.label}</span>
                </div>
                <span className="font-bold text-deep-blue">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      )}

      {activeTab === 'ocr' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 premium-card p-6 ai-glow">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-lg font-bold text-deep-blue flex items-center gap-2">
                <ScanLine size={20} className="text-lime-ia" />
                Traitement Intelligent des Factures (OCR)
              </h3>
              <div className="flex gap-2">
                {isScanning && (
                  <button 
                    onClick={() => handleStopOCR()}
                    className="px-4 py-2 bg-red-500/10 text-red-500 hover:bg-red-500/20 rounded-lg text-xs font-bold transition-all border border-red-500/20"
                  >
                    Stopper l'Analyse
                  </button>
                )}
                <button 
                  onClick={handleOCRScan}
                  disabled={isScanning}
                  className="btn-primary flex items-center gap-2"
                >
                  {isScanning ? <History className="animate-spin" size={18} /> : <Plus size={18} />}
                  Scanner une Facture
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-[10px] font-bold uppercase text-deep-blue/40 tracking-widest">Derniers Traitements</h4>
              <div className="space-y-3">
                {invoices.map((inv, i) => (
                  <div key={inv.id} className="flex items-center justify-between p-4 bg-deep-blue/5 rounded-xl border border-deep-blue/5 group">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-deep-blue flex items-center justify-center text-lime-ia">
                        <FileText size={20} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-deep-blue">{inv.provider}</p>
                        <p className="text-[10px] text-deep-blue/20 font-bold">{inv.id} • {inv.date}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold text-deep-blue">{inv.amount.toLocaleString()} XAF</p>
                        <button 
                          onClick={() => handleEditInvoice(i)}
                          className="p-1.5 hover:bg-deep-blue/10 rounded text-deep-blue/10 hover:text-deep-blue transition-colors opacity-0 group-hover:opacity-100"
                        >
                          <Edit2 size={12} />
                        </button>
                      </div>
                      <span className={cn(
                        "px-2 py-1 rounded text-[9px] font-bold uppercase",
                        inv.status === 'processed' ? "bg-green-500/10 text-green-500" : "bg-amber-500/10 text-amber-500"
                      )}>
                        {inv.status === 'processed' ? 'Rapproché' : 'En attente'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="premium-card p-6 bg-lime-ia/5 border-lime-ia/20 ai-glow">
            <h3 className="text-xs font-bold mb-4 text-lime-ia uppercase tracking-widest">Statut Automatisation</h3>
            <div className="space-y-6">
              <div className="text-center py-8">
                <div className="text-4xl font-bold text-deep-blue mb-1">85%</div>
                <p className="text-[10px] text-deep-blue/40 uppercase font-bold">Taux de Reconnaissance IA</p>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between text-[10px] font-bold">
                  <span className="text-deep-blue/40 uppercase">Précision OCR</span>
                  <span className="text-lime-ia">98.2%</span>
                </div>
                <div className="w-full h-1 bg-deep-blue/5 rounded-full overflow-hidden">
                  <div className="h-full bg-lime-ia w-[98.2%]" />
                </div>
              </div>
              <p className="text-[11px] text-deep-blue/60 italic leading-relaxed">
                "L'automatisation du back-office a permis d'économiser **14h de travail administratif** ce mois-ci."
              </p>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'forecast' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 premium-card p-6 ai-glow">
            <h3 className="text-lg font-bold text-deep-blue mb-8 flex items-center gap-2">
              <TrendingUp size={20} className="text-lime-ia" />
              Prévisions de Trésorerie & Pipeline
            </h3>
            <div className="h-[300px] w-full flex items-end justify-between gap-4 px-4">
              {[60, 75, 90, 110, 130, 150].map((height, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-3 group">
                  <div className="w-full relative">
                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-bold text-lime-ia opacity-0 group-hover:opacity-100 transition-opacity">
                      {(height * 100000).toLocaleString()}
                    </div>
                    <motion.div 
                      initial={{ height: 0 }}
                      animate={{ height: `${height}px` }}
                      className={cn(
                        "w-full rounded-t-lg transition-all relative",
                        i < 3 ? "bg-deep-blue/10" : "bg-lime-ia/40 shadow-[0_0_20px_rgba(131,197,1,0.2)]"
                      )}
                    >
                      {i >= 3 && <div className="absolute top-0 left-0 w-full h-1 bg-lime-ia" />}
                    </motion.div>
                  </div>
                  <span className="text-[10px] text-deep-blue/40 font-bold uppercase">
                    {['Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sept'][i]}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-8 flex items-center gap-4 p-4 bg-deep-blue/5 rounded-xl border border-deep-blue/5">
              <AlertCircle size={20} className="text-amber-500" />
              <p className="text-xs text-deep-blue/60">
                **Alerte IA** : Pic de dépenses serveur (GPU) prévu en Juillet (+25%) suite à la signature probable du projet **SNH**.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="premium-card p-6 ai-glow">
              <h4 className="text-[10px] font-bold uppercase text-deep-blue/40 tracking-widest mb-4">Allocation Ressources</h4>
              <div className="space-y-4">
                {allocation.map((item, i) => (
                  <div key={i} className="space-y-1.5 group">
                    <div className="flex justify-between text-[10px] font-bold">
                      <div className="flex items-center gap-2">
                        <span className="text-deep-blue/60">{item.label}</span>
                        <button 
                          onClick={() => handleEditAllocation(i)}
                          className="opacity-0 group-hover:opacity-100 p-1 hover:bg-deep-blue/5 rounded text-deep-blue/20 hover:text-deep-blue transition-all"
                        >
                          <Edit2 size={10} />
                        </button>
                      </div>
                      <span className="text-deep-blue">{item.value}%</span>
                    </div>
                    <div className="w-full h-1 bg-deep-blue/5 rounded-full overflow-hidden">
                      <div className="h-full bg-lime-ia" style={{ width: `${item.value}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
