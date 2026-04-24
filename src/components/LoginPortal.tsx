import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Lock, ShieldCheck, ArrowRight, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface LoginPortalProps {
  onLogin: () => void;
}

export const LoginPortal: React.FC<LoginPortalProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      let data;
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.indexOf("application/json") !== -1) {
        data = await response.json();
      } else {
        throw new Error("Réponse non-JSON du serveur");
      }

      if (response.ok && data.success) {
        toast.success("Accès autorisé. Bienvenue dans le Hub Doulia.");
        onLogin();
      } else {
        const errorMsg = data.message || `Erreur ${response.status}: Accès refusé`;
        toast.error(errorMsg);
        setIsLoading(false);
      }
    } catch (error) {
      console.error("Login detail error:", error);
      toast.error("Impossible de joindre le serveur. Vérifiez la configuration (ADMIN_EMAIL / MOT_DE_PASSE_ADMIN).");
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-deep-blue p-6 overflow-hidden">
      {/* Background Effects */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-lime-ia/10 blur-[150px] rounded-full animate-pulse" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-lime-ia/5 blur-[120px] rounded-full" />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md relative"
      >
        <div className="text-center mb-8">
          <img 
            src="https://i.postimg.cc/Y0nJdHW3/DOULIA_LOGO.jpg" 
            alt="Doulia Logo" 
            className="w-20 h-20 mx-auto rounded-2xl border-2 border-lime-ia shadow-[0_0_20px_rgba(131,197,1,0.3)] mb-6"
          />
          <h1 className="text-white text-2xl font-black tracking-tight mb-2">DOULIA FINANCE HUB</h1>
          <p className="text-white/40 text-sm font-medium">Portail de Gestion Stratégique Sécurisé v1.1.0</p>
        </div>

        <div className="premium-card p-8 bg-white/5 border-white/10 backdrop-blur-xl shadow-2xl">
          <div className="flex items-center gap-3 mb-8 pb-4 border-b border-white/5">
            <div className="w-10 h-10 rounded-xl bg-lime-ia/20 flex items-center justify-center text-lime-ia">
              <Lock size={20} />
            </div>
            <div>
              <h2 className="text-white font-bold text-sm">Authentification Requise</h2>
              <p className="text-white/30 text-[10px] uppercase tracking-widest font-bold">Accès Restreint</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-white/40 uppercase tracking-wider ml-1">Email Professionnel</label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-lime-ia focus:ring-4 focus:ring-lime-ia/10 transition-all placeholder:text-white/10"
                placeholder="nom@doulia.cm"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-white/40 uppercase tracking-wider ml-1">Mot de Passe</label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-lime-ia focus:ring-4 focus:ring-lime-ia/10 transition-all placeholder:text-white/10"
                placeholder="••••••••"
                required
              />
            </div>

            <button 
              type="submit"
              disabled={isLoading}
              className="w-full bg-lime-ia hover:bg-lime-ia/90 text-deep-blue font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <>
                  Déverrouiller le Hub
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>
        </div>

        <div className="mt-8 flex items-center justify-center gap-2 text-white/20">
          <ShieldCheck size={14} />
          <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Chiffrement de Grade Militaire</span>
        </div>
      </motion.div>
    </div>
  );
};
