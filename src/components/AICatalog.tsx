import React from 'react';
import { motion } from 'motion/react';
import { Sparkles, CheckCircle2, ArrowRight, Zap, Target, Cpu } from 'lucide-react';
import { cn } from '../lib/utils';

import { AIRTABLE_CONFIG } from '../lib/schema';
import { airtableService } from '../lib/airtable';

export const AICatalog: React.FC = () => {
  const [services, setServices] = React.useState<any[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);

  React.useEffect(() => {
    const loadServices = async () => {
      setIsLoading(true);
      const data = await airtableService.getServices();
      if (data.length > 0) {
        setServices(data);
      }
      setIsLoading(false);
    };
    loadServices();
  }, []);

  const fixedSolutions = services.filter(s => s[AIRTABLE_CONFIG.FIELDS.SERVICES.TYPE] === 'Fixe');
  const variableServices = services.filter(s => s[AIRTABLE_CONFIG.FIELDS.SERVICES.TYPE] === 'Variable');

  return (
    <div className="p-6 space-y-10">
      <div className="text-center max-w-2xl mx-auto space-y-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-lime-ia/10 border border-lime-ia/20 text-lime-ia text-[10px] font-bold uppercase tracking-widest"
        >
          <Sparkles size={12} /> Catalogue de Solutions IA
        </motion.div>
        <h1 className="text-3xl font-bold text-deep-blue">Propulsez votre entreprise dans l'ère de l'IA</h1>
        <p className="text-deep-blue/40 text-sm">Découvrez nos solutions packagées et nos services de développement sur-mesure pour une rentabilité maximale.</p>
      </div>

      {/* Fixed Price Solutions */}
      <section className="space-y-6">
        <h2 className="text-sm font-bold uppercase tracking-widest text-deep-blue/60 border-l-2 border-lime-ia pl-4">Solutions Clés en main</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {isLoading ? (
            <div className="col-span-3 py-12 text-center text-deep-blue/40 font-bold uppercase text-xs">Chargement du catalogue...</div>
          ) : fixedSolutions.map((sol, i) => (
            <motion.div 
              key={i}
              whileHover={{ y: -10 }}
              className={cn(
                "premium-card p-6 flex flex-col ai-glow relative overflow-hidden group",
                "bg-gradient-to-br from-lime-ia/5 to-deep-blue/5"
              )}
            >
              <div className="mb-6 p-3 bg-deep-blue/40 rounded-xl w-fit text-lime-ia group-hover:scale-110 transition-transform">
                <Zap size={24} />
              </div>
              <h3 className="text-xl font-bold text-deep-blue mb-2">{sol[AIRTABLE_CONFIG.FIELDS.SERVICES.NAME]}</h3>
              <p className="text-[12px] text-deep-blue/60 mb-6 leading-relaxed">{sol[AIRTABLE_CONFIG.FIELDS.SERVICES.DESCRIPTION]}</p>
              
              <div className="pt-6 border-t border-deep-blue/10 flex items-center justify-between">
                <div>
                  <p className="text-[9px] uppercase font-bold text-deep-blue/40">À partir de</p>
                  <p className="text-lg font-bold text-lime-ia">{(sol[AIRTABLE_CONFIG.FIELDS.SERVICES.SETUP_PRICE] as number || 0).toLocaleString()} XAF</p>
                </div>
                <button 
                  onClick={() => alert(`Intégration de ${sol[AIRTABLE_CONFIG.FIELDS.SERVICES.NAME]} lancée. Redirection vers le simulateur de ROI...`)}
                  className="p-2 bg-deep-blue/5 hover:bg-lime-ia hover:text-deep-blue rounded-lg transition-all"
                >
                  <ArrowRight size={18} />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Custom Services */}
      <section className="space-y-6">
        <h2 className="text-sm font-bold uppercase tracking-widest text-deep-blue/60 border-l-2 border-lime-ia pl-4">Développements Sur-Mesure</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {variableServices.map((service, i) => (
            <motion.div 
              key={i}
              whileHover={{ x: 5 }}
              className="premium-card p-4 flex items-center justify-between ai-glow group"
            >
              <div>
                <h4 className="text-sm font-bold text-deep-blue group-hover:text-lime-ia transition-colors">{service[AIRTABLE_CONFIG.FIELDS.SERVICES.NAME]}</h4>
                <p className="text-[10px] text-deep-blue/40">{service[AIRTABLE_CONFIG.FIELDS.SERVICES.DESCRIPTION]}</p>
              </div>
              <span className="text-[9px] font-bold text-deep-blue/20 uppercase tracking-tighter">Sur Devis</span>
            </motion.div>
          ))}
        </div>
        <div className="p-4 bg-deep-blue/5 rounded-xl border border-deep-blue/5 text-center">
          <p className="text-[11px] text-deep-blue/40 italic">
            * Tarification sur devis après analyse de complexité et étude de ROI.
          </p>
        </div>
      </section>
    </div>
  );
};
