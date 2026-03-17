import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchDetailedIndicator, fetchIndicators } from '../lib/api';
import { domainColors } from '../lib/designTokens';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar, Legend, Cell
} from 'recharts';
import { Download, Filter, Info, ChevronLeft, AlertCircle, FileText, Sparkles, Loader2, Globe } from 'lucide-react';
import { exportToCSV } from '../lib/export';
import { generatePDF } from '../lib/pdfExport';
import PdfExportModal from './PdfExportModal';
import { GoogleGenAI } from '@google/genai';

const getFallbackDescription = (domain: string) => {
  switch (domain) {
    case 'economic': return 'Measures economic participation, financial inclusion, and employment metrics.';
    case 'health': return 'Tracks health outcomes, access to healthcare, and maternal well-being.';
    case 'education': return 'Monitors educational attainment, enrollment rates, and literacy.';
    case 'leadership': return 'Evaluates representation in decision-making and leadership roles.';
    default: return 'Monitors key metrics and progress for this indicator across Rwanda.';
  }
};

export default function DataExplorer() {
  const [filters, setFilters] = useState({ domain: '', source: '', frequency: '' });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'trend' | 'disaggregation' | 'geography' | 'insights'>('trend');
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  
  const [isGeneratingInsight, setIsGeneratingInsight] = useState(false);
  const [generatedInsights, setGeneratedInsights] = useState<any[]>([]);

  const { data: indicators, isLoading: listLoading, isError: listError, isFetching: listFetching } = useQuery({
    queryKey: ['indicators', filters],
    queryFn: () => fetchIndicators(filters)
  });

  const { data: detailedData, isLoading: detailLoading, isError: detailError } = useQuery({
    queryKey: ['detailedIndicator', selectedId],
    queryFn: () => fetchDetailedIndicator(selectedId!),
    enabled: !!selectedId
  });

  const handleExport = () => {
    if (!detailedData) return;
    if (activeTab === 'trend') exportToCSV(detailedData.trendData, `${detailedData.title}_Trend`);
    if (activeTab === 'disaggregation') exportToCSV([...detailedData.disaggregation.location, ...detailedData.disaggregation.age], `${detailedData.title}_Disaggregation`);
    if (activeTab === 'geography') exportToCSV(detailedData.regionalData, `${detailedData.title}_Geography`);
  };

  const handleExportPDF = async (title: string, date: string, selectedSections: string[]) => {
    const allSections = ['explorer-trend', 'explorer-disaggregation', 'explorer-geography', 'explorer-insights'];
    const hiddenSections = allSections.filter(id => !selectedSections.includes(id));
    
    setIsExportingPdf(true);
    
    // Wait for React to render all sections
    setTimeout(async () => {
      await generatePDF('explorer-content', `${detailedData?.title || 'Indicator'}_Report`, title, date, hiddenSections);
      setIsExportingPdf(false);
    }, 500);
  };

  const handleGenerateInsight = async () => {
    if (!detailedData) return;
    setIsGeneratingInsight(true);
    setActiveTab('insights');
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) throw new Error('GEMINI_API_KEY is not set');
      const ai = new GoogleGenAI({ apiKey });

      const response = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: `Based on this specific metric for Rwanda: "${detailedData.title}" (Domain: ${detailedData.domain}). What are the latest real-world developments, news, or initiatives in Rwanda regarding this specific area? Provide exactly 3 short, distinct insights. Return a JSON array of objects, where each object has a 'type' (e.g., 'NEWS', 'POLICY', 'INITIATIVE') and a 'headline' (the insight text).`,
        config: {
          tools: [{ googleSearch: {} }],
          responseMimeType: "application/json",
        },
      });

      const text = response.text || '';
      try {
        const parsed = JSON.parse(text);
        const newInsights = parsed.map((item: any, index: number) => ({
          id: `gen-${Date.now()}-${index}`,
          type: item.type || 'SEARCH',
          headline: item.headline || item,
          isGenerated: true
        }));
        setGeneratedInsights(newInsights);
      } catch (e) {
        console.error("Failed to parse JSON response:", e, text);
      }
    } catch (error) {
      console.error("Failed to generate insights:", error);
    } finally {
      setIsGeneratingInsight(false);
    }
  };

  if (selectedId) {
    if (detailLoading) return <div className="h-[500px] w-full skeleton rounded-xl"></div>;
    if (detailError || !detailedData) return (
      <div className="bg-white rounded-xl shadow-sm border border-light-gray p-12 text-center h-full flex flex-col items-center justify-center">
        <AlertCircle className="w-12 h-12 text-rwanda-yellow mb-4" />
        <h3 className="text-xl font-semibold text-rich-black">Unable to load indicator details</h3>
        <p className="text-dark-gray mt-2 max-w-md">Please ensure the backend API is running and accessible.</p>
        <button onClick={() => setSelectedId(null)} className="btn-ghost mt-6 flex items-center gap-2">
          <ChevronLeft className="w-4 h-4" /> Back to Indicators
        </button>
      </div>
    );

    const primaryColor = domainColors[detailedData.domain];

    return (
      <div className="bg-white rounded-xl shadow-sm border border-light-gray overflow-hidden flex flex-col h-full">
        {/* Header */}
        <div className="p-6 border-b border-light-gray">
          <button 
            onClick={() => setSelectedId(null)}
            className="text-sm font-medium text-dark-gray hover:text-rwanda-blue flex items-center gap-1 mb-4 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" /> Back to List
          </button>
          
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider" 
                      style={{ backgroundColor: `${primaryColor}20`, color: primaryColor }}>
                  {detailedData.domain} Data
                </span>
                <span className="text-xs text-dark-gray flex items-center gap-1">
                  <Info className="w-3 h-3" /> Updated {detailedData.lastUpdated}
                </span>
              </div>
              <h2 className="text-2xl font-display font-bold text-rich-black">{detailedData.title}</h2>
              <p className="text-sm text-dark-gray mt-1">Source: {detailedData.source}</p>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={handleGenerateInsight} 
                disabled={isGeneratingInsight}
                className="btn-primary py-2 px-3 flex items-center gap-2 text-sm disabled:opacity-70"
              >
                {isGeneratingInsight ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                {isGeneratingInsight ? 'Generating...' : 'Insights'}
              </button>
              <button onClick={() => setIsPdfModalOpen(true)} className="btn-ghost py-2 px-3 flex items-center gap-2 text-sm">
                <FileText className="w-4 h-4" /> PDF
              </button>
              <button onClick={handleExport} className="btn-ghost py-2 px-3 flex items-center gap-2 text-sm">
                <Download className="w-4 h-4" /> CSV
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-6 border-b border-light-gray overflow-x-auto">
            {(['trend', 'disaggregation', 'geography', 'insights'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-3 text-sm font-semibold capitalize transition-colors relative whitespace-nowrap ${
                  activeTab === tab ? 'text-rich-black' : 'text-medium-gray hover:text-dark-gray'
                }`}
              >
                {tab === 'disaggregation' ? 'Data Disaggregation' : tab}
                {activeTab === tab && (
                  <div className="absolute bottom-0 left-0 w-full h-0.5" style={{ backgroundColor: primaryColor }} />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Chart Area */}
        <div id="explorer-content" className="p-6 flex-1 min-h-[400px]">
          {(activeTab === 'trend' || isExportingPdf) && (
            <div id="explorer-trend" className={isExportingPdf ? "mb-12 h-[400px]" : "h-full"}>
              {isExportingPdf && <h3 className="text-lg font-bold mb-4">Trend Analysis</h3>}
              <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={detailedData.trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
            </div>
          )}

          {(activeTab === 'disaggregation' || isExportingPdf) && (
            <div id="explorer-disaggregation" className={isExportingPdf ? "mb-12 h-[400px]" : "h-full"}>
              {isExportingPdf && <h3 className="text-lg font-bold mb-4">Data Disaggregation</h3>}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 h-full">
              <div className="h-full flex flex-col">
                <h4 className="text-sm font-semibold text-dark-gray mb-4 text-center">By Location</h4>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={detailedData.disaggregation.location} layout="vertical" margin={{ top: 0, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#1A1A1A', fontWeight: 500 }} width={60} />
                    <Tooltip cursor={{ fill: '#F7FAFC' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                    <Bar dataKey="value" name="Participation Rate (%)" radius={[0, 4, 4, 0]} barSize={32}>
                      {detailedData.disaggregation.location.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={index === 0 ? primaryColor : `${primaryColor}80`} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="h-full flex flex-col">
                <h4 className="text-sm font-semibold text-dark-gray mb-4 text-center">By Age Group</h4>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={detailedData.disaggregation.age} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis dataKey="group" axisLine={false} tickLine={false} tick={{ fill: '#4A5568', fontSize: 12 }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#4A5568', fontSize: 12 }} />
                    <Tooltip cursor={{ fill: '#F7FAFC' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                    <Bar dataKey="value" name="Participation Rate (%)" fill={primaryColor} radius={[4, 4, 0, 0]} barSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            </div>
          )}

          {(activeTab === 'geography' || isExportingPdf) && (
            <div id="explorer-geography" className={isExportingPdf ? "mb-12 h-[400px]" : "h-full"}>
              {isExportingPdf && <h3 className="text-lg font-bold mb-4">Geography</h3>}
              <ResponsiveContainer width="100%" height="100%">
              <BarChart data={detailedData.regionalData} layout="vertical" margin={{ top: 0, right: 30, left: 20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
                <XAxis type="number" hide />
                <YAxis dataKey="district" type="category" axisLine={false} tickLine={false} tick={{ fill: '#1A1A1A', fontWeight: 500 }} width={80} />
                <Tooltip cursor={{ fill: '#F7FAFC' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                <Bar dataKey="value" name="Participation Rate (%)" fill={primaryColor} radius={[0, 4, 4, 0]} barSize={24}>
                  {detailedData.regionalData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.value > 50 ? primaryColor : `${primaryColor}60`} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            </div>
          )}

          {(activeTab === 'insights' || isExportingPdf) && (
            <div id="explorer-insights" className={isExportingPdf ? "mb-12" : "h-full overflow-y-auto pr-2"}>
              {isExportingPdf ? (
                <h3 className="text-lg font-bold mb-4">AI-Generated Insights</h3>
              ) : (
                <div className="flex items-center gap-2 mb-6">
                  <Sparkles className="w-5 h-5 text-rwanda-blue" />
                  <h3 className="text-xl font-display font-semibold text-rich-black">AI-Generated Insights</h3>
                  {generatedInsights.length > 0 && (
                    <span className="ml-2 px-2 py-0.5 bg-rwanda-blue/10 text-rwanda-blue text-xs font-medium rounded-full flex items-center gap-1">
                      <Globe className="w-3 h-3" /> Live Search Data
                    </span>
                  )}
                </div>
              )}
              
              {isGeneratingInsight ? (
                <div className="flex flex-col items-center justify-center h-40 text-medium-gray">
                  <Loader2 className="w-8 h-8 animate-spin mb-4 text-rwanda-blue" />
                  <p>Analyzing real-time data...</p>
                </div>
              ) : generatedInsights.length > 0 ? (
                <div className="grid grid-cols-1 gap-4">
                  {generatedInsights.map(insight => (
                    <div key={insight.id} className="bg-off-white p-5 rounded-xl border border-light-gray">
                      <span className="inline-block px-2 py-1 bg-white text-xs font-bold text-dark-gray rounded mb-3 uppercase tracking-wider border border-light-gray">
                        {insight.type}
                      </span>
                      <p className="text-rich-black font-medium leading-relaxed">
                        {insight.headline}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-40 text-medium-gray text-center">
                  <Sparkles className="w-8 h-8 mb-4 opacity-50" />
                  <p>Click "Insights" to generate real-time analysis for this indicator.</p>
                </div>
              )}
            </div>
          )}
        </div>

        <PdfExportModal
          isOpen={isPdfModalOpen}
          onClose={() => setIsPdfModalOpen(false)}
          onExport={handleExportPDF}
          defaultTitle={`${detailedData.title} - Detailed Report`}
          sections={[
            { id: 'explorer-trend', label: 'Trend Analysis' },
            { id: 'explorer-disaggregation', label: 'Data Disaggregation' },
            { id: 'explorer-geography', label: 'Geography' },
            { id: 'explorer-insights', label: 'AI Insights' }
          ]}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row gap-6 h-full">
      {/* Filters Sidebar */}
      <div className="w-full md:w-64 shrink-0 bg-white rounded-xl shadow-sm border border-light-gray p-5 h-fit">
        <div className="flex items-center gap-2 mb-6 pb-4 border-b border-light-gray">
          <Filter className="w-5 h-5 text-rwanda-blue" />
          <h3 className="font-display font-semibold text-rich-black">Filters</h3>
        </div>

        <div className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-rich-black mb-2">Domain</label>
            <select 
              value={filters.domain}
              onChange={(e) => setFilters(f => ({ ...f, domain: e.target.value }))}
              className="w-full border border-light-gray rounded-lg p-2.5 text-sm focus:border-rwanda-blue focus:ring-1 focus:ring-rwanda-blue outline-none bg-off-white"
            >
              <option value="">All Domains</option>
              <option value="economic">Economic</option>
              <option value="health">Health</option>
              <option value="education">Education</option>
              <option value="leadership">Leadership</option>
              <option value="crossCutting">Cross-Cutting</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-rich-black mb-2">Source</label>
            <select 
              value={filters.source}
              onChange={(e) => setFilters(f => ({ ...f, source: e.target.value }))}
              className="w-full border border-light-gray rounded-lg p-2.5 text-sm focus:border-rwanda-blue focus:ring-1 focus:ring-rwanda-blue outline-none bg-off-white"
            >
              <option value="">All Sources</option>
              <option value="NISR">NISR</option>
              <option value="MINECOFIN">MINECOFIN</option>
              <option value="Ministry of Health">Ministry of Health</option>
              <option value="UN Women">UN Women</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-rich-black mb-2">Update Frequency</label>
            <select 
              value={filters.frequency}
              onChange={(e) => setFilters(f => ({ ...f, frequency: e.target.value }))}
              className="w-full border border-light-gray rounded-lg p-2.5 text-sm focus:border-rwanda-blue focus:ring-1 focus:ring-rwanda-blue outline-none bg-off-white"
            >
              <option value="">All Frequencies</option>
              <option value="Annual">Annual</option>
              <option value="Quarterly">Quarterly</option>
              <option value="Monthly">Monthly</option>
              <option value="Periodic">Periodic</option>
            </select>
          </div>
          
          <button 
            onClick={() => setFilters({ domain: '', source: '', frequency: '' })}
            className="w-full py-2 text-sm text-dark-gray hover:text-rwanda-blue transition-colors font-medium mt-2"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Results Area */}
      <div className="flex-1 bg-white rounded-xl shadow-sm border border-light-gray p-6 overflow-y-auto relative">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-display font-semibold text-rich-black">
            Indicators {indicators ? `(${indicators.length})` : ''}
          </h3>
          {listFetching && !listLoading && (
            <span className="text-xs font-medium text-rwanda-blue animate-pulse flex items-center gap-1">
              <div className="w-3 h-3 border-2 border-rwanda-blue border-t-transparent rounded-full animate-spin"></div>
              Updating...
            </span>
          )}
        </div>
        
        {listLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => <div key={i} className="h-24 skeleton rounded-lg w-full" />)}
          </div>
        ) : listError ? (
          <div className="text-center py-12">
            <AlertCircle className="w-10 h-10 text-rwanda-yellow mx-auto mb-4" />
            <h4 className="text-lg font-semibold text-rich-black">Unable to load indicators</h4>
            <p className="text-dark-gray mt-2 max-w-md mx-auto">
              Could not connect to the backend API. Please ensure the Django server is running at {import.meta.env.VITE_API_URL || 'https://api.gdoportal.rw/api/v1'}.
            </p>
          </div>
        ) : indicators?.length === 0 ? (
          <div className="text-center py-12">
            <Info className="w-10 h-10 text-medium-gray mx-auto mb-4" />
            <h4 className="text-lg font-semibold text-rich-black">No indicators found</h4>
            <p className="text-dark-gray mt-2">Try adjusting your filters to see more results.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {indicators?.map(indicator => (
              <div 
                key={indicator.id} 
                onClick={() => setSelectedId(indicator.id)}
                className="border border-light-gray rounded-lg p-4 hover:border-rwanda-blue hover:shadow-md transition-all cursor-pointer group"
              >
                <div className="flex items-start justify-between gap-4 mb-3">
                  <h4 className="font-semibold text-rich-black group-hover:text-rwanda-blue transition-colors line-clamp-2">
                    {indicator.title}
                  </h4>
                  <span 
                    className="px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider shrink-0"
                    style={{ 
                      backgroundColor: `${domainColors[indicator.domain]}15`, 
                      color: domainColors[indicator.domain] 
                    }}
                  >
                    {indicator.domain}
                  </span>
                </div>
                <p className="text-sm text-dark-gray mb-4 line-clamp-2">
                  {indicator.description || getFallbackDescription(indicator.domain)}
                </p>
                <div className="flex items-center gap-4 text-xs text-dark-gray">
                  <span className="flex items-center gap-1">
                    <span className="font-medium text-soft-black">Source:</span> {indicator.source}
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="font-medium text-soft-black">Updates:</span> {indicator.updateFrequency}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
