import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI } from "@google/genai";
import { motion, AnimatePresence } from 'motion/react';
import { 
  Send, 
  Bot, 
  User, 
  Sparkles, 
  Loader2, 
  BrainCircuit, 
  Search, 
  PlusCircle, 
  ArrowRight,
  RefreshCw,
  Mic,
  Volume2,
  Globe,
  Database,
  Users
} from 'lucide-react';
import { airtableService } from '../lib/airtable';
import { AIRTABLE_CONFIG } from '../lib/schema';
import { toast } from 'sonner';
import { cn } from '../lib/utils';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export const AIChat: React.FC = () => {
  const [messages, setMessages] = useState<{ role: 'user' | 'model'; content: string }[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [context, setContext] = useState<string>('');
  const [sessionId] = useState(() => `sess_${Math.random().toString(36).substr(2, 9)}`);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadContext();
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const loadContext = async () => {
    try {
      const [clients, veille] = await Promise.all([
        airtableService.getClients(),
        airtableService.getSocialPosts() // Using this as proxy for veille as per previous turn
      ]);

      const clientNames = clients.map(c => (c as any).fldn2cShZ3MzzI2lc).filter(Boolean).join(", ");
      const latestVeille = veille.map(v => (v as any).fldWfOYnsvIBIIXba).filter(Boolean).slice(0, 3).join(" | ");

      setContext(`
        CONTEXTE DOULIA:
        CLIENTS ACTUELS: ${clientNames || 'Aucun client répertorié'}
        DERNIÈRES VEILLES: ${latestVeille || 'Aucune veille récente'}
      `);
    } catch (error) {
      console.error("Failed to load context:", error);
    }
  };

  const logConversation = async (role: 'Utilisateur' | 'IA', content: string) => {
    try {
      await airtableService.createChatLog({
        [AIRTABLE_CONFIG.FIELDS.CHAT_LOGS.SESSION_ID]: sessionId,
        [AIRTABLE_CONFIG.FIELDS.CHAT_LOGS.ROLE]: role,
        [AIRTABLE_CONFIG.FIELDS.CHAT_LOGS.CONTENT]: content,
        [AIRTABLE_CONFIG.FIELDS.CHAT_LOGS.TIMESTAMP]: new Date().toISOString()
      });
    } catch (err) {
      console.error("Failed to log chat to Airtable", err);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);
    
    // Log User Message
    logConversation('Utilisateur', userMessage);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });
      const customInstructions = localStorage.getItem('doulia_ai_instructions') || '';
      
      const prompt = `Tu es le Hub Intelligent de DOULIA, une société de conseil en IA au Cameroun.
      
      INSTRUCTIONS SYSTÈME PERSONNALISÉES :
      ${customInstructions}
      
      ${context}
      
      RÈGLES DE RÉPONSE :
      1. Sois expert, stratégique et orienté business.
      2. Utilise le Gras (**) pour les titres et mots-clés importants.
      3. Pas de HTML.
      4. Pas d'astérisques pour les listes (utilise des tirets).
      5. Sépare CLAIREMENT tes paragraphes par un double saut de ligne pour une lecture aérée.
      6. Si l'utilisateur parle d'une opportunité de veille, propose de créer un projet.
      
      MESSAGE UTILISATEUR : ${userMessage}`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [{ role: 'user', parts: [{ text: prompt }] }]
      });

      const aiText = response.text || "Désolé, je n'ai pas pu générer de réponse.";
      setMessages(prev => [...prev, { role: 'model', content: aiText }]);
      
      // Log AI Response
      logConversation('IA', aiText);
    } catch (error: any) {
      toast.error("Erreur de communication avec l'IA");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResearch = async () => {
    if (!input.trim() || isLoading) return;
    
    const query = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: `Recherche approfondie : ${query}` }]);
    setIsLoading(true);

    try {
      const res = await fetch('/api/ai/research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
      });
      
      const searchData = await res.json();
      const searchContext = searchData.results.map((r: any) => `${r.title}: ${r.content}`).join("\n\n");

      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });
      const prompt = `Analyse ces résultats de recherche Tavily pour DOULIA.
      RECHERCHE : ${query}
      RÉSULTATS : ${searchContext}
      
      FOURNIS :
      1. RÉSUMÉ STRATÉGIQUE (Gras pour les points clés)
      2. 3 OPPORTUNITÉS CONCRÈTES POUR DOULIA
      3. RECOMMANDATION D'ACTION
      
      Formatage : Gras (**) pour les titres, pas de HTML, pas d'astérisques pour les listes.`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [{ role: 'user', parts: [{ text: prompt }] }]
      });

      setMessages(prev => [...prev, { role: 'model', content: response.text || "" }]);
    } catch (error) {
      toast.error("Échec de la recherche IA");
    } finally {
      setIsLoading(false);
    }
  };

  const createProjectFromIdea = async (title: string, budget: number) => {
    const toastId = toast.loading("Création du projet Prospect...");
    try {
      const res = await fetch('/api/ai/create-project-from-veille', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, budget })
      });
      
      if (res.ok) {
        toast.success("Projet créé avec succès !", { id: toastId });
      } else {
        throw new Error();
      }
    } catch (error) {
      toast.error("Erreur lors de la création du projet", { id: toastId });
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] relative">
      {/* Logo Header */}
      <div className="absolute top-4 right-6 z-10 opacity-40 hover:opacity-100 transition-opacity">
        <img 
          src="https://i.postimg.cc/hP5bwmpt/Doulia_Magique_logo.jpg" 
          alt="DOULIA Logo" 
          className="h-10 w-auto rounded-lg grayscale hover:grayscale-0 transition-all"
          referrerPolicy="no-referrer"
        />
      </div>

      {/* Chat Area */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 py-4 space-y-6 custom-scrollbar"
      >
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full max-w-3xl space-y-12"
            >
              <div className="text-center space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-lime-ia/10 border border-lime-ia/20 text-lime-ia text-[10px] font-black uppercase tracking-widest mb-4">
                  <Sparkles size={12} />
                  Intelligence Artificielle Premium
                </div>
                <h3 className="text-5xl font-black text-deep-blue uppercase tracking-tighter leading-none">
                  Hub Intelligent <span className="text-lime-ia">DOULIA</span>
                </h3>
                <p className="text-lg text-deep-blue/40 font-medium max-w-2xl mx-auto italic">
                  "L'excellence stratégique propulsée par l'IA contextuelle."
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { 
                    hint: 'Opportunités distribution Douala', 
                    icon: Globe, 
                    desc: 'Analyse de marché régionale' 
                  },
                  { 
                    hint: 'Analyse concurrence IA', 
                    icon: BrainCircuit, 
                    desc: 'Veille stratégique ciblée' 
                  },
                  { 
                    hint: 'Résumé clients actifs', 
                    icon: Users, 
                    desc: 'Synthèse CRM & Portefeuille' 
                  },
                  { 
                    hint: 'Idées nouveaux services', 
                    icon: PlusCircle, 
                    desc: 'Innovation et croissance' 
                  }
                ].map((item) => (
                  <button 
                    key={item.hint}
                    onClick={() => setInput(item.hint)}
                    className="group p-5 bg-white border border-deep-blue/5 rounded-3xl text-left transition-all hover:bg-deep-blue hover:border-deep-blue shadow-sm hover:shadow-xl hover:-translate-y-1 relative overflow-hidden"
                  >
                    <div className="flex items-center gap-4 relative z-10">
                      <div className="p-3 bg-lime-ia/10 rounded-2xl text-lime-ia group-hover:bg-white/10 transition-colors">
                        <item.icon size={20} />
                      </div>
                      <div>
                        <div className="text-[11px] font-black text-lime-ia uppercase tracking-widest mb-1 opacity-0 group-hover:opacity-100 transition-opacity">Consulter</div>
                        <div className="text-sm font-bold text-deep-blue group-hover:text-white transition-colors">{item.hint}</div>
                        <div className="text-[10px] text-deep-blue/30 group-hover:text-white/40 font-medium">{item.desc}</div>
                      </div>
                    </div>
                    {/* Decorative glow */}
                    <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-lime-ia/5 rounded-full blur-2xl group-hover:bg-white/10 transition-all" />
                  </button>
                ))}
              </div>

              <div className="flex flex-wrap justify-center gap-6 opacity-30 grayscale pointer-events-none">
                <div className="flex items-center gap-2 font-black tracking-tighter text-xl">
                  <Database size={16} /> AIRTABLE
                </div>
                <div className="flex items-center gap-2 font-black tracking-tighter text-xl text-lime-ia">
                  <Sparkles size={16} /> GEMINI
                </div>
                <div className="flex items-center gap-2 font-black tracking-tighter text-xl">
                  <Search size={16} /> TAVILY
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {messages.map((msg, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-[90%] ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
              <div className="space-y-2">
                <div className={cn(
                  "prose prose-sm max-w-none prose-p:mb-6 prose-p:leading-relaxed",
                  msg.role === 'user' ? "text-deep-blue font-bold" : "text-deep-blue/80"
                )}>
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {msg.content}
                  </ReactMarkdown>
                </div>
                
                {msg.role === 'model' && (
                  <div className="flex items-center gap-3 mt-2">
                    <button className="p-1.5 text-deep-blue/20 hover:text-lime-ia transition-colors" title="Écouter la réponse">
                      <Volume2 size={16} />
                    </button>
                    {msg.content.toLowerCase().includes('projet') && (
                      <button 
                        onClick={() => createProjectFromIdea("Nouveau Projet IA", 5000000)}
                        className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest bg-deep-blue text-white px-3 py-2 rounded-lg hover:bg-deep-blue/90 transition-all shadow-lg shadow-deep-blue/10"
                      >
                        <PlusCircle size={12} /> Créer le Projet Prospect
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-xl bg-white text-lime-ia flex items-center justify-center border border-deep-blue/5 shadow-sm">
                <Loader2 size={20} className="animate-spin" />
              </div>
              <div className="p-5 bg-white rounded-2xl border border-deep-blue/5 shadow-sm">
                <div className="flex gap-1.5">
                  <span className="w-2 h-2 bg-lime-ia rounded-full animate-bounce" />
                  <span className="w-2 h-2 bg-lime-ia rounded-full animate-bounce [animation-delay:0.2s]" />
                  <span className="w-2 h-2 bg-lime-ia rounded-full animate-bounce [animation-delay:0.4s]" />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="px-4 pb-4 pt-0 max-w-xl mx-auto w-full mt-auto">
        <div className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-lime-ia/10 to-deep-blue/5 rounded-xl blur opacity-10 group-hover:opacity-20 transition duration-1000"></div>
          <div className="relative bg-white border border-deep-blue/5 rounded-lg shadow-md overflow-hidden">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Message..."
              className="w-full bg-transparent py-2 pl-4 pr-24 text-deep-blue placeholder:text-deep-blue/20 focus:outline-none transition-all resize-none min-h-[36px] max-h-[80px] text-[11px] font-medium"
            />
            <div className="absolute right-1 bottom-1 flex items-center gap-0.5">
              <button className="p-1.5 text-deep-blue/20 hover:text-lime-ia transition-colors" title="Enregistrer un message">
                <Mic size={14} />
              </button>
              <button
                onClick={handleResearch}
                disabled={!input.trim() || isLoading}
                className="p-1.5 text-deep-blue/20 hover:text-lime-ia transition-colors disabled:opacity-30"
                title="Recherche Web IA"
              >
                <Search size={14} />
              </button>
              <button
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                className="p-1.5 bg-lime-ia text-deep-blue rounded-md hover:brightness-105 transition-all disabled:opacity-50"
              >
                <Send size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
