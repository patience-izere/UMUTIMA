import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchMetrics, fetchInsights, fetchGapAlerts, Insight } from '../lib/api';
import { exportToCSV } from '../lib/export';
import { generatePDF } from '../lib/pdfExport';
import MetricCard from '../components/MetricCard';
import GapAlert from '../components/GapAlert';
import RwandaMap from '../components/RwandaMap';
import DataExplorer from '../components/DataExplorer';
import PdfExportModal from '../components/PdfExportModal';
import { Sparkles, Download, LayoutGrid, BarChart2, FileText, Loader2, Globe } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';

export default function Dashboard() {
  const [viewMode, setViewMode] = useState<'overview' | 'explorer'>('overview');
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [isGeneratingInsight, setIsGeneratingInsight] = useState(false);
  const [generatedInsights, setGeneratedInsights] = useState<Insight[]>([]);

  const { data: metrics, isLoading: metricsLoading } = useQuery({
    queryKey: ['metrics'],
    queryFn: fetchMetrics
  });

  const { data: insights, isLoading: insightsLoading } = useQuery({
    queryKey: ['insights'],
    queryFn: fetchInsights
  });

  const { data: gapAlerts, isLoading: gapAlertsLoading } = useQuery({
    queryKey: ['gapAlerts'],
    queryFn: fetchGapAlerts
  });

  const handleGenerateInsight = async () => {
    setIsGeneratingInsight(true);
    try {
      // @ts-ignore - process.env is injected by the platform
      const apiKey = typeof process !== 'undefined' && process.env ? process.env.GEMINI_API_KEY : import.meta.env.VITE_GEMINI_API_KEY;
      const ai = new GoogleGenAI({ apiKey });
      
      const metricsContext = metrics ? metrics.map(m => `${m.title}: ${m.value} (${m.trendDirection})`).join(', ') : '';
      
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Based on these current metrics for Rwanda: ${metricsContext}. What are the latest real-world developments, news, or initiatives in Rwanda regarding gender equality, women's empowerment, or these specific metric areas? Provide exactly 3 short, distinct insights. Return a JSON array of objects, where each object has a 'type' (e.g., 'NEWS', 'POLICY', 'INITIATIVE') and a 'headline' (the insight text).`,
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

  const handleExportDashboard = () => {
    if (metrics) {
      exportToCSV(metrics.map(m => ({
        Indicator: m.title,
        Domain: m.domain,
        Value: m.value,
        Trend: m.trend,
        'Time Range': m.timeRange
      })), 'UMUTIMA_Dashboard_Metrics');
    }
  };

  const handleExportPDF = async (title: string, date: string, selectedSections: string[]) => {
    const allSections = ['dashboard-metrics', 'dashboard-map', 'dashboard-gaps', 'dashboard-insights'];
    const hiddenSections = allSections.filter(id => !selectedSections.includes(id));
    
    await generatePDF('dashboard-content', 'UMUTIMA_Dashboard_Report', title, date, hiddenSections);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-rich-black mb-2">Gender Data Observatory</h1>
          <p className="text-dark-gray text-lg">National overview of key gender indicators and data gaps.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-white border border-light-gray rounded-lg p-1 flex mr-2">
            <button 
              onClick={() => setViewMode('overview')}
              className={`p-2 rounded-md transition-colors ${viewMode === 'overview' ? 'bg-off-white text-rwanda-blue shadow-sm' : 'text-medium-gray hover:text-dark-gray'}`}
              title="Overview"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setViewMode('explorer')}
              className={`p-2 rounded-md transition-colors ${viewMode === 'explorer' ? 'bg-off-white text-rwanda-blue shadow-sm' : 'text-medium-gray hover:text-dark-gray'}`}
              title="Data Explorer"
            >
              <BarChart2 className="w-4 h-4" />
            </button>
          </div>
          {viewMode === 'overview' && (
            <button onClick={() => setIsPdfModalOpen(true)} className="btn-ghost flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Export PDF
            </button>
          )}
          <button onClick={handleExportDashboard} className="btn-ghost flex items-center gap-2">
            <Download className="w-4 h-4" />
            Export CSV
          </button>
          <button 
            onClick={handleGenerateInsight} 
            disabled={isGeneratingInsight}
            className="btn-primary flex items-center gap-2 disabled:opacity-70"
          >
            {isGeneratingInsight ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {isGeneratingInsight ? 'Generating...' : 'Generate Insight'}
          </button>
        </div>
      </div>

      {viewMode === 'explorer' ? (
        <section className="h-[600px]">
          <DataExplorer />
        </section>
      ) : (
        <div id="dashboard-content" className="space-y-8 bg-off-white p-2 rounded-xl">
          {/* Metrics Grid */}
          <section id="dashboard-metrics">
            <h2 className="text-xl font-display font-semibold text-rich-black mb-4">Key Indicators</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {metricsLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-40 rounded-xl skeleton" />
                ))
              ) : (
                metrics?.map(metric => (
                  <MetricCard
                    key={metric.id}
                    domain={metric.domain}
                    title={metric.title}
                    value={metric.value}
                    trend={metric.trend}
                    trendDirection={metric.trendDirection}
                    chartData={metric.chartData}
                  />
                ))
              )}
            </div>
          </section>

          {/* Map and Gaps */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <section id="dashboard-map" className="lg:col-span-2">
              <h2 className="text-xl font-display font-semibold text-rich-black mb-4">Coverage Map</h2>
              <RwandaMap />
            </section>

            {/* Data Gaps */}
            <section id="dashboard-gaps" className="space-y-4">
              <h2 className="text-xl font-display font-semibold text-rich-black mb-4">Data Gaps & Alerts</h2>
              <div className="space-y-4">
                {gapAlertsLoading ? (
                  Array.from({ length: 2 }).map((_, i) => (
                    <div key={i} className="h-32 rounded-xl skeleton" />
                  ))
                ) : (
                  gapAlerts?.map(alert => (
                    <GapAlert
                      key={alert.id}
                      title={alert.title}
                      description={alert.description}
                      severity={alert.severity}
                    />
                  ))
                )}
              </div>
            </section>
          </div>

          {/* AI Insights Panel */}
          <section id="dashboard-insights" className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-5 h-5 text-rwanda-blue" />
              <h2 className="text-xl font-display font-semibold text-rich-black">AI-Generated Insights</h2>
              {generatedInsights.length > 0 && (
                <span className="ml-2 px-2 py-0.5 bg-rwanda-blue/10 text-rwanda-blue text-xs font-medium rounded-full flex items-center gap-1">
                  <Globe className="w-3 h-3" /> Live Search Data
                </span>
              )}
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {insightsLoading || isGeneratingInsight ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-32 rounded-xl skeleton" />
                ))
              ) : (
                (generatedInsights.length > 0 ? generatedInsights : insights)?.map(insight => (
                  <div key={insight.id} className="bg-white p-5 rounded-xl border border-light-gray shadow-sm hover:border-rwanda-blue transition-colors">
                    <span className="inline-block px-2 py-1 bg-off-white text-xs font-bold text-dark-gray rounded mb-3 uppercase tracking-wider">
                      {insight.type}
                    </span>
                    <p className="text-rich-black font-medium leading-relaxed">
                      {insight.headline}
                    </p>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      )}

      <PdfExportModal
        isOpen={isPdfModalOpen}
        onClose={() => setIsPdfModalOpen(false)}
        onExport={handleExportPDF}
        defaultTitle="UMUTIMA Gender Data Observatory - National Overview"
        sections={[
          { id: 'dashboard-metrics', label: 'Key Indicators' },
          { id: 'dashboard-map', label: 'Coverage Map' },
          { id: 'dashboard-gaps', label: 'Data Gaps & Alerts' },
          { id: 'dashboard-insights', label: 'AI-Generated Insights' }
        ]}
      />
    </div>
  );
}
