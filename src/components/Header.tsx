import React from 'react';
import { Search, Info, Menu } from 'lucide-react';
import DistrictFilter from './DistrictFilter';

interface Props {
  onMenuToggle: () => void;
  onInfoClick: () => void;
}

export default function Header({ onMenuToggle, onInfoClick }: Props) {
  return (
    <header className="h-16 bg-rwanda-blue text-white flex items-center justify-between px-4 md:px-6 sticky top-0 z-10">
      <div className="flex items-center gap-3 flex-1">
        <button
          onClick={onMenuToggle}
          className="md:hidden p-2 hover:bg-white/10 rounded-lg transition-colors"
          aria-label="Toggle menu"
        >
          <Menu className="w-5 h-5" />
        </button>
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
        <button
          onClick={onInfoClick}
          className="p-2 hover:bg-white/10 rounded-full transition-colors"
          aria-label="About & Privacy"
          title="About & Privacy Policy"
        >
          <Info className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
}
