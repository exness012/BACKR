import React, { useRef } from 'react';
import { Hero } from '../components/Hero';
import { ProjectCard } from '../components/ProjectCard';
import { Project } from '../types';
import { usePlatformTotalFunding } from '../lib/ledger';
import { APP_NAME } from '../lib/constants';
import { Link } from 'react-router-dom';
import { 
  ArrowRight, 
  ShieldCheck, 
  Flame, 
  Layers, 
  Lock, 
  CheckCircle2, 
  Sparkles,
  TrendingUp,
  Cpu,
  RefreshCw
} from 'lucide-react';

interface HomePageProps {
  projects: Project[];
}

export const HomePage: React.FC<HomePageProps> = ({ projects }) => {
  const projectsSectionRef = useRef<HTMLDivElement>(null);

  const scrollToProjects = () => {
    projectsSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const {
    totalRaised,
    totalBackers,
    isLoading: isTotalsLoading,
    isError: isTotalsError,
    refetch: refetchTotals,
  } = usePlatformTotalFunding(projects);

  const totalMilestonesVerified = projects.reduce(
    (acc, p) => acc + p.milestones.filter(m => m.status === 'completed').length,
    0
  );

  return (
    <div className="space-y-16 sm:space-y-24">
      {/* Hero section with 3-card carousel */}
      <Hero projects={projects} onGetStartedClick={scrollToProjects} />

      {/* Platform Highlight Metrics Bar */}
      <div className="max-w-6xl mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 rounded-3xl glass-panel border border-white/10 bg-[#0a0816]/70">
          <div className="p-3 text-center sm:text-left">
            <span className="text-xs text-[#9b98ad] block">Total Raised</span>
            {isTotalsLoading ? (
              <div className="h-8 w-24 bg-white/10 rounded-xl mt-1 animate-pulse" />
            ) : isTotalsError ? (
              <div className="flex items-center gap-2 mt-1">
                <span className="text-2xl sm:text-3xl font-extrabold text-white/50 font-mono">— ◎</span>
                <button
                  type="button"
                  onClick={() => refetchTotals()}
                  title="Retry"
                  className="p-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-xs cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <span className="text-2xl sm:text-3xl font-extrabold text-white font-mono mt-1 flex items-center justify-center sm:justify-start gap-1">
                {totalRaised.toFixed(1)} <span className="text-purple-400 font-mono text-xl">◎</span>
              </span>
            )}
            <span className="text-[11px] text-purple-300/70 mt-0.5 block">Solana Devnet SOL</span>
          </div>

          <div className="p-3 text-center sm:text-left">
            <span className="text-xs text-[#9b98ad] block">Total Supporters</span>
            {isTotalsLoading ? (
              <div className="h-8 w-20 bg-white/10 rounded-xl mt-1 animate-pulse" />
            ) : isTotalsError ? (
              <span className="text-2xl sm:text-3xl font-extrabold text-white/50 font-mono mt-1 block">—</span>
            ) : (
              <span className="text-2xl sm:text-3xl font-extrabold text-white font-mono mt-1 block">
                {totalBackers.toLocaleString()}
              </span>
            )}
            <span className="text-[11px] text-emerald-400/80 mt-0.5 block">Unique pledges</span>
          </div>

          <div className="p-3 text-center sm:text-left">
            <span className="text-xs text-[#9b98ad] block">Milestones Verified</span>
            <span className="text-2xl sm:text-3xl font-extrabold text-white font-mono mt-1 block">
              {totalMilestonesVerified}
            </span>
            <span className="text-[11px] text-purple-300/80 mt-0.5 block">On-chain memo proofs</span>
          </div>

          <div className="p-3 text-center sm:text-left">
            <span className="text-xs text-[#9b98ad] block">Active Campaigns</span>
            <span className="text-2xl sm:text-3xl font-extrabold text-white font-mono mt-1 block">
              {projects.length}
            </span>
            <span className="text-[11px] text-white/50 mt-0.5 block">Early-stage ventures</span>
          </div>
        </div>
      </div>

      {/* Projects Grid Section */}
      <section ref={projectsSectionRef} className="max-w-6xl mx-auto px-4 scroll-mt-24">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
              <span className="text-xs font-semibold uppercase tracking-wider text-purple-400 font-mono">
                Curated Opportunities
              </span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-bold text-white mt-1.5 tracking-tight">
              Featured Crowdfund Campaigns
            </h2>
            <p className="text-sm text-[#9b98ad] mt-1 max-w-xl">
              Explore vetted web3 startups raising seed liquidity with on-chain milestone escrow.
            </p>
          </div>

          <Link
            to="/projects"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full glass-panel border border-white/10 hover:border-purple-400 text-sm font-medium text-white hover:bg-white/5 transition-all self-start sm:self-auto cursor-pointer"
          >
            <span>View all projects</span>
            <ArrowRight className="w-4 h-4 text-purple-400" />
          </Link>
        </div>

        {/* Responsive Grid */}
        {projects.length === 0 ? (
          <div className="py-16 px-6 text-center rounded-3xl glass-panel border border-white/10 bg-[#0d0b1a]/60 max-w-xl mx-auto space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/20 text-purple-400 flex items-center justify-center mx-auto">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">No Campaigns Listed</h3>
              <p className="text-sm text-[#9b98ad] mt-1 max-w-md mx-auto leading-relaxed">
                All pre-seeded campaigns have been removed. Ready to launch your own venture on Solana Devnet?
              </p>
            </div>
            <div className="pt-2">
              <Link
                to="/create"
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full text-xs font-semibold text-white bg-purple-600 hover:bg-purple-500 transition-colors shadow-lg shadow-purple-600/30 cursor-pointer"
              >
                <span>Launch a Campaign</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                isCenter={false}
                showProgress={true}
              />
            ))}
          </div>
        )}
      </section>

      {/* Platform Features: Why BACKR */}
      <section className="max-w-6xl mx-auto px-4">
        <div className="rounded-[32px] glass-panel border border-white/10 p-8 sm:p-12 bg-gradient-to-b from-[#0e0c1f]/80 to-[#07060d]/90 relative overflow-hidden">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-mono font-semibold uppercase tracking-wider text-purple-400">
              Trust By Architecture
            </span>
            <h3 className="text-2xl sm:text-3xl font-bold text-white mt-2">
              Crowdfunding Rebuilt for Verifiable Delivery
            </h3>
            <p className="text-sm text-[#9b98ad] mt-2 leading-relaxed">
              Traditional crowdfunding suffers from empty promises. {APP_NAME} introduces milestone-governed devnet escrows so backers always retain visibility.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl glass-panel border border-white/10 bg-white/5 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center text-purple-400">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-white">Transparent Solana Ledger</h4>
              <p className="text-xs text-[#9b98ad] leading-relaxed">
                Every contribution is directly written to the Solana Devnet blockchain with standard JSON memo instructions and explorer traces.
              </p>
            </div>

            <div className="p-6 rounded-2xl glass-panel border border-white/10 bg-white/5 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                <Lock className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-white">Milestone Proofs</h4>
              <p className="text-xs text-[#9b98ad] leading-relaxed">
                Founders unlock subsequent funding tranches only when on-chain deliverables are broadcast and verified by the community.
              </p>
            </div>

            <div className="p-6 rounded-2xl glass-panel border border-white/10 bg-white/5 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                <Sparkles className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-white">Algorithmic Founder Trust</h4>
              <p className="text-xs text-[#9b98ad] leading-relaxed">
                Reputation is calculated in real time (0-100) from on-time roadmap velocity, backer volume, and treasury accountability.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Frequently Asked Questions */}
      <section className="max-w-4xl mx-auto px-4 pb-8">
        <div className="text-center mb-10">
          <span className="text-xs font-mono font-semibold uppercase tracking-wider text-purple-400">
            Frequently Asked Questions
          </span>
          <h3 className="text-2xl sm:text-3xl font-bold text-white mt-1.5">
            Everything You Need to Know
          </h3>
        </div>

        <div className="space-y-4">
          <div className="p-6 rounded-2xl glass-panel border border-white/10 bg-[#0d0b1a]/60">
            <h4 className="text-base font-semibold text-white">What is {APP_NAME}?</h4>
            <p className="text-xs text-[#9b98ad] mt-2 leading-relaxed">
              {APP_NAME} is a decentralized, milestone-governed crypto crowdfunding platform powered by Solana. It allows visionary founders to raise seed liquidity from global supporters with 100% on-chain ledger transparency and provable deliverable releases.
            </p>
          </div>

          <div className="p-6 rounded-2xl glass-panel border border-white/10 bg-[#0d0b1a]/60">
            <h4 className="text-base font-semibold text-white">How does {APP_NAME} milestone tracking protect supporters?</h4>
            <p className="text-xs text-[#9b98ad] mt-2 leading-relaxed">
              Every pledge transaction is recorded with a verified cryptographic Solana memo referencing the project ID. Subsequent development milestones require proof submissions verified directly on-chain before teams can claim community trust badges.
            </p>
          </div>

          <div className="p-6 rounded-2xl glass-panel border border-white/10 bg-[#0d0b1a]/60">
            <h4 className="text-base font-semibold text-white">Do I need real cryptocurrency to use {APP_NAME}?</h4>
            <p className="text-xs text-[#9b98ad] mt-2 leading-relaxed">
              No. {APP_NAME} is currently deployed in demonstration mode on Solana Devnet. All transactions utilize free devnet SOL test tokens, which you can claim with a single click from the wallet dropdown.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};
