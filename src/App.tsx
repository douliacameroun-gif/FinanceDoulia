import { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { Chatbot } from './components/Chatbot';
import { Dashboard } from './components/Dashboard';
import { InvoiceGenerator } from './components/InvoiceGenerator';
import { CRM } from './components/CRM';
import { ROISimulator } from './components/ROISimulator';
import { Projects } from './components/Projects';
import { Budget } from './components/Budget';
import { AICatalog } from './components/AICatalog';
import { motion, AnimatePresence } from 'motion/react';
import { Toaster } from 'sonner';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'projets':
        return <Projects />;
      case 'budget':
        return <Budget />;
      case 'crm':
        return <CRM />;
      case 'roi':
        return <ROISimulator />;
      case 'invoices':
        return <InvoiceGenerator />;
      case 'catalogue':
        return <AICatalog />;
      default:
        return (
          <div className="flex flex-col items-center justify-center h-full text-center p-12">
            <div className="w-24 h-24 bg-lime-ia/10 rounded-full flex items-center justify-center text-lime-ia mb-6">
              <span className="text-4xl font-bold">!</span>
            </div>
            <h2 className="text-2xl font-bold text-deep-blue mb-2">Module en Développement</h2>
            <p className="text-deep-blue/40 max-w-md">
              Le module <span className="text-lime-ia font-bold uppercase">{activeTab}</span> est actuellement en cours de configuration par l'équipe Doulia.
            </p>
          </div>
        );
    }
  };

  return (
    <div className="flex min-h-screen bg-cloud-gray text-deep-blue selection:bg-lime-ia selection:text-deep-blue">
      {/* Sidebar */}
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Main Content */}
      <main className="flex-1 relative overflow-x-hidden">
        {/* Background Decorative Elements */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-lime-ia/5 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-lime-ia/5 blur-[100px] rounded-full pointer-events-none" />

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="relative z-10"
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Floating Chatbot */}
      <Chatbot />

      {/* Global Notifications */}
      <Toaster position="top-right" richColors closeButton />
    </div>
  );
}
