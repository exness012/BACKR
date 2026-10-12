import React, { useState } from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { Project } from '../types';
import { Coins, Lock, Info, Sparkles } from 'lucide-react';

interface TokenomicsViewProps {
  project: Project;
}

export const TokenomicsView: React.FC<TokenomicsViewProps> = ({ project }) => {
  const [pledgePreview, setPledgePreview] = useState('1');
  const tokenomics = project.tokenomics;

  const solVal = parseFloat(pledgePreview) || 0;
  const estimatedTokens = Math.round(solVal * tokenomics.backerTokensPerSol);

  return (
    <div className="space-y-6">
      {/* Header Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl glass-panel border border-white/10 bg-[#0e0c1c]">
          <span className="text-xs text-[#9b98ad] block">Token Name</span>
          <span className="text-base font-bold text-white mt-1 block">
            {tokenomics.tokenName} ({tokenomics.tokenSymbol})
          </span>
        </div>
        <div className="p-4 rounded-2xl glass-panel border border-white/10 bg-[#0e0c1c]">
          <span className="text-xs text-[#9b98ad] block">Total Supply</span>
          <span className="text-base font-bold font-mono text-white mt-1 block">
            {tokenomics.totalSupply}
          </span>
        </div>
        <div className="p-4 rounded-2xl glass-panel border border-white/10 bg-[#0e0c1c]">
          <span className="text-xs text-[#9b98ad] block">Backer Rate</span>
          <span className="text-base font-bold font-mono text-purple-300 mt-1 block">
            1 SOL = {tokenomics.backerTokensPerSol.toLocaleString()} {tokenomics.tokenSymbol}
          </span>
        </div>
      </div>

      {/* Distribution Chart & Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-6 rounded-3xl glass-panel border border-white/10 bg-[#0e0c1c]">
        {/* Pie Chart */}
        <div className="lg:col-span-6 flex flex-col items-center justify-center">
          <h4 className="text-sm font-semibold text-white mb-2 self-start">Token Distribution</h4>
          <div className="w-full h-64 relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={tokenomics.distribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={95}
                  paddingAngle={4}
                  dataKey="percentage"
                >
                  {tokenomics.distribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="#0e0c1c" strokeWidth={2} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val: number | string | readonly (string | number)[] | undefined) => [`${val}%`, 'Allocation']}
                  contentStyle={{
                    backgroundColor: '#120f24',
                    borderColor: 'rgba(255,255,255,0.15)',
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-xs text-[#9b98ad]">Total</span>
              <span className="text-sm font-bold text-white font-mono">100%</span>
            </div>
          </div>
        </div>

        {/* Legend List */}
        <div className="lg:col-span-6 flex flex-col justify-center space-y-3">
          <h4 className="text-sm font-semibold text-white mb-1">Allocation Pools</h4>
          {tokenomics.distribution.map((item) => (
            <div
              key={item.name}
              className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 border border-white/5"
            >
              <div className="flex items-center gap-2.5">
                <span
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-xs font-medium text-white">{item.name}</span>
              </div>
              <span className="text-xs font-mono font-bold text-white">{item.percentage}%</span>
            </div>
          ))}

          {/* Vesting Note */}
          <div className="mt-2 p-3 rounded-xl bg-purple-950/20 border border-purple-500/20 flex items-start gap-2 text-xs text-purple-200">
            <Lock className="w-3.5 h-3.5 text-purple-400 mt-0.5 flex-shrink-0" />
            <span>
              <strong className="text-purple-100">Vesting Terms:</strong> {tokenomics.vestingNote}
            </span>
          </div>
        </div>
      </div>

      {/* Supporter Token Calculator (Demo Preview) */}
      <div className="p-6 rounded-3xl glass-panel border border-white/10 bg-gradient-to-r from-purple-950/20 to-indigo-950/20">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <h4 className="text-base font-bold text-white">Supporter Allocation Preview</h4>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-white/10 text-white/70">
                Preview Only
              </span>
            </div>
            <p className="text-xs text-[#9b98ad] mt-1 max-w-lg leading-relaxed">
              Illustrative token rewards simulated for Devnet supporters. No real tokens are minted or distributed.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <input
                type="number"
                min="0.1"
                step="0.5"
                value={pledgePreview}
                onChange={(e) => setPledgePreview(e.target.value)}
                className="w-28 px-3 py-2 rounded-xl bg-white/5 border border-white/15 focus:border-purple-400 text-white text-xs font-mono focus:outline-none"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-purple-300 font-mono">
                SOL
              </span>
            </div>

            <div className="text-right">
              <span className="text-xs text-[#9b98ad] block">Estimated Reward</span>
              <span className="text-base font-bold font-mono text-emerald-400">
                {estimatedTokens.toLocaleString()} {tokenomics.tokenSymbol}
              </span>
            </div>

            <button
              disabled
              className="px-4 py-2 rounded-xl bg-white/5 text-white/40 text-xs font-medium border border-white/10 cursor-not-allowed"
              title="Token claiming will be available after project graduation to mainnet"
            >
              Claim (coming soon)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
