import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Project } from '../types';
import { ProjectCard } from './ProjectCard';
import { ChevronLeft, ChevronRight, PlusCircle, ArrowRight } from 'lucide-react';

interface CarouselProps {
  projects: Project[];
}

export const Carousel: React.FC<CarouselProps> = ({ projects }) => {
  const [activeIndex, setActiveIndex] = useState(0);

  if (!projects.length) {
    return (
      <div className="relative w-full max-w-md mx-auto px-4 py-8">
        <div className="p-8 rounded-3xl glass-panel border border-white/10 bg-[#0d0b1a]/70 text-center space-y-4 shadow-xl">
          <div className="w-12 h-12 rounded-2xl bg-purple-500/20 text-purple-400 flex items-center justify-center mx-auto">
            <PlusCircle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">No Campaigns Listed</h3>
            <p className="text-xs text-[#9b98ad] mt-1.5 leading-relaxed">
              All previous campaigns have been removed. Ready to raise milestone-backed capital on Solana Devnet?
            </p>
          </div>
          <div>
            <Link
              to="/create"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-semibold text-white bg-purple-600 hover:bg-purple-500 transition-colors shadow-lg shadow-purple-600/30 cursor-pointer"
            >
              <span>Start the First Campaign</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Single project display
  if (projects.length === 1) {
    return (
      <div className="relative w-full max-w-sm mx-auto px-4 py-6">
        <ProjectCard project={projects[0]} isCenter={true} showProgress={true} />
      </div>
    );
  }

  // 2 projects display
  if (projects.length === 2) {
    return (
      <div className="relative w-full max-w-3xl mx-auto px-4 py-6 flex flex-col sm:flex-row items-center justify-center gap-6">
        <div className="w-full max-w-[340px]">
          <ProjectCard project={projects[0]} isCenter={true} showProgress={true} />
        </div>
        <div className="w-full max-w-[340px]">
          <ProjectCard project={projects[1]} isCenter={true} showProgress={true} />
        </div>
      </div>
    );
  }

  const total = projects.length;
  const safeIndex = activeIndex % total;

  const handlePrev = () => {
    setActiveIndex((prev) => (prev - 1 + total) % total);
  };

  const handleNext = () => {
    setActiveIndex((prev) => (prev + 1) % total);
  };

  // Get current 3 cards: left, center, right
  const prevIndex = (safeIndex - 1 + total) % total;
  const nextIndex = (safeIndex + 1) % total;

  return (
    <div className="relative w-full max-w-6xl mx-auto px-2 sm:px-6">
      {/* Cards container with overflow visibility to give the edge peek effect */}
      <div className="relative flex items-center justify-center gap-4 sm:gap-6 py-8 sm:py-10 overflow-hidden sm:overflow-visible">
        {/* Left card */}
        <div
          onClick={() => setActiveIndex(prevIndex)}
          className="hidden md:block w-72 lg:w-80 flex-shrink-0 opacity-60 hover:opacity-85 transition-all duration-300 transform -translate-x-4 cursor-pointer select-none"
        >
          <ProjectCard project={projects[prevIndex]} isCenter={false} showProgress={true} />
        </div>

        {/* Center elevated card */}
        <div className="w-full max-w-[340px] sm:max-w-[380px] md:max-w-[400px] flex-shrink-0 z-20 transform transition-all duration-300">
          <ProjectCard project={projects[safeIndex]} isCenter={true} showProgress={true} />
        </div>

        {/* Right card */}
        <div
          onClick={() => setActiveIndex(nextIndex)}
          className="hidden md:block w-72 lg:w-80 flex-shrink-0 opacity-60 hover:opacity-85 transition-all duration-300 transform translate-x-4 cursor-pointer select-none"
        >
          <ProjectCard project={projects[nextIndex]} isCenter={false} showProgress={true} />
        </div>
      </div>

      {/* Navigation Controls: arrows + indicators */}
      <div className="flex items-center justify-center gap-4 mt-4 sm:mt-6">
        <button
          onClick={handlePrev}
          aria-label="Previous project"
          className="w-9 h-9 rounded-full glass-panel border border-white/10 hover:border-purple-400 text-white/70 hover:text-white flex items-center justify-center transition-all cursor-pointer hover:bg-white/10"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        {/* Indicators */}
        <div className="flex items-center gap-1.5">
          {projects.map((_, i) => (
            <button
              key={i}
              onClick={() => setActiveIndex(i)}
              aria-label={`Go to slide ${i + 1}`}
              className={`h-1.5 rounded-full transition-all cursor-pointer ${
                i === safeIndex
                  ? 'w-6 bg-gradient-to-r from-purple-400 to-indigo-400'
                  : 'w-1.5 bg-white/20 hover:bg-white/40'
              }`}
            />
          ))}
        </div>

        <button
          onClick={handleNext}
          aria-label="Next project"
          className="w-9 h-9 rounded-full glass-panel border border-white/10 hover:border-purple-400 text-white/70 hover:text-white flex items-center justify-center transition-all cursor-pointer hover:bg-white/10"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
