import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchDetailedIndicator } from '../lib/api';
import { domainColors } from '../lib/designTokens';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar, Legend, Cell
} from 'recharts';
import { Download, Filter, Info } from 'lucide-react';
import { exportToCSV } from '../lib/export';

export default function DataExplorer() {
  const [activeTab, setActiveTab] = useState<'trend' | 'demographics' | 'geography'>('trend');
  
  const { data, isLoading } = useQuery({
    queryKey: ['detailedIndicator', 'm1'],
    queryFn: () => fetchDetailedIndicator('m1')
  });

  if (isLoading || !data) {
    return <div className="h-[500px] w-full skeleton rounded-xl"></div>;
  }

  const primaryColor = domainColors[data.domain];

  const handleExport = () => {
    if (activeTab === 'trend') exportToCSV(data.trendData, `${data.title}_Trend`);
    if (activeTab === 'demographics') exportToCSV([...data.disaggregation.location, ...data.disaggregation.age], `${data.title}_Demographics`);
    if (activeTab === 'geography') exportToCSV(data.regionalData, `${data.title}_Geography`);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-light-gray overflow-hidden flex flex-col h-full">
      {/* Header */}
      <div className="p-6 border-b border-light-gray">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider" 
                    style={{ backgroundColor: `${primaryColor}20`, color: primaryColor }}>
                {data.domain} Data
              </span>
              <span className="text-xs text-dark-gray flex items-center gap-1">
                <Info className="w-3 h-3" /> Updated {data.lastUpdated}
              </span>
            </div>
            <h2 className="text-2xl font-display font-bold text-rich-black">{data.title}</h2>
            <p className="text-sm text-dark-gray mt-1">Source: {data.source}</p>
          </div>
          <div className="flex gap-2">
            <button className="btn-ghost py-2 px-3 flex items-center gap-2 text-sm">
              <Filter className="w-4 h-4" /> Filter
            </button>
            <button onClick={handleExport} className="btn-ghost py-2 px-3 flex items-center gap-2 text-sm">
              <Download className="w-4 h-4" /> CSV
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-6 border-b border-light-gray">
          {(['trend', 'demographics', 'geography'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-3 text-sm font-semibold capitalize transition-colors relative ${
                activeTab === tab ? 'text-rich-black' : 'text-medium-gray hover:text-dark-gray'
              }`}
            >
              {tab}
              {activeTab === tab && (
                <div className="absolute bottom-0 left-0 w-full h-0.5" style={{ backgroundColor: primaryColor }} />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Chart Area */}
      <div className="p-6 flex-1 min-h-[400px]">
        {activeTab === 'trend' && (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data.trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={primaryColor} stopOpacity={0.3}/>
                  <stop offset="95%" stopColor={primaryColor} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
              <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{ fill: '#4A5568', fontSize: 12 }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#4A5568', fontSize: 12 }} />
              <Tooltip 
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                labelStyle={{ fontWeight: 'bold', color: '#1A1A1A', marginBottom: '4px' }}
              />
              <Legend verticalAlign="top" height={36} iconType="circle" />
              <Area type="monotone" name="National Average (%)" dataKey="national" stroke={primaryColor} strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
              <Area type="monotone" name="NST1 Target (%)" dataKey="target" stroke="#A0AEC0" strokeWidth={2} strokeDasharray="5 5" fill="none" />
            </AreaChart>
          </ResponsiveContainer>
        )}

        {activeTab === 'demographics' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 h-full">
            <div className="h-full flex flex-col">
              <h4 className="text-sm font-semibold text-dark-gray mb-4 text-center">By Location</h4>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.disaggregation.location} layout="vertical" margin={{ top: 0, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#1A1A1A', fontWeight: 500 }} width={60} />
                  <Tooltip cursor={{ fill: '#F7FAFC' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                  <Bar dataKey="value" name="Participation Rate (%)" radius={[0, 4, 4, 0]} barSize={32}>
                    {data.disaggregation.location.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index === 0 ? primaryColor : `${primaryColor}80`} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="h-full flex flex-col">
              <h4 className="text-sm font-semibold text-dark-gray mb-4 text-center">By Age Group</h4>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.disaggregation.age} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="group" axisLine={false} tickLine={false} tick={{ fill: '#4A5568', fontSize: 12 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#4A5568', fontSize: 12 }} />
                  <Tooltip cursor={{ fill: '#F7FAFC' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                  <Bar dataKey="value" name="Participation Rate (%)" fill={primaryColor} radius={[4, 4, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {activeTab === 'geography' && (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.regionalData} layout="vertical" margin={{ top: 0, right: 30, left: 20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
              <XAxis type="number" hide />
              <YAxis dataKey="district" type="category" axisLine={false} tickLine={false} tick={{ fill: '#1A1A1A', fontWeight: 500 }} width={80} />
              <Tooltip cursor={{ fill: '#F7FAFC' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
              <Bar dataKey="value" name="Participation Rate (%)" fill={primaryColor} radius={[0, 4, 4, 0]} barSize={24}>
                {data.regionalData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.value > 50 ? primaryColor : `${primaryColor}60`} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
