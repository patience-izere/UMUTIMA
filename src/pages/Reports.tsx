import React from 'react';
import { FileText } from 'lucide-react';

export default function Reports() {
  return (
    <div className="p-4 max-w-7xl mx-auto space-y-3">
      <div>
        <h1 className="text-lg font-display font-bold text-rich-black">Reports</h1>
        <p className="text-dark-gray text-sm">Generate and download gender data reports.</p>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-light-gray p-8 flex flex-col items-center justify-center text-center">
        <FileText className="w-8 h-8 text-medium-gray mb-3" />
        <h3 className="text-base font-semibold text-rich-black mb-1">No Reports Yet</h3>
        <p className="text-dark-gray text-sm max-w-sm">Export reports from the Dashboard or Data Explorer to see them here.</p>
      </div>
    </div>
  );
}
