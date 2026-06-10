import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Send, Bot, Sparkles, Loader2, BrainCircuit, Search, 
  PlusCircle, RefreshCw, Mic, Volume2, Globe, 
  Database, Users, Trash2, Copy, Check, Info, MicOff, VolumeX
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
  const [sessionId, setSessionId] = useState(() => `sess_${Math.random().toString(36).substr(2, 9)}`);
  
  // Audio & Speech states
  const [isListening, setIsListening] = useState(false);
  const [speakingMsgIdx, setSpeakingMsgIdx] = useState<number | null>(null);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    loadContext();
    initSpeechRecognition();
    return () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const loadContext = async () => {
    try {
      const [clients, veille] = await Promise.all([
        airtableService.getClients(),
        airtableService.getSocialPosts()
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

  // Initialize Speech Dictation (Web Speech API)
  const initSpeechRecognition = () => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const rec = new SpeechRecognition();
        rec.continuous = false;
        rec.interimResults = false;
        rec.lang = 'fr-FR';
        
        rec.onstart = () => {
          setIsListening(true);
          toast.info("Reconnaissance vocale activée. Parlez...");
        };
        
        rec.onresult = (event: any) => {
          const text = event.results[0][0].transcript;
          if (text) {
            setInput(prev => prev ? `${prev} ${text}` : text);
            toast.success("Voix convertie en texte !");
          }
        };
        
        rec.onerror = (e: any) => {
          console.error("Speech Recognition error", e);
          setIsListening(false);
          toast.error("Impossible de capturer l'audio.");
        };
        
        rec.onend = () => {
          setIsListening(false);
        };
        
        recognitionRef.current = rec;
      }
    }
  };

  const toggleSpeechInput = () => {
    if (!recognitionRef.current) {
      toast.error("La dictation vocale n'est pas supportée par votre navigateur (Utilisez Google Chrome/Edge).");
      return;
    }
    
    if (isListening) {
      recognitionRef.current.stop();
    } else {
      try {
        recognitionRef.current.start();
      } catch (e) {
        console.error(e);
      }
    }
  };

  // Speech Synthesis (Text-to-Speech)
  const speakMessage = (text: string, index: number) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      toast.error("La synthèse vocale n'est pas compatible avec votre navigateur.");
      return;
    }
    
    if (speakingMsgIdx === index) {
      window.speechSynthesis.cancel();
      setSpeakingMsgIdx(null);
      toast.info("Lecture audio arrêtée.");
      return;
    }
    
    window.speechSynthesis.cancel(); // cancel current speech
    
    // Clean markdown elements from reading stream
    const cleanText = text
      .replace(/[*#`_-]/g, ' ')
      .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1'); // clean links
      
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = 'fr-FR';
    
    utterance.onend = () => {
      setSpeakingMsgIdx(null);
    };
    
    utterance.onerror = () => {
      setSpeakingMsgIdx(null);
    };
    
    setSpeakingMsgIdx(index);
    window.speechSynthesis.speak(utterance);
    toast.success("Doulia fait la lecture à haute voix...");
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

  const handleSend = async (overridePrompt?: string) => {
    const promptToSend = overridePrompt || input.trim();
    if (!promptToSend || isLoading) return;

    if (!overridePrompt) {
      setInput('');
    }
    
    setMessages(prev => [...prev, { role: 'user', content: promptToSend }]);
    setIsLoading(true);
    
    logConversation('Utilisateur', promptToSend);

    try {
      const customInstructions = localStorage.getItem('doulia_ai_instructions') || '';
      
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, { role: 'user', content: promptToSend }],
          context,
          customInstructions
        })
      });

      const data = await response.json();
      if (data.success) {
        setMessages(prev => [...prev, { role: 'model', content: data.text }]);
        logConversation('IA', data.text);
      } else {
        toast.error(data.error || "Impossible d'obtenir une réponse de Gemini.");
      }
    } catch (error: any) {
      toast.error("L'IA de Doulia est temporairement injoignable.");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResearch = async () => {
    const query = input.trim();
    if (!query || isLoading) return;
    
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: `🔍 Recherche Approfondie : ${query}` }]);
    setIsLoading(true);

    try {
      const res = await fetch('/api/ai/research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
      });
      
      const searchData = await res.json();
      const results = searchData.results || [];
      const searchContext = results.map((r: any) => `- ${r.title} (${r.url || 'Web'}): ${r.content}`).join("\n");

      const chatPrompt = `Tu es l'Analyste Stratégique Doulia. Analyse, confronte et synthétise les résultats récents du Web listés ci-dessous pour répondre à la question : "${query}".
      
RÉSULTATS DE RECHERCHE ACTUALISÉS CONSTATÉS :
${searchContext}

Analyse la pertinence, liste 3 opportunités concrètes et génère un tableau récapitulatif détaillé d'indicateurs ou de planification avec des pourcentages de réussite / faisabilité (ex: '85%', '90%', '45%') pour que les barres de progression interactives du chat s'activent. Garde un ton professionnel et direct.`;

      const chatResponse = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: 'user', content: chatPrompt }],
          context,
          customInstructions: "L'utilisateur veut une analyse de haut impact. Intègre des tableaux standard et des pourcentages pour de superbes barres de progression."
        })
      });

      const responseData = await chatResponse.json();
      if (responseData.success) {
        setMessages(prev => [...prev, { role: 'model', content: responseData.text }]);
        logConversation('IA', responseData.text);
      } else {
        toast.error(responseData.error || "L'IA n'a pas pu formuler de synthèse des résultats Tavily.");
      }
    } catch (error) {
      console.error(error);
      toast.error("Échec de la recherche internet.");
    } finally {
      setIsLoading(false);
    }
  };

  const createProjectFromIdea = async (title: string, budget: number) => {
    const toastId = toast.loading("Création du projet IA dans Airtable...");
    try {
      const res = await fetch('/api/ai/create-project-from-veille', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, budget })
      });
      
      if (res.ok) {
        toast.success("Projet opportuniste créé et synchronisé avec succès !", { id: toastId });
      } else {
        throw new Error();
      }
    } catch (error) {
      toast.error("Erreur lors de la synchronisation de l'opportunité.", { id: toastId });
    }
  };

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(index);
    toast.success("Texte copié avec succès !");
    setTimeout(() => setCopiedIdx(null), 1500);
  };

  const clearChatSession = () => {
    setMessages([]);
    setInput('');
    setSessionId(`sess_${Math.random().toString(36).substr(2, 9)}`);
    toast.success("Nouvelle session de discussion démarrée !");
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-pure-white via-white to-cloud-gray text-deep-blue relative font-sans overflow-hidden">
      
      {/* Floating Header info badge for Doulia Core Status */}
      <div className="absolute top-4 right-6 z-10 flex items-center gap-3">
        <img 
          src="https://i.postimg.cc/hP5bwmpt/Doulia_Magique_logo.jpg" 
          alt="DOULIA Logo" 
          className="h-8 w-auto rounded opacity-60 hover:opacity-100 transition-opacity"
          referrerPolicy="no-referrer"
        />
      </div>

      {/* Main chat messages list */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 py-8 scrollbar-thin scroll-smooth"
      >
        <div className="max-w-4xl mx-auto w-full space-y-8 pb-12">
          
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center pt-10 pb-8 min-h-[60vh]">
              <motion.div 
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="w-full text-center space-y-6"
              >
                {/* Doulia Logo/Branding Header (replacing sparkles/AI badges) */}
                <div className="space-y-3">
                  <h3 className="text-4xl md:text-5xl font-black tracking-tight bg-gradient-to-r from-deep-blue to-lime-ia bg-clip-text text-transparent py-1">
                    Bonjour, que puis-je concevoir pour vous ?
                  </h3>
                  <p className="text-deep-blue/60 text-sm md:text-base font-medium max-w-xl mx-auto leading-relaxed">
                    Je suis votre hub décisionnel. J'analyse vos portefeuilles clients, filtre vos veilles technologiques au Cameroun et rédige vos livrables stratégiques.
                  </p>
                </div>

                {/* Gemini modern Suggestion bento cards Grid with Doulia Branding Colors */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-12 max-w-2xl mx-auto">
                  {[
                    { 
                      hint: "Opportunités technologiques et IA à Douala", 
                      icon: Globe, 
                      desc: "Analyse de marché, innovations portuaires et industrielles." 
                    },
                    { 
                      hint: "Préparer un cahier des charges de CRM", 
                      icon: BrainCircuit, 
                      desc: "Rédiger des spécifications et scénarios fonctionnels complets." 
                    },
                    { 
                      hint: "Résumé complet de mon portefeuille clients", 
                      icon: Users, 
                      desc: "Synthétiser l'état actuel et dégager le ROI potentiel." 
                    },
                    { 
                      hint: "Identifier les risques d'une solution d'automatisation", 
                      icon: Database, 
                      desc: "Bugs critiques, surcoûts et méthodologies d'atténuation." 
                    }
                  ].map((item, idx) => (
                    <button 
                      key={idx}
                      onClick={() => handleSend(item.hint)}
                      className="group p-5 bg-pure-white border border-deep-blue/10 rounded-2xl text-left transition-all hover:bg-cloud-gray/20 hover:border-lime-ia/40 hover:shadow-md"
                    >
                      <div className="flex items-start gap-4">
                        <div className="p-3 bg-deep-blue/5 rounded-xl text-deep-blue group-hover:scale-110 group-hover:bg-lime-ia/10 group-hover:text-lime-ia transition-all">
                          <item.icon size={18} />
                        </div>
                        <div>
                          <div className="text-sm font-bold text-deep-blue group-hover:text-deep-blue transition-colors">{item.hint}</div>
                          <div className="text-[11px] text-deep-blue/50 mt-1 leading-snug">{item.desc}</div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </motion.div>
            </div>
          ) : (
            messages.map((msg, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className={cn(
                  "flex w-full items-start gap-4 p-5 rounded-2xl transition-all border",
                  msg.role === 'user' 
                    ? "bg-cloud-gray/25 border-deep-blue/5 flex-row-reverse" 
                    : "bg-pure-white border-deep-blue/10 shadow-sm"
                )}
              >
                {/* Avatar Icon */}
                <div className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center shrink-0 border shadow-md",
                  msg.role === 'user'
                    ? "bg-deep-blue/5 border-deep-blue/10 text-deep-blue"
                    : "bg-lime-ia/15 border-lime-ia/30 text-lime-ia"
                )}>
                  {msg.role === 'user' ? (
                    <span className="text-xs font-black">U</span>
                  ) : (
                    <Sparkles size={16} className="animate-pulse" />
                  )}
                </div>

                {/* Message Box */}
                <div className="flex-1 space-y-3 overflow-hidden">
                  <div className="flex justify-between items-center bg-cloud-gray/35 -mx-5 -mt-5 px-5 py-2.5 rounded-t-2xl border-b border-deep-blue/5">
                    <span className={cn(
                      "text-[10px] font-black uppercase tracking-wider",
                      msg.role === 'user' ? "text-deep-blue/60" : "text-lime-ia"
                    )}>
                      {msg.role === 'user' ? 'Vous (Consultant)' : 'Hub IA Doulia'}
                    </span>
                    
                    {msg.role === 'model' && (
                      <div className="flex items-center gap-1.5">
                        <button 
                          onClick={() => handleCopy(msg.content, i)}
                          className="p-1 px-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded transition-colors flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider"
                          title="Copier"
                        >
                          {copiedIdx === i ? <Check size={10} className="text-lime-ia" /> : <Copy size={10} />}
                          <span>{copiedIdx === i ? 'Copié' : 'Copier'}</span>
                        </button>
                        
                        <button 
                          onClick={() => speakMessage(msg.content, i)}
                          className={cn(
                            "p-1 px-2 rounded transition-colors flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider",
                            speakingMsgIdx === i 
                              ? "text-red-500 bg-red-100 hover:bg-red-200" 
                              : "text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                          )}
                          title="Écouter"
                        >
                          {speakingMsgIdx === i ? <VolumeX size={10} /> : <Volume2 size={10} />}
                          <span>{speakingMsgIdx === i ? 'Arrêter' : 'Écouter'}</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Message content parsed with custom high-end rendering (Markdown support + Auto progress table) */}
                  <div className="pt-2 text-slate-800 text-sm leading-relaxed whitespace-normal break-words select-text">
                    {msg.role === 'user' ? (
                      <p className="whitespace-pre-wrap font-sans font-medium text-slate-900">{msg.content}</p>
                    ) : (
                      <div className="space-y-4">
                        <ReactMarkdown 
                          remarkPlugins={[remarkGfm]}
                          components={{
                            table: ({ children }) => (
                              <div className="my-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg">
                                <div className="overflow-x-auto">
                                  <table className="w-full border-collapse text-left">
                                    {children}
                                  </table>
                                </div>
                              </div>
                            ),
                            thead: ({ children }) => (
                              <thead className="bg-[#4285f4]/10 border-b border-slate-200 text-[10px] font-black uppercase text-[#4285f4] tracking-wider">
                                {children}
                              </thead>
                            ),
                            tbody: ({ children }) => (
                              <tbody className="divide-y divide-slate-100 bg-white">
                                {children}
                              </tbody>
                            ),
                            tr: ({ children }) => (
                              <tr className="hover:bg-slate-50/50 transition-all">
                                {children}
                              </tr>
                            ),
                            th: ({ children }) => (
                              <th className="px-5 py-3.5 text-xs font-black uppercase tracking-wider text-slate-700 text-center first:text-left">
                                {children}
                              </th>
                            ),
                            td: ({ children }) => {
                              const rawVal = React.Children.toArray(children).map(child => {
                                  if (typeof child === 'string' || typeof child === 'number') return String(child);
                                  if (child && typeof child === 'object' && 'props' in child) {
                                    return String((child as any).props.children || '');
                                  }
                                  return '';
                                }).join('');

                              const trimmedVal = rawVal.trim();
                              
                              // Auto progress bar for cell carrying a percentage (e.g. 85%)
                              if (/^\d+(\.\d+)?%$/.test(trimmedVal)) {
                                const numericVal = parseFloat(trimmedVal);
                                let barColor = 'bg-red-500';
                                if (numericVal >= 75) barColor = 'bg-lime-ia';
                                else if (numericVal >= 45) barColor = 'bg-amber-400';

                                return (
                                  <td className="px-5 py-4 text-xs font-medium text-slate-700 border-r border-slate-100">
                                    <div className="flex items-center gap-3">
                                      <span className="font-mono font-bold text-slate-900 min-w-[32px]">{trimmedVal}</span>
                                      <div className="w-20 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                                        <div className={cn("h-full rounded-full transition-all duration-500", barColor)} style={{ width: `${numericVal}%` }} />
                                      </div>
                                    </div>
                                  </td>
                                );
                              }

                              // Badges for specific keywords
                              if (["terminé", "en cours", "critique", "élevé", "actif", "high", "done", "success"].includes(trimmedVal.toLowerCase())) {
                                let badgeColor = "bg-lime-ia/10 text-lime-ia border-lime-ia/20";
                                if (["critique", "high"].includes(trimmedVal.toLowerCase())) badgeColor = "bg-red-500/10 text-red-500 border-red-500/20";
                                if (["en cours", "actif"].includes(trimmedVal.toLowerCase())) badgeColor = "bg-[#4285f4]/15 text-[#4285f4] border-[#4285f4]/30";

                                return (
                                  <td className="px-5 py-4 text-xs font-medium border-r border-slate-100">
                                    <span className={cn("inline-flex items-center px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider border", badgeColor)}>
                                      {trimmedVal}
                                    </span>
                                  </td>
                                );
                              }

                              return (
                                <td className="px-5 py-4 text-xs font-medium text-slate-600 border-r border-slate-100 leading-relaxed">
                                  {children}
                                </td>
                              );
                            },
                            p: ({ children }) => (
                              <p className="text-sm text-slate-700 leading-relaxed mb-4 font-sans whitespace-pre-line">{children}</p>
                            ),
                            h1: ({ children }) => (
                              <h1 className="text-xl font-black text-slate-900 mt-6 mb-3 tracking-tight font-sans border-b border-slate-200 pb-2">{children}</h1>
                            ),
                            h2: ({ children }) => (
                              <h2 className="text-base font-black text-slate-800 border-l-4 border-lime-ia pl-2.5 py-0.5 mt-5 mb-2.5 tracking-tight font-sans">{children}</h2>
                            ),
                            h3: ({ children }) => (
                              <h3 className="text-sm font-bold text-slate-800 mt-4 mb-2 tracking-tight font-sans">{children}</h3>
                            ),
                            li: ({ children }) => (
                              <li className="list-disc list-inside text-sm text-slate-600 mb-1.5 ml-2 font-sans">{children}</li>
                            ),
                            ol: ({ children }) => (
                              <ol className="list-decimal list-inside text-sm text-slate-700 my-4 space-y-1.5 font-sans">{children}</ol>
                            ),
                            ul: ({ children }) => (
                              <ul className="list-disc list-inside text-sm text-slate-700 my-4 space-y-1.5 font-sans">{children}</ul>
                            ),
                            strong: ({ children }) => (
                              <strong className="font-extrabold text-[#4285f4]">{children}</strong>
                            ),
                            code: ({ children }) => (
                              <code className="bg-slate-150 text-pink-600 px-1.5 py-0.5 rounded font-mono text-xs font-semibold">{children}</code>
                            )
                          }}
                        >
                          {msg.content}
                        </ReactMarkdown>
                      </div>
                    )}
                  </div>
                  
                  {/* Option to create Airtable project from message details */}
                  {msg.role === 'model' && msg.content.toLowerCase().includes('projet') && (
                    <div className="pt-3 border-t border-slate-100">
                      <button 
                        onClick={() => createProjectFromIdea("Nouveau Projet Prospect IA", 5000000)}
                        className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest bg-lime-ia hover:brightness-110 text-slate-900 px-4 py-2 rounded-xl transition-all shadow-md"
                      >
                        <PlusCircle size={13} /> Créer le Projet Prospect de Doulia
                      </button>
                    </div>
                  )}

                </div>
              </motion.div>
            ))
          )}

          {/* Glowing loading dots while awaiting Gemini */}
          {isLoading && (
            <div className="flex justify-start">
              <div className="flex items-start gap-4 p-5 rounded-2xl bg-pure-white border border-deep-blue/10 shadow-sm w-full max-w-sm">
                <div className="w-10 h-10 rounded-full bg-lime-ia/10 border border-lime-ia/20 text-lime-ia flex items-center justify-center shrink-0">
                  <Sparkles size={16} className="animate-pulse" />
                </div>
                <div className="space-y-2 flex-1 pt-1.5">
                  <span className="text-[10px] font-black uppercase tracking-wider text-deep-blue/60 block">DOULIA IA</span>
                  <div className="flex items-center gap-1.5 pt-1">
                    <span className="w-2.5 h-2.5 bg-lime-ia rounded-full animate-bounce" />
                    <span className="w-2.5 h-2.5 bg-lime-ia rounded-full animate-bounce [animation-delay:0.2s]" />
                    <span className="w-2.5 h-2.5 bg-lime-ia rounded-full animate-bounce [animation-delay:0.4s]" />
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Bottom styled Pill-shaped Input controls */}
      <div className="w-full shrink-0 px-4 pb-4 pt-3 border-t border-deep-blue/10 bg-pure-white">
        <div className="max-w-4xl mx-auto space-y-3">
          
          <div className="relative group">
            {/* Background glowing gradient aura */}
            <div className="absolute -inset-0.5 bg-gradient-to-r from-lime-ia/15 via-deep-blue/5 to-lime-ia/15 rounded-2xl blur opacity-30 group-focus-within:opacity-60 transition duration-500"></div>
            
            <div className="relative bg-cloud-gray/40 border border-deep-blue/10 rounded-2xl overflow-hidden focus-within:border-lime-ia/50 transition-colors">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Exprimez votre idée de projet, demandez une analyse locale ou écrivez..."
                className="w-full bg-transparent py-4 pl-5 pr-40 text-sm text-deep-blue placeholder:text-deep-blue/40 focus:outline-none transition-all resize-none min-h-[60px] max-h-[180px] scrollbar-thin"
              />
              
              {/* Interaction controllers inside textbox */}
              <div className="absolute right-3 bottom-2.5 flex items-center gap-1.5 bg-transparent pl-3 py-1">
                
                {/* Trash/Clear Thread Action */}
                {messages.length > 0 && (
                  <button 
                    onClick={clearChatSession}
                    className="p-2 text-deep-blue/40 hover:text-red-500 hover:bg-deep-blue/5 rounded-xl transition-all"
                    title="Démarrer un nouveau chat"
                  >
                    <Trash2 size={16} />
                  </button>
                )}

                {/* Vocal/Dictation dict */}
                <button 
                  onClick={toggleSpeechInput}
                  className={cn(
                    "p-2 rounded-xl transition-all flex items-center justify-center",
                    isListening 
                      ? "bg-red-500/25 text-red-500 animate-pulse border border-red-500/35" 
                      : "text-deep-blue/40 hover:text-lime-ia hover:bg-deep-blue/5"
                  )}
                  title={isListening ? "Arrêter la dictée" : "Saisie vocale live"}
                >
                  {isListening ? <MicOff size={16} /> : <Mic size={16} />}
                </button>

                {/* Search Deep Intelligence */}
                <button
                  onClick={handleResearch}
                  disabled={!input.trim() || isLoading}
                  className="p-2 text-deep-blue/40 hover:text-deep-blue hover:bg-deep-blue/5 rounded-xl transition-colors disabled:opacity-20"
                  title="Recherche Web Doulia Tavily"
                >
                  <Search size={16} />
                </button>

                {/* Send Button */}
                <button
                  onClick={() => handleSend()}
                  disabled={!input.trim() || isLoading}
                  className="p-2.5 bg-lime-ia text-deep-blue rounded-xl hover:brightness-110 transition-all disabled:opacity-30 disabled:hover:brightness-100 flex items-center justify-center shadow-lg"
                >
                  <Send size={15} />
                </button>

              </div>
            </div>
          </div>

          {/* Gemini footnote disclaimer */}
          <div className="flex items-center justify-center gap-1.5 text-[10px] text-deep-blue/50 select-none pb-1">
            <Info size={11} />
            <span>L’IA de Doulia peut commettre des erreurs. Assurez-vous de valider les indicateurs financiers et de ROI clés.</span>
          </div>

        </div>
      </div>

    </div>
  );
};
