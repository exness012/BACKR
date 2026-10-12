import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { WalletButton } from './WalletButton';
import { Logo } from './Logo';
import { Search, PlusCircle, Layers, BookOpen, Menu, X } from 'lucide-react';

interface NavbarProps {
  onSearchClick?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onSearchClick }) => {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="relative z-40 w-full pt-4 md:pt-6 px-4">
      <div className="max-w-6xl mx-auto flex items-center justify-between px-4 py-3 rounded-2xl glass-panel border border-white/10 bg-[#07060d]/80 backdrop-blur-md">
        {/* Left: Brand Logo */}
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center group py-1" aria-label="BACKR Home">
            {/* On screens under 640px, use the mark variant */}
            <Logo size="md" variant="mark" className="sm:hidden" />
            {/* On 640px and wider, use the full wordmark variant */}
            <Logo size="md" variant="full" className="hidden sm:inline-block" />
          </Link>

          {/* Devnet network badge */}
          <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-purple-500/10 text-purple-300 border border-purple-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse"></span>
            Solana Devnet
          </span>
        </div>

        {/* Center: Navigation Links */}
        <nav className="hidden md:flex items-center gap-7">
          <Link
            to="/projects"
            className={`text-sm font-medium transition-colors ${
              isActive('/projects') ? 'text-white font-semibold' : 'text-[#9b98ad] hover:text-white'
            }`}
          >
            Projects
          </Link>
          <Link
            to="/ledger"
            className={`text-sm font-medium transition-colors flex items-center gap-1.5 ${
              isActive('/ledger') ? 'text-white font-semibold' : 'text-[#9b98ad] hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-purple-400" />
            <span>Ledger</span>
          </Link>
          <Link
            to="/about"
            className={`text-sm font-medium transition-colors ${
              isActive('/about') ? 'text-white font-semibold' : 'text-[#9b98ad] hover:text-white'
            }`}
          >
            About
          </Link>
          <Link
            to="/docs"
            className={`text-sm font-medium transition-colors flex items-center gap-1.5 ${
              location.pathname.startsWith('/docs') ? 'text-white font-semibold' : 'text-[#9b98ad] hover:text-white'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5 text-purple-400" />
            <span>Docs</span>
          </Link>
        </nav>

        {/* Right: Actions */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          <Link
            to="/create"
            className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-purple-300 bg-purple-950/30 border border-purple-500/30 hover:border-purple-400 hover:text-white transition-colors"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Create</span>
          </Link>

          {onSearchClick && (
            <button
              onClick={onSearchClick}
              className="p-2 rounded-full text-[#9b98ad] hover:text-white hover:bg-white/5 border border-transparent hover:border-white/10 transition-colors cursor-pointer"
              aria-label="Search projects"
            >
              <Search className="w-4 h-4" />
            </button>
          )}

          <WalletButton />

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 md:hidden text-white/70 hover:text-white rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
            aria-label="Open menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden mt-2 p-4 rounded-2xl glass-panel bg-[#0d0b1a] border border-white/10 space-y-3">
          <Link
            to="/projects"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-sm text-[#9b98ad] hover:text-white hover:bg-white/5"
          >
            Projects
          </Link>
          <Link
            to="/ledger"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-sm text-[#9b98ad] hover:text-white hover:bg-white/5"
          >
            Global On-Chain Ledger
          </Link>
          <Link
            to="/create"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-sm text-purple-300 hover:text-white hover:bg-purple-900/20"
          >
            + Create New Project
          </Link>
          <Link
            to="/about"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-sm text-[#9b98ad] hover:text-white hover:bg-white/5"
          >
            About
          </Link>
          <Link
            to="/docs"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-sm text-[#9b98ad] hover:text-white hover:bg-white/5"
          >
            Docs
          </Link>
          <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs text-purple-300 px-3">
            <span>Network</span>
            <span className="font-mono">Solana Devnet</span>
          </div>
        </div>
      )}
    </header>
  );
};
