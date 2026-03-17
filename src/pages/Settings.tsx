import React from 'react';
import { Settings as SettingsIcon } from 'lucide-react';

export default function Settings() {
  return (
    <div className="p-4 max-w-7xl mx-auto space-y-3">
      <div>
        <h1 className="text-lg font-display font-bold text-rich-black">Settings</h1>
        <p className="text-dark-gray text-sm">Configure your GDO Portal dashboard preferences.</p>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-light-gray p-8 flex flex-col items-center justify-center text-center">
        <SettingsIcon className="w-8 h-8 text-medium-gray mb-3" />
        <h3 className="text-base font-semibold text-rich-black mb-1">Settings Coming Soon</h3>
        <p className="text-dark-gray text-sm max-w-sm">User preferences and configuration options will be available here.</p>
      </div>
    </div>
  );
}
