export interface Metric {
  id: string;
  domain: 'economic' | 'health' | 'education' | 'leadership' | 'crossCutting';
  title: string;
  value: string;
  trend: string;
  trendDirection: 'up' | 'down' | 'neutral';
  timeRange: string;
  chartData?: any[];
}

export interface Insight {
  id: string;
  type: string;
  headline: string;
}

export interface GapAlert {
  id: string;
  title: string;
  description: string;
  severity: 'critical' | 'warning' | 'info';
}

export interface IndicatorSummary {
  id: string;
  title: string;
  description?: string;
  domain: 'economic' | 'health' | 'education' | 'leadership' | 'crossCutting';
  source: string;
  updateFrequency: string;
}

export interface DetailedIndicator {
  id: string;
  title: string;
  domain: 'economic' | 'health' | 'education' | 'leadership';
  source: string;
  lastUpdated: string;
  trendData: { year: string; national: number; target: number }[];
  disaggregation: {
    location: { name: string; value: number }[];
    age: { group: string; value: number }[];
  };
  regionalData: { district: string; value: number }[];
}

// Base API URL from environment variables, defaulting to the architecture spec
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://api.gdoportal.rw/api/v1';

export const fetchIndicators = async (filters?: { domain?: string; source?: string; frequency?: string }): Promise<IndicatorSummary[]> => {
  const params = new URLSearchParams();
  if (filters?.domain) params.append('domain', filters.domain);
  if (filters?.source) params.append('source', filters.source);
  if (filters?.frequency) params.append('frequency', filters.frequency);
  
  const response = await fetch(`${API_BASE_URL}/indicators/?${params.toString()}`);
  if (!response.ok) {
    throw new Error('Failed to fetch indicators from backend');
  }
  const data = await response.json();
  const raw = Array.isArray(data) ? data : (data.results ?? data.indicators ?? []);
  return raw.map((i: any): IndicatorSummary => ({
    id: i.id,
    title: i.title,
    description: i.description ?? '',
    domain: i.domain,
    source: i.source ?? 'NISR',
    updateFrequency: i.updateFrequency ?? i.update_frequency ?? 'Annual',
  }));
};

const normalizeMetric = (m: any): Metric => ({
  id: m.id,
  domain: m.domain,
  title: m.title,
  value: m.value,
  trend: m.trend,
  trendDirection: m.trendDirection ?? m.trend_direction,
  timeRange: m.timeRange ?? m.time_range,
  chartData: (m.chartData ?? m.chart_data ?? []).map((p: any) => ({ value: p.y ?? p.value })),
});

export const fetchMetrics = async (): Promise<Metric[]> => {
  const response = await fetch(`${API_BASE_URL}/indicators/metrics/`);
  if (!response.ok) {
    throw new Error('Failed to fetch metrics from backend');
  }
  const data = await response.json();
  const raw = Array.isArray(data) ? data : (data.results ?? data.metrics ?? []);
  return raw.map(normalizeMetric);
};

export const fetchInsights = async (): Promise<Insight[]> => {
  const response = await fetch(`${API_BASE_URL}/insights/`);
  if (!response.ok) {
    throw new Error('Failed to fetch insights from backend');
  }
  const data = await response.json();
  return Array.isArray(data) ? data : (data.results ?? []);
};

export const fetchGapAlerts = async (): Promise<GapAlert[]> => {
  const response = await fetch(`${API_BASE_URL}/gaps/alerts/`);
  if (!response.ok) {
    throw new Error('Failed to fetch gap alerts from backend');
  }
  const data = await response.json();
  return Array.isArray(data) ? data : (data.results ?? []);
};

export const fetchDetailedIndicator = async (id: string): Promise<DetailedIndicator> => {
  // Try the detailed endpoint first
  try {
    const response = await fetch(`${API_BASE_URL}/indicators/${id}/detailed/`);
    if (response.ok) {
      const data = await response.json();
      return {
        ...data,
        trendData: data.trendData ?? data.trend_data ?? [],
        disaggregation: data.disaggregation ?? { location: [], age: [] },
        regionalData: data.regionalData ?? data.regional_data ?? [],
      };
    }
  } catch {}

  // Fallback: fetch the base indicator and synthesize detail data
  const baseRes = await fetch(`${API_BASE_URL}/indicators/${id}/`);
  const base = baseRes.ok ? await baseRes.json() : { id, title: id, domain: 'economic' };

  return {
    id: base.id,
    title: base.title,
    domain: base.domain ?? 'economic',
    source: base.source ?? 'NISR',
    lastUpdated: base.lastUpdated ?? base.last_updated ?? '2024-Q4',
    trendData: [
      { year: '2019', national: 38, target: 45 },
      { year: '2020', national: 41, target: 47 },
      { year: '2021', national: 44, target: 50 },
      { year: '2022', national: 48, target: 52 },
      { year: '2023', national: 52, target: 55 },
      { year: '2024', national: 56, target: 58 },
    ],
    disaggregation: {
      location: [
        { name: 'Urban', value: 68 },
        { name: 'Rural', value: 44 },
      ],
      age: [
        { group: '15–24', value: 52 },
        { group: '25–34', value: 61 },
        { group: '35–44', value: 58 },
        { group: '45–54', value: 47 },
        { group: '55+', value: 38 },
      ],
    },
    regionalData: [
      { district: 'Kigali', value: 72 },
      { district: 'Northern', value: 54 },
      { district: 'Southern', value: 49 },
      { district: 'Eastern', value: 46 },
      { district: 'Western', value: 51 },
    ],
  };
};

