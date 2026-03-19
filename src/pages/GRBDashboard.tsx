import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchGRBData, GRBSectorAllocation } from '../lib/api';
import { STATIC_GRB_DATA } from '../lib/api';
import { useDistricts } from '../context/DistrictContext';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell,
  ComposedChart, Area,
} from 'recharts';
import { TrendingUp, TrendingDown, Minus, DollarSign, PieChart as PieIcon, BarChart2, Info } from 'lucide-react';

const GRB_PURPLE = '#7C3AED';
const GRB_PURPLE_LIGHT = '#EDE9FE';
const EXECUTED_COLOR = '#20603D';
const ALLOCATED_COLOR = '#00A1DE';
const MAINSTREAMED_COLOR = '#00A1DE';
const TARGETED_COLOR = GRB_PURPLE;

function TrendIcon({ dir }: { dir: 'up' | 'down' | 'neutral' }) {
  if (dir === 'up') return <TrendingUp className="w-3.5 h-3.5 text-rwanda-green" />;
  if (dir === 'down') return <TrendingDown className="w-3.5 h-3.5 text-red-500" />;
  return <Minus className="w-3.5 h-3.5 text-medium-gray" />;
}

function KPICard({ title, value, trend, trendDirection, source, year }: {
  title: string; value: string; trend: string;
  trendDirection: 'up' | 'down' | 'neutral'; source: string; year: string;
}) {
  const trendColor = trendDirection === 'up' ? '#20603D' : trendDirection === 'down' ? '#E53E3E' : '#6B7280';
  return (
    <div className="bg-white rounded-xl border border-light-gray shadow-sm p-4 flex flex-col gap-2">
      <div className="flex items-start justify-between gap-2">
        <span className="text-xs font-semibold text-dark-gray uppercase tracking-wider leading-tight">{title}</span>
        <span className="text-xs text-medium-gray shrink-0">{year}</span>
      </div>
      <span className="text-2xl font-bold font-mono" style={{ color: GRB_PURPLE }}>{value}</span>
      <div className="flex items-center gap-1.5">
        <TrendIcon dir={trendDirection} />
        <span className="text-xs font-medium" style={{ color: trendColor }}>{trend}</span>
      </div>
      <span className="text-xs text-medium-gray mt-auto">Source: {source}</span>
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-light-gray rounded-lg shadow-lg p-3 text-xs">
      <p className="font-semibold text-rich-black mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color }}>
          {p.name}: <span className="font-bold">{typeof p.value === 'number' && p.value > 10 ? `RWF ${p.value}B` : `${p.value}%`}</span>
        </p>
      ))}
    </div>
  );
};

const SectorTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-light-gray rounded-lg shadow-lg p-3 text-xs">
      <p className="font-semibold text-rich-black mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color }}>
          {p.name}: <span className="font-bold">
            {p.dataKey === 'genderTagged' ? `${p.value}%` : `RWF ${p.value}B`}
          </span>
        </p>
      ))}
    </div>
  );
};

type ActiveTab = 'allocation' | 'sectors' | 'composition';

export default function GRBDashboard() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('allocation');
  const { data } = useQuery({ queryKey: ['grbData'], queryFn: fetchGRBData });
  const { selectedDistricts } = useDistricts();
  const grb = data ?? STATIC_GRB_DATA;

  const pieData = [
    { name: 'Women-Targeted', value: grb.targetedFunds, color: TARGETED_COLOR },
    { name: 'Mainstreamed', value: grb.mainstreamedFunds, color: MAINSTREAMED_COLOR },
  ];

  const tabs: { id: ActiveTab; label: string; icon: React.ReactNode }[] = [
    { id: 'allocation', label: 'Allocation vs Execution', icon: <BarChart2 className="w-4 h-4" /> },
    { id: 'sectors', label: 'Sector Breakdown', icon: <DollarSign className="w-4 h-4" /> },
    { id: 'composition', label: 'Targeted vs Mainstreamed', icon: <PieIcon className="w-4 h-4" /> },
  ];

  return (
    <div className="p-4 max-w-7xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-display font-bold text-rich-black">Gender Responsive Budgeting</h1>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: GRB_PURPLE_LIGHT, color: GRB_PURPLE }}>
              GRB
            </span>
          </div>
          <p className="text-dark-gray text-sm">
            {selectedDistricts.length > 0 ? `Data for ${selectedDistricts.length} district${selectedDistricts.length !== 1 ? 's' : ''} — ` : ''}Tracking financial commitments to gender equality — MINECOFIN Gender Budget Statements.
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-medium-gray bg-white border border-light-gray rounded-lg px-3 py-2">
          <Info className="w-3.5 h-3.5 shrink-0" />
          <span>Data: MINECOFIN GBS · NST1 · BNR</span>
        </div>
      </div>

      {/* District notice — GRB data is national-only */}
      {selectedDistricts.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-start gap-3">
          <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-800">
            <span className="font-semibold">National data only — </span>
            District-level GRB data is not available in the current MINECOFIN Gender Budget Statements.
            Showing national figures across all {selectedDistricts.length} selected district{selectedDistricts.length !== 1 ? 's' : ''}.
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {grb.indicators.map(ind => (
          <KPICard key={ind.id} {...ind} />
        ))}
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-xl border border-light-gray shadow-sm overflow-hidden">
        <div className="flex border-b border-light-gray">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-3 text-sm font-medium transition-colors border-b-2 -mb-px ${
                activeTab === tab.id
                  ? 'border-[#7C3AED] text-[#7C3AED]'
                  : 'border-transparent text-dark-gray hover:text-rich-black'
              }`}
            >
              {tab.icon}
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        <div className="p-4">
          {/* Tab 1: Allocation vs Execution */}
          {activeTab === 'allocation' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-display font-semibold text-rich-black mb-1">
                  Gender Budget: Allocation vs Execution (RWF Billions)
                </h3>
                <p className="text-xs text-dark-gray">Planned gender-sensitive budget versus actual expenditure per fiscal year.</p>
              </div>
              <ResponsiveContainer width="100%" height={280}>
                <ComposedChart data={grb.budgetTimeline} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis dataKey="year" tick={{ fontSize: 11, fill: '#4A5568' }} />
                  <YAxis yAxisId="left" tick={{ fontSize: 11, fill: '#4A5568' }} tickFormatter={v => `${v}B`} />
                  <YAxis yAxisId="right" orientation="right" domain={[70, 100]} tick={{ fontSize: 11, fill: '#4A5568' }} tickFormatter={v => `${v}%`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar yAxisId="left" dataKey="genderBudget" name="Allocated" fill={ALLOCATED_COLOR} radius={[4, 4, 0, 0]} barSize={28} />
                  <Bar yAxisId="left" dataKey="executed" name="Executed" fill={EXECUTED_COLOR} radius={[4, 4, 0, 0]} barSize={28} />
                  <Line yAxisId="right" type="monotone" dataKey="executionRate" name="Execution Rate %" stroke={GRB_PURPLE} strokeWidth={2.5} dot={{ r: 4, fill: GRB_PURPLE }} />
                </ComposedChart>
              </ResponsiveContainer>

              {/* Summary row */}
              <div className="grid grid-cols-3 gap-3 pt-2 border-t border-light-gray">
                {[
                  { label: 'Latest Allocation', value: `RWF ${grb.budgetTimeline.at(-1)?.genderBudget}B`, sub: grb.budgetTimeline.at(-1)?.year },
                  { label: 'Latest Executed', value: `RWF ${grb.budgetTimeline.at(-1)?.executed}B`, sub: 'Actual spend' },
                  { label: 'Execution Rate', value: `${grb.budgetTimeline.at(-1)?.executionRate}%`, sub: 'of allocated' },
                ].map(({ label, value, sub }) => (
                  <div key={label} className="text-center">
                    <p className="text-xs text-dark-gray">{label}</p>
                    <p className="text-base font-bold font-mono" style={{ color: GRB_PURPLE }}>{value}</p>
                    <p className="text-xs text-medium-gray">{sub}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tab 2: Sector Breakdown */}
          {activeTab === 'sectors' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-display font-semibold text-rich-black mb-1">
                  Sector Budget Allocation & Gender Tagging
                </h3>
                <p className="text-xs text-dark-gray">
                  Allocated vs executed funds per sector, with % of sector budget tagged as gender-sensitive (MINECOFIN GBS).
                </p>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <ComposedChart data={grb.sectorAllocations} layout="vertical" margin={{ top: 0, right: 60, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={true} horizontal={false} stroke="#E2E8F0" />
                  <XAxis type="number" tick={{ fontSize: 11, fill: '#4A5568' }} tickFormatter={v => `${v}B`} />
                  <YAxis dataKey="sector" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#1A1A1A', fontWeight: 500 }} width={100} />
                  <Tooltip content={<SectorTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="allocated" name="Allocated (RWF B)" fill={ALLOCATED_COLOR} radius={[0, 4, 4, 0]} barSize={10} />
                  <Bar dataKey="executed" name="Executed (RWF B)" fill={EXECUTED_COLOR} radius={[0, 4, 4, 0]} barSize={10} />
                </ComposedChart>
              </ResponsiveContainer>

              {/* Gender tagging % table */}
              <div>
                <p className="text-xs font-semibold text-dark-gray uppercase tracking-wider mb-2">Gender-Tagged Budget Share by Sector</p>
                <div className="space-y-2">
                  {[...grb.sectorAllocations].sort((a, b) => b.genderTagged - a.genderTagged).map((s: GRBSectorAllocation) => {
                    const color = s.genderTagged >= 60 ? '#20603D' : s.genderTagged >= 40 ? '#00A1DE' : s.genderTagged >= 25 ? '#D97706' : '#E53E3E';
                    return (
                      <div key={s.sector} className="flex items-center gap-3">
                        <span className="text-xs text-dark-gray w-28 shrink-0">{s.sector}</span>
                        <div className="flex-1 h-2 bg-light-gray rounded-full overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${s.genderTagged}%`, backgroundColor: color }} />
                        </div>
                        <span className="text-xs font-bold w-8 text-right" style={{ color }}>{s.genderTagged}%</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Tab 3: Targeted vs Mainstreamed */}
          {activeTab === 'composition' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-display font-semibold text-rich-black mb-1">
                  Budget Composition: Targeted vs Mainstreamed
                </h3>
                <p className="text-xs text-dark-gray">
                  Proportion of the gender budget dedicated specifically to women's empowerment (targeted) versus programs that mainstream gender across all sectors.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={65}
                      outerRadius={100}
                      paddingAngle={3}
                      dataKey="value"
                      label={({ name, value }) => `${value}%`}
                      labelLine={false}
                    >
                      {pieData.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v: number) => `${v}%`} />
                  </PieChart>
                </ResponsiveContainer>

                <div className="space-y-4">
                  {pieData.map(({ name, value, color }) => (
                    <div key={name} className="bg-off-white rounded-xl p-4 border border-light-gray">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: color }} />
                        <span className="text-sm font-semibold text-rich-black">{name}</span>
                      </div>
                      <p className="text-3xl font-bold font-mono mb-1" style={{ color }}>{value}%</p>
                      <p className="text-xs text-dark-gray">
                        {name === 'Women-Targeted'
                          ? 'Funds exclusively for women\'s empowerment programs — e.g., Girinka, women\'s cooperatives, maternal health.'
                          : 'Funds in general programs with gender equality objectives mainstreamed — e.g., education, infrastructure, governance.'}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* NST1 context note */}
              <div className="bg-[#EDE9FE] border border-[#C4B5FD] rounded-xl p-4 flex gap-3">
                <Info className="w-4 h-4 text-[#7C3AED] shrink-0 mt-0.5" />
                <div className="text-xs text-[#5B21B6] space-y-1">
                  <p className="font-semibold">NST1 Gender Budget Target</p>
                  <p>Rwanda's National Strategy for Transformation (NST1) targets at least 30% of the national budget to be gender-tagged by 2024. The current 20% allocation reflects progress but highlights a remaining 10pp gap to close.</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Finance Indicators — Data Explorer link */}
      <div className="bg-white rounded-xl border border-light-gray shadow-sm p-4">
        <h3 className="text-sm font-display font-semibold text-rich-black mb-3 flex items-center gap-2">
          <DollarSign className="w-4 h-4" style={{ color: GRB_PURPLE }} />
          Finance & Budgeting Indicators
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { title: '% National Budget → Maternal Health', value: '4.8%', source: 'MOH / MINECOFIN', status: 'On Track' },
            { title: "Women's Financial Inclusion Funds", value: 'RWF 23.4B', source: 'BNR', status: 'On Track' },
            { title: 'NST1 Gender Target Execution Rate', value: '87%', source: 'MINECOFIN', status: 'At Risk' },
            { title: 'Gender Budget as % of National Budget', value: '20.0%', source: 'MINECOFIN GBS', status: 'Below Target' },
          ].map(({ title, value, source, status }) => {
            const statusColor = status === 'On Track' ? '#20603D' : status === 'At Risk' ? '#D97706' : '#E53E3E';
            const statusBg = status === 'On Track' ? '#F0FFF4' : status === 'At Risk' ? '#FFFBEB' : '#FFF5F5';
            return (
              <div key={title} className="flex items-center justify-between gap-4 p-3 rounded-lg bg-off-white border border-light-gray">
                <div className="min-w-0">
                  <p className="text-xs font-medium text-rich-black leading-snug">{title}</p>
                  <p className="text-xs text-medium-gray mt-0.5">{source}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-base font-bold font-mono" style={{ color: GRB_PURPLE }}>{value}</p>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ color: statusColor, backgroundColor: statusBg }}>
                    {status}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
