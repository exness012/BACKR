import React, { useState } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { Milestone, Project } from '../types';
import { 
  createMilestoneMemoTransaction, 
  explorerTxUrl, 
  shortenAddress 
} from '../lib/solana';
import { updateProjectMilestone } from '../lib/api';
import { recordConfirmedSessionTx } from '../lib/ledger';
import { 
  CheckCircle2, 
  Clock, 
  ExternalLink, 
  ShieldCheck, 
  Sparkles, 
  Loader2, 
  AlertCircle,
  FileText
} from 'lucide-react';

interface MilestoneTimelineProps {
  project: Project;
  onMilestoneUpdated?: () => void;
}

export const MilestoneTimeline: React.FC<MilestoneTimelineProps> = ({
  project,
  onMilestoneUpdated,
}) => {
  const { publicKey, connected, sendTransaction } = useWallet();
  const { connection } = useConnection();

  const [activeModalMilestone, setActiveModalMilestone] = useState<Milestone | null>(null);
  const [proofNote, setProofNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const isFounder = connected && publicKey && (
    publicKey.toBase58() === project.founderAddress ||
    publicKey.toBase58() === project.treasuryAddress
  );

  const handleVerifyMilestone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeModalMilestone || !connected || !publicKey) return;

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      // Create Memo transaction on Solana Devnet
      const tx = await createMilestoneMemoTransaction(
        connection,
        publicKey,
        project.id,
        activeModalMilestone.id,
        activeModalMilestone.order,
        proofNote || 'Verified milestone deliverable'
      );

      const signature = await sendTransaction(tx, connection, {
        skipPreflight: true,
        maxRetries: 3,
      });

      const blockhash =
        tx.recentBlockhash || (await connection.getLatestBlockhash('confirmed')).blockhash;
      const lastValidBlockHeight =
        (tx as unknown as { lastValidBlockHeight?: number }).lastValidBlockHeight ||
        (await connection.getLatestBlockhash('confirmed')).lastValidBlockHeight;

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
        console.warn('Milestone confirmation notice:', confirmNotice);
      }

      // Record session transaction
      recordConfirmedSessionTx({
        signature,
        timestamp: Date.now(),
        fromAddress: publicKey.toBase58(),
        toAddress: project.treasuryAddress,
        amountSol: 0,
        type: 'milestone',
        projectId: project.id,
        projectName: project.name,
        status: 'confirmed',
        memo: `{"app":"launchpad","type":"milestone","project":"${project.id}","milestone":${activeModalMilestone.order}}`,
      });

      // Update in Firestore backend
      await updateProjectMilestone(project.id, activeModalMilestone.id, signature, proofNote);

      setActiveModalMilestone(null);
      setProofNote('');
      onMilestoneUpdated?.();
    } catch (err: unknown) {
      console.error('Milestone verification error:', err);
      const msg = err instanceof Error ? err.message : 'Failed to publish milestone memo transaction';
      setErrorMsg(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
        <div>
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <span>Roadmap & Milestone Escrow</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-normal">
              {project.milestones.filter(m => m.status === 'completed').length} / {project.milestones.length} Completed
            </span>
          </h3>
          <p className="text-xs text-[#9b98ad] mt-1">
            Capital is unlocked incrementally as founders submit verifiable on-chain proofs on Solana Devnet.
          </p>
        </div>

        {connected && !isFounder && (
          <div className="text-[11px] text-purple-300/80 bg-purple-950/20 px-3 py-1.5 rounded-xl border border-purple-500/20">
            Tip: Connect founder wallet ({shortenAddress(project.founderAddress)}) to unlock milestones.
          </div>
        )}
      </div>

      {/* Vertical Timeline */}
      <div className="relative pl-6 sm:pl-8 space-y-8 before:absolute before:left-3 sm:before:left-4 before:top-2 before:bottom-2 before:w-0.5 before:bg-white/10">
        {project.milestones.map((m) => {
          const isCompleted = m.status === 'completed';
          const isInProgress = m.status === 'in_progress';

          return (
            <div key={m.id} className="relative group">
              {/* Dot Icon */}
              <div
                className={`absolute -left-6 sm:-left-8 top-1 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                  isCompleted
                    ? 'bg-emerald-500/20 border-emerald-400 text-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.4)]'
                    : isInProgress
                    ? 'bg-purple-500/20 border-purple-400 text-purple-300 shadow-[0_0_12px_rgba(168,85,247,0.4)]'
                    : 'bg-[#0e0c19] border-white/20 text-white/40'
                }`}
              >
                {isCompleted ? (
                  <CheckCircle2 className="w-3.5 h-3.5" />
                ) : isInProgress ? (
                  <Clock className="w-3.5 h-3.5 animate-pulse" />
                ) : (
                  <span className="text-[10px] font-mono">{m.order}</span>
                )}
              </div>

              {/* Milestone Card */}
              <div
                className={`p-5 rounded-2xl glass-panel border transition-all ${
                  isCompleted
                    ? 'border-emerald-500/30 bg-emerald-950/10'
                    : isInProgress
                    ? 'border-purple-500/30 bg-purple-950/15'
                    : 'border-white/10 bg-[#0e0c1a]/60'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-semibold text-purple-300">
                      Phase {m.order}
                    </span>
                    <span className="text-white/30">•</span>
                    <span className="text-xs text-[#9b98ad]">{m.targetDate}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-mono bg-white/5 border border-white/10 text-white">
                      Unlock: <strong className="text-purple-300">{m.unlockSol} ◎</strong>
                    </span>

                    <span
                      className={`text-[11px] font-semibold uppercase px-2.5 py-0.5 rounded-full ${
                        isCompleted
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : isInProgress
                          ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                          : 'bg-white/5 text-white/50 border border-white/10'
                      }`}
                    >
                      {m.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>

                <h4 className="text-base font-bold text-white mt-2">{m.title}</h4>
                <p className="text-sm text-[#9b98ad] mt-1 leading-relaxed">{m.description}</p>

                {/* Proof note or Completed verified state */}
                {m.proofNote && (
                  <div className="mt-3 p-3 rounded-xl bg-white/5 border border-white/5 text-xs text-white/80 flex items-start gap-2">
                    <FileText className="w-3.5 h-3.5 text-purple-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <strong className="text-white">Proof Deliverable:</strong> {m.proofNote}
                    </div>
                  </div>
                )}

                {/* Footer status & Tx signature */}
                <div className="mt-4 pt-3 border-t border-white/10 flex flex-wrap items-center justify-between gap-3">
                  {isCompleted && m.txSignature ? (
                    <div className="flex items-center gap-2 text-xs">
                      <span className="inline-flex items-center gap-1 text-emerald-400 font-semibold">
                        <ShieldCheck className="w-4 h-4" />
                        Verified on-chain
                      </span>
                      <a
                        href={explorerTxUrl(m.txSignature)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-mono text-purple-300 hover:text-white underline"
                      >
                        <span>Memo Tx: {shortenAddress(m.txSignature, 6)}</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  ) : (
                    <span className="text-xs text-[#9b98ad]">Pending milestone completion</span>
                  )}

                  {/* Founder action: Mark complete */}
                  {!isCompleted && (
                    <button
                      onClick={() => setActiveModalMilestone(m)}
                      className="px-3.5 py-1.5 rounded-xl text-xs font-medium text-purple-200 bg-purple-600/30 hover:bg-purple-600/50 border border-purple-400/40 transition-colors flex items-center gap-1.5 cursor-pointer ml-auto"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-purple-300" />
                      <span>{isFounder ? 'Mark milestone complete' : 'Verify as Founder'}</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Verify Milestone Modal */}
      {activeModalMilestone && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="relative w-full max-w-lg p-6 rounded-3xl glass-panel bg-[#0e0c1c] border border-white/15 shadow-2xl">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-400" />
              <span>Verify Milestone On-Chain</span>
            </h3>
            <p className="text-xs text-[#9b98ad] mt-1">
              Phase {activeModalMilestone.order}: {activeModalMilestone.title}
            </p>

            <form onSubmit={handleVerifyMilestone} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-medium text-white/80 mb-1.5">
                  Proof of Delivery / GitHub Release / Audit Link
                </label>
                <textarea
                  rows={3}
                  value={proofNote}
                  onChange={(e) => setProofNote(e.target.value)}
                  placeholder="e.g. Published smart contracts to Devnet, audited by Trail of Bits: https://github.com/..."
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/15 focus:border-purple-400 focus:outline-none text-white text-xs placeholder:text-white/30"
                />
              </div>

              <div className="p-3 rounded-xl bg-purple-950/30 border border-purple-500/20 text-xs text-purple-200">
                This publishes an immutable Memo Program transaction to <strong>Solana Devnet</strong> from your connected wallet.
              </div>

              {errorMsg && (
                <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveModalMilestone(null)}
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-400 hover:to-indigo-400 transition-all flex items-center gap-1.5 cursor-pointer shadow-lg shadow-purple-600/30 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Broadcasting Memo…</span>
                    </>
                  ) : (
                    <span>Publish On-Chain Memo</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
