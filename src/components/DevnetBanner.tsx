import React, { useState } from 'react';
import { Info, X, ExternalLink } from 'lucide-react';

export const DevnetBanner: React.FC = () => {
  const [dismissed, setDismissed] = useState(() => {
    return localStorage.getItem('launchpad_banner_dismissed') === 'true';
  });

  if (dismissed) return null;

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem('launchpad_banner_dismissed', 'true');
  };

  return (
    <div className="relative z-30 bg-gradient-to-r from-purple-900/60 via-indigo-900/50 to-purple-950/60 border-b border-purple-500/20 px-4 py-2.5 text-xs text-purple-200 backdrop-blur-md">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 text-purple-400 flex-shrink-0" />
          <span>
            This is a demo running on Solana Devnet. Install Phantom or Solflare and switch to Devnet to try it.
          </span>
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
          <a
            href="https://faucet.solana.com"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:inline-flex items-center gap-1 text-[11px] font-mono text-purple-300 hover:text-white underline"
          >
            <span>Solana Faucet</span>
            <ExternalLink className="w-3 h-3" />
          </a>
          <button
            onClick={handleDismiss}
            className="p-1 hover:text-white rounded text-purple-300/70 hover:bg-white/5 cursor-pointer"
            aria-label="Dismiss banner"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
