import React, { useState, useRef } from 'react';
import { motion } from 'motion/react';
import { Plus, Trash2, Download, FileCheck, Printer, Sparkles, Phone, MapPin, CreditCard, Calendar, History, Eye, RotateCcw, Wifi, WifiOff, MessageCircle, PenTool, X } from 'lucide-react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { QRCodeSVG } from 'qrcode.react';
import { toast } from 'sonner';
import SignatureCanvas from 'react-signature-canvas';
import { cn } from '../lib/utils';
import { InvoiceItem } from '../lib/airtable-schema';

import { AIRTABLE_CONFIG } from '../lib/schema';
import { airtableService } from '../lib/airtable';

interface HistoryEntry {
  id: string;
  type: 'invoice' | 'quote' | 'expense';
  number: string;
  clientName: string;
  date: string;
  total: number;
  items: InvoiceItem[];
  clientPhone: string;
  clientAddress: string;
  taxId: string;
  paymentMethod: string;
  paymentTerms: string;
  synced?: boolean;
  signature?: string;
}

export const InvoiceGenerator: React.FC = () => {
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('+237 ');
  const [clientAddress, setClientAddress] = useState('');
  const [taxId, setTaxId] = useState('');
  const [docType, setDocType] = useState<'invoice' | 'quote' | 'expense'>('invoice');
  const [paymentMethod, setPaymentMethod] = useState('Virement Bancaire / Mobile Money');
  const [paymentTerms, setPaymentTerms] = useState('30 jours');
  const [invoiceNumber, setInvoiceNumber] = useState(`${docType === 'invoice' ? 'INV' : docType === 'quote' ? 'DEV' : 'DEP'}-${Date.now().toString().slice(-6)}`);
  const [services, setServices] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [amountPaid, setAmountPaid] = useState<number>(0);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
  const [signatureData, setSignatureData] = useState<string | null>(null);
  const sigPad = useRef<any>(null);
  const [isSignatureMode, setIsSignatureMode] = useState(false);

  React.useEffect(() => {
    setInvoiceNumber(`${docType === 'invoice' ? 'INV' : docType === 'quote' ? 'DEV' : 'DEP'}-${Date.now().toString().slice(-6)}`);
    setSignatureData(null); // Reset signature when doc type changes
  }, [docType]);

  const clearSignature = () => {
    sigPad.current?.clear();
    setSignatureData(null);
  };

  const saveSignature = () => {
    if (sigPad.current?.isEmpty()) {
      toast.error("Signature vide !");
      return;
    }
    setSignatureData(sigPad.current?.getTrimmedCanvas().toDataURL('image/png'));
    setIsSignatureMode(false);
    toast.success("Signature enregistrée !");
  };

  const handleWhatsAppSend = () => {
    if (!clientPhone || clientPhone.length < 9) {
      toast.error("Numéro de téléphone client manquant ou invalide");
      return;
    }

    const typeLabel = docType === 'invoice' ? 'Facture' : docType === 'quote' ? 'Devis' : 'Dépense';
    const totalAmount = calculateTotal();
    const cleanPhone = clientPhone.replace(/\s+/g, '');
    
    const message = `*Bonjour ${clientName || 'Cher Client'}*,%0A%0AVoici votre *${typeLabel} DOULIA* n° *${invoiceNumber}*.%0A%0A*Détails :*%0A- *Montant Total :* ${totalAmount.toLocaleString()} FCFA%0A- *Date :* ${new Date().toLocaleDateString()}%0A%0A_Propulsez votre croissance par l'IA avec DOULIA._%0A%0AAccédez à vos documents via : https://douliacameroun-825a6.web.app/`;
    
    window.open(`https://wa.me/${cleanPhone.startsWith('+') ? cleanPhone.substring(1) : cleanPhone}?text=${message}`, '_blank');
    toast.success("Redirection vers WhatsApp...");
  };

  React.useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      triggerSync();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const savedHistory = localStorage.getItem('doulia_doc_history');
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error("Failed to parse history", e);
      }
    }

    const loadServices = async () => {
      setIsLoading(true);
      const data = await airtableService.getServices();
      if (data.length > 0) {
        setServices(data);
      }
      setIsLoading(false);
    };
    loadServices();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const triggerSync = async () => {
    const savedHistory = localStorage.getItem('doulia_doc_history');
    if (!savedHistory) return;
    
    let currentHistory: HistoryEntry[] = JSON.parse(savedHistory);
    let hasChanges = false;

    for (const entry of currentHistory) {
      if (!entry.synced) {
        const success = await syncEntryToAirtable(entry);
        if (success) {
          entry.synced = true;
          hasChanges = true;
        }
      }
    }

    if (hasChanges) {
      setHistory(currentHistory);
      localStorage.setItem('doulia_doc_history', JSON.stringify(currentHistory));
      toast.success("Synchronisation effectuée avec succès !");
    }
  };

  const syncEntryToAirtable = async (entry: HistoryEntry) => {
    try {
      if (entry.type === 'invoice' || entry.type === 'quote') {
        const res = await airtableService.createInvoice({
          [AIRTABLE_CONFIG.FIELDS.INVOICES.ID]: entry.number,
          [AIRTABLE_CONFIG.FIELDS.INVOICES.CLIENT]: entry.clientName,
          [AIRTABLE_CONFIG.FIELDS.INVOICES.TOTAL_AMOUNT]: entry.total,
          [AIRTABLE_CONFIG.FIELDS.INVOICES.EMISSION_DATE]: entry.date,
          [AIRTABLE_CONFIG.FIELDS.INVOICES.STATUS]: entry.type === 'invoice' ? 'Payé' : 'Brouillon'
        });
        return !!res;
      } else if (entry.type === 'expense') {
        const res = await airtableService.createExpense({
          [AIRTABLE_CONFIG.FIELDS.EXPENSES.ID]: entry.number,
          [AIRTABLE_CONFIG.FIELDS.EXPENSES.NAME]: entry.clientName, // For expense, clientName is actually the vendor/reason
          [AIRTABLE_CONFIG.FIELDS.EXPENSES.AMOUNT]: entry.total,
          [AIRTABLE_CONFIG.FIELDS.EXPENSES.DATE]: entry.date,
          [AIRTABLE_CONFIG.FIELDS.EXPENSES.CATEGORY]: 'Général',
          [AIRTABLE_CONFIG.FIELDS.EXPENSES.STATUS]: 'Payé'
        });
        return !!res;
      }
      return false;
    } catch (e) {
      console.error("Sync error:", e);
      return false;
    }
  };

  const fixedPrices = services.filter(s => s[AIRTABLE_CONFIG.FIELDS.SERVICES.TYPE] === 'Fixe');
  const variableServices = services.filter(s => s[AIRTABLE_CONFIG.FIELDS.SERVICES.TYPE] === 'Variable');

  const addItem = (description: string, price: number, type: 'fixed' | 'variable') => {
    const newItem: InvoiceItem = {
      description,
      quantity: 1,
      unitPrice: price,
      total: price,
      type
    };
    setItems([...items, newItem]);
    toast.success("Élément ajouté au document");
  };

  const addCustomItem = () => {
    addItem('Nouveau service', 0, 'variable');
  };

  const updateItem = (index: number, field: keyof InvoiceItem, value: any) => {
    const newItems = [...items];
    const item = { ...newItems[index], [field]: value };
    
    if (field === 'quantity' || field === 'unitPrice') {
      item.total = item.quantity * item.unitPrice;
    }
    
    newItems[index] = item;
    setItems(newItems);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
    toast.info("Élément supprimé");
  };

  const calculateTotal = () => {
    return items.reduce((acc, item) => acc + item.total, 0);
  };

  const saveToHistory = async () => {
    if (!clientName || items.length === 0) return;

    const newEntry: HistoryEntry = {
      id: Date.now().toString(),
      type: docType,
      number: invoiceNumber,
      clientName,
      date: new Date().toLocaleDateString(),
      total: calculateTotal(),
      items,
      clientPhone,
      clientAddress,
      taxId,
      paymentMethod,
      paymentTerms,
      synced: false
    };

    // Attempt silent sync if online
    if (navigator.onLine) {
      const synced = await syncEntryToAirtable(newEntry);
      if (synced) newEntry.synced = true;
    }

    const updatedHistory = [newEntry, ...history].slice(0, 50); // Keep last 50
    setHistory(updatedHistory);
    localStorage.setItem('doulia_doc_history', JSON.stringify(updatedHistory));
  };

  const loadFromHistory = (entry: HistoryEntry) => {
    setDocType(entry.type);
    setInvoiceNumber(entry.number);
    setClientName(entry.clientName);
    setClientPhone(entry.clientPhone);
    setClientAddress(entry.clientAddress);
    setTaxId(entry.taxId);
    setPaymentMethod(entry.paymentMethod);
    setPaymentTerms(entry.paymentTerms);
    setItems(entry.items);
    toast.success(`Document ${entry.number} chargé !`);
  };

  const deleteFromHistory = (id: string) => {
    const updatedHistory = history.filter(e => e.id !== id);
    setHistory(updatedHistory);
    localStorage.setItem('doulia_doc_history', JSON.stringify(updatedHistory));
    toast.info("Document supprimé de l'historique");
  };

  const handlePrint = async () => {
    if (!clientName) {
      toast.error("Veuillez entrer le nom du client avant d'imprimer");
      return;
    }
    await saveToHistory();
    window.print();
  };

  const exportPDF = async () => {
    if (!clientName) {
      toast.error("Veuillez entrer le nom du client");
      return;
    }
    
    await saveToHistory();
    const promise = new Promise(async (resolve, reject) => {
      try {
        const element = document.getElementById('invoice-preview');
        if (!element) throw new Error("Preview element not found");

        const canvas = await html2canvas(element, {
          scale: 2,
          useCORS: true,
          backgroundColor: '#ffffff'
        });
        
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const imgProps = pdf.getImageProperties(imgData);
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
        
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        pdf.save(`Doulia_${docType === 'invoice' ? 'Facture' : 'Devis'}_${invoiceNumber}.pdf`);
        resolve(true);
      } catch (e) {
        reject(e);
      }
    });

    toast.promise(promise, {
      loading: 'Génération du PDF...',
      success: 'PDF exporté avec succès !',
      error: 'Erreur lors de la génération du PDF',
    });
  };

  const handleMagicFill = () => {
    setClientName("Société Nationale des Hydrocarbures (SNH)");
    setClientPhone("+237 222 20 19 10");
    setClientAddress("Boulevard du 20 Mai, Yaoundé, Cameroun");
    setTaxId("M012345678901A");
    toast.success("Remplissage magique IA effectué ✨");
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-6 print:p-0">
      {/* Editor Side */}
      <div className="space-y-6 print:hidden">
        <div className="premium-card p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold flex items-center gap-2 text-deep-blue">
              <FileCheck size={24} className="text-lime-ia" />
              Générateur de Documents
            </h2>
            <div className="flex items-center gap-3">
              <div className={cn(
                "flex items-center gap-1.5 px-2 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border",
                isOnline ? "bg-green-500/10 text-green-500 border-green-500/20" : "bg-red-500/10 text-red-500 border-red-500/20"
              )}>
                {isOnline ? <Wifi size={10} /> : <WifiOff size={10} />}
                {isOnline ? "Sync Online" : "Mode Hors Ligne"}
              </div>
              <button 
                onClick={handleMagicFill}
                className="p-2 text-lime-ia hover:bg-lime-ia/10 rounded-lg transition-colors"
                title="Remplissage magique IA"
              >
                <Sparkles size={18} />
              </button>
              <div className="flex bg-cloud-gray/50 p-1 rounded-lg border border-deep-blue/10">
                <button 
                  onClick={() => setDocType('invoice')}
                  className={cn(
                    "px-3 py-1.5 rounded-md text-[11px] font-bold transition-all",
                    docType === 'invoice' ? "bg-lime-ia text-deep-blue" : "text-deep-blue/40 hover:text-deep-blue"
                  )}
                >
                  Facture
                </button>
                <button 
                  onClick={() => setDocType('quote')}
                  className={cn(
                    "px-3 py-1.5 rounded-md text-[11px] font-bold transition-all",
                    docType === 'quote' ? "bg-lime-ia text-deep-blue" : "text-deep-blue/40 hover:text-deep-blue"
                  )}
                >
                  Devis
                </button>
                <button 
                  onClick={() => setDocType('expense')}
                  className={cn(
                    "px-3 py-1.5 rounded-md text-[11px] font-bold transition-all",
                    docType === 'expense' ? "bg-red-500 text-white" : "text-deep-blue/40 hover:text-deep-blue"
                  )}
                >
                  Dépense
                </button>
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="premium-label">Nom du Client *</label>
                <input 
                  type="text" 
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="Ex: SNH Cameroun"
                  className="premium-input"
                  required
                />
              </div>
              <div>
                <label className="premium-label">Téléphone</label>
                <div className="relative">
                  <Phone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-deep-blue/30" />
                  <input 
                    type="text" 
                    value={clientPhone}
                    onChange={(e) => setClientPhone(e.target.value)}
                    className="premium-input pl-11"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="premium-label">Adresse de Facturation</label>
              <div className="relative">
                <MapPin size={16} className="absolute left-4 top-4 text-deep-blue/30" />
                <textarea 
                  value={clientAddress}
                  onChange={(e) => setClientAddress(e.target.value)}
                  placeholder="Ex: Boulevard du 20 Mai, Yaoundé"
                  className="premium-input pl-11 min-h-[80px] resize-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="premium-label">N° Contribuable (NIU)</label>
                <input 
                  type="text" 
                  value={taxId}
                  onChange={(e) => setTaxId(e.target.value)}
                  placeholder="Ex: M0123..."
                  className="premium-input"
                />
              </div>
              <div>
                <label className="premium-label">Mode de Paiement</label>
                <div className="relative">
                  <CreditCard size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-deep-blue/30" />
                  <input 
                    type="text" 
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="premium-input pl-11"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="premium-label">Conditions de Paiement</label>
              <div className="relative">
                <Calendar size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-deep-blue/30" />
                <input 
                  type="text" 
                  value={paymentTerms}
                  onChange={(e) => setPaymentTerms(e.target.value)}
                  className="premium-input pl-11"
                />
              </div>
            </div>

            <div>
              <label className="premium-label">Montant Versé (Acompte)</label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-deep-blue/30 font-bold text-xs">FCFA</div>
                  <input 
                    type="number" 
                    value={amountPaid}
                    onChange={(e) => setAmountPaid(parseInt(e.target.value) || 0)}
                    className="premium-input pl-14"
                    placeholder="0"
                  />
                </div>
                <button 
                  onClick={() => setIsSignatureMode(true)}
                  className="flex items-center gap-2 px-4 py-2 border-2 border-deep-blue text-deep-blue rounded-xl font-bold text-xs hover:bg-deep-blue hover:text-white transition-all shadow-sm"
                >
                  <PenTool size={16} /> Signer
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6 pt-4">
              <div className="space-y-3">
                <label className="premium-label flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-lime-ia" />
                  Prix Fixes (Catalogue)
                </label>
                <div className="flex flex-col gap-2 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                  {isLoading ? (
                    [1, 2, 3].map(i => <div key={i} className="h-10 skeleton rounded-xl" />)
                  ) : (
                    fixedPrices.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => addItem(p[AIRTABLE_CONFIG.FIELDS.SERVICES.NAME], p[AIRTABLE_CONFIG.FIELDS.SERVICES.SETUP_PRICE] as number || 0, 'fixed')}
                        className="text-left px-3 py-2.5 rounded-xl bg-white hover:bg-lime-ia hover:text-deep-blue text-[11px] transition-all border border-deep-blue/5 text-deep-blue font-bold shadow-sm hover:shadow-md"
                      >
                        {p[AIRTABLE_CONFIG.FIELDS.SERVICES.NAME]}
                      </button>
                    ))
                  )}
                </div>
              </div>
              
              <div className="space-y-3">
                <label className="premium-label flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                  Services Variables
                </label>
                <div className="flex flex-col gap-2 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                  {isLoading ? (
                    [1, 2].map(i => <div key={i} className="h-10 skeleton rounded-xl" />)
                  ) : (
                    variableServices.map((s) => (
                      <button
                        key={s.id}
                        onClick={() => {
                          const price = prompt(`Entrez le prix pour ${s[AIRTABLE_CONFIG.FIELDS.SERVICES.NAME]}:`, "0");
                          if (price) addItem(s[AIRTABLE_CONFIG.FIELDS.SERVICES.NAME], parseInt(price), 'variable');
                        }}
                        className="text-left px-3 py-2.5 rounded-xl bg-white hover:bg-blue-500 hover:text-white text-[11px] transition-all border border-deep-blue/5 text-deep-blue font-bold shadow-sm hover:shadow-md"
                      >
                        {s[AIRTABLE_CONFIG.FIELDS.SERVICES.NAME]}
                      </button>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="premium-card p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-bold uppercase text-deep-blue/40 tracking-widest">Lignes du document</h3>
            <button 
              onClick={addCustomItem}
              className="text-xs font-bold text-lime-ia hover:bg-lime-ia/10 px-3 py-1.5 rounded-lg transition-all flex items-center gap-1"
            >
              <Plus size={14} /> Ajouter une ligne
            </button>
          </div>
          <div className="space-y-3">
            {items.map((item, i) => (
              <motion.div 
                key={i} 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-3 p-4 bg-cloud-gray/30 rounded-xl border border-deep-blue/5"
              >
                <div className="flex gap-2">
                  <input 
                    type="text"
                    value={item.description}
                    onChange={(e) => updateItem(i, 'description', e.target.value)}
                    className="flex-1 premium-input py-2 text-sm"
                    placeholder="Description du service"
                  />
                  <button onClick={() => removeItem(i)} className="text-red-500 hover:bg-red-500/10 p-2 rounded-lg transition-colors">
                    <Trash2 size={18} />
                  </button>
                </div>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="premium-label">Prix Unitaire</label>
                    <input 
                      type="number"
                      value={item.unitPrice}
                      onChange={(e) => updateItem(i, 'unitPrice', parseInt(e.target.value) || 0)}
                      className="premium-input py-2 text-sm"
                    />
                  </div>
                  <div className="w-24">
                    <label className="premium-label">Qté</label>
                    <input 
                      type="number"
                      value={item.quantity}
                      onChange={(e) => updateItem(i, 'quantity', parseInt(e.target.value) || 0)}
                      className="premium-input py-2 text-sm"
                    />
                  </div>
                  <div className="w-32 text-right">
                    <label className="premium-label">Total</label>
                    <p className="text-sm font-bold text-deep-blue py-2">{item.total.toLocaleString()} FCFA</p>
                  </div>
                </div>
              </motion.div>
            ))}
            {items.length === 0 && (
              <div className="text-center py-12 border-2 border-dashed border-deep-blue/5 rounded-2xl">
                <FileCheck size={40} className="mx-auto text-deep-blue/10 mb-3" />
                <p className="text-deep-blue/30 text-sm font-medium">Aucun article ajouté au document</p>
              </div>
            )}
          </div>
        </div>

        {/* History Section */}
        <div className="premium-card p-6">
          <div className="flex items-center gap-2 mb-6">
            <History size={20} className="text-deep-blue/40" />
            <h3 className="text-sm font-bold uppercase text-deep-blue/40 tracking-widest">Historique Local</h3>
          </div>
          
          <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
            {history.length > 0 ? (
              history.map((entry) => (
                <div 
                  key={entry.id}
                  className="group flex items-center justify-between p-3 bg-cloud-gray/20 rounded-xl border border-deep-blue/5 hover:border-lime-ia/20 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-black",
                      entry.type === 'invoice' ? "bg-lime-ia text-deep-blue" : "bg-blue-500 text-white"
                    )}>
                      {entry.type === 'invoice' ? 'INV' : 'DEV'}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-deep-blue">{entry.clientName}</p>
                      <p className="text-[9px] text-deep-blue/40 font-bold uppercase">{entry.number} • {entry.date}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-bold text-deep-blue mr-2">{entry.total.toLocaleString()} F</p>
                    <button 
                      onClick={() => loadFromHistory(entry)}
                      className="p-1.5 hover:bg-lime-ia/10 rounded text-deep-blue/20 hover:text-lime-ia transition-colors"
                      title="Charger"
                    >
                      <RotateCcw size={14} />
                    </button>
                    <button 
                      onClick={() => deleteFromHistory(entry.id)}
                      className="p-1.5 hover:bg-red-500/10 rounded text-deep-blue/20 hover:text-red-500 transition-colors"
                      title="Supprimer"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 opacity-20">
                <History size={32} className="mx-auto mb-2" />
                <p className="text-[10px] font-bold uppercase tracking-widest">Aucun historique</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Preview Side */}
      <div className="space-y-6">
        <div className="flex justify-end gap-3 print:hidden">
          <button 
            onClick={handleWhatsAppSend}
            className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-bold text-sm transition-colors shadow-lg"
            title="Doulia Connect : Envoyer par WhatsApp"
          >
            <MessageCircle size={18} /> WhatsApp
          </button>
          <button 
            onClick={handlePrint}
            className="btn-secondary flex items-center gap-2"
          >
            <Printer size={18} /> Imprimer
          </button>
          <button 
            onClick={exportPDF}
            className="btn-primary flex items-center gap-2"
          >
            <Download size={18} /> Exporter PDF
          </button>
        </div>

        <div 
          id="invoice-preview"
          className="bg-white text-slate-900 p-12 rounded-sm shadow-2xl min-h-[842px] w-full max-w-[595px] mx-auto flex flex-col border border-slate-200 print:shadow-none print:border-none print:p-0"
        >
          {/* Header */}
          <div className="flex justify-between items-start mb-12 relative">
            <div className="absolute -top-12 -left-12 w-32 h-32 bg-lime-ia/5 rounded-full blur-3xl" />
            <div className="relative z-10">
              <div className="flex items-center gap-4 mb-6">
                <img 
                  src="https://i.postimg.cc/Y0nJdHW3/DOULIA_LOGO.jpg" 
                  alt="Logo" 
                  className="h-16 w-16 object-cover rounded-xl border-2 border-lime-ia/20 shadow-xl"
                  referrerPolicy="no-referrer"
                />
                <div>
                  <p className="font-black text-2xl text-deep-blue tracking-tighter leading-none">DOULIA</p>
                  <p className="text-[8px] font-bold text-lime-ia uppercase tracking-wider mt-1">Propulsez votre croissance par l'IA</p>
                </div>
              </div>
              <h1 className="text-5xl font-black tracking-tighter uppercase text-deep-blue/10 absolute -bottom-4 left-0 select-none pointer-events-none">
                {docType === 'invoice' ? 'Facture' : docType === 'quote' ? 'Devis' : 'Dépense'}
              </h1>
              <h1 className={cn(
                "text-3xl font-black tracking-tight uppercase relative z-10",
                docType === 'expense' ? "text-red-600" : "text-deep-blue"
              )}>
                {docType === 'invoice' ? 'Facture' : docType === 'quote' ? 'Devis' : 'Dépense'}
              </h1>
            </div>
            <div className="text-right pt-2">
              <div className={cn(
                "inline-block text-white px-4 py-2 rounded-lg mb-4",
                docType === 'expense' ? "bg-red-600" : "bg-slate-900"
              )}>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">Numéro</p>
                <p className="text-sm font-black tracking-wider">{invoiceNumber}</p>
              </div>
              <div className="space-y-0.5 text-right">
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Date d'émission</p>
                <p className="text-xs font-black text-deep-blue">{new Date().toLocaleDateString()}</p>
              </div>
            </div>
          </div>

          {/* Client Info */}
          <div className="mb-12 grid grid-cols-2 gap-8">
            <div className={cn(
              "p-5 rounded-xl border-l-4",
              docType === 'expense' ? "bg-red-50 border-red-600" : "bg-slate-50 border-lime-ia"
            )}>
              <p className="text-[10px] font-bold uppercase text-slate-400 mb-2 tracking-widest">
                {docType === 'expense' ? 'Payé à (Fournisseur)' : 'Facturé à'}
              </p>
              <p className="font-bold text-lg text-deep-blue leading-tight mb-1">{clientName || (docType === 'expense' ? 'Nom du Fournisseur' : 'Client Nom')}</p>
              {clientPhone && <p className="text-xs text-slate-600 flex items-center gap-1.5 mb-1"><Phone size={10} /> {clientPhone}</p>}
              {clientAddress && <p className="text-xs text-slate-500 flex items-start gap-1.5"><MapPin size={10} className="mt-0.5 shrink-0" /> {clientAddress}</p>}
              {taxId && <p className="text-[10px] font-bold text-deep-blue/40 mt-2">NIU: {taxId}</p>}
            </div>
            <div className="p-5">
              <p className="text-[10px] font-bold uppercase text-slate-400 mb-2 tracking-widest">Détails de Paiement</p>
              <p className="text-sm font-bold text-deep-blue mb-1">{paymentMethod}</p>
              <p className="text-[11px] text-slate-600 font-medium">Conditions: <span className="text-deep-blue">{paymentTerms}</span></p>
            </div>
          </div>

          {/* Table */}
          <div className="flex-1">
            <table className="w-full text-[11px]">
              <thead>
                <tr className={cn(
                  "text-white",
                  docType === 'expense' ? "bg-red-600" : "bg-slate-900"
                )}>
                  <th className="text-left px-5 py-4 font-black uppercase tracking-[0.15em] text-[9px] rounded-tl-xl">
                    {docType === 'expense' ? 'Désignation des Dépenses' : 'Désignation des Services'}
                  </th>
                  <th className="text-center px-4 py-4 font-black uppercase tracking-[0.15em] text-[9px]">Qté</th>
                  <th className="text-right px-4 py-4 font-black uppercase tracking-[0.15em] text-[9px]">P.U (FCFA)</th>
                  <th className="text-right px-5 py-4 font-black uppercase tracking-[0.15em] text-[9px] rounded-tr-xl">Montant (FCFA)</th>
                </tr>
              </thead>
              <tbody className="border-x border-slate-100">
                {items.map((item, i) => (
                  <tr key={i} className={cn(
                    "border-b border-slate-50 transition-colors hover:bg-slate-50/50",
                    i % 2 === 0 ? "bg-white" : "bg-slate-50/20"
                  )}>
                    <td className="px-5 py-5">
                      <p className="font-bold text-deep-blue text-xs mb-0.5">{item.description}</p>
                      <p className="text-[9px] text-slate-400 font-medium italic">Prestation de service IA & Digital</p>
                    </td>
                    <td className="text-center px-4 py-5 font-bold text-slate-600">{item.quantity}</td>
                    <td className="text-right px-4 py-5 font-medium text-slate-600">{item.unitPrice.toLocaleString()}</td>
                    <td className="text-right px-5 py-5 font-black text-deep-blue">{item.total.toLocaleString()}</td>
                  </tr>
                ))}
                {/* Summary Table Row */}
                <tr className={cn(
                  "text-white font-black text-[10px] uppercase tracking-widest border-t-2",
                  docType === 'expense' ? "bg-red-500 border-red-700" : "bg-slate-900 border-deep-blue"
                )}>
                  <td colSpan={3} className="px-5 py-4 text-right">Total Général</td>
                  <td className="px-5 py-4 text-right">{calculateTotal().toLocaleString()} FCFA</td>
                </tr>
                {/* Empty rows to maintain structure if needed */}
                {items.length < 5 && Array.from({ length: 4 - items.length }).map((_, i) => (
                  <tr key={`empty-${i}`} className="border-b border-slate-50 h-12">
                    <td className="px-5 py-4"></td>
                    <td className="px-4 py-4"></td>
                    <td className="px-4 py-4"></td>
                    <td className="px-5 py-4"></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="mt-8 flex justify-end">
            <div className="w-72 space-y-3">
              <div className="flex justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2">
                <span>Sous-total HT</span>
                <span className="text-deep-blue">{calculateTotal().toLocaleString()} FCFA</span>
              </div>
              <div className="flex justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2">
                <span>TVA (0%)</span>
                <span className="text-deep-blue">0 FCFA</span>
              </div>
              
              <div className="h-px bg-slate-100" />
              
              <div className={cn(
                "flex justify-between text-white p-4 rounded-xl shadow-lg relative overflow-hidden",
                docType === 'expense' ? "bg-red-600" : "bg-deep-blue"
              )}>
                {/* Visual Accent */}
                <div className="absolute top-0 right-0 w-16 h-16 bg-white/10 rotate-45 translate-x-8 -translate-y-8" />
                
                <div className="relative z-10 flex flex-col">
                  <span className="font-black uppercase text-[9px] tracking-[0.2em] opacity-60 mb-1">
                    {docType === 'expense' ? 'Total Sortie' : 'Total Net à Payer'}
                  </span>
                  <span className="text-xl font-black">{calculateTotal().toLocaleString()} FCFA</span>
                </div>
              </div>

              {amountPaid > 0 && (
                <>
                  <div className="flex justify-between text-[11px] font-bold text-lime-ia uppercase tracking-wider px-2 pt-1">
                    <span>Montant Versé</span>
                    <span>- {amountPaid.toLocaleString()} FCFA</span>
                  </div>
                  <div className="flex justify-between bg-lime-ia/10 border border-lime-ia/20 p-3 rounded-lg">
                    <span className="font-bold uppercase text-[9px] text-deep-blue/60 self-center">Reste à Payer</span>
                    <span className="text-sm font-black text-deep-blue">{(calculateTotal() - amountPaid).toLocaleString()} FCFA</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Validation Section */}
          <div className="mt-16 grid grid-cols-2 gap-8 items-end relative">
            {/* QR Code Security */}
            <div className="flex flex-col items-start gap-2">
              <div className="p-2 bg-white border border-slate-100 rounded-lg shadow-sm">
                <QRCodeSVG 
                  value="https://douliacameroun-825a6.web.app/"
                  size={64}
                  level="H"
                  includeMargin={false}
                />
              </div>
              <div className="space-y-0.5">
                <p className="text-[8px] font-black text-deep-blue uppercase tracking-tighter">Vérification d'Authenticité</p>
                <p className="text-[7px] text-slate-400 font-medium">Scannez pour vérifier l'originalité du document</p>
              </div>
            </div>

            {/* Signature & Digital Stamp */}
            <div className="relative flex flex-col items-center">
              {signatureData ? (
                <div className="mb-4">
                  <p className="text-[7px] text-slate-400 font-bold uppercase tracking-widest mb-1 text-center">Signature Client</p>
                  <img src={signatureData} alt="Signature" className="h-16 w-auto object-contain border-b border-slate-100" />
                </div>
              ) : (
                <div 
                  onClick={() => setIsSignatureMode(true)}
                  className="mb-4 p-4 border border-dashed border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors print:hidden"
                >
                  <p className="text-[8px] font-bold text-slate-300 uppercase">Signature Client</p>
                </div>
              )}
              
              {/* Digital Stamp (Cachet) - Optimized for print/PDF visibility */}
              <div className="absolute -top-12 right-0 w-40 h-40 rounded-full border-[4px] border-blue-900/40 flex items-center justify-center rotate-12 pointer-events-none z-10 print:opacity-100">
                <div className="w-[140px] h-[140px] rounded-full border-2 border-dashed border-blue-900/30 flex flex-col items-center justify-center p-3 text-center relative bg-white/20 backdrop-blur-[1px]">
                  {/* Circular Text (Simulated) */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-full h-full rounded-full border border-dashed border-blue-900/10 animate-[spin_20s_linear_infinite]" />
                  </div>
                  
                  <img 
                    src="https://i.postimg.cc/Y0nJdHW3/DOULIA_LOGO.jpg" 
                    alt="Stamp Logo" 
                    className="w-12 h-12 object-cover rounded-full mb-1.5 opacity-60 grayscale contrast-125"
                    referrerPolicy="no-referrer"
                  />
                  <p className="text-[9px] font-black text-blue-900/70 uppercase tracking-widest leading-none">DOULIA</p>
                  <div className="h-px w-10 bg-blue-900/30 my-1" />
                  <p className="text-[8px] font-bold text-blue-900/60 uppercase leading-tight">
                    Direction Générale<br/>Douala - Cameroun
                  </p>
                  <p className="text-[6px] font-bold text-blue-900/40 mt-1 uppercase tracking-tighter">Approuvé le {new Date().toLocaleDateString()}</p>
                </div>
              </div>

              {/* Signature Area */}
              <div className="text-center z-10">
                <p className="text-[10px] font-bold uppercase text-slate-400 mb-6 tracking-widest">Le Directeur Général</p>
                <div className="relative inline-block">
                  <p className="font-handwriting text-5xl text-blue-900/90 -rotate-2 mb-2 select-none filter drop-shadow-[0.5px_0.5px_0px_rgba(30,58,138,0.3)] tracking-tight skew-x-[-2deg]">
                    Marc Bagnack
                  </p>
                  {/* Signature Flourish - Complex Path */}
                  <svg className="absolute -bottom-6 -left-8 w-64 h-16 text-blue-900/20 pointer-events-none" viewBox="0 0 200 60">
                    <path 
                      d="M10,40 Q40,10 80,40 T150,30 Q180,20 195,50 M15,45 Q60,35 120,45" 
                      fill="none" 
                      stroke="currentColor" 
                      strokeWidth="1.2" 
                      strokeLinecap="round"
                      className="opacity-30"
                    />
                  </svg>
                  <div className="w-48 h-px bg-slate-200 mx-auto mt-2" />
                </div>
                <p className="text-[11px] font-black text-deep-blue mt-4 tracking-tight">Marc Bagnack</p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-auto pt-6 border-t border-slate-100">
            <p className="text-[10px] font-bold text-deep-blue text-center mb-3 italic">
              "L'IA n'est pas un coût, c'est un investissement dont le ROI est visible dès le premier mois."
            </p>
            <div className="flex flex-wrap justify-center items-center gap-x-6 gap-y-2 text-[9px] font-bold text-slate-500">
              <div className="flex items-center gap-1.5">
                <div className="w-1 h-1 rounded-full bg-lime-ia" />
                <span className="text-deep-blue">TEL : 6 56 30 48 18 / 6 73 04 31 27</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-1 h-1 rounded-full bg-lime-ia" />
                <span className="text-deep-blue">contact@doulia.cm</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-1 h-1 rounded-full bg-lime-ia" />
                <span className="text-deep-blue">www.doulia.cm</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-1 h-1 rounded-full bg-lime-ia" />
                <span>Merci pour votre confiance.</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-1 h-1 rounded-full bg-lime-ia" />
                <span>Généré par Doulia Finance Hub</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-1 h-1 rounded-full bg-lime-ia" />
                <span className="uppercase">DOULIA - RC/DLA/2024/B/1234</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Signature Modal */}
      {isSignatureMode && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-deep-blue/80 backdrop-blur-sm p-4">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-3xl p-8 w-full max-w-lg shadow-2xl overflow-hidden relative"
          >
            <button 
              onClick={() => setIsSignatureMode(false)}
              className="absolute top-6 right-6 p-2 text-deep-blue/20 hover:text-deep-blue transition-colors"
            >
              <X size={24} />
            </button>

            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-lime-ia/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <PenTool className="text-lime-ia" size={32} />
              </div>
              <h2 className="text-2xl font-black text-deep-blue">Signature Électronique</h2>
              <p className="text-sm text-deep-blue/40 mt-2">Signez directement sur l'écran pour certifier le document.</p>
            </div>

            <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl p-4 mb-8">
              <SignatureCanvas 
                ref={sigPad}
                penColor="#001529"
                canvasProps={{
                  className: "w-full h-64 cursor-crosshair rounded-xl",
                  id: "signature-canvas"
                }}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={clearSignature}
                className="btn-secondary py-3"
              >
                Effacer
              </button>
              <button 
                onClick={saveSignature}
                className="btn-primary py-3"
              >
                Valider & Fermer
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};
