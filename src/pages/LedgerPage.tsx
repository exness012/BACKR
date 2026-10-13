import React from 'react';
import { Project } from '../types';
import { LedgerTable } from '../components/LedgerTable';
import { usePlatformTotalFunding } from '../lib/ledger';
import { Layers, TrendingUp, Users, ShieldCheck, RefreshCw } from 'lucide-react';

interface LedgerPageProps {
  projects: Project[];
}

export const LedgerPage: React.FC<LedgerPageProps> = ({ projects }) => {
  const {
    totalRaised,
    totalBackers,
    isLoading,
    isError,
    refetch,
  } = usePlatformTotalFunding(projects);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-purple-400" />
          <span className="text-xs font-mono font-semibold uppercase tracking-wider text-purple-300">
            Decentralized Transparency
          </span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white mt-1.5 tracking-tight">
          Global On-Chain Funding Ledger
        </h1>
        <p className="text-sm text-[#9b98ad] mt-1 max-w-xl">
          Real-time transparent audit stream of all supporter pledges and founder milestone proofs recorded on Solana Devnet.
        </p>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl glass-panel border border-white/10 bg-[#0d0a1b] flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-purple-500/20 flex items-center justify-center text-purple-300 shrink-0">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <span className="text-xs text-[#9b98ad] block">Total Platform Raise</span>
            {isLoading ? (
              <div className="h-7 w-28 bg-white/10 rounded-lg mt-1 animate-pulse" />
            ) : isError ? (
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xl sm:text-2xl font-bold font-mono text-white/50">— ◎</span>
                <button
                  type="button"
                  onClick={() => refetch()}
                  title="Retry"
                  className="p-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-xs cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <span className="text-xl sm:text-2xl font-bold font-mono text-white mt-0.5 block truncate">
                {totalRaised.toFixed(1)} <span className="text-purple-400">◎ SOL</span>
              </span>
            )}
          </div>
        </div>

        <div className="p-5 rounded-2xl glass-panel border border-white/10 bg-[#0d0a1b] flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 flex items-center justify-center text-emerald-300 shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <span className="text-xs text-[#9b98ad] block">Community Supporters</span>
            {isLoading ? (
              <div className="h-7 w-24 bg-white/10 rounded-lg mt-1 animate-pulse" />
            ) : isError ? (
              <span className="text-xl sm:text-2xl font-bold font-mono text-white/50 mt-0.5 block">—</span>
            ) : (
              <span className="text-xl sm:text-2xl font-bold font-mono text-white mt-0.5 block truncate">
                {totalBackers.toLocaleString()} Backers
              </span>
            )}
          </div>
        </div>

        <div className="p-5 rounded-2xl glass-panel border border-white/10 bg-[#0d0a1b] flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-500/20 flex items-center justify-center text-blue-300">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-[#9b98ad] block">Live Campaigns</span>
            <span className="text-xl sm:text-2xl font-bold font-mono text-white mt-0.5 block">
              {projects.length} Projects
            </span>
          </div>
        </div>
      </div>

      {/* Global Ledger Component */}
      <LedgerTable
        globalProjects={projects}
        isGlobal={true}
      />
    </div>
  );
};
