import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './pages/Dashboard';
import DataExplorerPage from './pages/DataExplorerPage';
import GapAnalysis from './pages/GapAnalysis';
import DistrictMap from './pages/DistrictMap';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import CensusPage from './pages/CensusPage';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { DistrictProvider } from './context/DistrictContext';

export type Page = 'dashboard' | 'explorer' | 'gaps' | 'map' | 'reports' | 'settings' | 'census';

const queryClient = new QueryClient();

export default function App() {
  const [page, setPage] = useState<Page>('dashboard');

  const renderPage = () => {
    switch (page) {
      case 'explorer': return <DataExplorerPage />;
      case 'gaps': return <GapAnalysis />;
      case 'map': return <DistrictMap />;
      case 'reports': return <Reports />;
      case 'settings': return <Settings />;
      case 'census': return <CensusPage />;
      default: return <Dashboard />;
    }
  };

  return (
    <QueryClientProvider client={queryClient}>
      <DistrictProvider>
        <div className="flex min-h-screen bg-off-white font-sans text-soft-black">
          <Sidebar activePage={page} onNavigate={setPage} />
          <div className="flex-1 flex flex-col min-w-0">
            <Header />
            <main className="flex-1 overflow-y-auto">
              {renderPage()}
            </main>
          </div>
        </div>
      </DistrictProvider>
    </QueryClientProvider>
  );
}
