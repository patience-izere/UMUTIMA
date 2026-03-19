import React from 'react';
import { Search, Bell, User } from 'lucide-react';
import DistrictFilter from './DistrictFilter';

export default function Header() {
  return (
    <header className="h-16 bg-rwanda-blue text-white flex items-center justify-between px-6 sticky top-0 z-10">
      <div className="flex items-center gap-4 flex-1">
        <div className="relative w-full max-w-md hidden md:block">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-white/70" />
          <input 
            type="text" 
            placeholder="Search gender data, indicators, or reports..." 
            className="w-full bg-white/10 border border-white/20 rounded-lg pl-10 pr-4 py-2 text-sm text-white placeholder:text-white/70 focus:outline-none focus:bg-white/20 transition-colors"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <DistrictFilter />
        
        <button className="relative p-2 hover:bg-white/10 rounded-full transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rwanda-gold rounded-full" />
        </button>
        <button className="flex items-center gap-2 hover:bg-white/10 py-1.5 px-3 rounded-lg transition-colors">
          <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
            <User className="w-4 h-4" />
          </div>
          <span className="text-sm font-medium hidden sm:block">Researcher</span>
        </button>
      </div>
    </header>
  );
}
