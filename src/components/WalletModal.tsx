import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '../context/WalletModalContext';
import { WalletReadyState, WalletName } from '@solana/wallet-adapter-base';
import { Logo } from './Logo';
import { 
  X, 
  Loader2, 
  AlertCircle, 
  ExternalLink, 
  CheckCircle2, 
  Sparkles,
  ShieldCheck 
} from 'lucide-react';

const WALLET_DOWNLOAD_LINKS: Record<string, string> = {
  Phantom: 'https://phantom.app/download',
  Solflare: 'https://solflare.com/download',
};

export const WalletModal: React.FC = () => {
  const { isModalOpen, closeWalletModal, toastMessage, showToast } = useWalletModal();
  const { wallets, select, connect, connected, connecting, wallet } = useWallet();

  const [connectingWallet, setConnectingWallet] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Lock body scroll while modal is open
  useEffect(() => {
    if (isModalOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isModalOpen]);

  // Close on Escape key
  useEffect(() => {
    if (!isModalOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeWalletModal();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isModalOpen, closeWalletModal]);

  // When connection succeeds, close modal and show toast
  useEffect(() => {
    if (connected && isModalOpen) {
      setConnectingWallet(null);
      setErrorMessage(null);
      closeWalletModal();
      showToast('Wallet connected successfully!');
    }
  }, [connected, isModalOpen, closeWalletModal, showToast]);

  const handleSelectWallet = async (walletName: WalletName, isInstalled: boolean) => {
    setErrorMessage(null);

    if (!isInstalled) {
      const downloadUrl = WALLET_DOWNLOAD_LINKS[walletName as string] || 'https://solana.com/ecosystem/wallets';
      window.open(downloadUrl, '_blank', 'noopener,noreferrer');
      return;
    }

    try {
      setConnectingWallet(walletName);
      select(walletName);
      
      // Delay slightly for adapter initialization then trigger connect
      setTimeout(async () => {
        try {
          await connect();
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : 'Wallet connection was cancelled or rejected.';
          setErrorMessage(msg);
          setConnectingWallet(null);
        }
      }, 100);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to connect wallet.';
      setErrorMessage(msg);
      setConnectingWallet(null);
    }
  };

  // Group wallets: Recommended (Phantom & Solflare) vs Other
  const recommendedNames = ['Phantom', 'Solflare'];
  const recommendedWallets = wallets.filter(w => recommendedNames.includes(w.adapter.name));
  const otherWallets = wallets.filter(w => !recommendedNames.includes(w.adapter.name));

  // Portal target container
  if (typeof document === 'undefined') return null;

  return createPortal(
    <>
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[10000] px-4 py-3 rounded-2xl bg-[#141224] border border-purple-500/40 text-white text-xs font-medium shadow-2xl flex items-center gap-2.5 animate-in fade-in slide-in-from-top-4 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Modal Overlay */}
      {isModalOpen && (
        <div
          onClick={closeWalletModal}
          className="fixed inset-0 z-[9999] bg-black/75 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-150"
        >
          {/* Modal Panel - SOLID OPAQUE #0f0e17 */}
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full sm:max-w-[420px] max-h-[85vh] overflow-y-auto bg-[#0f0e17] border border-white/10 rounded-t-2xl sm:rounded-2xl shadow-[0_25px_60px_-15px_rgba(139,92,246,0.3)] flex flex-col p-6 animate-in zoom-in-95 sm:zoom-in-95 slide-in-from-bottom-6 sm:slide-in-from-bottom-0 duration-200"
          >
            {/* Header */}
            <div className="flex items-start justify-between pb-4 border-b border-white/10">
              <div>
                <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2.5">
                  <Logo size="sm" variant="mark" />
                  <span>Connect a wallet</span>
                </h3>
                <p className="text-xs text-[#9b98ad] mt-0.5">
                  Use Solana Devnet. Test SOL only
                </p>
              </div>

              <button
                type="button"
                onClick={closeWalletModal}
                className="p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Error Message banner */}
            {errorMessage && (
              <div className="mt-4 p-3 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                <span className="leading-relaxed">{errorMessage}</span>
              </div>
            )}

            {/* Recommended Wallets List */}
            <div className="mt-5 space-y-2.5">
              <span className="text-[11px] font-mono uppercase tracking-wider text-white/40 block px-1">
                Recommended
              </span>

              {recommendedWallets.map((w) => {
                const isInstalled = w.readyState === WalletReadyState.Installed;
                const isCurrentConnecting = connectingWallet === w.adapter.name || (connecting && wallet?.adapter.name === w.adapter.name);

                return (
                  <button
                    key={w.adapter.name}
                    type="button"
                    onClick={() => handleSelectWallet(w.adapter.name, isInstalled)}
                    disabled={isCurrentConnecting}
                    className="w-full flex items-center justify-between p-3 rounded-xl bg-white/[0.05] hover:bg-purple-600/[0.15] border border-white/10 hover:border-purple-400/50 transition-all text-white group cursor-pointer disabled:opacity-60"
                  >
                    <div className="flex items-center gap-3">
                      {w.adapter.icon ? (
                        <img
                          src={w.adapter.icon}
                          alt={w.adapter.name}
                          className="w-8 h-8 rounded-lg overflow-hidden flex-shrink-0 object-contain bg-white/5 p-1"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center text-purple-300 font-bold text-xs flex-shrink-0">
                          {w.adapter.name[0]}
                        </div>
                      )}
                      <span className="text-sm font-semibold text-white tracking-tight">
                        {w.adapter.name}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs">
                      {isCurrentConnecting ? (
                        <div className="flex items-center gap-1.5 text-purple-300 font-medium">
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Connecting…</span>
                        </div>
                      ) : isInstalled ? (
                        <span className="text-emerald-400 font-medium flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          Detected
                        </span>
                      ) : (
                        <span className="text-white/40 group-hover:text-purple-300 flex items-center gap-1">
                          <span>Install</span>
                          <ExternalLink className="w-3 h-3" />
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Other Wallets (if any) */}
            {otherWallets.length > 0 && (
              <div className="mt-4 space-y-2">
                <span className="text-[11px] font-mono uppercase tracking-wider text-white/40 block px-1">
                  Other wallets
                </span>
                {otherWallets.map((w) => {
                  const isInstalled = w.readyState === WalletReadyState.Installed;
                  const isCurrentConnecting = connectingWallet === w.adapter.name;

                  return (
                    <button
                      key={w.adapter.name}
                      type="button"
                      onClick={() => handleSelectWallet(w.adapter.name, isInstalled)}
                      disabled={isCurrentConnecting}
                      className="w-full flex items-center justify-between p-2.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/5 hover:border-white/20 transition-all text-white group cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        {w.adapter.icon && (
                          <img
                            src={w.adapter.icon}
                            alt={w.adapter.name}
                            className="w-6 h-6 rounded flex-shrink-0"
                          />
                        )}
                        <span className="text-xs font-medium text-white/90">
                          {w.adapter.name}
                        </span>
                      </div>
                      <span className="text-[11px] text-white/40">
                        {isInstalled ? 'Detected' : 'Install'}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Devnet Notice Footer (solid background, inside panel, below list) */}
            <div className="mt-5 p-3.5 rounded-xl bg-[#161426] border border-purple-500/20 text-xs text-purple-200/90 leading-relaxed flex items-start gap-2.5">
              <Sparkles className="w-4 h-4 text-purple-400 flex-shrink-0 mt-0.5" />
              <div>
                <strong className="text-purple-100 block mb-0.5">Devnet Demo Environment</strong>
                <span>
                  Switch your wallet network to <strong>Solana Devnet</strong>. You can claim free test SOL directly from the wallet dropdown anytime!
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>,
    document.body
  );
};
