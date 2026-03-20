import React from 'react';
import { LayoutDashboard, Search, BarChart2, Map, FileText, Settings, Users } from 'lucide-react';
import type { Page } from '../App';

interface Props {
  activePage: Page;
  onNavigate: (page: Page) => void;
}

const navItems: { page: Page; label: string; icon: React.ReactNode }[] = [
  { page: 'census', label: 'Overview', icon: <Users className="w-5 h-5" /> },
  { page: 'explorer', label: 'Data Explorer', icon: <Search className="w-5 h-5" /> },
  { page: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
  { page: 'gaps', label: 'Gap Analysis', icon: <BarChart2 className="w-5 h-5" /> },
  { page: 'map', label: 'District Map', icon: <Map className="w-5 h-5" /> },
  { page: 'reports', label: 'Reports', icon: <FileText className="w-5 h-5" /> },
];

export default function Sidebar({ activePage, onNavigate }: Props) {
  return (
    <aside className="w-64 bg-white border-r border-light-gray h-screen sticky top-0 flex-col hidden md:flex">
      <div className="p-6 border-b border-light-gray">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-rwanda-blue flex items-center justify-center">
            <div className="w-4 h-4 bg-rwanda-yellow rounded-full" />
          </div>
          <span className="font-display font-bold text-xl text-rich-black">GDO PORTAL</span>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {navItems.map(({ page, label, icon }) => (
          <button
            key={page}
            onClick={() => onNavigate(page)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors text-left ${
              activePage === page
                ? 'bg-[rgba(0,161,222,0.1)] text-rwanda-blue border-l-4 border-rwanda-blue'
                : 'text-dark-gray hover:bg-off-white border-l-4 border-transparent'
            }`}
          >
            {icon}
            {label}
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-light-gray">
        <button
          onClick={() => onNavigate('settings')}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors text-left ${
            activePage === 'settings'
              ? 'bg-[rgba(0,161,222,0.1)] text-rwanda-blue border-l-4 border-rwanda-blue'
              : 'text-dark-gray hover:bg-off-white border-l-4 border-transparent'
          }`}
        >
          <Settings className="w-5 h-5" />
          Settings
        </button>
      </div>
    </aside>
  );
}
