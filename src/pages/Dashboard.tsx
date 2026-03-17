import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchMetrics, fetchInsights, fetchGapAlerts, Insight } from '../lib/api';
import { exportToCSV } from '../lib/export';
import { generatePDF } from '../lib/pdfExport';
import MetricCard from '../components/MetricCard';
import GapAlert from '../components/GapAlert';
import RwandaMap from '../components/RwandaMap';
import PdfExportModal from '../components/PdfExportModal';
import { Sparkles, Download, FileText, Loader2, Globe } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';

export default function Dashboard() {
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
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) throw new Error('GEMINI_API_KEY is not set');
      const ai = new GoogleGenAI({ apiKey });
      
      const metricsContext = metrics ? metrics.map(m => `${m.title}: ${m.value} (${m.trendDirection})`).join(', ') : '';
      
      const response = await ai.models.generateContent({
        model: "gemini-2.0-flash",
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
      })), 'GDO Portal_Dashboard_Metrics');
    }
  };

  const handleExportPDF = async (title: string, date: string, selectedSections: string[]) => {
    const allSections = ['dashboard-metrics', 'dashboard-map', 'dashboard-gaps', 'dashboard-insights'];
    const hiddenSections = allSections.filter(id => !selectedSections.includes(id));
    
    await generatePDF('dashboard-content', 'GDO_Portal_Dashboard_Report', title, date, hiddenSections);
  };

  return (
    <div className="p-4 max-w-7xl mx-auto space-y-4">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h1 className="text-lg font-display font-bold text-rich-black">Gender Data Observatory</h1>
          <p className="text-dark-gray text-sm">National overview of key gender indicators and data gaps.</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setIsPdfModalOpen(true)} className="btn-ghost flex items-center gap-1.5 py-1.5 px-3 text-xs">
            <FileText className="w-3.5 h-3.5" />
            Export PDF
          </button>
          <button onClick={handleExportDashboard} className="btn-ghost flex items-center gap-1.5 py-1.5 px-3 text-xs">
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </button>
          <button
            onClick={handleGenerateInsight}
            disabled={isGeneratingInsight}
            className="btn-primary flex items-center gap-1.5 py-1.5 px-3 text-xs disabled:opacity-70"
          >
            {isGeneratingInsight ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
            {isGeneratingInsight ? 'Generating...' : 'Generate Insight'}
          </button>
        </div>
      </div>

        <div id="dashboard-content" className="space-y-4 bg-off-white p-2 rounded-xl">
          {/* Metrics Grid */}
          <section id="dashboard-metrics">
            <h2 className="text-sm font-display font-semibold text-rich-black mb-2">Key Indicators</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {metricsLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-24 rounded-xl skeleton" />
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
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <section id="dashboard-map" className="lg:col-span-2">
              <h2 className="text-sm font-display font-semibold text-rich-black mb-2">Coverage Map</h2>
              <RwandaMap />
            </section>

            {/* Data Gaps */}
            <section id="dashboard-gaps" className="space-y-3">
              <h2 className="text-sm font-display font-semibold text-rich-black mb-2">Data Gaps & Alerts</h2>
              <div className="space-y-3">
                {gapAlertsLoading ? (
                  Array.from({ length: 2 }).map((_, i) => (
                    <div key={i} className="h-24 rounded-xl skeleton" />
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
          <section id="dashboard-insights" className="space-y-3">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-4 h-4 text-rwanda-blue" />
              <h2 className="text-sm font-display font-semibold text-rich-black">AI-Generated Insights</h2>
              {generatedInsights.length > 0 && (
                <span className="ml-2 px-2 py-0.5 bg-rwanda-blue/10 text-rwanda-blue text-xs font-medium rounded-full flex items-center gap-1">
                  <Globe className="w-3 h-3" /> Live Search Data
                </span>
              )}
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {insightsLoading || isGeneratingInsight ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-24 rounded-xl skeleton" />
                ))
              ) : (
                (generatedInsights.length > 0 ? generatedInsights : insights)?.map(insight => (
                  <div key={insight.id} className="bg-white p-3 rounded-xl border border-light-gray shadow-sm hover:border-rwanda-blue transition-colors">
                    <span className="inline-block px-2 py-0.5 bg-off-white text-xs font-bold text-dark-gray rounded mb-2 uppercase tracking-wider">
                      {insight.type}
                    </span>
                    <p className="text-rich-black text-sm font-medium leading-relaxed">
                      {insight.headline}
                    </p>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>

      <PdfExportModal
        isOpen={isPdfModalOpen}
        onClose={() => setIsPdfModalOpen(false)}
        onExport={handleExportPDF}
        defaultTitle="GDO PORTAL Gender Data Observatory - National Overview"
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
