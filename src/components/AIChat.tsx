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
  Volume2
} from 'lucide-react';
import { airtableService } from '../lib/airtable';
import { toast } from 'sonner';
import { cn } from '../lib/utils';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export const AIChat: React.FC = () => {
  const [messages, setMessages] = useState<{ role: 'user' | 'model'; content: string }[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [context, setContext] = useState<string>('');
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

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });
      
      const prompt = `Tu es le Hub Intelligent de DOULIA, une société de conseil en IA au Cameroun.
      
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
          <div className="h-full flex flex-col items-center justify-center text-center space-y-8 opacity-60">
            <div className="max-w-md">
              <h3 className="text-2xl font-black text-deep-blue mb-3 uppercase tracking-tight">Hub Intelligent DOULIA</h3>
              <p className="text-sm text-deep-blue/60 font-medium">
                Expertise contextuelle en IA pour le marché camerounais. <br/>
                Posez vos questions stratégiques ci-dessous.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4 w-full max-w-2xl">
              {['Opportunités distribution Douala', 'Analyse concurrence IA', 'Résumé clients actifs', 'Idées nouveaux services'].map((hint) => (
                <button 
                  key={hint}
                  onClick={() => setInput(hint)}
                  className="p-4 bg-white border border-deep-blue/5 rounded-2xl text-xs text-deep-blue/60 hover:bg-lime-ia/5 hover:border-lime-ia/30 transition-all text-left font-bold shadow-sm"
                >
                  {hint}
                </button>
              ))}
            </div>
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
