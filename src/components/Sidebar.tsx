import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LayoutDashboard, 
  Briefcase, 
  Wallet, 
  Users, 
  Contact, 
  Calculator, 
  FileText, 
  Cpu,
  ChevronLeft,
  ChevronRight,
  LogOut,
  MessageSquare,
  ListTodo,
  TrendingUp,
  Settings
} from 'lucide-react';
import { cn } from '../lib/utils';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onLogout: () => void;
}

const menuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'chat-ia', label: 'Chat IA', icon: MessageSquare },
  { id: 'projets', label: 'Projets', icon: Briefcase },
  { id: 'tasks', label: 'Tâches', icon: ListTodo },
  { id: 'veille', label: 'Veille', icon: TrendingUp },
  { id: 'budget', label: 'Budget', icon: Wallet },
  { id: 'crm', label: 'CRM', icon: Contact },
  { id: 'roi', label: 'Simulateur ROI', icon: Calculator },
  { id: 'invoices', label: 'Devis & Factures', icon: FileText },
  { id: 'catalogue', label: 'Catalogue IA', icon: Cpu },
  { id: 'settings', label: 'Paramètres', icon: Settings },
];

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, onTabChange, onLogout }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <motion.aside
      initial={false}
      animate={{ width: isCollapsed ? 64 : 240 }}
      className="h-screen bg-deep-blue border-r border-white/5 flex flex-col sticky top-0 z-50"
    >
      {/* Logo Section */}
      <div className="p-4 flex items-center justify-between">
        <AnimatePresence mode="wait">
          {!isCollapsed && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex items-center gap-3"
            >
              <img 
                src="https://i.postimg.cc/Y0nJdHW3/DOULIA_LOGO.jpg" 
                alt="Doulia Logo" 
                className="h-14 w-14 rounded-xl object-cover border border-lime-ia/30 shadow-[0_0_15px_rgba(131,197,1,0.2)]"
                referrerPolicy="no-referrer"
              />
              <span className="font-display font-black text-2xl tracking-tighter text-white">DOULIA</span>
            </motion.div>
          )}
        </AnimatePresence>
        
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1.5 rounded-lg hover:bg-white/5 transition-colors text-lime-ia"
        >
          {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
            className={cn(
              "sidebar-link w-full",
              activeTab === item.id && "sidebar-link-active"
            )}
          >
            <item.icon size={18} className="shrink-0" />
            
            {!isCollapsed && (
              <span className="whitespace-nowrap">{item.label}</span>
            )}
            
            {isCollapsed && (
              <div className="absolute left-full ml-4 px-2 py-1 bg-deep-blue border border-white/10 rounded text-[10px] text-white opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 whitespace-nowrap">
                {item.label}
              </div>
            )}
          </button>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-white/5">
        <button 
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-white/40 hover:text-red-400 hover:bg-red-400/5 transition-all duration-300 text-[13px] font-display font-medium"
        >
          <LogOut size={18} />
          {!isCollapsed && <span>Déconnexion</span>}
        </button>
      </div>
    </motion.aside>
  );
};
