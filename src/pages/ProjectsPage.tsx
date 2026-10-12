import React, { useState, useMemo } from 'react';
import { Project, ProjectStatus, ProjectType } from '../types';
import { ProjectCard } from '../components/ProjectCard';
import { Search, Filter, Sparkles } from 'lucide-react';

interface ProjectsPageProps {
  projects: Project[];
}

export const ProjectsPage: React.FC<ProjectsPageProps> = ({ projects }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');

  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      const matchesSearch =
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.tagline.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.category.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus =
        selectedStatus === 'all' || p.status === selectedStatus;

      const matchesType =
        selectedType === 'all' || p.type === selectedType;

      return matchesSearch && matchesStatus && matchesType;
    });
  }, [projects, searchTerm, selectedStatus, selectedType]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-purple-400" />
          <span className="text-xs font-mono font-semibold uppercase tracking-wider text-purple-300">
            Discovery Hub
          </span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white mt-1.5 tracking-tight">
          Explore Solana Devnet Projects
        </h1>
        <p className="text-sm text-[#9b98ad] mt-1 max-w-xl">
          Back visionary teams building the decentralized future. Every pledge is confirmed on Solana Devnet.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl glass-panel border border-white/10 bg-[#0d0b1a] flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-white/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name, tag, or category…"
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-white/5 border border-white/10 focus:border-purple-400 focus:outline-none text-white text-xs placeholder:text-white/30"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-start md:justify-end">
          {/* Status filter */}
          <div className="flex items-center bg-white/5 p-1 rounded-xl border border-white/10 text-xs">
            {['all', 'live', 'funded', 'upcoming'].map((st) => (
              <button
                key={st}
                onClick={() => setSelectedStatus(st)}
                className={`px-3 py-1 rounded-lg capitalize transition-colors cursor-pointer ${
                  selectedStatus === st
                    ? 'bg-purple-600 text-white font-medium shadow-sm'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          {/* Type filter */}
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-[#141029] border border-white/10 text-xs text-white/80 focus:outline-none focus:border-purple-400 cursor-pointer"
          >
            <option value="all">All Types</option>
            <option value="IDO">IDO</option>
            <option value="Crowdfund">Crowdfund</option>
            <option value="Grant">Grant</option>
            <option value="Incubation">Incubation</option>
          </select>
        </div>
      </div>

      {/* Projects Grid */}
      {projects.length === 0 ? (
        <div className="py-20 text-center glass-panel rounded-3xl border border-white/10 p-8 max-w-lg mx-auto space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-purple-500/20 text-purple-400 flex items-center justify-center mx-auto">
            <Sparkles className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-white">No Campaigns Listed</h3>
          <p className="text-sm text-[#9b98ad] leading-relaxed">
            There are currently no listed campaigns on BACKR. Be the first visionary team to launch on Solana Devnet.
          </p>
          <div className="pt-2">
            <a
              href="/create"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full text-xs font-semibold text-white bg-purple-600 hover:bg-purple-500 transition-colors shadow-lg shadow-purple-600/30 cursor-pointer"
            >
              Start a Campaign
            </a>
          </div>
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="py-20 text-center glass-panel rounded-3xl border border-white/10 p-8">
          <p className="text-base text-white/60">No projects found matching your criteria</p>
          <button
            onClick={() => {
              setSearchTerm('');
              setSelectedStatus('all');
              setSelectedType('all');
            }}
            className="mt-4 px-4 py-2 rounded-xl text-xs text-purple-300 hover:text-white bg-white/5 border border-white/10 cursor-pointer"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              isCenter={false}
              showProgress={true}
            />
          ))}
        </div>
      )}
    </div>
  );
};
