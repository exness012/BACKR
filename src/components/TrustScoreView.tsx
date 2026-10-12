import React from 'react';
import { Project } from '../types';
import { calculateTrustScore } from '../lib/trust';
import { ShieldCheck, Award, CheckCircle2, TrendingUp, Users, Cpu } from 'lucide-react';

interface TrustScoreViewProps {
  project: Project;
}

export const TrustScoreView: React.FC<TrustScoreViewProps> = ({ project }) => {
  const trust = calculateTrustScore(project);
  const completedMilestones = project.milestones.filter(m => m.status === 'completed');
  const onChainVerified = completedMilestones.filter(m => Boolean(m.txSignature)).length;

  return (
    <div className="space-y-6">
      {/* Top Banner Score */}
      <div className="p-6 rounded-3xl glass-panel border border-white/10 bg-[#0e0c1e] flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          {/* Radial score badge */}
          <div className="relative w-24 h-24 rounded-full bg-gradient-to-tr from-purple-600 via-indigo-600 to-emerald-400 p-1 flex items-center justify-center shadow-lg shadow-purple-600/20">
            <div className="w-full h-full bg-[#0e0c1e] rounded-full flex flex-col items-center justify-center">
              <span className="text-3xl font-extrabold text-white font-mono tracking-tight">
                {trust.overallScore}
              </span>
              <span className="text-[10px] text-white/50 font-mono">/ 100</span>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-bold text-white">Founder Trust Score</h3>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                {trust.ratingLabel}
              </span>
            </div>
            <p className="text-xs text-[#9b98ad] mt-1 max-w-md leading-relaxed">
              Algorithmic reputation computed directly from verified Solana on-chain memos, milestone execution velocity, and treasury transparency.
            </p>
          </div>
        </div>

        <div className="flex sm:flex-col items-center sm:items-end gap-2 text-right">
          <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold">
            <ShieldCheck className="w-4 h-4" />
            <span>On-Chain Audited</span>
          </div>
          <span className="text-xs text-white/60">
            {onChainVerified} of {project.milestones.length} milestones verified on Devnet
          </span>
        </div>
      </div>

      {/* Breakdown Bars */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Metric 1 */}
        <div className="p-4 rounded-2xl glass-panel border border-white/10 bg-[#0c0a1a] space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-white/80 font-medium flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-purple-400" />
              Roadmap Delivery & Milestones
            </span>
            <span className="font-mono text-purple-300 font-semibold">{trust.roadmapDeliveryScore} / 35</span>
          </div>
          <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full"
              style={{ width: `${(trust.roadmapDeliveryScore / 35) * 100}%` }}
            />
          </div>
          <p className="text-[11px] text-[#9b98ad]">
            Points earned for each completed milestone with an immutable Solana memo transaction.
          </p>
        </div>

        {/* Metric 2 */}
        <div className="p-4 rounded-2xl glass-panel border border-white/10 bg-[#0c0a1a] space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-white/80 font-medium flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-emerald-400" />
              Treasury Transparency
            </span>
            <span className="font-mono text-emerald-300 font-semibold">{trust.treasuryTransparencyScore} / 25</span>
          </div>
          <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full"
              style={{ width: `${(trust.treasuryTransparencyScore / 25) * 100}%` }}
            />
          </div>
          <p className="text-[11px] text-[#9b98ad]">
            Direct correlation between funds unlocked and verifiable milestones delivered.
          </p>
        </div>

        {/* Metric 3 */}
        <div className="p-4 rounded-2xl glass-panel border border-white/10 bg-[#0c0a1a] space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-white/80 font-medium flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-blue-400" />
              Backer Community Traction
            </span>
            <span className="font-mono text-blue-300 font-semibold">{trust.backerCommunityScore} / 20</span>
          </div>
          <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full"
              style={{ width: `${(trust.backerCommunityScore / 20) * 100}%` }}
            />
          </div>
          <p className="text-[11px] text-[#9b98ad]">
            Derived from community pledge volume, backer count, and wallet distribution.
          </p>
        </div>

        {/* Metric 4 */}
        <div className="p-4 rounded-2xl glass-panel border border-white/10 bg-[#0c0a1a] space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-white/80 font-medium flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
              On-Chain Activity & Integrity
            </span>
            <span className="font-mono text-amber-300 font-semibold">{trust.activityScore} / 20</span>
          </div>
          <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-500 to-orange-400 rounded-full"
              style={{ width: `${(trust.activityScore / 20) * 100}%` }}
            />
          </div>
          <p className="text-[11px] text-[#9b98ad]">
            Founder responsiveness, verified social accounts, and frequency of updates.
          </p>
        </div>
      </div>
    </div>
  );
};
