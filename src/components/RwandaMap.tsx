import React, {
  useRef, useState, useMemo, useCallback, useEffect,
} from 'react';
import {
  Download, Image as ImageIcon, FileText, ChevronDown, Loader2,
  TrendingUp, TrendingDown, Minus, Search, X, MapPin,
} from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

// ─── Types ─────────────────────────────────────────────────────────────────
type Province = 'Kigali' | 'Northern' | 'Southern' | 'Eastern' | 'Western';

interface District {
  id: string;
  name: string;
  province: Province;
  path: string;
  labelX: number;
  labelY: number;
}

interface DistrictData {
  coverage: number;
  indicators: number;
  lastUpdated: string;
  trend: 'up' | 'down' | 'stable';
  femaleRatio: number; // 0–100
  history: number[];   // last 4 quarters
}

// ─── Province meta ─────────────────────────────────────────────────────────
const PROVINCE_META: Record<Province, { label: string; accent: string; dim: string }> = {
  Kigali:   { label: 'Kigali City',        accent: '#F472B6', dim: 'rgba(244,114,182,0.18)' },
  Northern: { label: 'Northern Province',  accent: '#34D399', dim: 'rgba(52,211,153,0.18)'  },
  Southern: { label: 'Southern Province',  accent: '#FBBF24', dim: 'rgba(251,191,36,0.18)'  },
  Eastern:  { label: 'Eastern Province',   accent: '#818CF8', dim: 'rgba(129,140,248,0.18)' },
  Western:  { label: 'Western Province',   accent: '#FB923C', dim: 'rgba(251,146,60,0.18)'  },
};

// ─── Districts ─────────────────────────────────────────────────────────────
const DISTRICTS: District[] = [
  // KIGALI
  { id: 'nyarugenge', name: 'Nyarugenge', province: 'Kigali',   labelX: 231, labelY: 176, path: 'M 228 168 L 242 162 L 252 170 L 248 182 L 234 184 Z' },
  { id: 'gasabo',     name: 'Gasabo',     province: 'Kigali',   labelX: 256, labelY: 158, path: 'M 242 148 L 264 144 L 272 158 L 262 172 L 252 170 L 242 162 Z' },
  { id: 'kicukiro',   name: 'Kicukiro',   province: 'Kigali',   labelX: 256, labelY: 184, path: 'M 248 182 L 252 170 L 262 172 L 268 184 L 258 194 L 244 192 Z' },
  // NORTHERN
  { id: 'musanze',  name: 'Musanze',  province: 'Northern', labelX: 162, labelY:  92, path: 'M 148 80 L 172 72 L 184 88 L 176 104 L 156 108 L 140 96 Z' },
  { id: 'burera',   name: 'Burera',   province: 'Northern', labelX: 190, labelY:  70, path: 'M 172 60 L 200 56 L 208 72 L 196 84 L 184 88 L 172 72 Z' },
  { id: 'gakenke',  name: 'Gakenke',  province: 'Northern', labelX: 202, labelY: 100, path: 'M 184 88 L 208 84 L 220 96 L 212 112 L 196 116 L 184 104 Z' },
  { id: 'gicumbi',  name: 'Gicumbi',  province: 'Northern', labelX: 228, labelY:  84, path: 'M 208 72 L 236 68 L 248 84 L 240 100 L 220 96 L 208 84 Z' },
  { id: 'rulindo',  name: 'Rulindo',  province: 'Northern', labelX: 234, labelY: 114, path: 'M 220 96 L 240 100 L 248 116 L 236 128 L 220 124 L 212 112 Z' },
  // EASTERN
  { id: 'nyagatare', name: 'Nyagatare', province: 'Eastern', labelX: 326,  labelY:  88, path: 'M 300 72 L 340 68 L 356 92 L 340 112 L 308 108 L 296 88 Z' },
  { id: 'gatsibo',   name: 'Gatsibo',   province: 'Eastern', labelX: 310,  labelY: 118, path: 'M 296 108 L 320 104 L 332 120 L 320 136 L 300 132 L 288 120 Z' },
  { id: 'kayonza',   name: 'Kayonza',   province: 'Eastern', labelX: 314,  labelY: 146, path: 'M 300 132 L 324 128 L 336 144 L 324 160 L 304 156 L 292 144 Z' },
  { id: 'rwamagana', name: 'Rwamagana', province: 'Eastern', labelX: 300,  labelY: 158, path: 'M 288 148 L 312 144 L 320 160 L 308 172 L 288 168 L 280 156 Z' },
  { id: 'kirehe',    name: 'Kirehe',    province: 'Eastern', labelX: 330,  labelY: 180, path: 'M 316 168 L 340 164 L 352 180 L 340 196 L 320 192 L 308 180 Z' },
  { id: 'ngoma',     name: 'Ngoma',     province: 'Eastern', labelX: 306,  labelY: 192, path: 'M 296 180 L 316 176 L 328 192 L 316 208 L 296 204 L 284 192 Z' },
  { id: 'bugesera',  name: 'Bugesera',  province: 'Eastern', labelX: 284,  labelY: 210, path: 'M 272 196 L 296 192 L 308 208 L 296 224 L 272 220 L 260 208 Z' },
  // SOUTHERN
  { id: 'kamonyi',   name: 'Kamonyi',   province: 'Southern', labelX: 216, labelY: 196, path: 'M 200 184 L 220 180 L 232 192 L 224 208 L 204 212 L 192 200 Z' },
  { id: 'muhanga',   name: 'Muhanga',   province: 'Southern', labelX: 196, labelY: 208, path: 'M 180 196 L 200 192 L 212 204 L 204 220 L 184 224 L 172 212 Z' },
  { id: 'ruhango',   name: 'Ruhango',   province: 'Southern', labelX: 208, labelY: 216, path: 'M 196 204 L 216 200 L 228 212 L 220 228 L 200 232 L 188 220 Z' },
  { id: 'nyanza',    name: 'Nyanza',    province: 'Southern', labelX: 208, labelY: 232, path: 'M 196 220 L 216 216 L 228 228 L 220 244 L 200 248 L 188 236 Z' },
  { id: 'huye',      name: 'Huye',      province: 'Southern', labelX: 192, labelY: 252, path: 'M 180 240 L 200 236 L 212 248 L 204 264 L 184 268 L 172 256 Z' },
  { id: 'nyamagabe', name: 'Nyamagabe', province: 'Southern', labelX: 172, labelY: 252, path: 'M 160 240 L 180 236 L 192 248 L 184 264 L 164 268 L 152 256 Z' },
  { id: 'gisagara',  name: 'Gisagara',  province: 'Southern', labelX: 200, labelY: 262, path: 'M 188 248 L 208 244 L 220 256 L 212 272 L 192 276 L 180 264 Z' },
  { id: 'nyaruguru', name: 'Nyaruguru', province: 'Southern', labelX: 180, labelY: 276, path: 'M 168 264 L 188 260 L 200 272 L 192 288 L 172 292 L 160 280 Z' },
  // WESTERN
  { id: 'rubavu',     name: 'Rubavu',     province: 'Western', labelX: 108, labelY: 130, path: 'M 96 120 L 120 116 L 132 132 L 120 148 L 100 144 L 88 132 Z' },
  { id: 'nyabihu',    name: 'Nyabihu',    province: 'Western', labelX: 132, labelY: 110, path: 'M 120 100 L 144 96 L 156 112 L 144 128 L 124 124 L 112 112 Z' },
  { id: 'ngororero',  name: 'Ngororero',  province: 'Western', labelX: 158, labelY: 160, path: 'M 144 148 L 168 144 L 180 160 L 168 176 L 148 172 L 136 160 Z' },
  { id: 'rutsiro',    name: 'Rutsiro',    province: 'Western', labelX: 116, labelY: 174, path: 'M 108 164 L 132 160 L 144 176 L 132 192 L 112 188 L 100 176 Z' },
  { id: 'karongi',    name: 'Karongi',    province: 'Western', labelX: 120, labelY: 208, path: 'M 112 196 L 136 192 L 148 208 L 136 224 L 116 220 L 104 208 Z' },
  { id: 'nyamasheke', name: 'Nyamasheke', province: 'Western', labelX: 124, labelY: 228, path: 'M 116 216 L 140 212 L 152 228 L 140 244 L 120 240 L 108 228 Z' },
  { id: 'rusizi',     name: 'Rusizi',     province: 'Western', labelX: 112, labelY: 252, path: 'M 100 240 L 124 236 L 136 252 L 124 268 L 104 264 L 92 252 Z' },
];

// Province label centres (SVG coords)
const PROVINCE_LABELS: { province: Province; x: number; y: number }[] = [
  { province: 'Northern', x: 205, y: 65 },
  { province: 'Eastern',  x: 323, y: 150 },
  { province: 'Southern', x: 196, y: 286 },
  { province: 'Western',  x: 108, y: 190 },
  { province: 'Kigali',   x: 254, y: 190 },
];

// ─── Enhanced district data ──────────────────────────────────────────────────
const DISTRICT_DATA: Record<string, DistrictData> = {
  nyarugenge: { coverage: 92, indicators: 24, lastUpdated: '2024-Q4', trend: 'up',     femaleRatio: 52, history: [78, 83, 89, 92] },
  gasabo:     { coverage: 88, indicators: 22, lastUpdated: '2024-Q4', trend: 'up',     femaleRatio: 51, history: [74, 80, 85, 88] },
  kicukiro:   { coverage: 85, indicators: 21, lastUpdated: '2024-Q4', trend: 'stable', femaleRatio: 50, history: [83, 84, 84, 85] },
  musanze:    { coverage: 74, indicators: 18, lastUpdated: '2024-Q3', trend: 'up',     femaleRatio: 53, history: [60, 65, 70, 74] },
  burera:     { coverage: 58, indicators: 14, lastUpdated: '2024-Q3', trend: 'up',     femaleRatio: 55, history: [44, 50, 54, 58] },
  gakenke:    { coverage: 45, indicators: 11, lastUpdated: '2024-Q2', trend: 'stable', femaleRatio: 54, history: [43, 44, 45, 45] },
  gicumbi:    { coverage: 67, indicators: 16, lastUpdated: '2024-Q3', trend: 'up',     femaleRatio: 52, history: [55, 59, 64, 67] },
  rulindo:    { coverage: 52, indicators: 13, lastUpdated: '2024-Q2', trend: 'down',   femaleRatio: 53, history: [58, 55, 54, 52] },
  nyanza:     { coverage: 61, indicators: 15, lastUpdated: '2024-Q3', trend: 'up',     femaleRatio: 51, history: [48, 53, 57, 61] },
  gisagara:   { coverage: 38, indicators: 9,  lastUpdated: '2024-Q1', trend: 'stable', femaleRatio: 55, history: [36, 37, 38, 38] },
  nyaruguru:  { coverage: 29, indicators: 7,  lastUpdated: '2023-Q4', trend: 'down',   femaleRatio: 56, history: [33, 31, 30, 29] },
  huye:       { coverage: 71, indicators: 17, lastUpdated: '2024-Q3', trend: 'up',     femaleRatio: 52, history: [60, 64, 68, 71] },
  nyamagabe:  { coverage: 44, indicators: 11, lastUpdated: '2024-Q2', trend: 'stable', femaleRatio: 54, history: [42, 43, 44, 44] },
  ruhango:    { coverage: 55, indicators: 13, lastUpdated: '2024-Q2', trend: 'up',     femaleRatio: 52, history: [44, 48, 52, 55] },
  muhanga:    { coverage: 63, indicators: 15, lastUpdated: '2024-Q3', trend: 'up',     femaleRatio: 51, history: [52, 56, 60, 63] },
  kamonyi:    { coverage: 49, indicators: 12, lastUpdated: '2024-Q2', trend: 'stable', femaleRatio: 53, history: [47, 48, 49, 49] },
  rwamagana:  { coverage: 68, indicators: 16, lastUpdated: '2024-Q3', trend: 'up',     femaleRatio: 51, history: [56, 61, 65, 68] },
  nyagatare:  { coverage: 42, indicators: 10, lastUpdated: '2024-Q1', trend: 'stable', femaleRatio: 50, history: [40, 41, 42, 42] },
  gatsibo:    { coverage: 35, indicators: 8,  lastUpdated: '2023-Q4', trend: 'down',   femaleRatio: 54, history: [40, 38, 37, 35] },
  kayonza:    { coverage: 47, indicators: 11, lastUpdated: '2024-Q2', trend: 'up',     femaleRatio: 52, history: [38, 41, 44, 47] },
  kirehe:     { coverage: 31, indicators: 7,  lastUpdated: '2023-Q4', trend: 'stable', femaleRatio: 55, history: [29, 30, 31, 31] },
  ngoma:      { coverage: 53, indicators: 13, lastUpdated: '2024-Q2', trend: 'up',     femaleRatio: 52, history: [42, 46, 50, 53] },
  bugesera:   { coverage: 59, indicators: 14, lastUpdated: '2024-Q3', trend: 'up',     femaleRatio: 51, history: [47, 51, 55, 59] },
  karongi:    { coverage: 48, indicators: 12, lastUpdated: '2024-Q2', trend: 'stable', femaleRatio: 53, history: [46, 47, 48, 48] },
  rutsiro:    { coverage: 33, indicators: 8,  lastUpdated: '2023-Q4', trend: 'down',   femaleRatio: 55, history: [38, 36, 35, 33] },
  rubavu:     { coverage: 76, indicators: 19, lastUpdated: '2024-Q3', trend: 'up',     femaleRatio: 51, history: [62, 67, 72, 76] },
  nyabihu:    { coverage: 41, indicators: 10, lastUpdated: '2024-Q1', trend: 'stable', femaleRatio: 54, history: [39, 40, 41, 41] },
  ngororero:  { coverage: 36, indicators: 9,  lastUpdated: '2024-Q1', trend: 'stable', femaleRatio: 54, history: [34, 35, 36, 36] },
  rusizi:     { coverage: 65, indicators: 16, lastUpdated: '2024-Q3', trend: 'up',     femaleRatio: 52, history: [53, 57, 61, 65] },
  nyamasheke: { coverage: 39, indicators: 9,  lastUpdated: '2024-Q1', trend: 'stable', femaleRatio: 55, history: [37, 38, 39, 39] },
};

// ─── Helpers ────────────────────────────────────────────────────────────────
function coverageColor(c: number): string {
  if (c >= 80) return '#00D48A';
  if (c >= 60) return '#38BDF8';
  if (c >= 40) return '#A78BFA';
  if (c >= 20) return '#FBBF24';
  return '#1E2D47';
}

function coverageLabel(c: number) {
  if (c >= 80) return 'High';
  if (c >= 60) return 'Med–High';
  if (c >= 40) return 'Medium';
  if (c >= 20) return 'Low';
  return 'No Data';
}

function coverageGrade(c: number) {
  if (c >= 80) return 'A';
  if (c >= 60) return 'B';
  if (c >= 40) return 'C';
  if (c >= 20) return 'D';
  return 'F';
}

// Mini sparkline SVG path from array of values
function sparkPath(values: number[], w = 52, h = 18): string {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  return values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * w;
      const y = h - ((v - min) / range) * h;
      return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(' ');
}

// ─── Embedded CSS ───────────────────────────────────────────────────────────
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=Space+Mono:wght@400;700&family=Inter:wght@300;400;500;600&display=swap');

  .rw-root {
    --bg:       #080E1A;
    --surf:     #0F1829;
    --card:     #152035;
    --bdr:      #1E2D47;
    --bdr2:     #2A3D5C;
    --t1:       #E2EBFF;
    --t2:       #6B8AB5;
    --t3:       #2C3F60;
    font-family: 'Inter', sans-serif;
    background: var(--bg);
    color: var(--t1);
    min-height: 100%;
    display: flex;
    flex-direction: column;
  }

  .rw-root * { box-sizing: border-box; }

  /* Header */
  .rw-header {
    padding: 18px 24px 0;
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 16px;
  }
  .rw-title {
    font-family: 'Syne', sans-serif;
    font-size: 1.35rem;
    font-weight: 800;
    letter-spacing: -0.3px;
    line-height: 1.2;
    color: var(--t1);
  }
  .rw-subtitle {
    font-size: 0.72rem;
    color: var(--t2);
    margin-top: 3px;
    letter-spacing: 0.4px;
    text-transform: uppercase;
  }

  /* Province tabs */
  .rw-tabs {
    display: flex;
    gap: 6px;
    padding: 12px 24px;
    overflow-x: auto;
    scrollbar-width: none;
  }
  .rw-tabs::-webkit-scrollbar { display: none; }
  .rw-tab {
    padding: 5px 14px;
    border-radius: 20px;
    font-size: 0.72rem;
    font-weight: 600;
    letter-spacing: 0.3px;
    cursor: pointer;
    border: 1px solid var(--bdr2);
    background: var(--card);
    color: var(--t2);
    white-space: nowrap;
    transition: all 0.18s ease;
  }
  .rw-tab:hover { border-color: var(--bdr2); color: var(--t1); }
  .rw-tab.active {
    color: #fff;
    border-color: transparent;
  }

  /* KPI strip */
  .rw-kpi-strip {
    display: flex;
    gap: 1px;
    background: var(--bdr);
    border-top: 1px solid var(--bdr);
    border-bottom: 1px solid var(--bdr);
    margin-bottom: 0;
  }
  .rw-kpi {
    flex: 1;
    padding: 12px 18px;
    background: var(--surf);
  }
  .rw-kpi-label {
    font-size: 0.64rem;
    color: var(--t2);
    text-transform: uppercase;
    letter-spacing: 0.8px;
    font-weight: 600;
  }
  .rw-kpi-value {
    font-family: 'Space Mono', monospace;
    font-size: 1.5rem;
    font-weight: 700;
    line-height: 1;
    margin-top: 4px;
  }
  .rw-kpi-sub {
    font-size: 0.67rem;
    color: var(--t2);
    margin-top: 3px;
  }

  /* Body */
  .rw-body {
    display: flex;
    flex: 1;
    min-height: 0;
    gap: 0;
  }

  /* Map panel */
  .rw-map-panel {
    flex: 1;
    min-width: 0;
    position: relative;
    background: var(--surf);
    border-right: 1px solid var(--bdr);
  }

  /* SVG map */
  .rw-svg {
    width: 100%;
    height: 100%;
    display: block;
  }

  /* District paths */
  .rw-district {
    cursor: pointer;
    transition: opacity 0.15s, filter 0.15s;
    opacity: 0;
    animation: rw-fadein 0.5s ease forwards;
  }
  .rw-district:hover { opacity: 0.85; }
  .rw-district.selected { filter: url(#rw-glow); }
  .rw-district.dimmed  { opacity: 0.15; }

  @keyframes rw-fadein {
    from { opacity: 0; transform-origin: center; }
    to   { opacity: 1; }
  }

  /* Tooltip */
  .rw-tip {
    position: absolute;
    pointer-events: none;
    background: rgba(8,14,26,0.95);
    border: 1px solid var(--bdr2);
    border-radius: 10px;
    padding: 12px 14px;
    min-width: 175px;
    font-size: 0.78rem;
    backdrop-filter: blur(12px);
    box-shadow: 0 8px 32px rgba(0,0,0,0.5);
    animation: rw-tip-in 0.12s ease;
    z-index: 50;
  }
  @keyframes rw-tip-in {
    from { opacity: 0; transform: translateY(4px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .rw-tip-name  { font-family:'Syne',sans-serif; font-size:0.88rem; font-weight:700; }
  .rw-tip-prov  { font-size:0.68rem; color:var(--t2); margin-top:1px; margin-bottom:8px; }
  .rw-tip-row   { display:flex; justify-content:space-between; gap:16px; margin-top:4px; }
  .rw-tip-key   { color:var(--t2); }
  .rw-tip-val   { font-family:'Space Mono',monospace; font-weight:700; }

  /* Right panel */
  .rw-right {
    width: 278px;
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    background: var(--bg);
    overflow: hidden;
  }

  /* Legend */
  .rw-legend {
    padding: 16px 18px;
    border-bottom: 1px solid var(--bdr);
  }
  .rw-section-title {
    font-size: 0.62rem;
    font-weight: 700;
    letter-spacing: 1.2px;
    text-transform: uppercase;
    color: var(--t2);
    margin-bottom: 10px;
  }
  .rw-leg-row {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 7px;
  }
  .rw-leg-swatch {
    width: 28px;
    height: 8px;
    border-radius: 4px;
    flex-shrink: 0;
  }
  .rw-leg-label { font-size: 0.72rem; color: var(--t2); }
  .rw-leg-pct   { font-size: 0.66rem; color: var(--t3); margin-left: auto; font-family:'Space Mono',monospace; }

  /* District detail */
  .rw-detail {
    flex: 1;
    overflow-y: auto;
    padding: 16px 18px;
    scrollbar-width: thin;
    scrollbar-color: var(--bdr2) transparent;
  }
  .rw-detail::-webkit-scrollbar { width: 4px; }
  .rw-detail::-webkit-scrollbar-track { background: transparent; }
  .rw-detail::-webkit-scrollbar-thumb { background: var(--bdr2); border-radius: 4px; }

  /* Gauge arc */
  .rw-gauge-wrap {
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 10px 0 16px;
  }

  /* Grade badge */
  .rw-grade {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 28px; height: 28px;
    border-radius: 6px;
    font-family: 'Syne', sans-serif;
    font-size: 0.85rem;
    font-weight: 800;
  }

  /* Progress bar */
  .rw-bar-track {
    height: 6px;
    border-radius: 3px;
    background: var(--card);
    overflow: hidden;
    margin-top: 6px;
  }
  .rw-bar-fill {
    height: 100%;
    border-radius: 3px;
    transition: width 0.6s cubic-bezier(.22,.61,.36,1);
  }

  /* Stat row */
  .rw-stat-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 7px 0;
    border-bottom: 1px solid var(--bdr);
    font-size: 0.75rem;
  }
  .rw-stat-row:last-child { border-bottom: none; }
  .rw-stat-key { color: var(--t2); }
  .rw-stat-val { font-family:'Space Mono',monospace; font-weight:700; font-size:0.72rem; }

  /* Gender bar */
  .rw-gender-bar {
    display: flex;
    height: 8px;
    border-radius: 4px;
    overflow: hidden;
    margin-top: 6px;
  }

  /* Ranking list */
  .rw-ranking {
    padding: 0 18px 16px;
    border-top: 1px solid var(--bdr);
  }
  .rw-rank-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 0;
    border-bottom: 1px solid var(--bdr);
    cursor: pointer;
    transition: background 0.12s;
  }
  .rw-rank-item:last-child { border-bottom: none; }
  .rw-rank-item:hover { opacity: 0.85; }
  .rw-rank-num {
    width: 18px;
    text-align: right;
    font-family: 'Space Mono', monospace;
    font-size: 0.6rem;
    color: var(--t3);
    flex-shrink: 0;
  }
  .rw-rank-name {
    flex: 1;
    font-size: 0.72rem;
    font-weight: 500;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .rw-rank-pct {
    font-family: 'Space Mono', monospace;
    font-size: 0.68rem;
    font-weight: 700;
  }
  .rw-rank-bar {
    width: 40px;
    height: 4px;
    border-radius: 2px;
    background: var(--card);
    overflow: hidden;
    flex-shrink: 0;
  }
  .rw-rank-bar-fill {
    height: 100%;
    border-radius: 2px;
  }

  /* Search */
  .rw-search-wrap {
    position: relative;
    padding: 0 18px 8px;
    border-bottom: 1px solid var(--bdr);
  }
  .rw-search {
    width: 100%;
    background: var(--card);
    border: 1px solid var(--bdr2);
    border-radius: 8px;
    padding: 7px 10px 7px 30px;
    font-size: 0.72rem;
    color: var(--t1);
    outline: none;
    font-family: 'Inter', sans-serif;
  }
  .rw-search::placeholder { color: var(--t3); }
  .rw-search:focus { border-color: #38BDF8; }
  .rw-search-icon {
    position: absolute;
    left: 26px;
    top: 50%;
    transform: translateY(-50%);
    color: var(--t3);
    pointer-events: none;
  }

  /* Export btn */
  .rw-export-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 7px 14px;
    background: var(--card);
    border: 1px solid var(--bdr2);
    border-radius: 8px;
    color: var(--t2);
    font-size: 0.72rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.15s;
    letter-spacing: 0.2px;
    font-family: 'Inter', sans-serif;
  }
  .rw-export-btn:hover { color: var(--t1); border-color: #38BDF8; }
  .rw-export-btn:disabled { opacity: 0.5; cursor: default; }

  .rw-export-menu {
    position: absolute;
    right: 0;
    top: calc(100% + 6px);
    width: 148px;
    background: var(--card);
    border: 1px solid var(--bdr2);
    border-radius: 10px;
    overflow: hidden;
    box-shadow: 0 12px 40px rgba(0,0,0,0.6);
    z-index: 100;
    animation: rw-tip-in 0.12s ease;
  }
  .rw-menu-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 14px;
    font-size: 0.74rem;
    color: var(--t2);
    cursor: pointer;
    transition: background 0.1s;
    border: none;
    background: none;
    width: 100%;
    text-align: left;
    font-family: 'Inter', sans-serif;
  }
  .rw-menu-item:hover { background: var(--bdr); color: var(--t1); }

  /* Trend icons */
  .trend-up   { color: #00D48A; }
  .trend-down { color: #F87171; }
  .trend-flat { color: #94A3B8; }

  /* Province badge */
  .rw-prov-dot {
    width: 8px; height: 8px; border-radius: 50%; display: inline-block;
  }

  /* Empty state */
  .rw-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 24px;
    text-align: center;
    color: var(--t2);
    gap: 8px;
    flex: 1;
  }
  .rw-empty-icon { opacity: 0.25; margin-bottom: 4px; }
  .rw-empty-text { font-size: 0.78rem; }
  .rw-empty-sub  { font-size: 0.68rem; color: var(--t3); }
`;

// ─── Sub-components ──────────────────────────────────────────────────────────

// Circular arc gauge for coverage
function CoverageGauge({ value, color }: { value: number; color: string }) {
  const r = 44, cx = 56, cy = 56;
  const circ = 2 * Math.PI * r;
  const arc = circ * 0.75;
  const filled = arc * (value / 100);
  const rotation = 135;
  return (
    <svg width={112} height={80} viewBox="0 0 112 80">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#1E2D47" strokeWidth={10}
        strokeDasharray={`${arc} ${circ - arc}`}
        strokeDashoffset={0}
        transform={`rotate(${rotation} ${cx} ${cy})`}
        strokeLinecap="round"
      />
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth={10}
        strokeDasharray={`${filled} ${circ}`}
        transform={`rotate(${rotation} ${cx} ${cy})`}
        strokeLinecap="round"
        style={{ transition: 'stroke-dasharray 0.8s cubic-bezier(.22,.61,.36,1)' }}
      />
      <text x={cx} y={cy - 4} textAnchor="middle" fill="#E2EBFF"
        fontFamily="'Space Mono', monospace" fontSize={18} fontWeight="700">
        {value}%
      </text>
      <text x={cx} y={cy + 13} textAnchor="middle" fill="#6B8AB5"
        fontFamily="Inter, sans-serif" fontSize={9.5}>
        COVERAGE
      </text>
    </svg>
  );
}

// Tiny sparkline
function Sparkline({ values, color }: { values: number[]; color: string }) {
  const p = sparkPath(values);
  const last = values[values.length - 1];
  const first = values[0];
  const trend = last > first ? 'up' : last < first ? 'down' : 'flat';
  return (
    <svg width={52} height={18} viewBox={`0 0 52 18`}>
      <defs>
        <linearGradient id="sp-grad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="1" />
        </linearGradient>
      </defs>
      <path d={p} fill="none" stroke="url(#sp-grad)" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
      {trend === 'up' && <circle cx={52} cy={sparkPath(values).split(' ').filter(t => t === 'L').length > 0 ? 0 : 0} r={0} />}
    </svg>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function RwandaMap() {
  const mapRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const [activeProvince, setActiveProvince] = useState<Province | 'All'>('All');
  const [selected, setSelected]             = useState<string | null>(null);
  const [hovered, setHovered]               = useState<string | null>(null);
  const [search, setSearch]                 = useState('');
  const [isExporting, setIsExporting]       = useState(false);
  const [showMenu, setShowMenu]             = useState(false);
  const [tooltip, setTooltip]               = useState<{ x: number; y: number; id: string } | null>(null);

  // Close export menu on outside click
  useEffect(() => {
    if (!showMenu) return;
    const handler = () => setShowMenu(false);
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showMenu]);

  // ── Memoised computations ─────────────────────────────────────────────────
  const visibleDistricts = useMemo(() =>
    activeProvince === 'All'
      ? DISTRICTS
      : DISTRICTS.filter(d => d.province === activeProvince),
    [activeProvince]
  );

  const rankedDistricts = useMemo(() =>
    [...visibleDistricts]
      .filter(d => d.name.toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => (DISTRICT_DATA[b.id]?.coverage ?? 0) - (DISTRICT_DATA[a.id]?.coverage ?? 0)),
    [visibleDistricts, search]
  );

  const kpis = useMemo(() => {
    const vals = Object.values(DISTRICT_DATA).map(d => d.coverage);
    const avg  = Math.round(vals.reduce((s, v) => s + v, 0) / vals.length);
    const high = vals.filter(v => v >= 60).length;
    const low  = vals.filter(v => v < 40).length;
    return { avg, high, low, total: DISTRICTS.length };
  }, []);

  const provinceStats = useMemo(() =>
    (Object.keys(PROVINCE_META) as Province[]).map(p => {
      const ids = DISTRICTS.filter(d => d.province === p).map(d => d.id);
      const avg = Math.round(ids.reduce((s, id) => s + (DISTRICT_DATA[id]?.coverage ?? 0), 0) / ids.length);
      return { province: p, avg, count: ids.length };
    }),
    []
  );

  const selectedDistrict = useMemo(() => selected ? DISTRICTS.find(d => d.id === selected) : null, [selected]);
  const selectedData     = useMemo(() => selected ? DISTRICT_DATA[selected] : null, [selected]);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleDistrictClick = useCallback((id: string) => {
    setSelected(prev => prev === id ? null : id);
  }, []);

  const handleMouseEnter = useCallback((e: React.MouseEvent<SVGPathElement>, id: string) => {
    setHovered(id);
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    setTooltip({ x: e.clientX - rect.left, y: e.clientY - rect.top, id });
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent<SVGPathElement>) => {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    setTooltip(prev => prev ? { ...prev, x: e.clientX - rect.left, y: e.clientY - rect.top } : null);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setHovered(null);
    setTooltip(null);
  }, []);

  // ── Export ────────────────────────────────────────────────────────────────
  const exportImage = useCallback(async (fmt: 'png' | 'jpeg') => {
    if (!mapRef.current) return;
    setIsExporting(true); setShowMenu(false);
    try {
      const c = await html2canvas(mapRef.current, { scale: 2, useCORS: true, backgroundColor: '#080E1A' });
      const a = document.createElement('a');
      a.download = `rwanda-coverage.${fmt === 'jpeg' ? 'jpg' : 'png'}`;
      a.href = c.toDataURL(`image/${fmt}`, 1.0);
      a.click();
    } finally { setIsExporting(false); }
  }, []);

  const exportPDF = useCallback(async () => {
    if (!mapRef.current) return;
    setIsExporting(true); setShowMenu(false);
    try {
      const c = await html2canvas(mapRef.current, { scale: 2, useCORS: true, backgroundColor: '#080E1A' });
      const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
      const pw = pdf.internal.pageSize.getWidth(), ph = pdf.internal.pageSize.getHeight();
      const ratio = Math.min(pw / c.width, ph / c.height);
      const w = c.width * ratio, h = c.height * ratio;
      pdf.addImage(c.toDataURL('image/png'), 'PNG', (pw - w) / 2, (ph - h) / 2, w, h);
      pdf.save('rwanda-coverage.pdf');
    } finally { setIsExporting(false); }
  }, []);

  // ── Tooltip district data ─────────────────────────────────────────────────
  const tooltipDistrict = tooltip ? DISTRICTS.find(d => d.id === tooltip.id) : null;
  const tooltipData     = tooltip ? DISTRICT_DATA[tooltip.id] : null;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="rw-root" ref={mapRef}>
        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className="rw-header">
          <div>
            <div className="rw-title">Rwanda Gender Data Coverage</div>
            <div className="rw-subtitle">District-level tracking · 2024 Q4 snapshot</div>
          </div>
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <button className="rw-export-btn" onClick={e => { e.stopPropagation(); setShowMenu(v => !v); }} disabled={isExporting}>
              {isExporting ? <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> : <Download size={13} />}
              {isExporting ? 'Exporting…' : 'Export'}
              {!isExporting && <ChevronDown size={11} />}
            </button>
            {showMenu && (
              <div className="rw-export-menu" onClick={e => e.stopPropagation()}>
                <button className="rw-menu-item" onClick={() => exportImage('png')}><ImageIcon size={13} />PNG Image</button>
                <button className="rw-menu-item" onClick={() => exportImage('jpeg')}><ImageIcon size={13} />JPG Image</button>
                <button className="rw-menu-item" onClick={exportPDF}><FileText size={13} />PDF Document</button>
              </div>
            )}
          </div>
        </div>

        {/* ── Province tabs ───────────────────────────────────────────────── */}
        <div className="rw-tabs">
          {(['All', ...Object.keys(PROVINCE_META)] as (Province | 'All')[]).map(p => {
            const isAll = p === 'All';
            const meta  = isAll ? null : PROVINCE_META[p as Province];
            const stat  = isAll ? null : provinceStats.find(s => s.province === p);
            const active = activeProvince === p;
            return (
              <button
                key={p}
                className={`rw-tab${active ? ' active' : ''}`}
                style={active ? { background: meta?.accent ?? '#38BDF8', borderColor: 'transparent', color: '#000' } : {}}
                onClick={() => {
                  setActiveProvince(p);
                  setSelected(null);
                }}
              >
                {isAll ? 'All Districts' : `${p}${stat ? ` · ${stat.avg}%` : ''}`}
              </button>
            );
          })}
        </div>

        {/* ── KPI strip ──────────────────────────────────────────────────── */}
        <div className="rw-kpi-strip">
          {[
            { label: 'Districts', value: kpis.total.toString(), sub: 'nationwide', color: '#E2EBFF' },
            { label: 'Avg Coverage', value: `${kpis.avg}%`, sub: 'all provinces', color: '#38BDF8' },
            { label: '60%+ Coverage', value: `${kpis.high}`, sub: 'high performers', color: '#00D48A' },
            { label: 'Under 40%', value: `${kpis.low}`, sub: 'need attention', color: '#FBBF24' },
          ].map(k => (
            <div className="rw-kpi" key={k.label}>
              <div className="rw-kpi-label">{k.label}</div>
              <div className="rw-kpi-value" style={{ color: k.color }}>{k.value}</div>
              <div className="rw-kpi-sub">{k.sub}</div>
            </div>
          ))}
        </div>

        {/* ── Body ───────────────────────────────────────────────────────── */}
        <div className="rw-body">
          {/* Map */}
          <div className="rw-map-panel">
            <svg
              ref={svgRef}
              viewBox="60 44 324 264"
              className="rw-svg"
              style={{ minHeight: 320 }}
              onMouseLeave={handleMouseLeave}
            >
              <defs>
                <filter id="rw-glow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3.5" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
                <filter id="rw-hover" x="-15%" y="-15%" width="130%" height="130%">
                  <feGaussianBlur stdDeviation="2" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
                <radialGradient id="rw-bg-grad" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#162035" />
                  <stop offset="100%" stopColor="#0F1829" />
                </radialGradient>
              </defs>

              {/* Background */}
              <rect x="60" y="44" width="324" height="264" fill="url(#rw-bg-grad)" />

              {/* Grid lines */}
              {[80, 120, 160, 200, 240, 280, 320, 360].map(x => (
                <line key={`v${x}`} x1={x} y1={44} x2={x} y2={308} stroke="#1E2D47" strokeWidth={0.4} />
              ))}
              {[60, 100, 140, 180, 220, 260, 300].map(y => (
                <line key={`h${y}`} x1={60} y1={y} x2={384} y2={y} stroke="#1E2D47" strokeWidth={0.4} />
              ))}

              {/* Districts */}
              {DISTRICTS.map((d, i) => {
                const data     = DISTRICT_DATA[d.id];
                const fill     = data ? coverageColor(data.coverage) : '#1E2D47';
                const isActive = activeProvince === 'All' || d.province === activeProvince;
                const isSel    = selected === d.id;
                const isHov    = hovered === d.id;
                const meta     = PROVINCE_META[d.province];

                let className = 'rw-district';
                if (!isActive) className += ' dimmed';
                if (isSel)     className += ' selected';

                return (
                  <path
                    key={d.id}
                    d={d.path}
                    fill={isSel ? fill : fill}
                    fillOpacity={isSel ? 1 : isHov ? 0.95 : 0.82}
                    stroke={isSel ? '#fff' : isHov ? meta.accent : '#0A1220'}
                    strokeWidth={isSel ? 1.8 : isHov ? 1.2 : 0.6}
                    filter={isSel ? 'url(#rw-glow)' : isHov ? 'url(#rw-hover)' : undefined}
                    className={className}
                    style={{ animationDelay: `${i * 28}ms` }}
                    onClick={() => handleDistrictClick(d.id)}
                    onMouseEnter={e => handleMouseEnter(e, d.id)}
                    onMouseMove={handleMouseMove}
                  />
                );
              })}

              {/* Province labels */}
              {PROVINCE_LABELS.map(pl => {
                const isActive = activeProvince === 'All' || activeProvince === pl.province;
                const meta = PROVINCE_META[pl.province];
                return (
                  <text
                    key={pl.province}
                    x={pl.x} y={pl.y}
                    textAnchor="middle"
                    fill={meta.accent}
                    fillOpacity={isActive ? 0.55 : 0.15}
                    fontSize={6.5}
                    fontFamily="'Syne', sans-serif"
                    fontWeight="700"
                    letterSpacing="1.2"
                    style={{ pointerEvents: 'none', textTransform: 'uppercase' }}
                  >
                    {pl.province.toUpperCase()}
                  </text>
                );
              })}

              {/* Compass rose (decorative) */}
              <g transform="translate(374, 56)" opacity={0.35}>
                <line x1={0} y1={-8} x2={0} y2={8} stroke="#6B8AB5" strokeWidth={0.8} />
                <line x1={-8} y1={0} x2={8} y2={0} stroke="#6B8AB5" strokeWidth={0.8} />
                <text x={0} y={-10} textAnchor="middle" fill="#6B8AB5" fontSize={5} fontFamily="'Syne',sans-serif" fontWeight="700">N</text>
              </g>

              {/* Scale bar */}
              <g transform="translate(68, 300)" opacity={0.45}>
                <line x1={0} y1={0} x2={30} y2={0} stroke="#6B8AB5" strokeWidth={0.8} />
                <line x1={0} y1={-3} x2={0} y2={3} stroke="#6B8AB5" strokeWidth={0.8} />
                <line x1={30} y1={-3} x2={30} y2={3} stroke="#6B8AB5" strokeWidth={0.8} />
                <text x={15} y={-5} textAnchor="middle" fill="#6B8AB5" fontSize={4.5} fontFamily="Inter,sans-serif">50 km</text>
              </g>
            </svg>

            {/* Tooltip */}
            {tooltip && tooltipDistrict && tooltipData && (
              <div
                className="rw-tip"
                style={{
                  left:      tooltip.x + 14,
                  top:       tooltip.y - 14,
                  transform: tooltip.x > 260 ? 'translateX(-110%)' : undefined,
                }}
              >
                <div className="rw-tip-name">{tooltipDistrict.name}</div>
                <div className="rw-tip-prov" style={{ color: PROVINCE_META[tooltipDistrict.province].accent }}>
                  {PROVINCE_META[tooltipDistrict.province].label}
                </div>
                <div className="rw-tip-row">
                  <span className="rw-tip-key">Coverage</span>
                  <span className="rw-tip-val" style={{ color: coverageColor(tooltipData.coverage) }}>
                    {tooltipData.coverage}%
                  </span>
                </div>
                <div className="rw-tip-row">
                  <span className="rw-tip-key">Grade</span>
                  <span className="rw-tip-val">{coverageGrade(tooltipData.coverage)}</span>
                </div>
                <div className="rw-tip-row">
                  <span className="rw-tip-key">Indicators</span>
                  <span className="rw-tip-val">{tooltipData.indicators}</span>
                </div>
                <div className="rw-tip-row">
                  <span className="rw-tip-key">Updated</span>
                  <span className="rw-tip-val" style={{ fontFamily: 'Inter', fontSize: '0.7rem' }}>{tooltipData.lastUpdated}</span>
                </div>
                <div style={{ marginTop: 8 }}>
                  <Sparkline values={tooltipData.history} color={coverageColor(tooltipData.coverage)} />
                </div>
              </div>
            )}
          </div>

          {/* Right panel */}
          <div className="rw-right">
            {/* Legend */}
            <div className="rw-legend">
              <div className="rw-section-title">Coverage Scale</div>
              {[
                { color: '#00D48A', label: 'High',     range: '≥ 80%' },
                { color: '#38BDF8', label: 'Med–High', range: '60–79%' },
                { color: '#A78BFA', label: 'Medium',   range: '40–59%' },
                { color: '#FBBF24', label: 'Low',      range: '20–39%' },
                { color: '#1E2D47', label: 'No Data',  range: '< 20%' },
              ].map(l => (
                <div className="rw-leg-row" key={l.label}>
                  <span className="rw-leg-swatch" style={{ background: l.color }} />
                  <span className="rw-leg-label">{l.label}</span>
                  <span className="rw-leg-pct">{l.range}</span>
                </div>
              ))}
            </div>

            {/* Selected district detail OR empty state */}
            <div className="rw-detail">
              {selectedDistrict && selectedData ? (
                <>
                  {/* Header */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 4 }}>
                    <div>
                      <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: '1rem' }}>
                        {selectedDistrict.name}
                      </div>
                      <div style={{ fontSize: '0.68rem', color: PROVINCE_META[selectedDistrict.province].accent, marginTop: 2 }}>
                        <span className="rw-prov-dot" style={{ background: PROVINCE_META[selectedDistrict.province].accent, marginRight: 4 }} />
                        {PROVINCE_META[selectedDistrict.province].label}
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                      <div
                        className="rw-grade"
                        style={{
                          background: coverageColor(selectedData.coverage) + '22',
                          color: coverageColor(selectedData.coverage),
                          border: `1px solid ${coverageColor(selectedData.coverage)}55`,
                        }}
                      >
                        {coverageGrade(selectedData.coverage)}
                      </div>
                      <span style={{ fontSize: '0.6rem', color: 'var(--t2)', fontFamily: "'Space Mono',monospace" }}>
                        {coverageLabel(selectedData.coverage)}
                      </span>
                    </div>
                  </div>

                  {/* Gauge */}
                  <div className="rw-gauge-wrap">
                    <CoverageGauge value={selectedData.coverage} color={coverageColor(selectedData.coverage)} />
                  </div>

                  {/* Stats */}
                  <div>
                    {[
                      { key: 'Indicators', val: `${selectedData.indicators} / 26` },
                      { key: 'Last Updated', val: selectedData.lastUpdated },
                      {
                        key: 'Trend',
                        val: (
                          <span className={selectedData.trend === 'up' ? 'trend-up' : selectedData.trend === 'down' ? 'trend-down' : 'trend-flat'}>
                            {selectedData.trend === 'up'   && <TrendingUp size={12} style={{ display: 'inline', marginRight: 3 }} />}
                            {selectedData.trend === 'down' && <TrendingDown size={12} style={{ display: 'inline', marginRight: 3 }} />}
                            {selectedData.trend === 'stable' && <Minus size={12} style={{ display: 'inline', marginRight: 3 }} />}
                            {selectedData.trend.charAt(0).toUpperCase() + selectedData.trend.slice(1)}
                          </span>
                        ),
                      },
                    ].map(row => (
                      <div className="rw-stat-row" key={row.key}>
                        <span className="rw-stat-key">{row.key}</span>
                        <span className="rw-stat-val">{row.val}</span>
                      </div>
                    ))}
                  </div>

                  {/* Coverage bar */}
                  <div style={{ marginTop: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.67rem', color: 'var(--t2)', marginBottom: 2 }}>
                      <span>Coverage</span>
                      <span style={{ color: coverageColor(selectedData.coverage), fontFamily: "'Space Mono',monospace", fontWeight: 700 }}>
                        {selectedData.coverage}%
                      </span>
                    </div>
                    <div className="rw-bar-track">
                      <div
                        className="rw-bar-fill"
                        style={{ width: `${selectedData.coverage}%`, background: coverageColor(selectedData.coverage) }}
                      />
                    </div>
                  </div>

                  {/* Gender breakdown */}
                  <div style={{ marginTop: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.67rem', color: 'var(--t2)', marginBottom: 4 }}>
                      <span>Gender split</span>
                    </div>
                    <div className="rw-gender-bar">
                      <div style={{ width: `${selectedData.femaleRatio}%`, background: '#F472B6' }} />
                      <div style={{ flex: 1, background: '#38BDF8' }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, fontSize: '0.64rem' }}>
                      <span style={{ color: '#F472B6' }}>♀ {selectedData.femaleRatio}% Female</span>
                      <span style={{ color: '#38BDF8' }}>♂ {100 - selectedData.femaleRatio}% Male</span>
                    </div>
                  </div>

                  {/* Sparkline history */}
                  <div style={{ marginTop: 12, padding: '10px 12px', background: 'var(--card)', borderRadius: 8, border: '1px solid var(--bdr)' }}>
                    <div style={{ fontSize: '0.62rem', color: 'var(--t2)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.8px', fontWeight: 600 }}>
                      4-Quarter Trend
                    </div>
                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6 }}>
                      <Sparkline values={selectedData.history} color={coverageColor(selectedData.coverage)} />
                      <div style={{ display: 'flex', gap: 3, marginLeft: 4 }}>
                        {selectedData.history.map((v, i) => (
                          <div key={i} style={{ textAlign: 'center' }}>
                            <div style={{
                              width: 6,
                              height: `${(v / 100) * 28}px`,
                              background: i === selectedData.history.length - 1 ? coverageColor(selectedData.coverage) : '#1E2D47',
                              borderRadius: 2,
                              border: `1px solid ${coverageColor(selectedData.coverage)}44`,
                            }} />
                          </div>
                        ))}
                      </div>
                      <div style={{ marginLeft: 'auto', fontFamily: "'Space Mono',monospace", fontSize: '0.7rem', color: coverageColor(selectedData.coverage), fontWeight: 700 }}>
                        {selectedData.history[selectedData.history.length - 1] > selectedData.history[0]
                          ? `+${selectedData.history[selectedData.history.length - 1] - selectedData.history[0]}pp`
                          : `${selectedData.history[selectedData.history.length - 1] - selectedData.history[0]}pp`
                        }
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => setSelected(null)}
                    style={{
                      marginTop: 12,
                      width: '100%',
                      padding: '7px',
                      background: 'var(--card)',
                      border: '1px solid var(--bdr2)',
                      borderRadius: 8,
                      color: 'var(--t2)',
                      fontSize: '0.72rem',
                      cursor: 'pointer',
                      fontFamily: 'Inter, sans-serif',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                    }}
                  >
                    <X size={11} /> Clear selection
                  </button>
                </>
              ) : (
                <div className="rw-empty">
                  <MapPin size={28} className="rw-empty-icon" />
                  <div className="rw-empty-text">Select a district</div>
                  <div className="rw-empty-sub">Click any district on the map to see detailed coverage data</div>
                </div>
              )}
            </div>

            {/* District rankings */}
            <div className="rw-ranking" style={{ borderTop: '1px solid var(--bdr)' }}>
              <div className="rw-section-title" style={{ paddingTop: 14, marginBottom: 8 }}>
                District Ranking ({rankedDistricts.length})
              </div>

              {/* Search */}
              <div className="rw-search-wrap" style={{ padding: '0 0 8px' }}>
                <Search size={11} className="rw-search-icon" style={{ left: 8 }} />
                <input
                  className="rw-search"
                  placeholder="Search district…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>

              <div style={{ maxHeight: 220, overflowY: 'auto', scrollbarWidth: 'thin', scrollbarColor: 'var(--bdr2) transparent' }}>
                {rankedDistricts.map((d, i) => {
                  const data = DISTRICT_DATA[d.id];
                  if (!data) return null;
                  const col = coverageColor(data.coverage);
                  return (
                    <div
                      key={d.id}
                      className="rw-rank-item"
                      onClick={() => {
                        setSelected(prev => prev === d.id ? null : d.id);
                        if (activeProvince !== 'All' && d.province !== activeProvince) {
                          setActiveProvince(d.province);
                        }
                      }}
                      style={{ opacity: selected && selected !== d.id ? 0.5 : 1 }}
                    >
                      <span className="rw-rank-num">{i + 1}</span>
                      <span
                        className="rw-prov-dot"
                        style={{ background: PROVINCE_META[d.province].accent, flexShrink: 0 }}
                      />
                      <span className="rw-rank-name">{d.name}</span>
                      <span className="rw-rank-pct" style={{ color: col }}>{data.coverage}%</span>
                      <div className="rw-rank-bar">
                        <div className="rw-rank-bar-fill" style={{ width: `${data.coverage}%`, background: col }} />
                      </div>
                      {data.trend === 'up'   && <TrendingUp  size={10} className="trend-up"   style={{ flexShrink: 0 }} />}
                      {data.trend === 'down' && <TrendingDown size={10} className="trend-down" style={{ flexShrink: 0 }} />}
                      {data.trend === 'stable' && <Minus     size={10} className="trend-flat" style={{ flexShrink: 0 }} />}
                    </div>
                  );
                })}
                {rankedDistricts.length === 0 && (
                  <div style={{ fontSize: '0.72rem', color: 'var(--t3)', padding: '12px 0', textAlign: 'center' }}>
                    No districts match "{search}"
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}