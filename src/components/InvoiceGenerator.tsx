import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Plus, Trash2, Download, FileCheck, Printer, Sparkles, Phone, MapPin, CreditCard, Calendar } from 'lucide-react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { QRCodeSVG } from 'qrcode.react';
import { toast } from 'sonner';
import { cn } from '../lib/utils';
import { InvoiceItem } from '../lib/airtable-schema';

import { AIRTABLE_CONFIG } from '../lib/schema';
import { airtableService } from '../lib/airtable';

export const InvoiceGenerator: React.FC = () => {
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('+237 ');
  const [clientAddress, setClientAddress] = useState('');
  const [taxId, setTaxId] = useState('');
  const [docType, setDocType] = useState<'invoice' | 'quote'>('invoice');
  const [paymentMethod, setPaymentMethod] = useState('Virement Bancaire / Mobile Money');
  const [paymentTerms, setPaymentTerms] = useState('30 jours');
  const [invoiceNumber, setInvoiceNumber] = useState(`${docType === 'invoice' ? 'INV' : 'DEV'}-${Date.now().toString().slice(-6)}`);
  const [services, setServices] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

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

  const handlePrint = () => {
    if (!clientName) {
      toast.error("Veuillez entrer le nom du client avant d'imprimer");
      return;
    }
    window.print();
  };

  const exportPDF = async () => {
    if (!clientName) {
      toast.error("Veuillez entrer le nom du client");
      return;
    }
    
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
      </div>

      {/* Preview Side */}
      <div className="space-y-6">
        <div className="flex justify-end gap-3 print:hidden">
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
          <div className="flex justify-between items-start mb-12 border-b-4 border-deep-blue pb-8">
            <div>
              <img 
                src="https://i.postimg.cc/Y0nJdHW3/DOULIA_LOGO.jpg" 
                alt="Logo" 
                className="h-24 w-24 object-cover rounded-xl mb-4 border-2 border-lime-ia shadow-lg"
                referrerPolicy="no-referrer"
              />
              <h1 className="text-3xl font-bold tracking-tighter uppercase text-deep-blue">
                {docType === 'invoice' ? 'Facture' : 'Devis'}
              </h1>
              <div className="w-12 h-1.5 bg-lime-ia mt-2" />
            </div>
            <div className="text-right space-y-1">
              <p className="font-black text-xl text-deep-blue tracking-tight">DOULIA</p>
              <p className="text-sm font-medium text-slate-600">Expertise en Intelligence Artificielle</p>
              <div className="pt-4 text-xs text-slate-500 font-medium">
                <p>Douala, Cameroun</p>
                <p className="text-deep-blue font-bold">N° {invoiceNumber}</p>
                <p>Date: {new Date().toLocaleDateString()}</p>
              </div>
            </div>
          </div>

          {/* Client Info */}
          <div className="mb-12 grid grid-cols-2 gap-8">
            <div className="bg-slate-50 p-5 rounded-xl border-l-4 border-lime-ia">
              <p className="text-[10px] font-bold uppercase text-slate-400 mb-2 tracking-widest">Facturé à</p>
              <p className="font-bold text-lg text-deep-blue leading-tight mb-1">{clientName || 'Client Nom'}</p>
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
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-deep-blue text-white">
                  <th className="text-left px-4 py-3 font-bold uppercase text-[10px] tracking-wider rounded-tl-lg">Description</th>
                  <th className="text-right px-4 py-3 font-bold uppercase text-[10px] tracking-wider">Qté</th>
                  <th className="text-right px-4 py-3 font-bold uppercase text-[10px] tracking-wider">Prix Unitaire</th>
                  <th className="text-right px-4 py-3 font-bold uppercase text-[10px] tracking-wider rounded-tr-lg">Total</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, i) => (
                  <tr key={i} className={cn("border-b border-slate-100", i % 2 === 0 ? "bg-white" : "bg-slate-50/50")}>
                    <td className="px-4 py-4 font-medium text-deep-blue">{item.description}</td>
                    <td className="text-right px-4 py-4">{item.quantity}</td>
                    <td className="text-right px-4 py-4">{item.unitPrice.toLocaleString()}</td>
                    <td className="text-right px-4 py-4 font-bold text-deep-blue">{item.total.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="mt-8 flex justify-end">
            <div className="w-64 space-y-2">
              <div className="flex justify-between text-sm text-slate-500 px-2">
                <span>Sous-total HT</span>
                <span>{calculateTotal().toLocaleString()} FCFA</span>
              </div>
              <div className="flex justify-between text-sm text-slate-500 px-2">
                <span>TVA (0%)</span>
                <span>0 FCFA</span>
              </div>
              <div className="flex justify-between bg-deep-blue text-white p-4 rounded-lg shadow-lg">
                <span className="font-bold uppercase text-[10px] self-center">Total Net</span>
                <span className="text-lg font-black">{calculateTotal().toLocaleString()} FCFA</span>
              </div>
            </div>
          </div>

          {/* Validation Section */}
          <div className="mt-16 grid grid-cols-2 gap-8 items-end relative">
            {/* QR Code Security */}
            <div className="flex flex-col items-start gap-2">
              <div className="p-2 bg-white border border-slate-100 rounded-lg shadow-sm">
                <QRCodeSVG 
                  value={`DOULIA-AUTH|ID:${invoiceNumber}|DATE:${new Date().toLocaleDateString()}|AMT:${calculateTotal()}|CLIENT:${clientName}`}
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
              {/* Digital Stamp (Cachet) */}
              <div className="absolute -top-16 -right-8 w-36 h-36 rounded-full border-[3px] border-blue-800/20 flex items-center justify-center rotate-12 pointer-events-none mix-blend-multiply">
                <div className="w-[130px] h-[130px] rounded-full border border-blue-800/30 flex flex-col items-center justify-center p-3 text-center relative">
                  {/* Circular Text (Simulated) */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-full h-full rounded-full border border-dashed border-blue-800/10 animate-[spin_20s_linear_infinite]" />
                  </div>
                  
                  <img 
                    src="https://i.postimg.cc/Y0nJdHW3/DOULIA_LOGO.jpg" 
                    alt="Stamp Logo" 
                    className="w-10 h-10 object-cover rounded-full mb-1.5 opacity-40 grayscale contrast-125"
                  />
                  <p className="text-[8px] font-black text-blue-800/60 uppercase tracking-widest leading-none">DOULIA</p>
                  <div className="h-px w-8 bg-blue-800/20 my-1" />
                  <p className="text-[7px] font-bold text-blue-800/50 uppercase leading-tight">
                    Direction Générale<br/>Douala - Cameroun
                  </p>
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
    </div>
  );
};
