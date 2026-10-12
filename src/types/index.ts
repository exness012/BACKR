export type ProjectType = 'Crowdfund' | 'IDO' | 'Grant' | 'Incubation';
export type ProjectStatus = 'live' | 'funded' | 'upcoming';
export type MilestoneStatus = 'upcoming' | 'in_progress' | 'completed';

export interface Milestone {
  id: string;
  order: number;
  title: string;
  description: string;
  targetDate: string;
  unlockSol: number;
  status: MilestoneStatus;
  txSignature?: string;
  completedAt?: string;
  proofNote?: string;
}

export interface TokenDistribution {
  name: string;
  percentage: number;
  color: string;
}

export interface FounderSocials {
  x?: string;
  linkedin?: string;
  github?: string;
  telegram?: string;
  discord?: string;
  website?: string;
}

export interface Founder {
  id: string;
  name: string;
  role?: string;
  bio?: string;
  avatar?: string;
  socials?: FounderSocials;
}

export interface Tokenomics {
  tokenName: string;
  tokenSymbol: string;
  totalSupply: string;
  backerTokensPerSol: number;
  vestingNote: string;
  distribution: TokenDistribution[];
}

export interface Project {
  id: string;
  createdAt: number;
  name: string;
  tagline: string;
  description: string;
  category: string;
  logoUrl?: string;
  bannerUrl?: string;
  founderAddress: string;
  treasuryAddress: string;
  goalSol: number;
  raisedSol?: number;
  backerCount?: number;
  deadline: string;
  launchDate: string;
  type: ProjectType;
  allocation: string;
  status: ProjectStatus;
  websiteUrl: string;
  twitterUrl: string;
  discordUrl: string;
  milestones: Milestone[];
  tokenomics: Tokenomics;
  founders?: Founder[];
  problemSolution?: {
    problem: string;
    solution: string;
  };
  team?: {
    name: string;
    role: string;
    avatar: string;
  }[];
}

export interface LedgerEntry {
  signature: string;
  slot?: number;
  timestamp: number;
  fromAddress: string;
  toAddress: string;
  amountSol: number;
  type: 'contribution' | 'milestone' | 'transfer';
  memo?: string;
  projectId?: string;
  projectName?: string;
  status?: 'confirmed' | 'finalized';
}

export interface TrustScoreBreakdown {
  overallScore: number;
  roadmapDeliveryScore: number;
  treasuryTransparencyScore: number;
  backerCommunityScore: number;
  activityScore: number;
  ratingLabel: string;
}
