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

// Simulating the backend data based on the design system documentation
export const fetchMetrics = async (): Promise<Metric[]> => {
  return [
    {
      id: 'm1',
      domain: 'economic',
      title: 'Female Labor Force Participation',
      value: '47.2%',
      trend: '+2.1%',
      trendDirection: 'up',
      timeRange: '2000-2024',
      chartData: [
        { year: '2020', value: 43.5 },
        { year: '2021', value: 44.1 },
        { year: '2022', value: 45.1 },
        { year: '2023', value: 46.5 },
        { year: '2024', value: 47.2 },
      ]
    },
    {
      id: 'm2',
      domain: 'health',
      title: 'Maternal Mortality Ratio',
      value: '203',
      trend: '-12%',
      trendDirection: 'down',
      timeRange: '2000-2024',
      chartData: [
        { year: '2020', value: 250 },
        { year: '2021', value: 235 },
        { year: '2022', value: 220 },
        { year: '2023', value: 211 },
        { year: '2024', value: 203 },
      ]
    },
    {
      id: 'm3',
      domain: 'education',
      title: 'Girls\' Secondary Enrollment',
      value: '89.4%',
      trend: '+3.2%',
      trendDirection: 'up',
      timeRange: 'Trend',
      chartData: [
        { year: '2020', value: 82.1 },
        { year: '2021', value: 84.5 },
        { year: '2022', value: 86.2 },
        { year: '2023', value: 88.0 },
        { year: '2024', value: 89.4 },
      ]
    },
    {
      id: 'm4',
      domain: 'leadership',
      title: 'Women in Parliament',
      value: '61.3%',
      trend: 'Global #1',
      trendDirection: 'neutral',
      timeRange: '2000-2024',
      chartData: [
        { year: '2020', value: 61.3 },
        { year: '2021', value: 61.3 },
        { year: '2022', value: 61.3 },
        { year: '2023', value: 61.3 },
        { year: '2024', value: 61.3 },
      ]
    }
  ];
};

export const fetchInsights = async (): Promise<Insight[]> => {
  return [
    {
      id: 'i1',
      type: 'Economic Data',
      headline: 'Female-owned enterprises show 15% higher resilience in rural districts.'
    },
    {
      id: 'i2',
      type: 'Health Data',
      headline: 'Contraceptive prevalence correlates strongly with secondary education completion.'
    },
    {
      id: 'i3',
      type: 'Leadership Data',
      headline: 'Local government representation reached parity in 14 out of 30 districts.'
    }
  ];
};

export const fetchGapAlerts = async (): Promise<GapAlert[]> => {
  return [
    {
      id: 'g1',
      title: 'Critical Data Gap',
      description: 'GBV data for Southern Province hasn\'t been updated since 2022.',
      severity: 'critical'
    },
    {
      id: 'g2',
      title: 'Missing Disaggregation',
      description: 'STEM enrollment data lacks disability disaggregation across all universities.',
      severity: 'warning'
    }
  ];
};

export const fetchDetailedIndicator = async (id: string): Promise<DetailedIndicator> => {
  // Returning World Bank style deep-dive data for the Data Explorer
  return {
    id: 'm1',
    title: 'Female Labor Force Participation Rate',
    domain: 'economic',
    source: 'National Institute of Statistics of Rwanda (NISR) - LFS 2024',
    lastUpdated: '2024-11-15',
    trendData: [
      { year: '2019', national: 42.1, target: 45.0 },
      { year: '2020', national: 43.5, target: 46.0 },
      { year: '2021', national: 44.1, target: 47.0 },
      { year: '2022', national: 45.1, target: 48.0 },
      { year: '2023', national: 46.5, target: 49.0 },
      { year: '2024', national: 47.2, target: 50.0 },
    ],
    disaggregation: {
      location: [
        { name: 'Urban', value: 52.4 },
        { name: 'Rural', value: 45.1 },
      ],
      age: [
        { group: '16-24', value: 38.2 },
        { group: '25-34', value: 54.1 },
        { group: '35-54', value: 58.7 },
        { group: '55+', value: 41.3 },
      ]
    },
    regionalData: [
      { district: 'Gasabo', value: 55.2 },
      { district: 'Nyarugenge', value: 53.8 },
      { district: 'Kicukiro', value: 54.5 },
      { district: 'Rubavu', value: 48.1 },
      { district: 'Musanze', value: 46.7 },
      { district: 'Huye', value: 45.9 },
      { district: 'Rusizi', value: 44.2 },
      { district: 'Nyagatare', value: 43.8 },
    ]
  };
};
