import React from 'react';
import { ShieldCheck, Cpu, Layers, Sparkles, Lock, ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { APP_NAME } from '../lib/constants';

export const AboutPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-10">
      <div>
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-purple-400" />
          <span className="text-xs font-mono font-semibold uppercase tracking-wider text-purple-300">
            About {APP_NAME}
          </span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white mt-1.5 tracking-tight">
          Decentralized Crypto Crowdfunding on Solana
        </h1>
        <p className="text-sm text-[#9b98ad] mt-2 leading-relaxed">
          {APP_NAME} bridges visionary crypto founders and an impassioned community of backers through trustless, on-chain milestone governance on Solana Devnet.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 rounded-3xl glass-panel border border-white/10 bg-[#0e0c1c] space-y-3">
          <div className="w-10 h-10 rounded-2xl bg-purple-500/20 flex items-center justify-center text-purple-400">
            <Lock className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-white">Milestone-Gated Escrows</h3>
          <p className="text-xs text-[#9b98ad] leading-relaxed">
            Unlike legacy kickstarter platforms where founders receive capital upfront without accountability, BACKR ties capital disbursement to auditable deliverables verified on-chain.
          </p>
        </div>

        <div className="p-6 rounded-3xl glass-panel border border-white/10 bg-[#0e0c1c] space-y-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Layers className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-white">Devnet Ledger Transparency</h3>
          <p className="text-xs text-[#9b98ad] leading-relaxed">
            Every SOL transfer, backer pledge, and founder update embeds structured JSON in Solana&apos;s native Memo Program. All transactions are verifiable with a single click on Solana Explorer.
          </p>
        </div>

        <div className="p-6 rounded-3xl glass-panel border border-white/10 bg-[#0e0c1c] space-y-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 flex items-center justify-center text-indigo-400">
            <Cpu className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-white">Algorithmic Trust Scoring</h3>
          <p className="text-xs text-[#9b98ad] leading-relaxed">
            Our autonomous evaluation engine rates founder reliability (0-100) based on on-time milestone delivery, community growth, and historical on-chain integrity.
          </p>
        </div>

        <div className="p-6 rounded-3xl glass-panel border border-white/10 bg-[#0e0c1c] space-y-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/20 flex items-center justify-center text-amber-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-white">Zero Real Financial Risk</h3>
          <p className="text-xs text-[#9b98ad] leading-relaxed">
            {APP_NAME} is currently in public testnet demo mode on Solana Devnet. All tokens and SOL are simulated test currency available free of charge via devnet faucets.
          </p>
        </div>
      </div>

      <div className="p-8 rounded-3xl glass-panel border border-purple-500/20 bg-gradient-to-r from-purple-950/30 to-indigo-950/30 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div>
          <h4 className="text-lg font-bold text-white">Ready to explore active projects?</h4>
          <p className="text-xs text-[#9b98ad] mt-1">
            Browse through active IDOs, back innovative teams, or launch your own proposal.
          </p>
        </div>
        <Link
          to="/projects"
          className="px-6 py-2.5 rounded-full text-xs font-semibold text-white bg-purple-600 hover:bg-purple-500 transition-colors shadow-lg shadow-purple-600/30"
        >
          Explore Projects
        </Link>
      </div>
    </div>
  );
};
