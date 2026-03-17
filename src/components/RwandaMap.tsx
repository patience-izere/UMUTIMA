import React from 'react';
import { Map } from 'lucide-react';

export default function RwandaMap() {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-light-gray p-6 h-full min-h-[400px] flex flex-col items-center justify-center text-center">
      <div className="w-16 h-16 bg-off-white rounded-full flex items-center justify-center mb-4">
        <Map className="w-8 h-8 text-medium-gray" />
      </div>
      <h3 className="text-lg font-display font-semibold text-rich-black mb-2">District Level Data Map</h3>
      <p className="text-dark-gray max-w-sm">
        Interactive choropleth map of Rwanda showing gender data coverage and indicators by district.
      </p>
      <div className="mt-6 flex gap-4 text-sm text-dark-gray">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-light-gray"></span> No Data
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-[#B3E5FC]"></span> Low
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-rwanda-blue"></span> Medium
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-rwanda-green"></span> High
        </div>
      </div>
    </div>
  );
}
