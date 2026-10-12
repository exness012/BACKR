import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Project } from '../types';
import { getProjectById, subscribeProject, getProject } from '../lib/api';
import { shortenAddress, explorerAddressUrl } from '../lib/solana';
import { FundingPanel } from '../components/FundingPanel';
import { MilestoneTimeline } from '../components/MilestoneTimeline';
import { LedgerTable } from '../components/LedgerTable';
import { FoundersSection } from '../components/FoundersSection';
import { 
  ArrowLeft, 
  Link2, 
  MessageSquare, 
  ExternalLink, 
  ShieldCheck, 
  Layers, 
  Compass, 
  Sparkles,
  Users,
  RefreshCw,
  AlertCircle
} from 'lucide-react';

interface ProjectDetailPageProps {
  onProjectsUpdated?: () => void;
}

export const ProjectDetailPage: React.FC<ProjectDetailPageProps> = ({ onProjectsUpdated }) => {
  const { id } = useParams<{ id: string }>();
  const [project, setProject] = useState<Project | null>(() => (id ? getProjectById(id) || null : null));
  const [activeTab, setActiveTab] = useState<'overview' | 'roadmap' | 'ledger'>('overview');
  const [loading, setLoading] = useState<boolean>(!project);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(!project);
    setFetchError(null);

    // Initial explicit async fetch
    getProject(id)
      .then((p) => {
        if (p) setProject(p);
      })
      .catch((err) => {
        console.error('Failed to load project from Firestore:', err);
        setFetchError('Failed to load project details from Firebase.');
      })
      .finally(() => setLoading(false));

    // Real-time listener
    const unsubscribe = subscribeProject(
      id,
      (updatedProject) => {
        setProject(updatedProject);
        setLoading(false);
        setFetchError(null);
        onProjectsUpdated?.();
      },
      (err) => {
        console.error('Project listener error:', err);
        setFetchError('Connection error with Firebase.');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [id]);

  const refreshProject = async () => {
    if (!id) return;
    try {
      const p = await getProject(id);
      if (p) setProject(p);
      onProjectsUpdated?.();
    } catch (err) {
      console.warn('Refresh project failed:', err);
    }
  };

  const handleRetry = async () => {
    if (!id) return;
    setLoading(true);
    setFetchError(null);
    try {
      const p = await getProject(id);
      setProject(p);
    } catch {
      setFetchError('Retry failed. Please check network connection.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-8 animate-pulse">
        <div className="w-full h-64 bg-[#100f17] border border-[#24222f] rounded-2xl" />
        <div className="h-10 w-1/3 bg-[#100f17] rounded-xl" />
        <div className="h-32 w-full bg-[#100f17] rounded-xl" />
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="max-w-md mx-auto px-4 py-24 text-center space-y-4">
        <div className="w-12 h-12 mx-auto rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-white">Connection Error</h2>
        <p className="text-xs text-[#8d8a9c]">{fetchError}</p>
        <button
          onClick={handleRetry}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#a78bfa] hover:bg-[#c4b5fd] text-[#09080f] font-semibold text-xs cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Retry</span>
        </button>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-24 text-center">
        <h2 className="text-2xl font-bold text-white">Project Not Found</h2>
        <p className="text-sm text-[#9b98ad] mt-2">The campaign you are looking for does not exist or has ended.</p>
        <Link
          to="/projects"
          className="inline-flex items-center gap-2 mt-6 px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Projects</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-8">
      {/* Top back navigation */}
      <div>
        <Link
          to="/projects"
          className="inline-flex items-center gap-2 text-xs font-medium text-[#9b98ad] hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to all campaigns</span>
        </Link>
      </div>

      {/* Main Campaign Header */}
      <div className="relative rounded-[28px] md:rounded-[32px] border border-[#24222f] bg-[#100f17] p-3 sm:p-4 pb-6 sm:pb-8 shadow-2xl">
        {/* Banner wrapper: its own block with fixed height (200px mobile, 280px desktop), overflow-hidden, rounded corners, z-index 0 */}
        <div className="relative z-0 h-[200px] md:h-[280px] w-full overflow-hidden rounded-2xl md:rounded-3xl bg-[#16151f] flex items-center justify-center">
          {project.bannerUrl ? (
            <img
              src={project.bannerUrl}
              alt={project.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="h-full w-full bg-gradient-to-r from-[#170c38] via-[#2a135b] to-[#4c1d95] relative flex items-center justify-center">
              <div className="absolute inset-0 bg-black/25" />
              <span className="font-black text-6xl sm:text-8xl tracking-tighter text-white/15 select-none uppercase transform -rotate-2">
                {project.name}
              </span>
            </div>
          )}
        </div>

        {/* Header content row: SIBLING after banner, z-10, solid background, NO negative margin on row or text */}
        <div className="relative z-10 bg-[#100f17] px-3 sm:px-6 md:px-8 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-6 min-w-0 flex-1">
            {/* Logo: only element pulled up with -mt-12, 4px border in card background color */}
            <div className="-mt-12 shrink-0 h-24 w-24 md:h-28 md:w-28 overflow-hidden rounded-2xl border-4 border-[#100f17] bg-[#100f17] shadow-xl shadow-black/50">
              {project.logoUrl ? (
                <img
                  src={project.logoUrl}
                  alt={project.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="h-full w-full bg-gradient-to-br from-[#a78bfa] to-[#6d28d9] flex items-center justify-center text-4xl font-bold text-white shadow-inner">
                  {project.name[0]?.toUpperCase() || 'P'}
                </div>
              )}
            </div>

            {/* Text block: placed to the right of logo on desktop (stacked under on mobile with 12px gap), starting below banner edge with pt-4, line-height >= 1.2, no overflow-hidden */}
            <div className="pt-0 sm:pt-4 space-y-2 min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 leading-[1.25]">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-[#f4f3f8] tracking-tight leading-[1.25] break-words">
                  {project.name}
                </h1>
                <span
                  className={`text-[10px] font-semibold uppercase px-2.5 py-0.5 rounded-full ${
                    project.status === 'funded'
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : project.status === 'upcoming'
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      : 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                  }`}
                >
                  {project.status === 'live' ? 'LIVE' : project.status}
                </span>

                {/* Founder wallet link to Solana Explorer Devnet next to project name */}
                <a
                  href={explorerAddressUrl(project.founderAddress)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white/5 hover:bg-white/10 border border-[#24222f] text-xs text-[#f4f3f8]/80 transition-colors font-mono"
                  title={`Founder Address: ${project.founderAddress}`}
                >
                  <span className="w-2 h-2 rounded-full bg-gradient-to-r from-[#9945FF] to-[#14F195]" />
                  <span>Founder: {shortenAddress(project.founderAddress, 4)}</span>
                  <ExternalLink className="w-3 h-3 text-white/40" />
                </a>
              </div>
              <p className="text-xs sm:text-sm text-[#8d8a9c] max-w-2xl leading-relaxed">
                {project.tagline}
              </p>
            </div>
          </div>

          {/* Social links */}
          <div className="pt-1 sm:pt-4 flex items-center gap-2 shrink-0 self-start sm:self-auto">
            {project.websiteUrl && (
              <a
                href={project.websiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-[#f4f3f8]/70 hover:text-white transition-colors border border-[#24222f]"
                title="Website"
              >
                <Link2 className="w-4 h-4" />
              </a>
            )}
            {project.twitterUrl && (
              <a
                href={project.twitterUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-[#f4f3f8]/70 hover:text-white transition-colors border border-[#24222f]"
                title="X (Twitter)"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>
            )}
            {project.discordUrl && (
              <a
                href={project.discordUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-[#f4f3f8]/70 hover:text-white transition-colors border border-[#24222f]"
                title="Discord"
              >
                <MessageSquare className="w-4 h-4" />
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Main Grid: Left Tabs & Right Sticky Funding Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Tabs & Content (7 or 8 columns) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Tab Navigation */}
          <div className="flex items-center gap-1.5 p-1 rounded-2xl border border-[#24222f] bg-[#100f17] overflow-x-auto no-scrollbar">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'overview'
                  ? 'bg-[#a78bfa] text-[#09080f]'
                  : 'text-[#8d8a9c] hover:text-[#f4f3f8] hover:bg-white/5'
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Overview</span>
            </button>

            <button
              onClick={() => setActiveTab('roadmap')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'roadmap'
                  ? 'bg-[#a78bfa] text-[#09080f]'
                  : 'text-[#8d8a9c] hover:text-[#f4f3f8] hover:bg-white/5'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Roadmap & Milestones</span>
            </button>

            <button
              onClick={() => setActiveTab('ledger')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'ledger'
                  ? 'bg-[#a78bfa] text-[#09080f]'
                  : 'text-[#8d8a9c] hover:text-[#f4f3f8] hover:bg-white/5'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Transparent Ledger</span>
            </button>
          </div>

          {/* Tab 1: Overview */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Description */}
              <div className="p-6 rounded-3xl border border-[#24222f] bg-[#16151f] space-y-4">
                <h3 className="text-lg font-bold text-[#f4f3f8]">About the Project</h3>
                <p className="text-sm text-[#8d8a9c] leading-relaxed">
                  {project.description}
                </p>
              </div>

              {/* Founders Section - directly below Description */}
              <FoundersSection founders={project.founders} />

              {/* Problem & Solution */}
              {project.problemSolution && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-5 rounded-2xl border border-rose-500/20 bg-rose-950/10 space-y-2">
                    <span className="text-xs font-mono font-semibold uppercase text-rose-400">
                      The Problem
                    </span>
                    <p className="text-xs text-[#f4f3f8]/90 leading-relaxed">
                      {project.problemSolution.problem}
                    </p>
                  </div>

                  <div className="p-5 rounded-2xl border border-emerald-500/20 bg-emerald-950/10 space-y-2">
                    <span className="text-xs font-mono font-semibold uppercase text-emerald-400">
                      The Solution
                    </span>
                    <p className="text-xs text-[#f4f3f8]/90 leading-relaxed">
                      {project.problemSolution.solution}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Tab 2: Roadmap & Milestones */}
          {activeTab === 'roadmap' && (
            <div className="p-6 rounded-3xl border border-[#24222f] bg-[#16151f]">
              <MilestoneTimeline
                project={project}
                onMilestoneUpdated={refreshProject}
              />
            </div>
          )}

          {/* Tab 3: Transparent Ledger */}
          {activeTab === 'ledger' && (
            <LedgerTable project={project} />
          )}
        </div>

        {/* Right Column: Sticky Funding Panel (4 columns) */}
        <div className="lg:col-span-4 sticky top-6">
          <FundingPanel
            project={project}
            onContributionSuccess={refreshProject}
          />
        </div>
      </div>
    </div>
  );
};
