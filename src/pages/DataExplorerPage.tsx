import React from 'react';
import DataExplorer from '../components/DataExplorer';

export default function DataExplorerPage() {
  return (
    <div className="p-4 max-w-7xl mx-auto space-y-3">
      <div>
        <h1 className="text-lg font-display font-bold text-rich-black">Data Explorer</h1>
        <p className="text-dark-gray text-sm">Browse, filter, and analyze gender indicators in depth.</p>
      </div>
      <div className="h-[640px]">
        <DataExplorer />
      </div>
    </div>
  );
}
