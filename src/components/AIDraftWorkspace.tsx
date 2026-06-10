import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, PenTool, Sparkles, Brain, Check, Loader2, Send, 
  RefreshCw, Copy, FileText, AlertTriangle, Lightbulb, 
  TrendingUp, Download, Eye, Edit3
} from 'lucide-react';
import { toast } from 'sonner';

interface AIDraftWorkspaceProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'project' | 'task';
  itemId: string;
  itemTitle: string;
  initialDescription?: string;
  onSave?: (updatedText: string | any) => Promise<void>;
}

export const AIDraftWorkspace: React.FC<AIDraftWorkspaceProps> = ({
  isOpen,
  onClose,
  type,
  itemId,
  itemTitle,
  initialDescription = '',
  onSave
}) => {
  const [draftText, setDraftText] = useState('');
  const [aiResponseText, setAiResponseText] = useState('');
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [activeAIAction, setActiveAIAction] = useState<string | null>(null);
  const [customPrompt, setCustomPrompt] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const [previewMode, setPreviewMode] = useState<boolean>(false);

  // Load from local storage or initial values on open
  useEffect(() => {
    if (isOpen) {
      const savedDraft = localStorage.getItem(`doulia_draft_${type}_${itemId}`);
      if (savedDraft) {
        setDraftText(savedDraft);
      } else {
        setDraftText(initialDescription || '');
      }
      setAiResponseText('');
      setAiSuggestions([]);
    }
  }, [isOpen, itemId, type, initialDescription]);

  // Auto-save draft locally as they type to prevent data loss
  const handleTextChange = (text: string) => {
    setDraftText(text);
    localStorage.setItem(`doulia_draft_${type}_${itemId}`, text);
  };

  const handleAIRequest = async (action: 'brainstorm' | 'specs' | 'risks' | 'pitch' | 'custom-chat') => {
    if (action === 'custom-chat' && !customPrompt.trim()) {
      toast.error("Vezillez saisir une instruction pour l'IA.");
      return;
    }

    setActiveAIAction(action);
    try {
      const response = await fetch("/api/ai/draft-assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          title: itemTitle,
          currentDraft: draftText,
          action,
          userInput: customPrompt
        })
      });

      const data = await response.json();
      if (data.success) {
        setAiResponseText(data.refinedText);
        setAiSuggestions(data.aiSuggestions || []);
        toast.success("Gemini a optimisé votre brouillon ! ✨");
        if (action === 'custom-chat') {
          setCustomPrompt('');
        }
      } else {
        toast.error(data.error || "Impossible d'obtenir une suggestion IA.");
      }
    } catch (err: any) {
      console.error(err);
      toast.error("Erreur de connexion avec le serveur IA.");
    } finally {
      setActiveAIAction(null);
    }
  };

  const insertAiText = () => {
    if (!aiResponseText) return;
    const combined = draftText 
      ? `${draftText}\n\n--- AJOUT CONCEPTION IA ---\n\n${aiResponseText}` 
      : aiResponseText;
    handleTextChange(combined);
    toast.success("Texte IA inséré dans votre brouillon !");
  };

  const copyDraftToClipboard = () => {
    navigator.clipboard.writeText(draftText);
    setIsCopied(true);
    toast.success("Brouillon copié dans le presse-papiers !");
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleSaveAndSync = async () => {
    try {
      // Save locally first
      localStorage.setItem(`doulia_draft_${type}_${itemId}`, draftText);
      
      if (onSave) {
        await onSave(draftText);
      }
      toast.success("Brouillon enregistré et synchronisé !");
      onClose();
    } catch (error: any) {
      toast.error("Erreur lors de la synchronisation : " + error.message);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div id={`workspace-modal-${itemId}`} className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-deep-blue/40 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.98, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.98, y: 15 }}
          className="bg-slate-900 border border-white/10 rounded-3xl w-full max-w-6xl h-[90vh] flex flex-col overflow-hidden shadow-2xl"
        >
          {/* Header */}
          <div className="px-8 py-5 border-b border-white/10 bg-white/[0.02] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-lime-ia/10 rounded-xl text-lime-ia">
                <Brain size={22} className="animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase font-black tracking-widest px-2 py-0.5 bg-lime-ia/20 text-lime-ia rounded">
                    Brouillon Stratégique IA
                  </span>
                  <span className="text-white/40 text-[10px]">•</span>
                  <span className="text-white/50 text-[11px] font-bold uppercase">{type === 'project' ? 'Projet' : 'Tâche'}</span>
                </div>
                <h3 className="text-lg font-black text-white mt-0.5 leading-snug truncate max-w-lg">
                  {itemTitle}
                </h3>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <button 
                onClick={copyDraftToClipboard}
                className="p-2 bg-white/5 hover:bg-white/10 text-white/70 rounded-xl transition-all flex items-center gap-1.5 text-xs font-bold"
                title="Copier tout"
              >
                {isCopied ? <Check size={14} className="text-lime-ia" /> : <Copy size={14} />}
                <span>Copier</span>
              </button>
              <button 
                onClick={onClose}
                className="p-2 bg-white/5 hover:bg-white/10 text-white/50 hover:text-white rounded-full transition-all"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Grid Panel Workspace */}
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden h-full">
            
            {/* Left Column: Rich Draft Editor Workspace (7 cols) */}
            <div className="lg:col-span-7 flex flex-col p-6 border-r border-white/10 h-full bg-slate-950/60">
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-2">
                  <PenTool size={16} className="text-lime-ia" />
                  <span className="text-xs font-bold text-white/85 uppercase tracking-wide">Zone de Conception & de Saisie</span>
                </div>
                <div className="flex items-center gap-1 bg-white/5 rounded-lg p-1 border border-white/10">
                  <button 
                    onClick={() => setPreviewMode(false)}
                    className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded transition-all ${!previewMode ? 'bg-lime-ia text-slate-900' : 'text-white/50 hover:text-white'}`}
                  >
                    Rédiger
                  </button>
                  <button 
                    onClick={() => setPreviewMode(true)}
                    className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded transition-all ${previewMode ? 'bg-lime-ia text-slate-900' : 'text-white/50 hover:text-white'}`}
                  >
                    Aperçu
                  </button>
                </div>
              </div>

              {previewMode ? (
                <div className="flex-1 bg-white/5 border border-white/10 rounded-2xl p-5 overflow-y-auto text-sm text-white/80 leading-relaxed font-mono whitespace-pre-wrap select-text scrollbar-thin">
                  {draftText ? draftText : "Aucun texte écrit. Utilisez le mode 'Rédiger' ou demandez de l'aide à Gemini ci-contre pour structurer votre document !"}
                </div>
              ) : (
                <div className="flex-1 relative">
                  <textarea
                    value={draftText}
                    onChange={(e) => handleTextChange(e.target.value)}
                    className="w-full h-full bg-slate-950 border border-white/10 rounded-2xl p-5 text-sm font-sans text-white placeholder-white/20 leading-relaxed focus:outline-none focus:border-lime-ia transition-all resize-none scrollbar-thin focus:ring-1 focus:ring-lime-ia/30"
                    placeholder="Saisissez ici les objectifs, les contraintes, les détails techniques ou commerciaux de votre projet... L'IA se chargera de réécrire, structurer ou finaliser cette spécification en temps réel."
                  />
                  <div className="absolute bottom-3 right-4 text-[9px] text-white/30 font-mono">
                    {draftText.length} caractères • Sauvegarde locale auto active
                  </div>
                </div>
              )}
            </div>

            {/* Right Column: AI Utilities / Co-Pilot (5 cols) */}
            <div className="lg:col-span-5 flex flex-col p-6 bg-slate-900 overflow-y-auto h-full scrollbar-thin space-y-6">
              
              {/* AI Generative Tools */}
              <div>
                <h4 className="text-[10px] font-bold text-white/50 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                  <Sparkles size={12} className="text-lime-ia" /> 
                  Générateurs de contenu IA Doulia
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => handleAIRequest('brainstorm')}
                    disabled={activeAIAction !== null}
                    className="flex flex-col items-start p-3 bg-white/5 hover:bg-lime-ia/10 border border-white/10 hover:border-lime-ia/20 rounded-xl text-left transition-all group disabled:opacity-50"
                  >
                    <Lightbulb size={16} className="text-lime-ia mb-1.5 group-hover:scale-110 transition-transform" />
                    <span className="text-xs font-bold text-white leading-tight">Brainstorming</span>
                    <span className="text-[9px] text-white/40 mt-0.5 font-medium">Lister idées & jalons</span>
                  </button>

                  <button
                    onClick={() => handleAIRequest('specs')}
                    disabled={activeAIAction !== null}
                    className="flex flex-col items-start p-3 bg-white/5 hover:bg-lime-ia/10 border border-white/10 hover:border-lime-ia/20 rounded-xl text-left transition-all group disabled:opacity-50"
                  >
                    <FileText size={16} className="text-lime-ia mb-1.5 group-hover:scale-110 transition-transform" />
                    <span className="text-xs font-bold text-white leading-tight">Cahier des charges</span>
                    <span className="text-[9px] text-white/40 mt-0.5 font-medium">Spécificatifs techniques</span>
                  </button>

                  <button
                    onClick={() => handleAIRequest('risks')}
                    disabled={activeAIAction !== null}
                    className="flex flex-col items-start p-3 bg-white/5 hover:bg-lime-ia/10 border border-white/10 hover:border-lime-ia/20 rounded-xl text-left transition-all group disabled:opacity-50"
                  >
                    <AlertTriangle size={16} className="text-lime-ia mb-1.5 group-hover:scale-110 transition-transform" />
                    <span className="text-xs font-bold text-white leading-tight">Analyse des Risques</span>
                    <span className="text-[9px] text-white/40 mt-0.5 font-medium">Bugs, délais, blocages</span>
                  </button>

                  <button
                    onClick={() => handleAIRequest('pitch')}
                    disabled={activeAIAction !== null}
                    className="flex flex-col items-start p-3 bg-white/5 hover:bg-lime-ia/10 border border-white/10 hover:border-lime-ia/20 rounded-xl text-left transition-all group disabled:opacity-50"
                  >
                    <TrendingUp size={16} className="text-lime-ia mb-1.5 group-hover:scale-110 transition-transform" />
                    <span className="text-xs font-bold text-white leading-tight">Pitch Client / ROI</span>
                    <span className="text-[9px] text-white/40 mt-0.5 font-medium">Argumentaires de vente</span>
                  </button>
                </div>
              </div>

              {/* AI output generation preview box */}
              <div className="flex-1 bg-white/[0.03] border border-white/10 rounded-2xl p-4 flex flex-col justify-between min-h-[220px]">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] uppercase font-black tracking-wider text-lime-ia">Résultats & Suggestions IA</span>
                    {activeAIAction && (
                      <span className="flex items-center gap-1.5 text-[10px] text-lime-ia/75 font-medium">
                        <Loader2 size={10} className="animate-spin" /> Gemini rédige...
                      </span>
                    )}
                  </div>

                  {aiResponseText ? (
                    <div className="text-[11px] font-mono text-white/80 leading-relaxed max-h-48 overflow-y-auto whitespace-pre-wrap select-text pr-2 scrollbar-thin">
                      {aiResponseText}
                    </div>
                  ) : (
                    <div className="text-[11px] text-white/30 italic py-8 text-center flex flex-col h-full items-center justify-center">
                      <span>Aucune recommandation générée pour le moment.</span>
                      <span className="text-[9px] not-italic text-white/20 mt-1">Cliquez sur un outil ci-dessus ou discutez avec l'IA.</span>
                    </div>
                  )}

                  {/* Recommendations list */}
                  {aiSuggestions.length > 0 && (
                    <div className="pt-3 border-t border-white/5 space-y-1">
                      <span className="text-[9px] font-black uppercase text-white/40 tracking-wider">Pistes de réflexion Doulia :</span>
                      <ul className="space-y-1">
                        {aiSuggestions.map((sug, idx) => (
                          <li key={idx} className="text-[10px] text-lime-ia/90 flex items-start gap-1.5 leading-tight font-medium">
                            <span className="text-white/30">•</span> <span>{sug}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {aiResponseText && (
                  <button
                    onClick={insertAiText}
                    className="mt-4 w-full py-2 bg-lime-ia hover:brightness-110 text-slate-900 text-[11px] font-black uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2"
                  >
                    <Download size={13} /> Insérer le texte généré à la fin
                  </button>
                )}
              </div>

              {/* AI Chat Prompt Input */}
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest ml-1">Prendre la main / Affiner par commande</span>
                <div className="relative">
                  <input
                    type="text"
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleAIRequest('custom-chat');
                    }}
                    placeholder="Ex: Rendre le ton extrêmement technique, lister 3 cas de test..."
                    className="w-full bg-slate-950 border border-white/10 rounded-xl pl-4 pr-12 py-3 text-xs text-white placeholder-white/25 focus:outline-none focus:border-lime-ia/50"
                  />
                  <button
                    onClick={() => handleAIRequest('custom-chat')}
                    disabled={activeAIAction !== null || !customPrompt.trim()}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-lime-ia hover:bg-white/5 rounded-lg transition-all disabled:opacity-30"
                  >
                    {activeAIAction === 'custom-chat' ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {["Ajuster le ton", "Corriger la grammaire", "Ajouter un ROI détaillé"].map((pill) => (
                    <button
                      key={pill}
                      type="button"
                      onClick={() => setCustomPrompt(prev => prev ? `${prev}, et ${pill.toLowerCase()}` : pill)}
                      className="text-[9px] font-medium text-white/40 hover:text-white bg-white/5 hover:bg-white/10 px-2 py-0.5 rounded transition-all"
                    >
                      +{pill}
                    </button>
                  ))}
                </div>
              </div>

            </div>
          </div>

          {/* Footer Save Operations */}
          <div className="px-8 py-5 border-t border-white/10 bg-white/[0.02] flex items-center justify-between">
            <div className="flex items-center gap-2 text-white/30 text-[11px] font-medium">
              <Sparkles size={14} className="text-lime-ia animate-pulse" />
              <span>Assistance IA propulsée par Gemini 3.5 Flash d'élite</span>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="px-5 py-2.5 bg-white/5 hover:bg-white/10 text-white/60 hover:text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all"
              >
                Fermer
              </button>
              <button
                onClick={handleSaveAndSync}
                className="px-6 py-2.5 bg-lime-ia hover:brightness-110 text-slate-900 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 shadow-lg shadow-lime-ia/10"
              >
                <Check size={14} /> Enregistrer & Associer
              </button>
            </div>
          </div>

        </motion.div>
      </div>
    </AnimatePresence>
  );
};
