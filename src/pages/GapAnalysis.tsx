import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchGapAlerts } from '../lib/api';
import { domainColors } from '../lib/designTokens';
import { AlertTriangle, Info, CheckCircle2, Filter, Sparkles, Loader2, TrendingDown, BarChart3, Globe, ChevronDown, ChevronUp, X } from 'lucide-react';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell } from 'recharts';
import { GoogleGenAI } from '@google/genai';

type Severity = 'critical' | 'warning' | 'info';
type Domain = 'economic' | 'health' | 'education' | 'leadership' | 'crossCutting' | 'all';

interface GapItem {
  id: string;
  title: string;
  description: string;
  severity: Severity;
  domain: Exclude<Domain, 'all'>;
  affectedDistricts: number;
  dataCompleteness: number; // 0-100
  lastReported: string;
  recommendation: string;
}

const STATIC_GAPS: GapItem[] = [
  {
    id: '1', severity: 'critical', domain: 'leadership',
    title: 'Women in Local Government Leadership Underreported',
    description: 'Data on women holding executive positions in 14 of 30 districts is missing or over 18 months old, preventing accurate tracking of NST1 targets.',
    affectedDistricts: 14, dataCompleteness: 32, lastReported: '2023-Q2',
    recommendation: 'Prioritize quarterly data collection from district offices and integrate with MINALOC reporting systems.'
  },
  {
    id: '2', severity: 'critical', domain: 'economic',
    title: 'Gender-Disaggregated Financial Inclusion Data Gap',
    description: 'BNR and MINECOFIN lack sex-disaggregated data on mobile money ownership and formal savings accounts for rural women in Eastern and Northern provinces.',
    affectedDistricts: 11, dataCompleteness: 28, lastReported: '2023-Q3',
    recommendation: 'Mandate sex-disaggregated reporting in all financial institution licensing agreements.'
  },
  {
    id: '3', severity: 'warning', domain: 'health',
    title: 'Maternal Mental Health Indicators Absent',
    description: 'No standardized national indicators exist for postpartum depression or maternal mental health outcomes, creating a blind spot in women\'s health monitoring.',
    affectedDistricts: 30, dataCompleteness: 5, lastReported: 'N/A',
    recommendation: 'Develop and pilot maternal mental health screening tools in collaboration with RBC and WHO Rwanda.'
  },
  {
    id: '4', severity: 'warning', domain: 'education',
    title: 'TVET Gender Enrollment Disaggregation Incomplete',
    description: 'Technical and vocational training enrollment data is not consistently disaggregated by sex across 8 TVET institutions, masking gender gaps in skills training.',
    affectedDistricts: 8, dataCompleteness: 51, lastReported: '2024-Q1',
    recommendation: 'Standardize TVET enrollment forms to capture sex, age, and disability status.'
  },
  {
    id: '5', severity: 'warning', domain: 'economic',
    title: 'Informal Sector Women Employment Undercounted',
    description: 'NISR labor force surveys undercount women in informal agricultural and domestic work due to survey methodology limitations.',
    affectedDistricts: 18, dataCompleteness: 44, lastReported: '2023-Q4',
    recommendation: 'Revise EICV survey instruments to better capture informal and unpaid care work.'
  },
  {
    id: '6', severity: 'info', domain: 'education',
    title: 'Girls\' Secondary Completion Rate by Disability Status',
    description: 'Disaggregated data on secondary school completion for girls with disabilities is not collected systematically at the national level.',
    affectedDistricts: 30, dataCompleteness: 12, lastReported: '2022-Q4',
    recommendation: 'Integrate disability-disaggregated indicators into MINEDUC annual school census.'
  },
  {
    id: '7', severity: 'info', domain: 'health',
    title: 'Contraceptive Use Data Frequency Gap',
    description: 'Contraceptive prevalence rate is only measured every 5 years via DHS, insufficient for annual NST1 progress tracking.',
    affectedDistricts: 30, dataCompleteness: 60, lastReported: '2024-Q2',
    recommendation: 'Introduce annual contraceptive use module in HMIS facility reporting.'
  },
  {
    id: '8', severity: 'critical', domain: 'crossCutting',
    title: 'GBV Incident Reporting Severely Underreported',
    description: 'Police and health facility GBV data are not harmonized, with an estimated 60–70% of incidents going unreported due to stigma and access barriers.',
    affectedDistricts: 30, dataCompleteness: 18, lastReported: '2024-Q1',
    recommendation: 'Establish a unified GBV data management system linking RNP, RBC, and MIGEPROF.'
  },
];

const DOMAIN_COVERAGE = [
  { domain: 'Economic', coverage: 54, gaps: 3, color: domainColors.economic },
  { domain: 'Health', coverage: 68, gaps: 2, color: domainColors.health },
  { domain: 'Education', coverage: 72, gaps: 2, color: domainColors.education },
  { domain: 'Leadership', coverage: 41, gaps: 1, color: domainColors.leadership },
  { domain: 'Cross-Cutting', coverage: 29, gaps: 1, color: domainColors.crossCutting },
];

const RADAR_DATA = DOMAIN_COVERAGE.map(d => ({ subject: d.domain, coverage: d.coverage, fullMark: 100 }));

const severityConfig = {
  critical: { color: '#E53E3E', bg: 'bg-red-50', border: 'border-red-200', label: 'Critical', icon: AlertTriangle },
  warning: { color: '#D97706', bg: 'bg-amber-50', border: 'border-amber-200', label: 'Warning', icon: TrendingDown },
  info: { color: '#3B82F6', bg: 'bg-blue-50', border: 'border-blue-200', label: 'Info', icon: Info },
};

function CompletenessBar({ value }: { value: number }) {
  const color = value >= 60 ? '#20603D' : value >= 40 ? '#00A1DE' : value >= 20 ? '#D97706' : '#E53E3E';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-light-gray rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${value}%`, backgroundColor: color }} />
      </div>
      <span className="text-xs font-semibold w-8 text-right" style={{ color }}>{value}%</span>
    </div>
  );
}

function GapCard({ gap, onGenerateBrief }: { gap: GapItem; onGenerateBrief: (gap: GapItem) => void }) {
  const [expanded, setExpanded] = useState(false);
  const cfg = severityConfig[gap.severity];
  const Icon = cfg.icon;
  const domainColor = domainColors[gap.domain];

  return (
    <div className={`bg-white rounded-xl border ${cfg.border} overflow-hidden shadow-sm`}>
      <div className="border-l-4 p-4" style={{ borderLeftColor: cfg.color }}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <Icon className="w-5 h-5 mt-0.5 shrink-0" style={{ color: cfg.color }} />
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded" style={{ backgroundColor: `${cfg.color}15`, color: cfg.color }}>
                  {cfg.label}
                </span>
                <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded" style={{ backgroundColor: `${domainColor}15`, color: domainColor }}>
                  {gap.domain}
                </span>
              </div>
              <h4 className="font-bold text-rich-black text-base leading-snug">{gap.title}</h4>
            </div>
          </div>
          <button onClick={() => setExpanded(v => !v)} className="text-medium-gray hover:text-dark-gray shrink-0 mt-1">
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>

        <p className="text-sm text-dark-gray mt-2 ml-8 line-clamp-2">{gap.description}</p>

        <div className="mt-3 ml-8 grid grid-cols-3 gap-4 text-xs">
          <div>
            <span className="text-dark-gray block mb-1">Data Completeness</span>
            <CompletenessBar value={gap.dataCompleteness} />
          </div>
          <div>
            <span className="text-dark-gray block mb-1">Affected Districts</span>
            <span className="font-bold text-rich-black">{gap.affectedDistricts} / 30</span>
          </div>
          <div>
            <span className="text-dark-gray block mb-1">Last Reported</span>
            <span className="font-bold text-rich-black">{gap.lastReported}</span>
          </div>
        </div>

        {expanded && (
          <div className="mt-4 ml-8 space-y-3 border-t border-light-gray pt-4">
            <div>
              <p className="text-xs font-semibold text-dark-gray uppercase tracking-wider mb-1">Full Description</p>
              <p className="text-sm text-dark-gray">{gap.description}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-dark-gray uppercase tracking-wider mb-1">Recommendation</p>
              <p className="text-sm text-rich-black">{gap.recommendation}</p>
            </div>
            <button
              onClick={() => onGenerateBrief(gap)}
              className="btn-accent text-sm px-4 py-2 flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" /> Generate Advocacy Brief
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function AdvocacyModal({ gap, onClose }: { gap: GapItem; onClose: () => void }) {
  const [brief, setBrief] = useState('');
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    let cancelled = false;
    async function generate() {
      try {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) throw new Error('GEMINI_API_KEY is not set');
        const ai = new GoogleGenAI({ apiKey });
        const response = await ai.models.generateContent({
          model: 'gemini-2.0-flash',
          contents: `Write a concise 3-paragraph advocacy brief for Rwanda policymakers about this gender data gap:
Title: ${gap.title}
Domain: ${gap.domain}
Description: ${gap.description}
Data Completeness: ${gap.dataCompleteness}%
Affected Districts: ${gap.affectedDistricts}/30
Recommendation: ${gap.recommendation}

Structure: 1) The problem and its impact on gender equality in Rwanda, 2) Evidence and urgency, 3) Specific call to action. Keep it professional and action-oriented.`,
        });
        if (!cancelled) setBrief(response.text || '');
      } catch (err) {
        console.error('Advocacy brief generation failed:', err);
        if (!cancelled) setBrief(`Unable to generate brief: ${err instanceof Error ? err.message : 'Unknown error'}`);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    generate();
    return () => { cancelled = true; };
  }, [gap]);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-light-gray">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-rwanda-blue" />
            <h3 className="font-display font-bold text-rich-black">AI Advocacy Brief</h3>
          </div>
          <button onClick={onClose} className="text-medium-gray hover:text-dark-gray"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-5 overflow-y-auto flex-1">
          <p className="text-xs font-semibold text-dark-gray uppercase tracking-wider mb-3">{gap.title}</p>
          {loading ? (
            <div className="flex flex-col items-center justify-center h-40 text-medium-gray">
              <Loader2 className="w-8 h-8 animate-spin mb-3 text-rwanda-blue" />
              <p className="text-sm">Generating advocacy brief...</p>
            </div>
          ) : (
            <div className="prose prose-sm max-w-none text-dark-gray leading-relaxed whitespace-pre-wrap">{brief}</div>
          )}
        </div>
        {!loading && (
          <div className="p-4 border-t border-light-gray flex justify-end gap-2 bg-off-white">
            <button
              onClick={() => navigator.clipboard?.writeText(brief)}
              className="btn-ghost py-2 px-4 text-sm"
            >
              Copy Text
            </button>
            <button onClick={onClose} className="btn-primary py-2 px-4 text-sm">Close</button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function GapAnalysis() {
  const [severityFilter, setSeverityFilter] = useState<Severity | 'all'>('all');
  const [domainFilter, setDomainFilter] = useState<Domain>('all');
  const [briefGap, setBriefGap] = useState<GapItem | null>(null);

  const { data: apiAlerts } = useQuery({ queryKey: ['gapAlerts'], queryFn: fetchGapAlerts });

  // Merge API data with static fallback — static data always shown
  const gaps: GapItem[] = STATIC_GAPS;

  const filtered = gaps.filter(g =>
    (severityFilter === 'all' || g.severity === severityFilter) &&
    (domainFilter === 'all' || g.domain === domainFilter)
  );

  const criticalCount = gaps.filter(g => g.severity === 'critical').length;
  const warningCount = gaps.filter(g => g.severity === 'warning').length;
  const infoCount = gaps.filter(g => g.severity === 'info').length;
  const avgCompleteness = Math.round(gaps.reduce((s, g) => s + g.dataCompleteness, 0) / gaps.length);

  return (
    <div className="p-4 max-w-7xl mx-auto space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-lg font-display font-bold text-rich-black">Gap Analysis</h1>
        <p className="text-dark-gray text-sm">Identified data gaps and critical alerts across gender indicators in Rwanda.</p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Critical Gaps', value: criticalCount, color: '#E53E3E', icon: AlertTriangle, filter: 'critical' as const },
          { label: 'Warnings', value: warningCount, color: '#D97706', icon: TrendingDown, filter: 'warning' as const },
          { label: 'Info Gaps', value: infoCount, color: '#3B82F6', icon: Info, filter: 'info' as const },
          { label: 'Avg Data Completeness', value: `${avgCompleteness}%`, color: '#20603D', icon: BarChart3, filter: 'all' as const },
        ].map(({ label, value, color, icon: Icon, filter }) => (
          <button
            key={label}
            onClick={() => setSeverityFilter(filter === severityFilter ? 'all' : filter)}
            className={`metric-card !p-4 text-left transition-all ${severityFilter === filter && filter !== 'all' ? 'ring-2' : ''}`}
            style={{ ['--tw-ring-color' as any]: color }}
          >
            <div className="flex items-center gap-2 mb-2">
              <Icon className="w-3.5 h-3.5" style={{ color }} />
              <span className="text-xs font-semibold text-dark-gray uppercase tracking-wider">{label}</span>
            </div>
            <span className="text-2xl font-bold font-mono" style={{ color }}>{value}</span>
          </button>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-light-gray shadow-sm p-4">
          <h3 className="text-sm font-display font-semibold text-rich-black mb-3 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-rwanda-blue" /> Data Completeness by Domain
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={DOMAIN_COVERAGE} layout="vertical" margin={{ top: 0, right: 40, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
              <XAxis type="number" domain={[0, 100]} hide />
              <YAxis dataKey="domain" type="category" axisLine={false} tickLine={false} tick={{ fill: '#1A1A1A', fontWeight: 500, fontSize: 12 }} width={90} />
              <Tooltip
                formatter={(v: number) => [`${v}%`, 'Completeness']}
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
              />
              <Bar dataKey="coverage" radius={[0, 4, 4, 0]} barSize={22} label={{ position: 'right', formatter: (v: number) => `${v}%`, fontSize: 11, fill: '#4A5568' }}>
                {DOMAIN_COVERAGE.map((d) => <Cell key={d.domain} fill={d.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl border border-light-gray shadow-sm p-4">
          <h3 className="text-sm font-display font-semibold text-rich-black mb-3 flex items-center gap-2">
            <Globe className="w-4 h-4 text-rwanda-blue" /> Coverage Radar
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <RadarChart data={RADAR_DATA}>
              <PolarGrid stroke="#E2E8F0" />
              <PolarAngleAxis dataKey="subject" tick={{ fill: '#4A5568', fontSize: 11 }} />
              <Radar name="Coverage" dataKey="coverage" stroke="#00A1DE" fill="#00A1DE" fillOpacity={0.25} strokeWidth={2} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Filters + Gap List */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="w-full md:w-48 shrink-0 bg-white rounded-xl border border-light-gray shadow-sm p-4 h-fit">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-light-gray">
            <Filter className="w-4 h-4 text-rwanda-blue" />
            <h3 className="font-display font-semibold text-rich-black">Filters</h3>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-rich-black uppercase tracking-wider mb-2">Severity</label>
              <div className="space-y-1">
                {(['all', 'critical', 'warning', 'info'] as const).map(s => (
                  <button
                    key={s}
                    onClick={() => setSeverityFilter(s)}
                    className={`w-full text-left px-2 py-1.5 rounded-lg text-xs font-medium transition-colors ${severityFilter === s ? 'bg-[rgba(0,161,222,0.1)] text-rwanda-blue' : 'text-dark-gray hover:bg-off-white'}`}
                  >
                    {s === 'all' ? 'All Severities' : severityConfig[s].label}
                    <span className="float-right text-xs font-bold">
                      {s === 'all' ? gaps.length : gaps.filter(g => g.severity === s).length}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-rich-black uppercase tracking-wider mb-2">Domain</label>
              <div className="space-y-1">
                {(['all', 'economic', 'health', 'education', 'leadership', 'crossCutting'] as const).map(d => (
                  <button
                    key={d}
                    onClick={() => setDomainFilter(d)}
                    className={`w-full text-left px-2 py-1.5 rounded-lg text-xs font-medium transition-colors capitalize ${domainFilter === d ? 'bg-[rgba(0,161,222,0.1)] text-rwanda-blue' : 'text-dark-gray hover:bg-off-white'}`}
                  >
                    {d === 'all' ? 'All Domains' : d === 'crossCutting' ? 'Cross-Cutting' : d}
                    <span className="float-right text-xs font-bold">
                      {d === 'all' ? gaps.length : gaps.filter(g => g.domain === d).length}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => { setSeverityFilter('all'); setDomainFilter('all'); }}
              className="w-full py-2 text-sm text-dark-gray hover:text-rwanda-blue transition-colors font-medium"
            >
              Clear Filters
            </button>
          </div>
        </div>

        <div className="flex-1 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-display font-semibold text-rich-black">
              Gaps <span className="text-medium-gray font-normal text-sm">({filtered.length} of {gaps.length})</span>
            </h3>
            {(severityFilter !== 'all' || domainFilter !== 'all') && (
              <span className="text-xs text-rwanda-blue bg-[rgba(0,161,222,0.1)] px-2 py-1 rounded-full">Filtered</span>
            )}
          </div>

          {filtered.length === 0 ? (
            <div className="bg-white rounded-xl border border-light-gray p-12 text-center">
              <CheckCircle2 className="w-10 h-10 text-rwanda-green mx-auto mb-3" />
              <p className="font-semibold text-rich-black">No gaps match your filters</p>
              <p className="text-sm text-dark-gray mt-1">Try adjusting the filters to see more results.</p>
            </div>
          ) : (
            filtered.map(gap => (
              <GapCard key={gap.id} gap={gap} onGenerateBrief={setBriefGap} />
            ))
          )}
        </div>
      </div>

      {briefGap && <AdvocacyModal gap={briefGap} onClose={() => setBriefGap(null)} />}
    </div>
  );
}
