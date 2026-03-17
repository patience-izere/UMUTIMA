import React from 'react';
import { LayoutDashboard, Search, BarChart2, Map, FileText, Settings } from 'lucide-react';

export default function Sidebar() {
  return (
    <aside className="w-64 bg-white border-r border-light-gray h-screen sticky top-0 flex-col hidden md:flex">
      <div className="p-6 border-b border-light-gray">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-rwanda-blue flex items-center justify-center">
            <div className="w-4 h-4 bg-rwanda-yellow rounded-full" />
          </div>
          <span className="font-display font-bold text-xl text-rich-black">UMUTIMA</span>
        </div>
      </div>
      
      <nav className="flex-1 p-4 space-y-1">
        <a href="#" className="flex items-center gap-3 px-4 py-3 bg-[rgba(0,161,222,0.1)] text-rwanda-blue rounded-lg font-medium border-l-4 border-rwanda-blue">
          <LayoutDashboard className="w-5 h-5" />
          Dashboard
        </a>
        <a href="#" className="flex items-center gap-3 px-4 py-3 text-dark-gray hover:bg-off-white rounded-lg font-medium transition-colors">
          <Search className="w-5 h-5" />
          Data Explorer
        </a>
        <a href="#" className="flex items-center gap-3 px-4 py-3 text-dark-gray hover:bg-off-white rounded-lg font-medium transition-colors">
          <BarChart2 className="w-5 h-5" />
          Gap Analysis
        </a>
        <a href="#" className="flex items-center gap-3 px-4 py-3 text-dark-gray hover:bg-off-white rounded-lg font-medium transition-colors">
          <Map className="w-5 h-5" />
          District Map
        </a>
        <a href="#" className="flex items-center gap-3 px-4 py-3 text-dark-gray hover:bg-off-white rounded-lg font-medium transition-colors">
          <FileText className="w-5 h-5" />
          Reports
        </a>
      </nav>

      <div className="p-4 border-t border-light-gray">
        <a href="#" className="flex items-center gap-3 px-4 py-3 text-dark-gray hover:bg-off-white rounded-lg font-medium transition-colors">
          <Settings className="w-5 h-5" />
          Settings
        </a>
      </div>
    </aside>
  );
}
