import React from 'react';

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
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://api.umutima.rw/api/v1';

export const fetchIndicators = async (filters?: { domain?: string; source?: string; frequency?: string }): Promise<IndicatorSummary[]> => {
  const params = new URLSearchParams();
  if (filters?.domain) params.append('domain', filters.domain);
  if (filters?.source) params.append('source', filters.source);
  if (filters?.frequency) params.append('frequency', filters.frequency);
  
  const response = await fetch(`${API_BASE_URL}/indicators/?${params.toString()}`);
  if (!response.ok) {
    throw new Error('Failed to fetch indicators from backend');
  }
  return response.json();
};

export const fetchMetrics = async (): Promise<Metric[]> => {
  const response = await fetch(`${API_BASE_URL}/indicators/metrics/`);
  if (!response.ok) {
    throw new Error('Failed to fetch metrics from backend');
  }
  return response.json();
};

export const fetchInsights = async (): Promise<Insight[]> => {
  const response = await fetch(`${API_BASE_URL}/insights/`);
  if (!response.ok) {
    throw new Error('Failed to fetch insights from backend');
  }
  return response.json();
};

export const fetchGapAlerts = async (): Promise<GapAlert[]> => {
  const response = await fetch(`${API_BASE_URL}/gaps/alerts/`);
  if (!response.ok) {
    throw new Error('Failed to fetch gap alerts from backend');
  }
  return response.json();
};

export const fetchDetailedIndicator = async (id: string): Promise<DetailedIndicator> => {
  const response = await fetch(`${API_BASE_URL}/indicators/${id}/detailed/`);
  if (!response.ok) {
    throw new Error(`Failed to fetch detailed indicator ${id} from backend`);
  }
  return response.json();
};

