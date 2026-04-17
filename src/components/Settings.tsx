import React, { useState, useEffect } from 'react';
import { 
  Settings as SettingsIcon, 
  Database, 
  Key, 
  Cpu, 
  CheckCircle2, 
  XCircle, 
  RefreshCw,
  User,
  Shield,
  Bell,
  Globe,
  Info,
  Save,
  MessageSquareCode
} from 'lucide-react';
import { motion } from 'motion/react';
import { airtableService } from '../lib/airtable';
import { toast } from 'sonner';

interface ConnectionStatus {
  airtable: { connected: boolean; message: string; loading: boolean };
  gemini: { connected: boolean; message: string; loading: boolean };
  tavily: { connected: boolean; message: string; loading: boolean };
}

export const Settings: React.FC = () => {
  const [status, setStatus] = useState<ConnectionStatus>({
    airtable: { connected: false, message: 'Non testé', loading: false },
    gemini: { connected: false, message: 'Non testé', loading: false },
    tavily: { connected: false, message: 'Non testé', loading: false },
  });

  // User Profile State
  const [profile, setProfile] = useState({
    name: localStorage.getItem('doulia_profile_name') || 'Expert Doulia',
    email: localStorage.getItem('doulia_profile_email') || 'douliacameroun@gmail.com',
    role: localStorage.getItem('doulia_profile_role') || 'Administrateur Système',
    location: localStorage.getItem('doulia_profile_location') || 'Douala, Cameroun'
  });

  // Preferences State
  const [preferences, setPreferences] = useState({
    notifications: localStorage.getItem('doulia_prefs_notifications') === 'true',
    aiReports: localStorage.getItem('doulia_prefs_ai_reports') === 'true'
  });

  // AI System Instructions State
  const [aiInstructions, setAiInstructions] = useState(
    localStorage.getItem('doulia_ai_instructions') || 
    "L'utilisateur est un Expert Doulia basé à Douala. Réponds avec professionnalisme et expertise B2B. Utilise un ton stratégique."
  );

  const [isSaving, setIsSaving] = useState(false);

  const handleSaveAll = () => {
    setIsSaving(true);
    try {
      localStorage.setItem('doulia_profile_name', profile.name);
      localStorage.setItem('doulia_profile_email', profile.email);
      localStorage.setItem('doulia_profile_role', profile.role);
      localStorage.setItem('doulia_profile_location', profile.location);
      localStorage.setItem('doulia_prefs_notifications', String(preferences.notifications));
      localStorage.setItem('doulia_prefs_ai_reports', String(preferences.aiReports));
      localStorage.setItem('doulia_ai_instructions', aiInstructions);
      
      toast.success("Paramètres sauvegardés avec succès");
    } catch (error) {
      toast.error("Erreur lors de la sauvegarde");
    } finally {
      setIsSaving(false);
    }
  };

  const checkConnections = async () => {
    setStatus(prev => ({
      airtable: { ...prev.airtable, loading: true },
      gemini: { ...prev.gemini, loading: true },
      tavily: { ...prev.tavily, loading: true },
    }));

    try {
      // 1. Check Airtable
      const airtableResult = await airtableService.testConnection();
      
      // 2. Check AI Services via proxy
      const aiHealthRes = await fetch('/api/ai/health');
      const aiHealth = await aiHealthRes.json();

      setStatus({
        airtable: { 
          connected: airtableResult.success, 
          message: airtableResult.message, 
          loading: false 
        },
        gemini: { 
          connected: aiHealth.gemini, 
          message: aiHealth.gemini ? 'Clé API configurée' : 'Clé API manquante', 
          loading: false 
        },
        tavily: { 
          connected: aiHealth.tavily, 
          message: aiHealth.tavily ? 'Clé API configurée' : 'Clé API manquante', 
          loading: false 
        },
      });
    } catch (error) {
      setStatus(prev => ({
        ...prev,
        airtable: { ...prev.airtable, loading: false },
        gemini: { ...prev.gemini, loading: false },
        tavily: { ...prev.tavily, loading: false },
      }));
    }
  };

  useEffect(() => {
    checkConnections();
  }, []);

  const StatusCard = ({ 
    title, 
    icon: Icon, 
    data, 
    onRetry 
  }: { 
    title: string; 
    icon: any; 
    data: { connected: boolean; message: string; loading: boolean };
    onRetry: () => void;
  }) => (
    <div className="premium-card p-6 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${data.connected ? 'bg-lime-ia/20 text-lime-ia' : 'bg-red-500/20 text-red-500'}`}>
            <Icon size={20} />
          </div>
          <h4 className="font-bold text-deep-blue">{title}</h4>
        </div>
        <button 
          onClick={onRetry}
          disabled={data.loading}
          className="p-2 hover:bg-cloud-gray rounded-lg transition-colors text-deep-blue/40 disabled:opacity-50"
        >
          <RefreshCw size={16} className={data.loading ? 'animate-spin' : ''} />
        </button>
      </div>
      
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          {data.connected ? (
            <CheckCircle2 size={16} className="text-lime-ia" />
          ) : (
            <XCircle size={16} className="text-red-500" />
          )}
          <span className={`text-sm font-bold uppercase tracking-wider ${data.connected ? 'text-lime-ia' : 'text-red-500'}`}>
            {data.connected ? 'Connecté' : 'Erreur'}
          </span>
        </div>
        <p className="text-xs text-deep-blue/60 leading-relaxed overflow-hidden text-ellipsis whitespace-nowrap">
          {data.message}
        </p>
      </div>
    </div>
  );

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-deep-blue uppercase tracking-tighter">Paramètres</h2>
          <p className="text-deep-blue/40 font-medium">Configuration et état de l'écosystème Doulia.</p>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={handleSaveAll}
            disabled={isSaving}
            className="btn-primary flex items-center gap-2"
          >
            {isSaving ? <RefreshCw size={18} className="animate-spin" /> : <Save size={18} />}
            Sauvegarder
          </button>
          <div className="p-3 bg-white rounded-2xl shadow-sm border border-deep-blue/5">
            <SettingsIcon size={24} className="text-lime-ia" />
          </div>
        </div>
      </header>

      <section className="space-y-4">
        <div className="flex items-center gap-2 text-deep-blue/40 uppercase tracking-widest text-[10px] font-black ml-1">
          <Database size={12} />
          Infrastructure & Connexions
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatusCard 
            title="Airtable Cloud" 
            icon={Database} 
            data={status.airtable} 
            onRetry={checkConnections}
          />
          <StatusCard 
            title="Gemini AI (Google)" 
            icon={Key} 
            data={status.gemini} 
            onRetry={checkConnections}
          />
          <StatusCard 
            title="Tavily Search" 
            icon={Globe} 
            data={status.tavily} 
            onRetry={checkConnections}
          />
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* User Profile */}
          <section className="premium-card p-6 space-y-6">
            <div className="flex items-center gap-2 text-deep-blue font-bold uppercase tracking-tight border-b border-deep-blue/5 pb-4">
              <User size={18} className="text-lime-ia" />
              Profil Utilisateur
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-deep-blue/40 ml-1">Nom Complet</label>
                <input 
                  type="text"
                  value={profile.name}
                  onChange={e => setProfile({...profile, name: e.target.value})}
                  className="w-full p-3 bg-cloud-gray/50 border border-deep-blue/10 rounded-xl text-sm font-medium text-deep-blue focus:outline-none focus:border-lime-ia"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-deep-blue/40 ml-1">Email</label>
                <input 
                  type="email"
                  value={profile.email}
                  onChange={e => setProfile({...profile, email: e.target.value})}
                  className="w-full p-3 bg-cloud-gray/50 border border-deep-blue/10 rounded-xl text-sm font-medium text-deep-blue focus:outline-none focus:border-lime-ia"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-deep-blue/40 ml-1">Rôle</label>
                <select 
                  value={profile.role}
                  onChange={e => setProfile({...profile, role: e.target.value})}
                  className="w-full p-3 bg-cloud-gray/50 border border-deep-blue/10 rounded-xl text-sm font-medium text-deep-blue focus:outline-none focus:border-lime-ia appearance-none"
                >
                  <option value="Administrateur Système">Administrateur Système</option>
                  <option value="Expert IA">Expert IA</option>
                  <option value="Consultant">Consultant</option>
                  <option value="Client Privilégié">Client Privilégié</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-deep-blue/40 ml-1">Localisation</label>
                <input 
                  type="text"
                  value={profile.location}
                  onChange={e => setProfile({...profile, location: e.target.value})}
                  className="w-full p-3 bg-cloud-gray/50 border border-deep-blue/10 rounded-xl text-sm font-medium text-deep-blue focus:outline-none focus:border-lime-ia"
                />
              </div>
            </div>
          </section>

          {/* AI System Instructions */}
          <section className="premium-card p-6 space-y-6">
            <div className="flex items-center gap-2 text-deep-blue font-bold uppercase tracking-tight border-b border-deep-blue/5 pb-4">
              <MessageSquareCode size={18} className="text-lime-ia" />
              Instructions Système IA
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-deep-blue/40 ml-1">
                Contexte & Directives Personnalisées
              </label>
              <textarea 
                value={aiInstructions}
                onChange={e => setAiInstructions(e.target.value)}
                placeholder="Ex: Utilise les informations de l'utilisateur pour personnaliser tes réponses..."
                className="w-full p-4 bg-cloud-gray/50 border border-deep-blue/10 rounded-xl text-sm font-medium text-deep-blue focus:outline-none focus:border-lime-ia h-32 resize-none"
              />
              <p className="text-[10px] text-deep-blue/30 italic">
                Ces instructions guident les réflexions et le profil de l'IA (Gemini & Chatbot) pour tout l'écosystème Doulia.
              </p>
            </div>
          </section>

          {/* Security & Preferences */}
          <section className="premium-card p-6 space-y-6">
            <div className="flex items-center gap-2 text-deep-blue font-bold uppercase tracking-tight border-b border-deep-blue/5 pb-4">
              <Shield size={18} className="text-lime-ia" />
              Sécurité & Préférences
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 hover:bg-cloud-gray/30 rounded-xl transition-colors">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-deep-blue/5 rounded-lg">
                    <Bell size={18} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-deep-blue">Notifications Intelligentes</p>
                    <p className="text-xs text-deep-blue/40">Alertes sur les budgets et nouvelles veilles.</p>
                  </div>
                </div>
                <button 
                  onClick={() => setPreferences({...preferences, notifications: !preferences.notifications})}
                  className={`w-10 h-5 rounded-full relative transition-colors duration-300 ${preferences.notifications ? 'bg-lime-ia' : 'bg-deep-blue/10'}`}
                >
                  <div className={`absolute top-1 w-3 h-3 bg-white rounded-full shadow-sm transition-all duration-300 ${preferences.notifications ? 'right-1' : 'left-1'}`} />
                </button>
              </div>
              <div className="flex items-center justify-between p-3 hover:bg-cloud-gray/30 rounded-xl transition-colors">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-deep-blue/5 rounded-lg">
                    <Cpu size={18} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-deep-blue">Rapports IA Automatisés</p>
                    <p className="text-xs text-deep-blue/40">Génération hebdomadaire de synthèses de marché.</p>
                  </div>
                </div>
                <button 
                  onClick={() => setPreferences({...preferences, aiReports: !preferences.aiReports})}
                  className={`w-10 h-5 rounded-full relative transition-colors duration-300 ${preferences.aiReports ? 'bg-lime-ia' : 'bg-deep-blue/10'}`}
                >
                  <div className={`absolute top-1 w-3 h-3 bg-white rounded-full shadow-sm transition-all duration-300 ${preferences.aiReports ? 'right-1' : 'left-1'}`} />
                </button>
              </div>
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <section className="premium-card p-6 bg-deep-blue text-white overflow-hidden relative">
            <div className="relative z-10 space-y-4">
              <div className="flex items-center gap-2 text-lime-ia font-black uppercase tracking-tighter text-lg">
                <Info size={20} />
                Système DOULIA
              </div>
              <div className="space-y-3">
                <div className="flex justify-between text-xs border-b border-white/5 pb-2">
                  <span className="text-white/40">Version Hub</span>
                  <span className="font-mono text-lime-ia">v1.2.4-stable</span>
                </div>
                <div className="flex justify-between text-xs border-b border-white/5 pb-2">
                  <span className="text-white/40">Dernière Sync</span>
                  <span className="font-mono">Il y a 2 min</span>
                </div>
                <div className="flex justify-between text-xs border-b border-white/5 pb-2">
                  <span className="text-white/40">Région Serveur</span>
                  <span className="font-mono uppercase tracking-widest">EU-WEST-2</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-white/40">License</span>
                  <span className="font-mono text-lime-ia">Enterprise AI</span>
                </div>
              </div>
              <p className="text-[10px] text-white/20 leading-relaxed pt-4 italic">
                Propulsé par le moteur IA de Doulia. Conçu pour l'excellence financière en Afrique Centrale.
              </p>
            </div>
            {/* Background pattern */}
            <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-lime-ia/5 blur-3xl rounded-full" />
          </section>

          <button 
            onClick={() => window.open('https://github.com/doulia-cameroun', '_blank')}
            className="w-full premium-card p-6 flex flex-col items-center justify-center gap-3 hover:bg-cloud-gray transition-all group"
          >
            <div className="p-3 bg-deep-blue/5 rounded-2xl group-hover:bg-lime-ia group-hover:text-deep-blue transition-all">
              <Globe size={24} />
            </div>
            <div className="text-center">
              <p className="text-sm font-bold text-deep-blue uppercase tracking-tight">Documentation Technique</p>
              <p className="text-xs text-deep-blue/40 mt-1">Accédez au guide de l'administrateur.</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};
