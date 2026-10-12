import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '../context/WalletModalContext';
import { Project, Milestone, ProjectType, Founder, FounderSocials } from '../types';
import { saveProject } from '../lib/api';
import { shortenAddress } from '../lib/solana';
import { normalizeUrl, normalizeSocialLink, sanitizeText } from '../lib/avatar';
import { ImageUpload } from '../components/ImageUpload';
import { ProjectCard } from '../components/ProjectCard';
import { FoundersSection } from '../components/FoundersSection';
import { 
  Sparkles, 
  ArrowRight, 
  ArrowLeft, 
  Plus, 
  Trash2, 
  ShieldCheck, 
  Wallet, 
  AlertCircle,
  Users
} from 'lucide-react';

export interface FounderFormItem {
  id: string;
  name: string;
  role: string;
  bio: string;
  avatar?: string;
  x: string;
  linkedin: string;
  github: string;
  telegramOrDiscord: string;
  website: string;
}

interface CreateProjectPageProps {
  onProjectCreated?: () => void;
}

export const CreateProjectPage: React.FC<CreateProjectPageProps> = ({ onProjectCreated }) => {
  const navigate = useNavigate();
  const { publicKey, connected } = useWallet();
  const { openWalletModal } = useWalletModal();

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Step 1: Basics
  const [name, setName] = useState('');
  const [tagline, setTagline] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Infrastructure & AI');
  const [logoUrl, setLogoUrl] = useState<string | undefined>(undefined);
  const [bannerUrl, setBannerUrl] = useState<string | undefined>(undefined);
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [twitterUrl, setTwitterUrl] = useState('');
  const [discordUrl, setDiscordUrl] = useState('');

  // Founders state
  const [founders, setFounders] = useState<FounderFormItem[]>([
    {
      id: crypto.randomUUID(),
      name: '',
      role: '',
      bio: '',
      avatar: undefined,
      x: '',
      linkedin: '',
      github: '',
      telegramOrDiscord: '',
      website: '',
    },
  ]);
  const [validationAttempted, setValidationAttempted] = useState(false);

  const updateFounder = (id: string, field: keyof FounderFormItem, value: string | undefined) => {
    setFounders((prev) =>
      prev.map((f) => (f.id === id ? { ...f, [field]: value } : f))
    );
  };

  const addFounder = () => {
    if (founders.length >= 5) return;
    setFounders((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        name: '',
        role: '',
        bio: '',
        avatar: undefined,
        x: '',
        linkedin: '',
        github: '',
        telegramOrDiscord: '',
        website: '',
      },
    ]);
  };

  const removeFounder = (id: string) => {
    if (founders.length <= 1) return;
    setFounders((prev) => prev.filter((f) => f.id !== id));
  };

  const getNormalizedFounders = (): { valid: boolean; error?: string; founders: Founder[] } => {
    if (founders.length === 0) {
      return { valid: false, error: 'At least one founder is required.', founders: [] };
    }

    // Check that at least one founder has a name
    const namedFounders = founders.filter((f) => f.name.trim().length > 0);
    if (namedFounders.length === 0) {
      return { valid: false, error: 'Please enter a full name for at least one founder.', founders: [] };
    }

    // Check duplicate founder names
    const namesSeen = new Set<string>();
    for (const f of founders) {
      const trimmed = f.name.trim();
      if (!trimmed) {
        return { valid: false, error: 'All founder cards must have a name, or remove the unused founder.', founders: [] };
      }
      const lower = trimmed.toLowerCase();
      if (namesSeen.has(lower)) {
        return { valid: false, error: `Duplicate founder name: "${trimmed}". Each founder must have a unique name.`, founders: [] };
      }
      namesSeen.add(lower);
    }

    // Check URLs
    for (const f of founders) {
      if (f.linkedin.trim() && !normalizeUrl(f.linkedin.trim())) {
        return { valid: false, error: `Invalid LinkedIn URL for ${f.name.trim()}. Must be a valid web URL.`, founders: [] };
      }
      if (f.website.trim() && !normalizeUrl(f.website.trim())) {
        return { valid: false, error: `Invalid website URL for ${f.name.trim()}. Must be a valid web URL.`, founders: [] };
      }
    }

    const result: Founder[] = founders.map((f) => {
      const socials: FounderSocials = {};
      if (f.x.trim()) {
        const xNorm = normalizeSocialLink('x', f.x.trim());
        if (xNorm) socials.x = xNorm.url;
      }
      if (f.linkedin.trim()) {
        const lNorm = normalizeSocialLink('linkedin', f.linkedin.trim());
        if (lNorm) socials.linkedin = lNorm.url;
      }
      if (f.github.trim()) {
        const ghNorm = normalizeSocialLink('github', f.github.trim());
        if (ghNorm) socials.github = ghNorm.url;
      }
      if (f.telegramOrDiscord.trim()) {
        const raw = f.telegramOrDiscord.trim();
        if (raw.toLowerCase().includes('discord') || raw.includes('#')) {
          const dNorm = normalizeSocialLink('discord', raw);
          if (dNorm) socials.discord = dNorm.url;
        } else {
          const tgNorm = normalizeSocialLink('telegram', raw);
          if (tgNorm) socials.telegram = tgNorm.url;
        }
      }
      if (f.website.trim()) {
        const wNorm = normalizeSocialLink('website', f.website.trim());
        if (wNorm) socials.website = wNorm.url;
      }

      return {
        id: f.id,
        name: sanitizeText(f.name),
        role: f.role.trim() ? sanitizeText(f.role) : undefined,
        bio: f.bio.trim() ? sanitizeText(f.bio) : undefined,
        avatar: f.avatar,
        socials,
      };
    });

    return { valid: true, founders: result };
  };

  // Step 2: Funding & Token
  const [goalSol, setGoalSol] = useState('150');
  const [deadline, setDeadline] = useState('2026-12-31');
  const [type, setType] = useState<ProjectType>('Crowdfund');
  const [tokenSymbol, setTokenSymbol] = useState('ALPHA');
  const [tokenName, setTokenName] = useState('Alpha Protocol Token');
  const [totalSupply, setTotalSupply] = useState('100,000,000');
  const [backerTokensPerSol, setBackerTokensPerSol] = useState('1000');

  // Step 3: Milestones
  const [milestones, setMilestones] = useState<Milestone[]>([
    {
      id: 'm-1',
      order: 1,
      title: 'Devnet MVP & Smart Contracts',
      description: 'Deploy core protocol contracts on Solana Devnet with full test suite.',
      targetDate: 'May 2026',
      unlockSol: 50,
      status: 'in_progress',
    },
    {
      id: 'm-2',
      order: 2,
      title: 'Public Beta & Security Audit',
      description: 'Formal verification by independent auditors and public testnet bug bounty.',
      targetDate: 'Aug 2026',
      unlockSol: 50,
      status: 'upcoming',
    },
    {
      id: 'm-3',
      order: 3,
      title: 'Mainnet Graduation & SDK',
      description: 'Mainnet genesis deployment and multi-platform developer SDK rollout.',
      targetDate: 'Nov 2026',
      unlockSol: 50,
      status: 'upcoming',
    },
  ]);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const addMilestone = () => {
    if (milestones.length >= 5) return;
    const newOrder = milestones.length + 1;
    setMilestones([
      ...milestones,
      {
        id: `m-${Date.now()}`,
        order: newOrder,
        title: `Phase ${newOrder} Deliverable`,
        description: 'Key feature release and verifiable on-chain deliverable.',
        targetDate: 'Dec 2026',
        unlockSol: 25,
        status: 'upcoming',
      },
    ]);
  };

  const removeMilestone = (index: number) => {
    if (milestones.length <= 2) {
      setErrorMsg('A project must have at least 2 milestones for backer escrow protection.');
      return;
    }
    const updated = milestones.filter((_, i) => i !== index).map((m, i) => ({
      ...m,
      order: i + 1,
    }));
    setMilestones(updated);
  };

  const handlePublish = () => {
    if (!connected || !publicKey) {
      setErrorMsg('Please connect your Solana wallet to publish.');
      return;
    }

    if (!name.trim()) {
      setErrorMsg('Project name is required.');
      return;
    }

    const norm = getNormalizedFounders();
    if (!norm.valid) {
      setErrorMsg(norm.error || 'Please fill in founder details correctly.');
      setValidationAttempted(true);
      return;
    }

    const solGoal = parseFloat(goalSol) || 100;
    const uniqueId = crypto.randomUUID();
    const createdAt = Date.now();

    const newProject: Project = {
      id: uniqueId,
      createdAt,
      name,
      tagline: tagline || 'Decentralized web3 project building on Solana Devnet',
      description: description || 'Next-generation project funded by community supporters on Solana Devnet.',
      category,
      logoUrl,
      bannerUrl,
      founderAddress: publicKey.toBase58(),
      treasuryAddress: publicKey.toBase58(),
      goalSol: solGoal,
      deadline,
      launchDate: 'Q4 2026',
      type,
      allocation: '10% Supply',
      status: 'live',
      websiteUrl: websiteUrl || 'https://solana.com',
      twitterUrl: twitterUrl || 'https://x.com',
      discordUrl: discordUrl || 'https://discord.com',
      milestones,
      founders: norm.founders,
      tokenomics: {
        tokenName: tokenName || `${name} Token`,
        tokenSymbol: tokenSymbol.toUpperCase() || 'TK',
        totalSupply: totalSupply || '100,000,000',
        backerTokensPerSol: parseFloat(backerTokensPerSol) || 1000,
        vestingNote: 'Quarterly milestone release tied to on-chain verified deliveries.',
        distribution: [
          { name: 'Public Crowdfund', percentage: 30, color: '#8b5cf6' },
          { name: 'Ecosystem & Staking', percentage: 35, color: '#ec4899' },
          { name: 'Core Contributors', percentage: 20, color: '#3b82f6' },
          { name: 'Treasury Reserve', percentage: 15, color: '#10b981' },
        ],
      },
    };

    try {
      saveProject(newProject);
      onProjectCreated?.();
      navigate(`/project/${newProject.id}`);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to save project. Local storage quota may be exceeded.');
    }
  };

  // Preview project object for Review & Publish step
  const previewFounders = getNormalizedFounders().founders;

  const previewProject: Project = {
    id: 'preview-project',
    createdAt: Date.now(),
    name: name.trim() || 'Untitled Project',
    tagline: tagline.trim() || 'Next-generation crypto venture building on Solana Devnet',
    description: description.trim() || 'Detailed project roadmap and milestone delivery.',
    category,
    logoUrl,
    bannerUrl,
    founderAddress: publicKey?.toBase58() || '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
    treasuryAddress: publicKey?.toBase58() || '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
    goalSol: parseFloat(goalSol) || 150,
    deadline,
    launchDate: 'Q4 2026',
    type,
    allocation: '10% Supply',
    status: 'live',
    websiteUrl: websiteUrl || 'https://solana.com',
    twitterUrl: twitterUrl || 'https://x.com',
    discordUrl: discordUrl || 'https://discord.com',
    milestones,
    founders: previewFounders,
    tokenomics: {
      tokenName: tokenName || `${name || 'Project'} Token`,
      tokenSymbol: tokenSymbol.toUpperCase() || 'TK',
      totalSupply: totalSupply || '100,000,000',
      backerTokensPerSol: parseFloat(backerTokensPerSol) || 1000,
      vestingNote: 'Quarterly milestone unlock on delivery.',
      distribution: [
        { name: 'Public Crowdfund', percentage: 30, color: '#8b5cf6' },
        { name: 'Ecosystem & Staking', percentage: 35, color: '#ec4899' },
        { name: 'Core Contributors', percentage: 20, color: '#3b82f6' },
        { name: 'Treasury Reserve', percentage: 15, color: '#10b981' },
      ],
    },
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-purple-400" />
          <span className="text-xs font-mono font-semibold uppercase tracking-wider text-purple-300">
            Founder Studio
          </span>
        </div>
        <h1 className="text-3xl font-extrabold text-white mt-1.5 tracking-tight">
          Create Crowdfund Campaign
        </h1>
        <p className="text-sm text-[#9b98ad] mt-1">
          Raise capital directly from community supporters with on-chain milestone escrow on Solana Devnet.
        </p>
      </div>

      {/* Step Progress Bar */}
      <div className="p-4 rounded-2xl glass-panel border border-white/10 bg-[#0d0a1b]">
        <div className="flex items-center justify-between">
          {[
            { num: 1, label: 'Basics' },
            { num: 2, label: 'Funding' },
            { num: 3, label: 'Roadmap' },
            { num: 4, label: 'Review' },
          ].map((s) => (
            <div key={s.num} className="flex items-center gap-2">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-mono font-bold transition-all ${
                  step === s.num
                    ? 'bg-purple-600 text-white shadow-[0_0_12px_rgba(168,85,247,0.5)]'
                    : step > s.num
                    ? 'bg-emerald-500 text-white'
                    : 'bg-white/10 text-white/40'
                }`}
              >
                {step > s.num ? '✓' : s.num}
              </div>
              <span className={`text-xs font-medium hidden sm:inline ${step === s.num ? 'text-white' : 'text-white/40'}`}>
                {s.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Wallet requirement warning */}
      {!connected && (
        <div className="p-4 rounded-2xl bg-amber-950/30 border border-amber-500/30 text-amber-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Wallet className="w-5 h-5 text-amber-400 flex-shrink-0" />
            <div>
              <strong className="block text-white">Wallet Connection Required</strong>
              Please connect your Solana wallet (Phantom or Solflare). Your connected address will be assigned as the campaign founder and treasury recipient.
            </div>
          </div>
          <button
            type="button"
            onClick={openWalletModal}
            className="px-4 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/40 font-semibold text-xs whitespace-nowrap cursor-pointer transition-colors flex-shrink-0 self-start sm:self-auto"
          >
            Connect Wallet
          </button>
        </div>
      )}

      {/* Step Forms */}
      <div className="p-6 sm:p-8 rounded-3xl glass-panel border border-white/10 bg-[#0e0c1d] space-y-6">
        {/* Step 1: Basics */}
        {step === 1 && (
          <div className="space-y-5">
            <h3 className="text-base font-bold text-white">1. Project Identity & Styling</h3>

            <div>
              <label className="block text-xs font-medium text-white/80 mb-1">Project Name *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. SolNova Protocol"
                className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/15 focus:border-purple-400 focus:outline-none text-white text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-white/80 mb-1">Tagline (One sentence pitch)</label>
              <input
                type="text"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                placeholder="e.g. Next-generation decentralized AI compute layer on Solana"
                className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/15 focus:border-purple-400 focus:outline-none text-white text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-white/80 mb-1">Detailed Description</label>
              <textarea
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Explain the vision, problem being solved, and how funds will be deployed..."
                className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/15 focus:border-purple-400 focus:outline-none text-white text-xs"
              />
            </div>

            {/* Project Banner Upload (3:1 aspect ratio) */}
            <div>
              <ImageUpload
                label="Project Banner"
                helperText="Recommended 1500x500px (3:1), PNG/JPG/WEBP, max 4MB"
                aspectRatio="3:1"
                maxSizeMB={4}
                maxWidth={1200}
                maxHeight={400}
                value={bannerUrl}
                onChange={setBannerUrl}
              />
            </div>

            {/* Logo Upload + Category Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 items-start pt-1">
              <div>
                <ImageUpload
                  label="Project Logo"
                  helperText="Square image recommended, PNG/JPG/WEBP, max 2MB"
                  aspectRatio="square"
                  maxSizeMB={2}
                  maxWidth={256}
                  maxHeight={256}
                  value={logoUrl}
                  onChange={setLogoUrl}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-white/80 mb-1.5">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#141029] border border-white/15 text-white text-xs focus:outline-none focus:border-purple-400 cursor-pointer"
                >
                  <option>Infrastructure & AI</option>
                  <option>Metaverse & Art</option>
                  <option>DeFi & Liquidity</option>
                  <option>Developer Tools</option>
                  <option>Gaming & Entertainment</option>
                </select>
                <p className="text-[11px] text-[#9b98ad] mt-2 leading-relaxed">
                  Select the primary category to help backers find your campaign in the discovery hub.
                </p>
              </div>
            </div>

            {/* Social links */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-white/10">
              <div>
                <label className="block text-xs font-medium text-white/70 mb-1">Website URL</label>
                <input
                  type="url"
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-purple-400"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-white/70 mb-1">X (Twitter) URL</label>
                <input
                  type="url"
                  value={twitterUrl}
                  onChange={(e) => setTwitterUrl(e.target.value)}
                  placeholder="https://x.com/..."
                  className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-purple-400"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-white/70 mb-1">Discord Invite URL</label>
                <input
                  type="url"
                  value={discordUrl}
                  onChange={(e) => setDiscordUrl(e.target.value)}
                  placeholder="https://discord.gg/..."
                  className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-purple-400"
                />
              </div>
            </div>

            {/* Founders / Team Section */}
            <div className="pt-4 border-t border-white/10 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-[#a78bfa]" />
                    <h4 className="text-sm font-bold text-white">Founders & Leadership Team</h4>
                  </div>
                  <p className="text-xs text-[#8d8a9c] mt-0.5">
                    Add the creators leading this project. At least one founder is required (up to 5).
                  </p>
                </div>
                {founders.length < 5 && (
                  <button
                    type="button"
                    onClick={addFounder}
                    className="px-3 py-1.5 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 border border-[#a78bfa]/40 text-xs font-semibold text-[#a78bfa] flex items-center gap-1.5 cursor-pointer transition-colors self-start sm:self-auto"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Founder ({founders.length}/5)</span>
                  </button>
                )}
              </div>

              {/* Founders Cards List */}
              <div className="space-y-4">
                {founders.map((f, idx) => {
                  const inlineErrors: { name?: string; linkedin?: string; website?: string } = {};
                  if (validationAttempted) {
                    if (!f.name.trim()) {
                      inlineErrors.name = 'Full name is required.';
                    } else if (f.name.trim().length > 50) {
                      inlineErrors.name = 'Name must be 50 characters or less.';
                    } else {
                      const isDup = founders.some(
                        (o, oIdx) => oIdx !== idx && o.name.trim().toLowerCase() === f.name.trim().toLowerCase()
                      );
                      if (isDup) {
                        inlineErrors.name = 'Duplicate founder name. Each founder must have a unique name.';
                      }
                    }

                    if (f.linkedin.trim() && !normalizeUrl(f.linkedin.trim())) {
                      inlineErrors.linkedin = 'Please enter a valid web URL (e.g. linkedin.com/in/username).';
                    }

                    if (f.website.trim() && !normalizeUrl(f.website.trim())) {
                      inlineErrors.website = 'Please enter a valid web URL (e.g. yoursite.com).';
                    }
                  }

                  return (
                    <div
                      key={f.id}
                      className="p-4 sm:p-5 rounded-2xl bg-[#16151f] border border-[#24222f] space-y-4"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-purple-500/20 text-[#a78bfa] text-xs font-mono font-bold flex items-center justify-center">
                            {idx + 1}
                          </span>
                          <span className="text-xs font-semibold text-white">Founder {idx + 1}</span>
                        </div>
                        {founders.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeFounder(f.id)}
                            className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1 cursor-pointer transition-colors p-1"
                            title="Remove founder"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Remove</span>
                          </button>
                        )}
                      </div>

                      <div className="flex flex-col sm:flex-row items-start gap-4">
                        {/* Profile picture upload: 1:1, max 2MB, 256x256, circular preview */}
                        <div className="shrink-0">
                          <ImageUpload
                            circular={true}
                            aspectRatio="square"
                            maxSizeMB={2}
                            maxWidth={256}
                            maxHeight={256}
                            value={f.avatar}
                            onChange={(dataUrl) => updateFounder(f.id, 'avatar', dataUrl)}
                            uploadButtonText="Photo"
                          />
                        </div>

                        {/* Name and Role inputs */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1 w-full">
                          <div>
                            <label className="block text-xs font-medium text-white/90 mb-1">
                              Full Name * <span className="text-[10px] text-[#8d8a9c]">(max 50)</span>
                            </label>
                            <input
                              type="text"
                              maxLength={50}
                              value={f.name}
                              onChange={(e) => updateFounder(f.id, 'name', e.target.value)}
                              placeholder="e.g. Alex Vance"
                              className={`w-full px-3 py-2 rounded-xl bg-white/5 border text-white text-xs focus:outline-none ${
                                inlineErrors.name ? 'border-rose-500/70 focus:border-rose-400' : 'border-white/10 focus:border-[#a78bfa]'
                              }`}
                            />
                            {inlineErrors.name && (
                              <div className="flex items-center gap-1 text-rose-400 text-[11px] mt-1">
                                <AlertCircle className="w-3 h-3 flex-shrink-0" />
                                <span>{inlineErrors.name}</span>
                              </div>
                            )}
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-white/90 mb-1">
                              Role / Title <span className="text-[10px] text-[#8d8a9c]">(max 40)</span>
                            </label>
                            <input
                              type="text"
                              maxLength={40}
                              value={f.role}
                              onChange={(e) => updateFounder(f.id, 'role', e.target.value)}
                              placeholder="e.g. Co-founder & CEO"
                              className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-[#a78bfa]"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Bio with counter */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-xs font-medium text-white/80">Short Bio</label>
                          <span className="text-[10px] text-[#8d8a9c] font-mono">
                            {f.bio.length}/160
                          </span>
                        </div>
                        <textarea
                          rows={2}
                          maxLength={160}
                          value={f.bio}
                          onChange={(e) => updateFounder(f.id, 'bio', e.target.value)}
                          placeholder="Brief founder background, achievements, or domain expertise..."
                          className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-[#a78bfa]"
                        />
                      </div>

                      {/* Socials with privacy hint */}
                      <div className="pt-2 border-t border-white/5 space-y-2">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                          <span className="text-[11px] font-semibold text-white/70">
                            Founder Social Links (Optional)
                          </span>
                          <span className="text-[10px] text-[#8d8a9c] italic">
                            Only share information you are comfortable making public.
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                          <div>
                            <label className="block text-[10px] text-[#8d8a9c] mb-0.5">X (Twitter) Handle / URL</label>
                            <input
                              type="text"
                              value={f.x}
                              onChange={(e) => updateFounder(f.id, 'x', e.target.value)}
                              placeholder="@username or https://x.com/..."
                              className="w-full px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-[#a78bfa]"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] text-[#8d8a9c] mb-0.5">LinkedIn Profile URL</label>
                            <input
                              type="text"
                              value={f.linkedin}
                              onChange={(e) => updateFounder(f.id, 'linkedin', e.target.value)}
                              placeholder="linkedin.com/in/username"
                              className={`w-full px-2.5 py-1.5 rounded-lg bg-white/5 border text-white text-xs focus:outline-none ${
                                inlineErrors.linkedin ? 'border-rose-500/70 focus:border-rose-400' : 'border-white/10 focus:border-[#a78bfa]'
                              }`}
                            />
                            {inlineErrors.linkedin && (
                              <div className="flex items-center gap-1 text-rose-400 text-[10px] mt-0.5">
                                <AlertCircle className="w-2.5 h-2.5 flex-shrink-0" />
                                <span>{inlineErrors.linkedin}</span>
                              </div>
                            )}
                          </div>

                          <div>
                            <label className="block text-[10px] text-[#8d8a9c] mb-0.5">GitHub Username / URL</label>
                            <input
                              type="text"
                              value={f.github}
                              onChange={(e) => updateFounder(f.id, 'github', e.target.value)}
                              placeholder="github.com/username"
                              className="w-full px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-[#a78bfa]"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] text-[#8d8a9c] mb-0.5">Telegram or Discord</label>
                            <input
                              type="text"
                              value={f.telegramOrDiscord}
                              onChange={(e) => updateFounder(f.id, 'telegramOrDiscord', e.target.value)}
                              placeholder="@handle or discord.gg/..."
                              className="w-full px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-[#a78bfa]"
                            />
                          </div>

                          <div className="sm:col-span-2 md:col-span-2">
                            <label className="block text-[10px] text-[#8d8a9c] mb-0.5">Personal Website</label>
                            <input
                              type="text"
                              value={f.website}
                              onChange={(e) => updateFounder(f.id, 'website', e.target.value)}
                              placeholder="https://..."
                              className={`w-full px-2.5 py-1.5 rounded-lg bg-white/5 border text-white text-xs focus:outline-none ${
                                inlineErrors.website ? 'border-rose-500/70 focus:border-rose-400' : 'border-white/10 focus:border-[#a78bfa]'
                              }`}
                            />
                            {inlineErrors.website && (
                              <div className="flex items-center gap-1 text-rose-400 text-[10px] mt-0.5">
                                <AlertCircle className="w-2.5 h-2.5 flex-shrink-0" />
                                <span>{inlineErrors.website}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Note under Founders block */}
              <p className="text-xs text-[#8d8a9c] pt-1">
                Founder details are provided by the project creator and are not verified by BACKR.
              </p>
            </div>
          </div>
        )}

        {/* Step 2: Funding */}
        {step === 2 && (
          <div className="space-y-4">
            <h3 className="text-base font-bold text-white">2. Funding Goal & Tokenomics</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-white/80 mb-1">Funding Target (SOL) *</label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    value={goalSol}
                    onChange={(e) => setGoalSol(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/15 focus:border-purple-400 focus:outline-none text-white text-xs font-mono"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-mono text-purple-300">
                    ◎ SOL
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-white/80 mb-1">Campaign Type</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as ProjectType)}
                  className="w-full px-3 py-2.5 rounded-xl bg-[#141029] border border-white/15 text-white text-xs focus:outline-none focus:border-purple-400 cursor-pointer"
                >
                  <option value="Crowdfund">Community Crowdfund</option>
                  <option value="IDO">Initial DEX Offering (IDO)</option>
                  <option value="Grant">Ecosystem Grant</option>
                  <option value="Incubation">Incubation Cohort</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-white/80 mb-1">Target Deadline</label>
                <input
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/15 focus:border-purple-400 focus:outline-none text-white text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-white/80 mb-1">Token Symbol (Ticker)</label>
                <input
                  type="text"
                  value={tokenSymbol}
                  onChange={(e) => setTokenSymbol(e.target.value.toUpperCase())}
                  placeholder="e.g. NOVA"
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/15 focus:border-purple-400 focus:outline-none text-white text-xs uppercase font-mono"
                />
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-purple-950/20 border border-purple-500/20 text-xs text-purple-200">
              💡 <strong>Devnet Treasury:</strong> Your connected wallet (
              <span className="font-mono text-white">{shortenAddress(publicKey?.toBase58()) || 'Not connected'}</span>
              ) will receive all pledges broadcast on Solana Devnet.
            </div>
          </div>
        )}

        {/* Step 3: Roadmap Milestones */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white">3. On-Chain Roadmap Milestones</h3>
                <p className="text-xs text-[#9b98ad]">Specify 2-5 progressive releases where funds unlock.</p>
              </div>
              <button
                type="button"
                onClick={addMilestone}
                disabled={milestones.length >= 5}
                className="px-3 py-1.5 rounded-xl bg-purple-600/30 hover:bg-purple-600/50 border border-purple-400/40 text-xs font-medium text-purple-200 flex items-center gap-1 cursor-pointer disabled:opacity-40"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Milestone</span>
              </button>
            </div>

            <div className="space-y-3">
              {milestones.map((m, idx) => (
                <div key={m.id} className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-semibold text-purple-300">
                      Phase {m.order}
                    </span>
                    {milestones.length > 2 && (
                      <button
                        type="button"
                        onClick={() => removeMilestone(idx)}
                        className="text-white/40 hover:text-rose-400 p-1 transition-colors cursor-pointer"
                        title="Remove milestone"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      type="text"
                      value={m.title}
                      onChange={(e) => {
                        const copy = [...milestones];
                        copy[idx].title = e.target.value;
                        setMilestones(copy);
                      }}
                      placeholder="Milestone Title"
                      className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-purple-400"
                    />

                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={m.unlockSol}
                        onChange={(e) => {
                          const copy = [...milestones];
                          copy[idx].unlockSol = parseFloat(e.target.value) || 0;
                          setMilestones(copy);
                        }}
                        placeholder="Unlock SOL"
                        className="w-1/2 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs font-mono focus:outline-none focus:border-purple-400"
                      />
                      <input
                        type="text"
                        value={m.targetDate}
                        onChange={(e) => {
                          const copy = [...milestones];
                          copy[idx].targetDate = e.target.value;
                          setMilestones(copy);
                        }}
                        placeholder="e.g. Q3 2026"
                        className="w-1/2 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-purple-400"
                      />
                    </div>
                  </div>

                  <textarea
                    rows={2}
                    value={m.description}
                    onChange={(e) => {
                      const copy = [...milestones];
                      copy[idx].description = e.target.value;
                      setMilestones(copy);
                    }}
                    placeholder="Milestone deliverables and proof requirements..."
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-purple-400"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 4: Review with Live Card Preview */}
        {step === 4 && (
          <div className="space-y-6">
            <div>
              <h3 className="text-base font-bold text-white">4. Review & Deploy to BACKR</h3>
              <p className="text-xs text-[#9b98ad] mt-0.5">
                Here is how your campaign will appear to supporters across the platform:
              </p>
            </div>

            {/* Live card preview identical to final project card */}
            <div className="flex justify-center py-2">
              <div className="w-full max-w-sm">
                <ProjectCard project={previewProject} isCenter={true} showProgress={true} />
              </div>
            </div>

            {/* Live Founders Section Preview */}
            {previewProject.founders && previewProject.founders.length > 0 && (
              <div className="pt-2 border-t border-white/10">
                <FoundersSection founders={previewProject.founders} />
              </div>
            )}

            {/* Key parameters summary */}
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3 text-xs">
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <span className="text-[#9b98ad] block">Target Goal:</span>
                  <span className="font-semibold text-white font-mono">{goalSol} ◎ SOL</span>
                </div>
                <div>
                  <span className="text-[#9b98ad] block">Type:</span>
                  <span className="font-semibold text-white">{type}</span>
                </div>
                <div>
                  <span className="text-[#9b98ad] block">Milestones:</span>
                  <span className="font-semibold text-white">{milestones.length} Phases</span>
                </div>
              </div>

              <div className="pt-2 border-t border-white/10 text-[#9b98ad] flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <span>Founder & Treasury Address:</span>
                <span className="font-mono text-purple-300">
                  {publicKey ? shortenAddress(publicKey.toBase58(), 6) : 'No wallet connected'}
                </span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-500/20 text-xs text-emerald-200 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>Ready to launch! The campaign will be publicly listed and ready for Solana Devnet backers.</span>
            </div>
          </div>
        )}

        {/* Error message */}
        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between pt-4 border-t border-white/10">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => {
                setErrorMsg(null);
                setStep((prev) => (prev - 1) as 1 | 2 | 3 | 4);
              }}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-white/70 hover:text-white bg-white/5 border border-white/10 flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>
          ) : <div />}

          {step < 4 ? (
            <button
              type="button"
              onClick={() => {
                setErrorMsg(null);
                if (step === 1) {
                  if (!name.trim()) {
                    setErrorMsg('Please enter a project name.');
                    return;
                  }
                  const norm = getNormalizedFounders();
                  if (!norm.valid) {
                    setErrorMsg(norm.error || 'Please provide at least one founder with a valid name.');
                    setValidationAttempted(true);
                    return;
                  }
                }
                setStep((prev) => (prev + 1) as 1 | 2 | 3 | 4);
              }}
              className="px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-purple-600 hover:bg-purple-500 flex items-center gap-1.5 cursor-pointer shadow-lg shadow-purple-600/30 ml-auto"
            >
              <span>Next</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handlePublish}
              disabled={!connected}
              className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-400 hover:to-indigo-400 flex items-center gap-1.5 cursor-pointer shadow-lg shadow-purple-600/40 ml-auto disabled:opacity-50"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Publish Campaign</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
