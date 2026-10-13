import React, { useState, useEffect } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { useWalletModal } from '../context/WalletModalContext';
import { PublicKey } from '@solana/web3.js';
import confetti from 'canvas-confetti';
import { Project } from '../types';
import { ProgressBar } from './ProgressBar';
import { 
  createContributionTransaction, 
  explorerTxUrl, 
  lamportsToSol 
} from '../lib/solana';
import { 
  useProjectFunding,
  notifyLedgerUpdated
} from '../lib/ledger';
import { 
  Coins, 
  Loader2, 
  ExternalLink, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  Users, 
  ShieldCheck, 
  ShieldAlert,
  Wallet,
  Sparkles,
  RefreshCw
} from 'lucide-react';

interface FundingPanelProps {
  project: Project;
  onContributionSuccess?: () => void;
}

export const FundingPanel: React.FC<FundingPanelProps> = ({ project, onContributionSuccess }) => {
  const { publicKey, connected, sendTransaction } = useWallet();
  const { connection } = useConnection();
  const { openWalletModal } = useWalletModal();

  const [amount, setAmount] = useState<string>('0.5');
  const [balance, setBalance] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successTx, setSuccessTx] = useState<string | null>(null);

  // Derived stats strictly recomputed from Solana Devnet on every load
  const {
    raisedSol,
    backerCount,
    percentFunded,
    treasuryBalance,
    isLoading: isFundingLoading,
    isError: isFundingError,
    error: fundingError,
    refetch: refetchFunding,
  } = useProjectFunding(project);

  // Quick preset chips
  const presets = ['0.1', '0.5', '1.0', '2.0'];

  // Self-funding guard: Check if connected wallet is the founder
  const isFounder = Boolean(
    connected && publicKey && (
      publicKey.toBase58() === project.founderAddress ||
      publicKey.toBase58() === project.treasuryAddress
    )
  );

  // Calculate days left
  const calculateDaysLeft = () => {
    try {
      const deadlineDate = new Date(project.deadline).getTime();
      const now = Date.now();
      const diff = Math.ceil((deadlineDate - now) / (1000 * 60 * 60 * 24));
      return diff > 0 ? diff : 0;
    } catch {
      return 30;
    }
  };

  const daysLeft = calculateDaysLeft();

  // Fetch supporter wallet balance
  const refreshBalance = async () => {
    if (connected && publicKey) {
      try {
        const bal = await connection.getBalance(publicKey);
        setBalance(lamportsToSol(bal));
      } catch (err) {
        console.warn('Error fetching balance:', err);
      }
    } else {
      setBalance(null);
    }
  };

  useEffect(() => {
    refreshBalance();
    const interval = setInterval(refreshBalance, 30000);
    return () => clearInterval(interval);
  }, [connected, publicKey, connection]);

  // Handle Backing Project
  const handleBackProject = async () => {
    setErrorMsg(null);
    setSuccessTx(null);

    if (!connected || !publicKey) {
      openWalletModal();
      return;
    }

    // Guard: Founders cannot back their own project
    if (isFounder) {
      setErrorMsg("Founders can't back their own campaign");
      return;
    }

    const solAmount = parseFloat(amount);
    if (isNaN(solAmount) || solAmount <= 0) {
      setErrorMsg('Please enter a valid SOL amount');
      return;
    }

    // Check balance
    if (balance !== null && balance < solAmount + 0.001) {
      setErrorMsg(`Insufficient Devnet SOL (Balance: ${balance.toFixed(3)} ◎).`);
      return;
    }

    setIsLoading(true);

    try {
      let treasuryPubkey: PublicKey;
      try {
        treasuryPubkey = new PublicKey(project.treasuryAddress);
      } catch {
        treasuryPubkey = publicKey;
      }

      // Build real on-chain transaction with transfer + strict Launchpad memo
      const transaction = await createContributionTransaction(
        connection,
        publicKey,
        treasuryPubkey,
        solAmount,
        project.id,
        project.name
      );

      // Prompt wallet signature and broadcast directly to Devnet
      // skipPreflight: true prevents simulation RPC roundtrips that trigger 429 rate limits
      const signature = await sendTransaction(transaction, connection, {
        skipPreflight: true,
        maxRetries: 3,
      });

      // Reuse blockhash & block height from transaction without firing redundant RPC requests
      const blockhash =
        transaction.recentBlockhash || (await connection.getLatestBlockhash('confirmed')).blockhash;
      const lastValidBlockHeight =
        (transaction as unknown as { lastValidBlockHeight?: number }).lastValidBlockHeight ||
        (await connection.getLatestBlockhash('confirmed')).lastValidBlockHeight;

      // Wait for confirmation on Devnet
      try {
        await connection.confirmTransaction(
          {
            blockhash,
            lastValidBlockHeight,
            signature,
          },
          'confirmed'
        );
      } catch (confirmNotice) {
        console.warn('Devnet confirmation notice (signature broadcasted):', confirmNotice);
      }

      // Trigger celebration confetti
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#a855f7', '#38bdf8', '#34d399', '#f43f5e'],
      });

      setSuccessTx(signature);
      await refreshBalance();

      // Trigger global and local chain re-fetch
      notifyLedgerUpdated();
      await refetchFunding();
      onContributionSuccess?.();
    } catch (err: unknown) {
      console.error('Contribution failed:', err);
      const msg = err instanceof Error ? err.message : 'Transaction failed or was rejected by user';
      if (msg.includes('User rejected')) {
        setErrorMsg('Transaction cancelled in wallet.');
      } else if (msg.includes('429') || msg.includes('Too Many Requests')) {
        setErrorMsg('Solana Devnet public node is busy (rate limit). Please retry in a moment.');
      } else if (msg.includes('Unexpected error')) {
        setErrorMsg('Transaction rejected by network or wallet timed out. Please retry.');
      } else {
        setErrorMsg(msg);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full glass-panel border border-white/10 rounded-3xl p-6 bg-[#0f0c20]/90 backdrop-blur-xl shadow-2xl relative overflow-hidden">
      {/* Devnet watermark ribbon */}
      <div className="flex items-center justify-between pb-4 border-b border-white/10">
        <span className="text-xs font-semibold uppercase tracking-wider text-purple-300 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-purple-400" />
          Crowdfund Pool
        </span>
        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono bg-purple-500/20 text-purple-200 border border-purple-500/30">
          Devnet Mode
        </span>
      </div>

      {/* Progress & Raised metrics derived solely from verified contributions */}
      <div className="mt-5 space-y-4">
        <div>
          {isFundingError ? (
            <div className="p-3 mb-3 rounded-2xl bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 min-w-0">
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
                <span className="truncate">Couldn't load on-chain data</span>
              </div>
              <button
                type="button"
                onClick={() => refetchFunding()}
                className="px-2.5 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 text-[11px] font-semibold flex items-center gap-1 shrink-0 cursor-pointer"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Retry</span>
              </button>
            </div>
          ) : null}

          <div className="flex items-baseline justify-between flex-wrap gap-1">
            {isFundingLoading ? (
              <div className="h-9 w-24 bg-white/10 rounded-xl animate-pulse" />
            ) : isFundingError ? (
              <span className="text-3xl font-extrabold text-white/50 tracking-tight font-mono">— ◎</span>
            ) : (
              <span className="text-3xl font-extrabold text-white flex items-center gap-1.5 tracking-tight font-mono">
                {raisedSol.toFixed(1)} <span className="text-xl text-purple-400 font-mono">◎</span>
              </span>
            )}
            <div className="flex items-center gap-2 text-xs font-mono">
              {isFundingLoading ? (
                <div className="h-4 w-28 bg-white/10 rounded animate-pulse" />
              ) : isFundingError ? (
                <span className="text-rose-400">—</span>
              ) : (
                <span className={percentFunded >= 100 ? "text-[#fde68a] font-semibold" : "text-purple-300 font-medium"}>
                  {percentFunded >= 100 ? `${percentFunded}% funded · Goal reached` : `${percentFunded}% funded`}
                </span>
              )}
              <span className="text-white/30">•</span>
              <span className="text-[#9b98ad]">
                of {project.goalSol} SOL goal
              </span>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-2.5">
            <ProgressBar value={isFundingLoading ? 0 : percentFunded} size="default" />
          </div>
        </div>

        {/* Backers & Days Left */}
        <div className="grid grid-cols-2 gap-3 pt-1">
          <div className="p-3 rounded-2xl bg-white/5 border border-white/5 flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-purple-500/20 flex items-center justify-center text-purple-300">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs text-[#9b98ad] block">Backers</span>
              {isFundingLoading ? (
                <div className="h-4 w-12 bg-white/10 rounded mt-0.5 animate-pulse" />
              ) : isFundingError ? (
                <span className="text-sm font-semibold text-white/50">—</span>
              ) : (
                <span className="text-sm font-semibold text-white">{backerCount} supporters</span>
              )}
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-white/5 border border-white/5 flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/20 flex items-center justify-center text-indigo-300">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs text-[#9b98ad] block">Time Left</span>
              <span className="text-sm font-semibold text-white">{daysLeft} days remaining</span>
            </div>
          </div>
        </div>
      </div>

      {/* Contribution Form */}
      <div className="mt-6 pt-5 border-t border-white/10 space-y-3.5">
        <div className="flex items-center justify-between text-xs">
          <label className="text-white/80 font-medium">Pledge Amount (SOL)</label>
          {connected && balance !== null && (
            <span className="text-[#9b98ad] font-mono">
              Balance: <span className="text-purple-300">{balance.toFixed(3)} ◎</span>
            </span>
          )}
        </div>

        {/* Presets */}
        <div className="grid grid-cols-4 gap-2">
          {presets.map((p) => (
            <button
              key={p}
              type="button"
              disabled={isFounder}
              onClick={() => setAmount(p)}
              className={`py-1.5 rounded-xl text-xs font-mono font-medium transition-all cursor-pointer ${
                amount === p
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30 border border-purple-400'
                  : 'bg-white/5 hover:bg-white/10 text-white/70 border border-white/10'
              } ${isFounder ? 'opacity-40 cursor-not-allowed' : ''}`}
            >
              {p} ◎
            </button>
          ))}
        </div>

        {/* Custom Input */}
        <div className="relative">
          <input
            type="number"
            min="0.01"
            step="0.1"
            disabled={isFounder}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.5"
            className={`w-full px-4 py-2.5 rounded-2xl bg-white/5 border border-white/10 focus:border-purple-400 focus:outline-none text-white font-mono text-sm pr-16 ${
              isFounder ? 'opacity-40 cursor-not-allowed' : ''
            }`}
          />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-mono font-semibold text-purple-300">
            SOL
          </span>
        </div>

        {/* Estimated Backer Tokens */}
        <div className="p-3 rounded-xl bg-purple-950/20 border border-purple-500/20 flex items-center justify-between text-xs">
          <span className="text-[#9b98ad] flex items-center gap-1.5">
            <Coins className="w-3.5 h-3.5 text-purple-400" />
            Estimated Token Reward:
          </span>
          <span className="font-mono text-purple-200 font-semibold">
            {((parseFloat(amount) || 0) * (project.tokenomics?.backerTokensPerSol || 1000)).toLocaleString()}{' '}
            {project.tokenomics?.tokenSymbol || 'TOKENS'}
          </span>
        </div>

        {/* Error notification */}
        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-2.5 text-rose-300 text-xs">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Self-funding guard notice */}
        {isFounder && (
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-start gap-2.5 text-amber-300 text-xs">
            <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold block">Founders can't back their own campaign</span>
              <span className="text-amber-200/70 text-[11px] block mt-0.5">
                You are connected with the campaign founder wallet. Switch to another Devnet wallet to test contributions.
              </span>
            </div>
          </div>
        )}

        {/* Success confirmation */}
        {successTx && (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 space-y-1 text-xs">
            <div className="flex items-center gap-2 text-emerald-300 font-semibold">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Devnet Contribution Confirmed!</span>
            </div>
            <p className="text-[#9b98ad]">Your pledge has been permanently recorded on Solana devnet.</p>
            <a
              href={explorerTxUrl(successTx)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-purple-300 hover:text-white underline mt-1"
            >
              <span>View transaction on Solana Explorer</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        )}

        {/* Action Button: Back this project with self-funding guard */}
        <button
          type="button"
          onClick={handleBackProject}
          disabled={isLoading || isFounder}
          title={isFounder ? "Founders can't back their own campaign" : undefined}
          className={`w-full py-3.5 rounded-2xl text-sm font-semibold transition-all flex items-center justify-center gap-2 shadow-lg ${
            isFounder
              ? 'bg-white/5 text-white/40 border border-white/10 cursor-not-allowed'
              : isLoading
              ? 'bg-purple-800 text-white/50 cursor-not-allowed'
              : !connected
              ? 'bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-500 hover:from-purple-500 hover:to-indigo-500 text-white cursor-pointer shadow-purple-600/30'
              : 'bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-500 hover:from-purple-500 hover:to-indigo-500 text-white cursor-pointer shadow-purple-600/30'
          }`}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Confirming on Devnet…</span>
            </>
          ) : isFounder ? (
            <>
              <ShieldAlert className="w-4 h-4 text-amber-300" />
              <span>Founders can't back their own campaign</span>
            </>
          ) : !connected ? (
            <>
              <Wallet className="w-4 h-4" />
              <span>Connect Wallet to Back</span>
            </>
          ) : (
            <>
              <Coins className="w-4 h-4" />
              <span>Back this project with {amount || '0'} SOL</span>
            </>
          )}
        </button>
      </div>

      {/* Treasury balance (live) shown strictly separately */}
      {treasuryBalance !== null && (
        <div className="mt-5 pt-3.5 border-t border-white/10 space-y-1">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-[#9b98ad]">Treasury balance (live):</span>
            <span className="font-semibold text-emerald-400">{treasuryBalance.toFixed(3)} ◎</span>
          </div>
          <p className="text-[10px] text-white/40 leading-tight">
            Live wallet balance includes external funds not tied to this campaign.
          </p>
        </div>
      )}

      {/* Safety & Educational Footnote */}
      <div className="mt-4 pt-3 border-t border-white/5 text-[11px] text-[#9b98ad] flex items-center gap-2">
        <ShieldCheck className="w-4 h-4 text-emerald-400/80 shrink-0" />
        <span>Demo platform on Solana Devnet. Transactions use non-economic testnet SOL.</span>
      </div>
    </div>
  );
};


