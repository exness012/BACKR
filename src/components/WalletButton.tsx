import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useLocation } from 'react-router-dom';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { useWalletModal } from '../context/WalletModalContext';
import { shortenAddress, explorerAddressUrl, lamportsToSol } from '../lib/solana';
import { 
  ExternalLink, 
  Copy, 
  LogOut, 
  ChevronDown, 
  Check, 
  Loader2
} from 'lucide-react';

export const WalletButton: React.FC = () => {
  const { publicKey, connected, connecting, disconnect, wallet } = useWallet();
  const { connection } = useConnection();
  const { openWalletModal } = useWalletModal();
  const location = useLocation();
  
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [balance, setBalance] = useState<number | null>(null);
  const [coords, setCoords] = useState<{ top: number; right: number } | null>(null);
  
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Fetch balance
  const updateBalance = useCallback(async () => {
    if (connected && publicKey) {
      try {
        const bal = await connection.getBalance(publicKey);
        setBalance(lamportsToSol(bal));
      } catch (e) {
        console.warn('Failed to load balance', e);
      }
    } else {
      setBalance(null);
    }
  }, [connected, publicKey, connection]);

  // Balance on connect, interval, and on open
  useEffect(() => {
    updateBalance();
    const interval = setInterval(updateBalance, 30000);
    return () => clearInterval(interval);
  }, [updateBalance]);

  // Refresh balance when dropdown opens
  useEffect(() => {
    if (dropdownOpen) {
      updateBalance();
    }
  }, [dropdownOpen, updateBalance]);

  // Close when route changes
  useEffect(() => {
    setDropdownOpen(false);
  }, [location.pathname]);

  // Compute position relative to button
  const computePosition = useCallback(() => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const right = Math.max(16, window.innerWidth - rect.right);
    setCoords({
      top: rect.bottom + 8,
      right,
    });
  }, []);

  // Update position or close on scroll/resize
  useEffect(() => {
    if (!dropdownOpen) return;

    computePosition();

    const handleResize = () => {
      computePosition();
    };

    const handleScroll = () => {
      // Close dropdown on scroll to guarantee zero overlap or detached floating
      setDropdownOpen(false);
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [dropdownOpen, computePosition]);

  // Click outside and Escape key handling
  useEffect(() => {
    if (!dropdownOpen) return;

    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node;
      if (
        menuRef.current && !menuRef.current.contains(target) &&
        buttonRef.current && !buttonRef.current.contains(target)
      ) {
        setDropdownOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [dropdownOpen]);

  const handleCopy = () => {
    if (publicKey) {
      navigator.clipboard.writeText(publicKey.toBase58());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!connected) {
    return (
      <button
        onClick={openWalletModal}
        disabled={connecting}
        className="px-5 py-2 rounded-full border border-white/20 hover:border-white/50 text-sm font-medium text-white transition-all duration-200 hover:bg-white/5 flex items-center gap-2 cursor-pointer focus:outline-none focus:ring-1 focus:ring-purple-500/50"
      >
        {connecting ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
            <span>Connecting…</span>
          </>
        ) : (
          <span>Connect wallet</span>
        )}
      </button>
    );
  }

  const base58 = publicKey?.toBase58() || '';
  const walletName = wallet?.adapter.name || 'Phantom';

  return (
    <>
      <button
        ref={buttonRef}
        onClick={() => {
          computePosition();
          setDropdownOpen((prev) => !prev);
        }}
        aria-haspopup="menu"
        aria-expanded={dropdownOpen}
        className="px-3.5 py-1.5 rounded-full border border-purple-500/40 bg-purple-950/20 hover:bg-purple-900/30 text-xs font-mono text-purple-200 flex items-center gap-2 transition-all cursor-pointer shadow-sm hover:border-purple-400 focus:outline-none focus:ring-1 focus:ring-purple-500/50"
      >
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
        <span className="font-semibold">{shortenAddress(base58, 4)}</span>
        {balance !== null && (
          <span className="text-white/60 font-sans border-l border-white/10 pl-2">
            {balance.toFixed(2)} ◎
          </span>
        )}
        <ChevronDown className={`w-3.5 h-3.5 text-white/50 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} />
      </button>

      {dropdownOpen && coords && typeof document !== 'undefined' && createPortal(
        <div
          ref={menuRef}
          style={{
            position: 'fixed',
            top: `${coords.top}px`,
            right: `${coords.right}px`,
            zIndex: 9998,
            backgroundColor: '#0f0e17',
          }}
          className="w-[280px] max-w-[calc(100vw-32px)] rounded-2xl border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.9),0_0_25px_rgba(168,85,247,0.18)] p-2 animate-in fade-in zoom-in-95 duration-150 select-none"
          role="menu"
          aria-label="Connected wallet menu"
        >
          {/* Header Row: Network, Wallet Badge, Address with Copy */}
          <div className="p-2.5 border-b border-white/10">
            <div className="flex items-center justify-between text-xs text-white/60 mb-2">
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="font-medium text-white/70">Connected to Devnet</span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300 font-medium border border-purple-500/30 font-mono">
                {walletName}
              </span>
            </div>

            <button
              type="button"
              onClick={handleCopy}
              className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/5 transition-colors group focus:outline-none focus:ring-1 focus:ring-purple-500/50 cursor-pointer"
              title="Click to copy address"
            >
              <span className="font-mono text-xs text-white/90 truncate tracking-wide max-w-[170px]" title={base58}>
                {shortenAddress(base58, 6)}
              </span>
              <div className="flex items-center gap-1.5 text-xs text-white/50 group-hover:text-purple-300 transition-colors ml-2 shrink-0">
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-[11px] text-emerald-400 font-sans font-medium">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span className="text-[11px] font-sans">Copy</span>
                  </>
                )}
              </div>
            </button>
          </div>

          {/* Devnet Balance Row */}
          <div className="px-2.5 py-2.5 border-b border-white/10 flex items-center justify-between">
            <span className="text-xs text-white/60 font-medium">Devnet Balance</span>
            <span className="text-sm font-semibold text-emerald-400 font-mono">
              {balance !== null ? `${balance.toFixed(4)} SOL` : 'Loading…'}
            </span>
          </div>

          {/* Action rows: Explorer and Disconnect */}
          <div className="pt-1 space-y-1">
            <a
              href={explorerAddressUrl(base58)}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setDropdownOpen(false)}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-white/80 hover:text-white hover:bg-white/5 transition-colors focus:outline-none focus:ring-1 focus:ring-purple-500/50 cursor-pointer"
            >
              <ExternalLink className="w-4 h-4 text-purple-400/80 shrink-0" />
              <span className="truncate">View on Solana Explorer</span>
            </a>

            <button
              type="button"
              onClick={() => {
                disconnect();
                setDropdownOpen(false);
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors focus:outline-none focus:ring-1 focus:ring-red-500/50 cursor-pointer"
            >
              <LogOut className="w-4 h-4 text-red-400 shrink-0" />
              <span>Disconnect</span>
            </button>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};

