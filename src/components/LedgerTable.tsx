import React, { useState, useEffect } from 'react';
import { useConnection } from '@solana/wallet-adapter-react';
import { LedgerEntry, Project } from '../types';
import { fetchProjectLedger, fetchTreasuryBalance } from '../lib/ledger';
import { shortenAddress, explorerTxUrl, explorerAddressUrl } from '../lib/solana';
import { 
  ExternalLink, 
  RefreshCw, 
  Layers, 
  Coins, 
  ShieldCheck, 
  Clock, 
  ArrowUpRight,
  Database,
  AlertCircle
} from 'lucide-react';

interface LedgerTableProps {
  project?: Project;
  globalProjects?: Project[];
  isGlobal?: boolean;
}

export const LedgerTable: React.FC<LedgerTableProps> = ({
  project,
  globalProjects = [],
  isGlobal = false,
}) => {
  const { connection } = useConnection();
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [treasuryBalance, setTreasuryBalance] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'contribution' | 'milestone'>('all');

  const loadData = async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      if (isGlobal) {
        // Fetch ledger entries across projects, limited to active 3 to respect devnet quotas
        const allResults: LedgerEntry[] = [];

        for (const p of globalProjects.slice(0, 3)) {
          try {
            const res = await fetchProjectLedger(connection, p);
            allResults.push(...res);
          } catch {
            // Silently continue if an address is throttled
          }
        }

        // Deduplicate and sort descending by time
        const map = new Map<string, LedgerEntry>();
        for (const item of allResults) {
          map.set(item.signature, item);
        }
        const sorted = Array.from(map.values()).sort((a, b) => b.timestamp - a.timestamp);
        setEntries(sorted);
      } else if (project) {
        // Single project ledger
        const [res, bal] = await Promise.all([
          fetchProjectLedger(connection, project),
          fetchTreasuryBalance(connection, project.treasuryAddress),
        ]);
        setEntries(res);
        setTreasuryBalance(bal);
      }
      setLastRefreshed(new Date());
    } catch (e) {
      console.warn('Ledger load error:', e);
      setErrorMessage('Unable to fetch on-chain transactions from Solana devnet.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // Auto-refresh every 20 seconds
    const interval = setInterval(loadData, 20000);
    return () => clearInterval(interval);
  }, [project?.id, project?.treasuryAddress, isGlobal]);

  const filteredEntries = entries.filter((item) => {
    if (selectedFilter === 'all') return true;
    return item.type === selectedFilter;
  });

  return (
    <div className="space-y-4">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl glass-panel border border-white/10 bg-[#0d0a1b]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-300">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-base font-bold text-white flex items-center gap-2">
              <span>{isGlobal ? 'Global On-Chain Funding Ledger' : 'Transparent Project Ledger'}</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono">
                Live Devnet
              </span>
            </h4>
            <div className="flex items-center gap-2 text-xs text-[#9b98ad] mt-0.5">
              <span className="flex items-center gap-1 text-[11px] text-white/50">
                <Database className="w-3 h-3 text-purple-400" />
                Source: Solana Devnet (read directly from chain)
              </span>
              <span>•</span>
              <span className="text-[11px] text-white/40">
                Updated {lastRefreshed.toLocaleTimeString()}
              </span>
            </div>
          </div>
        </div>

        {/* Action Controls & Balance */}
        <div className="flex items-center gap-3">
          {!isGlobal && project && treasuryBalance !== null && (
            <div className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs font-mono">
              <span className="text-[#9b98ad] mr-1.5">Treasury balance:</span>
              <span className="font-semibold text-emerald-400">{treasuryBalance.toFixed(3)} ◎</span>
            </div>
          )}

          {/* Filter Pills */}
          <div className="flex items-center bg-white/5 p-1 rounded-xl border border-white/10">
            <button
              onClick={() => setSelectedFilter('all')}
              className={`px-2.5 py-1 text-xs rounded-lg transition-colors cursor-pointer ${
                selectedFilter === 'all' ? 'bg-purple-600 text-white font-medium' : 'text-white/60 hover:text-white'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setSelectedFilter('contribution')}
              className={`px-2.5 py-1 text-xs rounded-lg transition-colors cursor-pointer ${
                selectedFilter === 'contribution' ? 'bg-purple-600 text-white font-medium' : 'text-white/60 hover:text-white'
              }`}
            >
              Contributions
            </button>
            <button
              onClick={() => setSelectedFilter('milestone')}
              className={`px-2.5 py-1 text-xs rounded-lg transition-colors cursor-pointer ${
                selectedFilter === 'milestone' ? 'bg-purple-600 text-white font-medium' : 'text-white/60 hover:text-white'
              }`}
            >
              Milestones
            </button>
          </div>

          <button
            onClick={loadData}
            disabled={isLoading}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border border-white/10 transition-colors cursor-pointer"
            title="Refresh Ledger"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-purple-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Ledger Table Container */}
      <div className="rounded-2xl glass-panel border border-white/10 overflow-hidden bg-[#0c0a1a]/80">
        {errorMessage ? (
          /* Error / Retry State - strictly no sample rows */
          <div className="py-14 px-4 text-center">
            <div className="flex flex-col items-center justify-center gap-2.5 max-w-md mx-auto">
              <AlertCircle className="w-8 h-8 text-amber-400" />
              <p className="text-sm font-semibold text-white">
                {errorMessage}
              </p>
              <p className="text-xs text-[#9b98ad]">
                The Solana Devnet RPC is temporarily busy or rate-limiting requests.
              </p>
              <button
                onClick={loadData}
                disabled={isLoading}
                className="mt-2 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-lg shadow-purple-600/30 transition-colors cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                <span>Retry Connection</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-white/80">
              <thead className="bg-white/5 text-[#9b98ad] border-b border-white/10 font-mono text-[11px] uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Time</th>
                  {isGlobal && <th className="py-3 px-4">Project</th>}
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">From (Supporter)</th>
                  <th className="py-3 px-4">Amount (SOL)</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Devnet Tx</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredEntries.length === 0 ? (
                  <tr>
                    <td
                      colSpan={isGlobal ? 7 : 6}
                      className="py-14 px-4 text-center text-white/40 font-sans"
                    >
                      <div className="flex flex-col items-center justify-center gap-3 max-w-md mx-auto">
                        <Coins className="w-9 h-9 text-white/20" />
                        <div>
                          <p className="text-sm font-medium text-white/80">
                            {project
                              ? 'No on-chain contributions yet. Be the first backer.'
                              : 'No on-chain transactions found for campaigns on Solana devnet.'}
                          </p>
                          <p className="text-xs text-[#9b98ad] mt-1">
                            Pledges and milestone proofs sent via connected wallets will be recorded and shown here in real time.
                          </p>
                        </div>
                        {project?.treasuryAddress && (
                          <a
                            href={explorerAddressUrl(project.treasuryAddress)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-xs text-purple-300 hover:text-white bg-white/5 hover:bg-white/10 px-3.5 py-1.5 rounded-xl border border-white/10 transition-colors mt-1"
                          >
                            <span>View treasury on Solana Explorer (devnet)</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredEntries.map((row) => {
                    const dateStr = new Date(row.timestamp).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    });

                    return (
                      <tr
                        key={row.signature}
                        className="hover:bg-white/5 transition-colors font-mono"
                      >
                        {/* Time */}
                        <td className="py-3.5 px-4 text-white/60 whitespace-nowrap">
                          <span className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-white/30" />
                            {dateStr}
                          </span>
                        </td>

                        {/* Project (if global) */}
                        {isGlobal && (
                          <td className="py-3.5 px-4 font-sans font-semibold text-white whitespace-nowrap">
                            {row.projectName || row.projectId || 'Community Project'}
                          </td>
                        )}

                        {/* Type */}
                        <td className="py-3.5 px-4 whitespace-nowrap font-sans">
                          <span
                            className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full font-medium ${
                              row.type === 'contribution'
                                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                                : row.type === 'milestone'
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                            }`}
                          >
                            {row.type === 'contribution' && <Coins className="w-3 h-3" />}
                            {row.type === 'milestone' && <ShieldCheck className="w-3 h-3" />}
                            {row.type === 'transfer' && <ArrowUpRight className="w-3 h-3" />}
                            <span className="capitalize">{row.type}</span>
                          </span>
                        </td>

                        {/* Supporter Address -> Explorer Devnet */}
                        <td className="py-3.5 px-4 text-white/90 whitespace-nowrap">
                          <a
                            href={explorerAddressUrl(row.fromAddress)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:text-purple-300 transition-colors underline decoration-dotted"
                            title={row.fromAddress}
                          >
                            {shortenAddress(row.fromAddress, 4)}
                          </a>
                        </td>

                        {/* Amount */}
                        <td className="py-3.5 px-4 text-white font-bold whitespace-nowrap">
                          {row.amountSol > 0 ? (
                            <span className="text-emerald-400">
                              +{row.amountSol.toFixed(2)} ◎
                            </span>
                          ) : (
                            <span className="text-white/40">—</span>
                          )}
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-4 whitespace-nowrap font-sans">
                          <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            <span>On-Chain</span>
                          </span>
                        </td>

                        {/* Explorer Link -> Real Devnet Tx */}
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <a
                            href={explorerTxUrl(row.signature)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-purple-300 hover:text-white bg-white/5 hover:bg-white/10 px-2.5 py-1 rounded-lg border border-white/10 transition-colors"
                          >
                            <span>{shortenAddress(row.signature, 3)}</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

