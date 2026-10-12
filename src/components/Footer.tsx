import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Layers, Sparkles } from 'lucide-react';
import { Logo } from './Logo';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full border-t border-white/10 mt-20 pt-12 pb-14 px-4 bg-[#05040a]/90 relative z-20">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
        {/* Brand */}
        <div>
          <Link to="/" className="flex items-center group py-1" aria-label="BACKR Home">
            <Logo size="md" />
          </Link>
          <p className="text-xs text-[#9b98ad] mt-2 max-w-sm leading-relaxed">
            Transparent crypto crowdfunding platform on Solana Devnet. Every backer contribution and project milestone is recorded immutably on-chain.
          </p>
        </div>

        {/* Quick Links */}
        <div className="flex flex-wrap items-center gap-6 text-xs text-[#9b98ad]">
          <Link to="/projects" className="hover:text-white transition-colors">
            Projects
          </Link>
          <Link to="/ledger" className="hover:text-white transition-colors">
            Transparent Ledger
          </Link>
          <Link to="/create" className="hover:text-white transition-colors">
            Start a Campaign
          </Link>
          <Link to="/about" className="hover:text-white transition-colors">
            About
          </Link>
          <Link to="/docs" className="hover:text-white transition-colors">
            Docs
          </Link>
        </div>

        {/* Devnet Status badge */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full glass-panel border border-white/10 text-xs text-white/70">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Solana Devnet Cluster</span>
        </div>
      </div>

      {/* Mandatory Regulatory & Informational Notice */}
      <div className="max-w-6xl mx-auto mt-8 pt-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-white/50">
        <p className="flex items-center gap-1.5 text-center sm:text-left">
          <ShieldCheck className="w-4 h-4 text-purple-400 flex-shrink-0" />
          <span>This is a demonstration on Solana Devnet. No real funds are involved.</span>
        </p>
        <p className="font-semibold text-purple-300/90 text-center sm:text-right">
          For informational tracking only. Not financial advice.
        </p>
      </div>
    </footer>
  );
};
