import React from 'react';
import { Project } from '../types';
import { Carousel } from './Carousel';

interface HeroProps {
  projects: Project[];
  onGetStartedClick: () => void;
}

export const Hero: React.FC<HeroProps> = ({ projects, onGetStartedClick }) => {
  return (
    <div className="relative w-full max-w-6xl xl:max-w-7xl mx-auto mt-4 sm:mt-6 px-3 sm:px-4">
      {/* Outer rounded container with 1px translucent border & inner purple glow */}
      <div className="relative rounded-[32px] md:rounded-[40px] border border-white/10 bg-transparent overflow-hidden py-16 sm:py-20 lg:py-24 min-h-[580px] sm:min-h-[660px] flex flex-col justify-center">
        {/* Soft violet/purple radial glow rising from bottom */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full max-w-5xl h-[560px] bg-[radial-gradient(ellipse_at_bottom,rgba(168,85,247,0.22),transparent_70%)] pointer-events-none" />

        {/* Hero Content */}
        <div className="relative z-10 flex flex-col items-center text-center px-4">
          {/* Main 2-line headline */}
          <h1 className="text-4xl sm:text-5xl md:text-[68px] lg:text-[74px] font-bold tracking-tight text-white leading-[1.08] max-w-4xl">
            Crypto Crowdfunding<br />
            For The Next Big Project
          </h1>

          {/* Subtitle */}
          <p className="mt-5 text-sm sm:text-base text-[#9b98ad] max-w-xl leading-relaxed">
            We empower visionary founders as the AI catalyst propels impactful projects to success
          </p>

          {/* Get started button */}
          <div className="mt-8 mb-8 relative">
            <button
              onClick={onGetStartedClick}
              className="relative px-7 py-3 rounded-full text-sm font-semibold text-white bg-gradient-to-r from-[#a78bfa] to-[#8b5cf6] hover:from-[#bca5fd] hover:to-[#9a6eff] transition-all duration-300 shadow-[0_0_25px_rgba(168,85,247,0.45)] hover:shadow-[0_0_35px_rgba(168,85,247,0.65)] transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
            >
              Get started
            </button>
          </div>

          {/* Carousel */}
          <div className="w-full mt-6 sm:mt-10">
            <Carousel projects={projects} />
          </div>
        </div>
      </div>
    </div>
  );
};
