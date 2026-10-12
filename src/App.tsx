import React, { useState, useEffect } from 'react';
import './polyfills';
import { BrowserRouter, Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import { WalletContextProvider } from './components/WalletContextProvider';
import { Navbar } from './components/Navbar';
import { DevnetBanner } from './components/DevnetBanner';
import { ShootingStars } from './components/ShootingStars';
import { Footer } from './components/Footer';
import { HomePage } from './pages/HomePage';
import { ProjectsPage } from './pages/ProjectsPage';
import { ProjectDetailPage } from './pages/ProjectDetailPage';
import { CreateProjectPage } from './pages/CreateProjectPage';
import { LedgerPage } from './pages/LedgerPage';
import { AboutPage } from './pages/AboutPage';
import { DocsPage } from './pages/DocsPage';
import { getStoredProjects } from './lib/api';
import { Project } from './types';
import { Search, X, ArrowRight } from 'lucide-react';

const MainApp: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>(getStoredProjects);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const reloadProjects = () => {
    setProjects(getStoredProjects());
  };

  // Keyboard shortcut Ctrl/Cmd+K for search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
      if (e.key === 'Escape') {
        setSearchOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const searchResults = projects.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.tagline.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#07060d] text-white flex flex-col relative selection:bg-purple-600 selection:text-white">
      {/* Background shooting stars animation */}
      <ShootingStars />

      {/* Background global grid with glowing crosshair aesthetic */}
      <div className="fixed inset-0 bg-grid-pattern opacity-25 pointer-events-none z-[1]" />

      {/* Devnet banner */}
      <DevnetBanner />

      {/* Top Navbar */}
      <Navbar onSearchClick={() => setSearchOpen(true)} />

      {/* Main Content Area */}
      <main className="flex-1 relative z-10">
        <Routes>
          <Route path="/" element={<HomePage projects={projects} />} />
          <Route path="/projects" element={<ProjectsPage projects={projects} />} />
          <Route
            path="/project/:id"
            element={<ProjectDetailPage onProjectsUpdated={reloadProjects} />}
          />
          <Route
            path="/create"
            element={<CreateProjectPage onProjectCreated={reloadProjects} />}
          />
          <Route path="/ledger" element={<LedgerPage projects={projects} />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/docs" element={<DocsPage />} />
          <Route path="/docs/:slug" element={<DocsPage />} />
          <Route path="/articles" element={<Navigate to="/docs" replace />} />
          <Route path="*" element={<HomePage projects={projects} />} />
        </Routes>
      </main>

      {/* Footer with informational disclaimer */}
      <Footer />

      {/* Global Quick Search Modal */}
      {searchOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 px-4 bg-black/80 backdrop-blur-md">
          <div className="relative w-full max-w-xl rounded-2xl glass-panel bg-[#0d0b1a] border border-white/15 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center px-4 py-3.5 border-b border-white/10">
              <Search className="w-4 h-4 text-white/40 mr-3" />
              <input
                type="text"
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search campaigns by name, category, or founder address..."
                className="w-full bg-transparent text-sm text-white focus:outline-none placeholder:text-white/30"
              />
              <button
                onClick={() => setSearchOpen(false)}
                className="p-1 rounded-lg text-white/40 hover:text-white hover:bg-white/10"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="max-h-80 overflow-y-auto p-2 space-y-1">
              {searchResults.length === 0 ? (
                <div className="py-8 text-center text-xs text-white/40">
                  No campaigns found matching &ldquo;{searchQuery}&rdquo;
                </div>
              ) : (
                searchResults.map((proj) => (
                  <button
                    key={proj.id}
                    onClick={() => {
                      setSearchOpen(false);
                      setSearchQuery('');
                      navigate(`/project/${proj.id}`);
                    }}
                    className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-white/5 transition-colors text-left group cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0 overflow-hidden bg-[#181330] border border-white/10">
                        {proj.logoUrl ? (
                          <img src={proj.logoUrl} alt={proj.name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-white drop-shadow font-extrabold">{proj.name[0]?.toUpperCase() || 'P'}</span>
                        )}
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-white group-hover:text-purple-300 transition-colors">
                          {proj.name}
                        </div>
                        <div className="text-xs text-[#9b98ad] truncate max-w-xs">
                          {proj.tagline}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-purple-300">
                        {proj.goalSol} ◎
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 text-white/30 group-hover:text-white group-hover:translate-x-1 transition-transform" />
                    </div>
                  </button>
                ))
              )}
            </div>

            <div className="px-4 py-2 bg-white/5 border-t border-white/5 text-[11px] text-white/40 flex items-center justify-between">
              <span>Press <kbd className="px-1 py-0.5 rounded bg-white/10 font-mono text-[10px]">ESC</kbd> to exit</span>
              <span>Solana Devnet Projects</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default function App() {
  return (
    <WalletContextProvider>
      <BrowserRouter>
        <MainApp />
      </BrowserRouter>
    </WalletContextProvider>
  );
}
