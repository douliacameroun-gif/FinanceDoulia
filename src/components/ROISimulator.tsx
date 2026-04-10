import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { 
  Calculator, 
  Users, 
  Clock, 
  TrendingUp, 
  Target, 
  Coins, 
  ArrowRight,
  Info
} from 'lucide-react';
import { cn } from '../lib/utils';

export const ROISimulator: React.FC = () => {
  // Input states with default values
  const [nombreEmployes, setNombreEmployes] = useState(5);
  const [coutHoraireMoyen, setCoutHoraireMoyen] = useState(2500);
  const [heuresRepetitivesJours, setHeuresRepetitivesJours] = useState(2);
  const [prospectsManquesMois, setProspectsManquesMois] = useState(10);
  const [valeurMoyenneProspect, setValeurMoyenneProspect] = useState(50000);

  // Calculations
  const results = useMemo(() => {
    const tempsLibereMois = nombreEmployes * heuresRepetitivesJours * 20; // 20 jours ouvrés
    const economieSalaireMois = tempsLibereMois * coutHoraireMoyen;
    const revenuRecupereMois = prospectsManquesMois * valeurMoyenneProspect * 0.30; // Hypothèse 30% de récupération
    const gainTotalMois = economieSalaireMois + revenuRecupereMois;
    const gainAnnuelEstime = gainTotalMois * 12;

    return {
      tempsLibereMois,
      economieSalaireMois,
      revenuRecupereMois,
      gainTotalMois,
      gainAnnuelEstime
    };
  }, [nombreEmployes, coutHoraireMoyen, heuresRepetitivesJours, prospectsManquesMois, valeurMoyenneProspect]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fr-FR').format(value) + ' FCFA';
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-deep-blue flex items-center gap-3">
          <Calculator className="text-lime-ia" />
          Simulateur de Gains IA
        </h1>
        <p className="text-deep-blue/60 text-lg max-w-2xl">
          Estimez l'impact concret de l'Intelligence Artificielle sur votre rentabilité et libérez le potentiel de votre entreprise.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column: Inputs */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="premium-card p-8 space-y-6 border-lime-ia/10"
        >
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1 h-6 bg-lime-ia rounded-full" />
            <h2 className="text-xl font-bold text-deep-blue">Vos Données Actuelles</h2>
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-xs font-bold uppercase text-deep-blue/40">
                <Users size={14} className="text-lime-ia" />
                Nombre d'employés
              </label>
              <input 
                type="number" 
                value={nombreEmployes}
                onChange={(e) => setNombreEmployes(Number(e.target.value))}
                className="w-full bg-pure-white border border-deep-blue/10 rounded-xl px-4 py-3 focus:border-lime-ia/50 outline-none transition-colors text-deep-blue"
              />
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-xs font-bold uppercase text-deep-blue/40">
                <Coins size={14} className="text-lime-ia" />
                Coût horaire moyen (FCFA)
              </label>
              <input 
                type="number" 
                value={coutHoraireMoyen}
                onChange={(e) => setCoutHoraireMoyen(Number(e.target.value))}
                className="w-full bg-pure-white border border-deep-blue/10 rounded-xl px-4 py-3 focus:border-lime-ia/50 outline-none transition-colors text-deep-blue"
              />
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-xs font-bold uppercase text-deep-blue/40">
                <Clock size={14} className="text-lime-ia" />
                Heures répétitives / jour / employé
              </label>
              <input 
                type="number" 
                step="0.5"
                value={heuresRepetitivesJours}
                onChange={(e) => setHeuresRepetitivesJours(Number(e.target.value))}
                className="w-full bg-pure-white border border-deep-blue/10 rounded-xl px-4 py-3 focus:border-lime-ia/50 outline-none transition-colors text-deep-blue"
              />
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-xs font-bold uppercase text-deep-blue/40">
                <Target size={14} className="text-lime-ia" />
                Prospects manqués / mois
              </label>
              <input 
                type="number" 
                value={prospectsManquesMois}
                onChange={(e) => setProspectsManquesMois(Number(e.target.value))}
                className="w-full bg-pure-white border border-deep-blue/10 rounded-xl px-4 py-3 focus:border-lime-ia/50 outline-none transition-colors text-deep-blue"
              />
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-xs font-bold uppercase text-deep-blue/40">
                <TrendingUp size={14} className="text-lime-ia" />
                Valeur moyenne d'un prospect (FCFA)
              </label>
              <input 
                type="number" 
                value={valeurMoyenneProspect}
                onChange={(e) => setValeurMoyenneProspect(Number(e.target.value))}
                className="w-full bg-pure-white border border-deep-blue/10 rounded-xl px-4 py-3 focus:border-lime-ia/50 outline-none transition-colors text-deep-blue"
              />
            </div>
          </div>
        </motion.div>

        {/* Right Column: Results */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-6"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="premium-card p-6 bg-pure-white border-deep-blue/5">
              <p className="text-[10px] font-bold uppercase text-deep-blue/30 mb-2">Temps libéré / mois</p>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-deep-blue">{results.tempsLibereMois}</span>
                <span className="text-xs text-deep-blue/40">heures</span>
              </div>
            </div>

            <div className="premium-card p-6 bg-pure-white border-deep-blue/5">
              <p className="text-[10px] font-bold uppercase text-deep-blue/30 mb-2">Économie salaire / mois</p>
              <p className="text-xl font-bold text-deep-blue">{formatCurrency(results.economieSalaireMois)}</p>
            </div>

            <div className="premium-card p-6 bg-pure-white border-deep-blue/5">
              <p className="text-[10px] font-bold uppercase text-deep-blue/30 mb-2">Revenu récupéré / mois</p>
              <p className="text-xl font-bold text-deep-blue">{formatCurrency(results.revenuRecupereMois)}</p>
            </div>

            <div className="premium-card p-6 bg-pure-white border-deep-blue/5">
              <p className="text-[10px] font-bold uppercase text-deep-blue/30 mb-2">Gain total / mois</p>
              <p className="text-xl font-bold text-lime-ia">{formatCurrency(results.gainTotalMois)}</p>
            </div>
          </div>

          {/* Main Result Card */}
          <div className="premium-card p-8 bg-lime-ia/5 border-lime-ia/20 relative overflow-hidden group ai-glow">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity text-lime-ia">
              <TrendingUp size={120} />
            </div>
            
            <div className="relative z-10 space-y-4">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-lime-ia">Gain Annuel Estimé</p>
              <h2 className="text-5xl md:text-6xl font-black text-lime-ia tracking-tighter animate-pulse">
                {formatCurrency(results.gainAnnuelEstime)}
              </h2>
              <div className="flex items-center gap-2 text-deep-blue/40 text-sm">
                <ArrowRight size={16} />
                <span>Potentiel de réinvestissement stratégique</span>
              </div>
            </div>
          </div>

          {/* Legal Mention */}
          <div className="flex gap-3 p-4 bg-pure-white rounded-xl border border-deep-blue/5">
            <Info size={18} className="text-lime-ia shrink-0" />
            <p className="text-[10px] leading-relaxed text-deep-blue/40 italic">
              *Basé sur une optimisation prudente de vos processus par l'IA DOULIA. Les résultats réels peuvent varier en fonction de la complexité de l'intégration et de l'adoption par vos équipes.
            </p>
          </div>

          <button 
            onClick={() => alert("Votre plan d'action IA personnalisé est en cours de génération par l'expert Doulia. Consultez le Chatbot pour les détails !")}
            className="btn-primary w-full py-4 text-lg"
          >
            Obtenir mon Plan d'Action IA
          </button>
        </motion.div>
      </div>
    </div>
  );
};
