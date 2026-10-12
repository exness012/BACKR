import React from 'react';
import { Link } from 'react-router-dom';
import { Project } from '../types';
import { useProjectStats } from '../lib/ledger';
import { ProgressBar } from './ProgressBar';
import { FounderAvatar } from './FounderAvatar';
import { Link2, MessageSquare } from 'lucide-react';

interface ProjectCardProps {
  project: Project;
  isCenter?: boolean;
  showProgress?: boolean;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({
  project,
  isCenter = false,
  showProgress = true,
}) => {
  const { percentFunded } = useProjectStats(project.id, project.goalSol);

  return (
    <div
      className={`relative flex flex-col justify-between rounded-3xl p-3.5 transition-all duration-300 ${
        isCenter
          ? 'border border-purple-500/40 bg-[#16151f] shadow-2xl z-20'
          : 'border border-[#24222f] bg-[#100f17] hover:border-white/20 z-10'
      }`}
    >
      {/* Top Banner (clipped with its own wrapper, z-0) */}
      <div className="relative z-0 w-full h-32 rounded-2xl overflow-hidden bg-[#16151f] flex items-center justify-center">
        {project.bannerUrl ? (
          <img
            src={project.bannerUrl}
            alt={project.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-tr from-[#160c33] via-[#291357] to-[#4c1d95] flex items-center justify-center relative overflow-hidden">
            {/* Subtle radial glow and grid */}
            <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.7),transparent)]" />
            <div className="absolute inset-0 bg-black/20" />
            
            {/* Graphic text watermark */}
            <span className="font-extrabold text-3xl tracking-tighter text-white/20 select-none uppercase transform -rotate-3 scale-110">
              {project.name}
            </span>
          </div>
        )}
      </div>

      {/* Avatar & Social Row: SIBLING after banner, z-10, no negative margin on row */}
      <div className="relative z-10 flex items-start justify-between px-2 mb-2">
        {/* Overlapping Avatar: only element pulled up with -mt-7 */}
        <div className="-mt-7 relative w-14 h-14 rounded-2xl shadow-xl shadow-black/50 border-[3.5px] border-[#100f17] bg-[#100f17] overflow-hidden shrink-0">
          {project.logoUrl ? (
            <img
              src={project.logoUrl}
              alt={project.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-[#a78bfa] to-[#6d28d9] flex items-center justify-center text-white font-bold text-xl shadow-inner">
              {project.name[0]?.toUpperCase() || 'P'}
            </div>
          )}
        </div>

        {/* Founders and Social Icons */}
        <div className="flex items-center gap-1.5 pt-1.5">
          {/* Stacked founder avatars (up to 3, 24px, overlapping by 8px) */}
          {project.founders && project.founders.length > 0 && (
            <div
              className="flex items-center -space-x-2 mr-1"
              title={`${project.founders.length} Founder${project.founders.length > 1 ? 's' : ''}`}
            >
              {project.founders.slice(0, 3).map((f) => (
                <FounderAvatar
                  key={f.id || f.name}
                  founder={f}
                  size={24}
                  borderWidth={2}
                  borderColor="#100f17"
                  className="shadow-sm"
                />
              ))}
              {project.founders.length > 3 && (
                <div className="w-6 h-6 rounded-full bg-[#16151f] border-2 border-[#100f17] flex items-center justify-center text-[9px] font-bold text-[#f4f3f8] shrink-0">
                  +{project.founders.length - 3}
                </div>
              )}
            </div>
          )}

          {project.websiteUrl && (
            <a
              href={project.websiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Website"
              className="w-7 h-7 rounded-lg flex items-center justify-center text-[#f4f3f8]/60 hover:text-white hover:bg-white/10 transition-colors"
            >
              <Link2 className="w-3.5 h-3.5" />
            </a>
          )}
          {project.twitterUrl && (
            <a
              href={project.twitterUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="X (Twitter)"
              className="w-7 h-7 rounded-lg flex items-center justify-center text-[#f4f3f8]/60 hover:text-white hover:bg-white/10 transition-colors"
            >
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </a>
          )}
          {project.discordUrl && (
            <a
              href={project.discordUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Discord"
              className="w-7 h-7 rounded-lg flex items-center justify-center text-[#f4f3f8]/60 hover:text-white hover:bg-white/10 transition-colors"
            >
              <MessageSquare className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
      </div>

      {/* Project Title & Network Row: sits cleanly below banner with proper line height */}
      <div className="px-2 mb-3">
        <h3 className="font-bold text-lg text-[#f4f3f8] tracking-tight leading-[1.25] flex items-center justify-between gap-2">
          <span className="truncate">{project.name}</span>
          {showProgress && (
            <span
              className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full shrink-0 ${
                project.status === 'funded'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : project.status === 'upcoming'
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  : 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
              }`}
            >
              {project.status === 'live' ? 'LIVE' : project.status}
            </span>
          )}
        </h3>

        <div className="flex items-center justify-between text-xs mt-1">
          <div className="flex items-center gap-1.5 text-white/80">
            {/* Solana devnet icon */}
            <span className="w-2 h-2 rounded-full bg-gradient-to-r from-[#9945FF] to-[#14F195]" />
            <span className="text-[11px] font-medium text-white/70">Solana Devnet</span>
          </div>
          <span className="text-[11px] text-[#9b98ad]">Launch {project.launchDate}</span>
        </div>
      </div>

      {/* Progress Bar (always displayed on card) */}
      {showProgress && (
        <div className="px-2 mb-3">
          <div className="flex justify-between items-center text-[11px] mb-1.5 font-mono">
            <span className="text-white/60">Progress</span>
            <span className={percentFunded >= 100 ? "text-[#fde68a] font-semibold" : "text-purple-300 font-semibold"}>
              {percentFunded >= 100 ? `${percentFunded}% funded · Goal reached` : `${percentFunded}% funded`}
            </span>
          </div>
          <ProgressBar value={percentFunded} size="sm" />
        </div>
      )}

      {/* Divider */}
      <div className="border-t border-white/10 my-2 mx-1" />

      {/* 3-Column Stats Row */}
      <div className="grid grid-cols-3 gap-2 px-2 py-2 text-left">
        <div>
          <span className="block text-[11px] text-[#9b98ad]">Total raise</span>
          <span className="text-xs sm:text-sm font-semibold text-white flex items-center gap-1 mt-0.5">
            {project.goalSol.toLocaleString()} <span className="text-purple-400 font-mono">◎</span>
          </span>
        </div>
        <div>
          <span className="block text-[11px] text-[#9b98ad]">Type</span>
          <span className="text-xs sm:text-sm font-semibold text-white mt-0.5 block truncate">
            {project.type}
          </span>
        </div>
        <div>
          <span className="block text-[11px] text-[#9b98ad]">Allocation</span>
          <span className="text-xs sm:text-sm font-semibold text-white mt-0.5 block truncate">
            {project.allocation}
          </span>
        </div>
      </div>

      {/* Action Button: "See project" */}
      <div className="mt-3 px-1">
        <Link
          to={`/project/${project.id}`}
          className={`w-full py-2.5 rounded-xl text-xs sm:text-sm font-medium flex items-center justify-center transition-all ${
            isCenter
              ? 'bg-white/10 hover:bg-white/20 text-white border border-white/15'
              : 'bg-white/5 hover:bg-white/10 text-white/90 border border-white/10'
          }`}
        >
          See project
        </Link>
      </div>
    </div>
  );
};
