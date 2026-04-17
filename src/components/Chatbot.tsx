import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, X, Minimize2, Maximize2, Sparkles, Mic, Globe } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from '../lib/utils';
import { airtableService } from '../lib/airtable';
import { AIRTABLE_CONFIG } from '../lib/schema';

interface Message {
  role: 'user' | 'bot';
  content: string;
}

const mapAirtableData = (data: any[], tableFields: any) => {
  return data.map(record => {
    const mapped: any = { id: record.id };
    Object.entries(tableFields).forEach(([key, id]) => {
      if (record[id as string] !== undefined) {
        mapped[key] = record[id as string];
      }
    });
    return mapped;
  });
};

export const Chatbot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    { role: 'bot', content: 'Bonjour ! Je suis votre **expert-stratège Doulia**. Comment puis-je vous accompagner dans votre croissance aujourd\'hui ?' }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const searchWeb = async (query: string) => {
    const apiKey = process.env.TAVILY_KEY;
    if (!apiKey || apiKey === '' || apiKey === 'undefined') return null;
    
    setIsSearching(true);
    try {
      const response = await fetch('https://api.tavily.com/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_key: apiKey,
          query: query,
          search_depth: "basic",
          max_results: 3
        })
      });
      const data = await response.json();
      return data.results?.map((r: any) => `Source: ${r.title}\nContent: ${r.content}`).join('\n\n') || null;
    } catch (error) {
      console.error('Tavily Error:', error);
      return null;
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen, isMinimized]);

  const handleVoiceInput = () => {
    console.log("Voice input triggered - SpeechRecognition stub");
    alert("La reconnaissance vocale sera bientôt disponible !");
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      // Fetch both web search results and Airtable business data in parallel
      const [searchResults, businessData] = await Promise.all([
        searchWeb(userMessage),
        Promise.all([
          airtableService.getClients(),
          airtableService.getProjects(),
          airtableService.getBudgets(),
          airtableService.getInvoices()
        ])
      ]);

      const [clients, projects, budgets, invoices] = businessData;
      
      // Map Airtable data to readable names for the AI
      const mappedClients = mapAirtableData(clients, AIRTABLE_CONFIG.FIELDS.CLIENTS);
      const mappedProjects = mapAirtableData(projects, AIRTABLE_CONFIG.FIELDS.PROJECTS);
      const mappedBudgets = mapAirtableData(budgets, AIRTABLE_CONFIG.FIELDS.BUDGETS);
      const mappedInvoices = mapAirtableData(invoices, AIRTABLE_CONFIG.FIELDS.INVOICES);

      const businessContext = `
      ${localStorage.getItem('doulia_ai_instructions') ? `INSTRUCTIONS SYSTÈME PERSONNALISÉES : ${localStorage.getItem('doulia_ai_instructions')}` : ''}

      CONTEXTE BUSINESS RÉEL (AIRTABLE) :
      - Clients : ${JSON.stringify(mappedClients)}
      - Projets : ${JSON.stringify(mappedProjects)}
      - Budgets : ${JSON.stringify(mappedBudgets)}
      - Factures : ${JSON.stringify(mappedInvoices)}
      `;
      
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [{ role: 'user', parts: [{ text: userMessage }] }],
        config: {
          systemInstruction: `Tu es l'expert Doulia, aide à la décision sur le marché Camerounais. 
          Personnalité : Expert-comptable, stratège commercial, et spécialiste du marché camerounais.
          Mission : Accompagner les entreprises camerounaises dans leur transformation numérique et optimisation financière via l'IA.
          
          TU AS ACCÈS AUX DONNÉES RÉELLES DE L'ENTREPRISE CI-DESSOUS. ANALYSE-LES POUR RÉPONDRE PRÉCISÉMENT.
          
          ${businessContext}
          
          ${searchResults ? `Voici des informations récentes trouvées sur le web pour t'aider :\n${searchResults}` : ''}
          
          Directives de rendu (STRICTES) :
          1. ANALYSE DE DONNÉES : Utilise les données Airtable fournies pour donner des chiffres précis (MRR, nombre de clients, état des projets, etc.) si la question le demande.
          2. SÉPARATION DES PARAGRAPHES : Utilise des doubles sauts de ligne pour bien séparer les idées.
          3. LISTES NUMÉROTÉES : Utilise des listes numérotées (1., 2., etc.) pour les étapes ou les énumérations.
          4. OPPORTUNITÉS : À la fin de CHAQUE réponse, ajoute une section intitulée "**Opportunités Doulia**" où tu proposes des offres de services, des idées marketing ou des opportunités de marché spécifiques pour Doulia basées sur la discussion et les données.
          5. FORMATAGE : Utilise le gras (**) pour les mots-clés et les titres. NE JAMAIS UTILISER DE BALISES HTML OU D'ASTÉRISQUES (*) POUR LES LISTES.
          6. LANGUE : Français uniquement.`,
        }
      });

      const botResponse = response.text || "Désolé, je n'ai pas pu traiter votre demande.";
      setMessages(prev => [...prev, { role: 'bot', content: botResponse }]);
    } catch (error) {
      console.error('Gemini Error:', error);
      setMessages(prev => [...prev, { role: 'bot', content: "Une erreur est survenue lors de la connexion à mon cerveau IA. Veuillez réessayer." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(true)}
        className={cn(
          "fixed bottom-6 right-6 z-[100] w-14 h-14 rounded-full shadow-2xl overflow-hidden border-2 border-lime-ia/50 ai-glow",
          isOpen && "hidden"
        )}
      >
        <img 
          src="https://i.postimg.cc/BQT208Q9/Generated_Image_November_15_2025_3_43PM_(1).png" 
          alt="AI Assistant" 
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ 
              opacity: 1, 
              y: 0, 
              scale: 1,
              height: isMinimized ? '56px' : '600px'
            }}
            exit={{ opacity: 0, y: 50, scale: 0.95 }}
            className="fixed bottom-6 right-6 z-[100] w-[400px] premium-card shadow-2xl flex flex-col overflow-hidden border-lime-ia/20 ai-glow"
          >
            <div className="p-3 bg-lime-ia flex items-center justify-between text-deep-blue">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full overflow-hidden border border-deep-blue/20">
                  <img 
                    src="https://i.postimg.cc/BQT208Q9/Generated_Image_November_15_2025_3_43PM_(1).png" 
                    alt="AI" 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div>
                  <h3 className="font-display font-bold text-xs text-deep-blue">Doulia AI Assistant</h3>
                  <div className="flex items-center gap-1">
                    <div className="w-1 h-1 rounded-full bg-deep-blue animate-pulse" />
                    <span className="text-[9px] uppercase font-bold opacity-70">Expert Stratège</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => setIsMinimized(!isMinimized)} className="p-1 hover:bg-black/10 rounded transition-colors">
                  {isMinimized ? <Maximize2 size={14} /> : <Minimize2 size={14} />}
                </button>
                <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-black/10 rounded transition-colors">
                  <X size={14} />
                </button>
              </div>
            </div>

            {!isMinimized && (
              <>
                <div 
                  ref={scrollRef}
                  className="flex-1 overflow-y-auto p-4 space-y-4 bg-cloud-gray/50"
                >
                  {messages.map((msg, i) => (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      key={i}
                      className={cn(
                        "max-w-[90%] p-3 rounded-2xl text-[13px] leading-relaxed font-sans shadow-sm",
                        msg.role === 'user' 
                          ? "ml-auto bg-lime-ia text-deep-blue rounded-tr-none font-medium" 
                          : "mr-auto bg-pure-white text-deep-blue border border-deep-blue/5 rounded-tl-none"
                      )}
                    >
                      <div className="markdown-body prose prose-sm max-w-none">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {msg.content}
                        </ReactMarkdown>
                      </div>
                    </motion.div>
                  ))}
                  {isLoading && (
                    <div className="flex flex-col gap-2">
                      {isSearching && (
                        <div className="flex items-center gap-2 text-[10px] text-lime-ia font-bold uppercase tracking-widest animate-pulse">
                          <Globe size={10} />
                          Recherche sur le web...
                        </div>
                      )}
                      <div className="flex gap-1.5 p-2.5 bg-pure-white rounded-xl w-fit shadow-sm">
                        <div className="w-1.5 h-1.5 bg-lime-ia rounded-full animate-bounce [animation-delay:-0.3s]" />
                        <div className="w-1.5 h-1.5 bg-lime-ia rounded-full animate-bounce [animation-delay:-0.15s]" />
                        <div className="w-1.5 h-1.5 bg-lime-ia rounded-full animate-bounce" />
                      </div>
                    </div>
                  )}
                </div>

                <div className="p-3 border-t border-deep-blue/5 bg-pure-white">
                  <div className="relative flex items-center gap-2">
                    <div className="relative flex-1">
                      <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        placeholder="Posez votre question stratégique..."
                        className="w-full bg-cloud-gray/50 border border-deep-blue/10 rounded-lg py-2.5 pl-3 pr-10 text-[13px] focus:outline-none focus:border-lime-ia/50 transition-colors text-deep-blue"
                      />
                      <button
                        onClick={handleVoiceInput}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-deep-blue/40 hover:text-lime-ia transition-colors"
                      >
                        <Mic size={14} />
                      </button>
                    </div>
                    <button
                      onClick={handleSend}
                      disabled={isLoading}
                      className="p-2.5 bg-lime-ia text-deep-blue rounded-lg hover:scale-105 transition-transform disabled:opacity-50 shadow-lg shadow-lime-ia/20"
                    >
                      <Send size={16} />
                    </button>
                  </div>
                  <div className="mt-2 flex items-center justify-center gap-1 text-[9px] text-deep-blue/20 uppercase tracking-widest font-bold">
                    <Sparkles size={8} />
                    Doulia Intelligence Hub
                  </div>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
