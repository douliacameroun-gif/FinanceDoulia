import React from 'react';
import { motion } from 'motion/react';
import { Sparkles, CheckCircle2, ArrowRight, Zap, Target, Cpu, Edit2 } from 'lucide-react';
import { toast } from 'sonner';
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

  const getServiceLogo = (name: string) => {
    const lowerName = name.toLowerCase();
    if (lowerName.includes('connect')) return 'https://i.postimg.cc/kX1fmzXD/Doulia_Connect.jpg';
    if (lowerName.includes('process')) return 'https://i.postimg.cc/YqsfVFbS/Doulia_Process.jpg';
    if (lowerName.includes('insight')) return 'https://i.postimg.cc/Wz96sqVK/Doulia_Insight.jpg';
    return 'https://i.postimg.cc/hP5bwmpt/Doulia_Magique_logo.jpg';
  };

  const [allocation, setAllocation] = React.useState([
    { label: 'GPU / Cloud', value: 45 },
    { label: 'Talents IA', value: 35 },
    { label: 'Marketing', value: 15 },
    { label: 'Autres', value: 5 },
  ]);

  const updateServicePrice = async (id: string, name: string, currentPrice: number) => {
    const newPrice = prompt(`Nouveau prix pour "${name}" (FCFA) :`, currentPrice.toString());
    if (newPrice && !isNaN(parseInt(newPrice))) {
      const priceVal = parseInt(newPrice);
      const success = await airtableService.updateService(id, {
        [AIRTABLE_CONFIG.FIELDS.SERVICES.SETUP_PRICE]: priceVal
      });
      
      if (success) {
        setServices(services.map(s => s.id === id ? { ...s, [AIRTABLE_CONFIG.FIELDS.SERVICES.SETUP_PRICE]: priceVal } : s));
        toast.success(`Le prix de "${name}" a été mis à jour !`);
      } else {
        toast.error("Échec de la mise à jour sur Airtable.");
      }
    }
  };

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
              <div className="mb-6 h-16 w-16 overflow-hidden rounded-xl border-2 border-lime-ia shadow-lg group-hover:scale-110 transition-transform">
                <img 
                  src={getServiceLogo(sol[AIRTABLE_CONFIG.FIELDS.SERVICES.NAME])} 
                  alt={sol[AIRTABLE_CONFIG.FIELDS.SERVICES.NAME]} 
                  className="h-full w-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
              <h3 className="text-xl font-bold text-deep-blue mb-2">{sol[AIRTABLE_CONFIG.FIELDS.SERVICES.NAME]}</h3>
              <p className="text-[12px] text-deep-blue/60 mb-6 leading-relaxed">{sol[AIRTABLE_CONFIG.FIELDS.SERVICES.DESCRIPTION]}</p>
              
              <div className="pt-6 border-t border-deep-blue/10 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-[9px] uppercase font-bold text-deep-blue/40">À partir de</p>
                    <button 
                      onClick={() => updateServicePrice(sol.id, sol[AIRTABLE_CONFIG.FIELDS.SERVICES.NAME], sol[AIRTABLE_CONFIG.FIELDS.SERVICES.SETUP_PRICE] as number || 0)}
                      className="p-1 hover:bg-lime-ia/10 rounded text-lime-ia transition-colors"
                      title="Modifier le prix dans le catalogue"
                    >
                      <Edit2 size={10} />
                    </button>
                  </div>
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
              className="premium-card p-4 flex items-center gap-4 ai-glow group"
            >
              <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-lime-ia/30">
                <img 
                  src={getServiceLogo(service[AIRTABLE_CONFIG.FIELDS.SERVICES.NAME])} 
                  alt={service[AIRTABLE_CONFIG.FIELDS.SERVICES.NAME]} 
                  className="h-full w-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="flex-1">
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

      {/* Allocation Ressources Section */}
      <section className="space-y-6">
        <h2 className="text-sm font-bold uppercase tracking-widest text-deep-blue/60 border-l-2 border-lime-ia pl-4">Allocation Ressources</h2>
        <div className="premium-card p-6 ai-glow">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {allocation.map((item, i) => (
              <div key={i} className="space-y-3 group">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase text-deep-blue/40 tracking-wider">{item.label}</span>
                    <button 
                      onClick={() => handleEditAllocation(i)}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:bg-deep-blue/5 rounded text-deep-blue/20 hover:text-deep-blue transition-all"
                    >
                      <Edit2 size={10} />
                    </button>
                  </div>
                  <span className="text-sm font-bold text-lime-ia">{item.value}%</span>
                </div>
                <div className="w-full h-1.5 bg-deep-blue/5 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${item.value}%` }}
                    className="h-full bg-lime-ia shadow-[0_0_10px_rgba(131,197,1,0.2)]"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};
