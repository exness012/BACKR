export interface DocHeading {
  id: string;
  title: string;
  level: 2 | 3;
}

export type DocBlock =
  | { type: 'paragraph'; text: string }
  | { type: 'heading'; level: 2 | 3; id: string; text: string }
  | { type: 'callout'; variant: 'note' | 'tip' | 'warning' | 'devnet'; title?: string; text: string }
  | { type: 'code'; language: string; code: string; label?: string }
  | { type: 'steps'; items: { step: number; title: string; description: string; detail?: string }[] }
  | { type: 'table'; headers: string[]; rows: string[][] }
  | { type: 'list'; items: string[] };

export interface DocPage {
  slug: string;
  title: string;
  section: string;
  sectionTitle: string;
  description: string;
  lastUpdated: string;
  headings: DocHeading[];
  blocks: DocBlock[];
}

export interface DocSectionMeta {
  id: string;
  title: string;
  slugs: string[];
}

export const DOC_SECTIONS: DocSectionMeta[] = [
  {
    id: 'getting-started',
    title: 'Getting started',
    slugs: ['introduction', 'quickstart', 'wallets-and-devnet'],
  },
  {
    id: 'for-supporters',
    title: 'For supporters',
    slugs: ['backing-a-project', 'reading-the-ledger', 'verifying-milestones'],
  },
  {
    id: 'for-founders',
    title: 'For founders',
    slugs: ['creating-a-project', 'roadmap-and-milestones', 'publishing-milestone-proof'],
  },
  {
    id: 'for-investors',
    title: 'For investors',
    slugs: ['evaluating-a-project', 'tokenomics'],
  },
  {
    id: 'how-it-works',
    title: 'How it works',
    slugs: ['the-transparent-ledger', 'memo-format', 'funding-model'],
  },
  {
    id: 'trust-and-security',
    title: 'Trust and security',
    slugs: ['custody-and-risks', 'roadmap'],
  },
  {
    id: 'help',
    title: 'Help',
    slugs: ['troubleshooting', 'glossary'],
  },
];

export const DOC_PAGES: Record<string, DocPage> = {
  introduction: {
    slug: 'introduction',
    title: 'Introduction to BACKR',
    section: 'getting-started',
    sectionTitle: 'Getting started',
    description: 'A transparent, milestone-governed crypto crowdfunding platform powered by Solana Devnet.',
    lastUpdated: 'October 2026',
    headings: [
      { id: 'what-is-backr', title: 'What is BACKR?', level: 2 },
      { id: 'the-three-sides', title: 'The Three Sides of the Platform', level: 2 },
      { id: 'why-solana', title: 'Why Solana Devnet?', level: 2 },
    ],
    blocks: [
      {
        type: 'callout',
        variant: 'devnet',
        title: 'Demo Environment Notice',
        text: 'BACKR is currently deployed as a demonstration application on Solana Devnet. All contributions, tokens, and balances use test SOL with no real financial value.',
      },
      {
        type: 'heading',
        level: 2,
        id: 'what-is-backr',
        text: 'What is BACKR?',
      },
      {
        type: 'paragraph',
        text: 'BACKR bridges visionary crypto founders and an impassioned community of backers through transparent on-chain crowdfunding. Unlike legacy crowdfunding websites that rely on opaque bank rails and unverified promises, BACKR records every backer pledge and founder milestone directly to the Solana blockchain.',
      },
      {
        type: 'paragraph',
        text: 'Each transaction embeds structured SPL Memo program instructions directly on-chain. This ensures that funding histories, backer counts, and milestone delivery proofs can be audited independently by anyone using Solana Explorer.',
      },
      {
        type: 'heading',
        level: 2,
        id: 'the-three-sides',
        text: 'The Three Sides of the Platform',
      },
      {
        type: 'paragraph',
        text: 'BACKR connects three distinct participants in the early-stage Web3 ecosystem:',
      },
      {
        type: 'list',
        items: [
          'Founders: Visionary builders who create campaigns, set roadmaps, and publish cryptographically signed delivery proofs for each milestone.',
          'Supporters: Community enthusiasts who pledge devnet SOL to back high-potential ideas and verify roadmap progress in real time.',
          'Investors & Analysts: Observers who evaluate on-chain velocity, unique supporter counts, and founder accountability through public ledger records.',
        ],
      },
      {
        type: 'heading',
        level: 2,
        id: 'why-solana',
        text: 'Why Solana Devnet?',
      },
      {
        type: 'paragraph',
        text: 'Solana provides sub-second transaction finality and negligible transaction costs. By pairing standard SOL transfers with the native SPL Memo Program (MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr), BACKR attaches immutable JSON metadata to each transfer without requiring complex or unverified custom smart contracts.',
      },
      {
        type: 'callout',
        variant: 'tip',
        title: 'Next Step',
        text: 'Check out the Quickstart guide to connect your Phantom or Solflare wallet and make your first demonstration pledge.',
      },
    ],
  },

  quickstart: {
    slug: 'quickstart',
    title: 'Quickstart Guide',
    section: 'getting-started',
    sectionTitle: 'Getting started',
    description: 'Get started backing campaigns on Solana Devnet in under two minutes.',
    lastUpdated: 'October 2026',
    headings: [
      { id: 'step-by-step', title: 'Step-by-Step Walkthrough', level: 2 },
      { id: 'next-steps', title: 'Next Steps', level: 2 },
    ],
    blocks: [
      {
        type: 'heading',
        level: 2,
        id: 'step-by-step',
        text: 'Step-by-Step Walkthrough',
      },
      {
        type: 'steps',
        items: [
          {
            step: 1,
            title: 'Install a Solana Wallet',
            description: 'Install the Phantom or Solflare browser extension for Chrome, Brave, or Firefox.',
            detail: 'Ensure you securely back up your seed phrase during installation.',
          },
          {
            step: 2,
            title: 'Switch Wallet to Solana Devnet',
            description: 'Open your wallet settings, navigate to Developer Settings or Network Selection, and switch from Mainnet-Beta to Solana Devnet.',
            detail: 'BACKR exclusively interacts with the Devnet cluster to protect your real assets.',
          },
          {
            step: 3,
            title: 'Connect Wallet to BACKR',
            description: 'Click "Connect Wallet" in the BACKR top navigation bar and select your wallet provider.',
          },
          {
            step: 4,
            title: 'Obtain Test Devnet SOL',
            description: 'Open the connected wallet dropdown in the navbar and click the Devnet Faucet link, or request free SOL directly from faucet.solana.com.',
          },
          {
            step: 5,
            title: 'Select a Campaign and Pledge',
            description: 'Navigate to Projects, open any active campaign, choose a pledge amount (e.g. 0.5 SOL), and click "Back this project".',
          },
          {
            step: 6,
            title: 'Verify in the Transparent Ledger',
            description: 'Once confirmed, open the on-chain Ledger tab. Your transaction signature, pledge amount, and formatted memo are displayed immediately.',
          },
        ],
      },
      {
        type: 'heading',
        level: 2,
        id: 'next-steps',
        text: 'Next Steps',
      },
      {
        type: 'callout',
        variant: 'note',
        title: 'Verifying on Solana Explorer',
        text: 'Every transaction signature in BACKR is a clickable link leading directly to the official Solana Explorer on Devnet cluster.',
      },
    ],
  },

  'wallets-and-devnet': {
    slug: 'wallets-and-devnet',
    title: 'Wallets & Devnet Setup',
    section: 'getting-started',
    sectionTitle: 'Getting started',
    description: 'How to configure Phantom and Solflare for Solana Devnet and claim test SOL.',
    lastUpdated: 'October 2026',
    headings: [
      { id: 'phantom-setup', title: 'Configuring Phantom Wallet', level: 2 },
      { id: 'solflare-setup', title: 'Configuring Solflare Wallet', level: 2 },
      { id: 'getting-devnet-sol', title: 'Getting Free Devnet SOL', level: 2 },
      { id: 'rate-limits', title: 'Handling Faucet Rate Limits', level: 2 },
    ],
    blocks: [
      {
        type: 'heading',
        level: 2,
        id: 'phantom-setup',
        text: 'Configuring Phantom Wallet',
      },
      {
        type: 'paragraph',
        text: 'To use Phantom with BACKR, enable Developer Mode and switch the active network to Solana Devnet:',
      },
      {
        type: 'steps',
        items: [
          {
            step: 1,
            title: 'Open Settings',
            description: 'Click the gear icon in the bottom-right corner of the Phantom extension window.',
          },
          {
            step: 2,
            title: 'Open Developer Settings',
            description: 'Scroll down and click "Developer Settings".',
          },
          {
            step: 3,
            title: 'Toggle Testnet Mode',
            description: 'Enable "Testnet Mode" and ensure the selected network is set to "Solana Devnet".',
          },
        ],
      },
      {
        type: 'heading',
        level: 2,
        id: 'solflare-setup',
        text: 'Configuring Solflare Wallet',
      },
      {
        type: 'paragraph',
        text: 'In Solflare, click the gear icon (Settings) -> "General" -> "Network" -> Select "Devnet". Your wallet balance will automatically switch to reflect your devnet address.',
      },
      {
        type: 'heading',
        level: 2,
        id: 'getting-devnet-sol',
        text: 'Getting Free Devnet SOL',
      },
      {
        type: 'paragraph',
        text: 'Devnet SOL is purely simulated token currency used for protocol testing. You can fund your address through the following verified methods:',
      },
      {
        type: 'list',
        items: [
          'Official Solana Faucet: Visit https://faucet.solana.com, paste your public key, and request 1.0 SOL.',
          'Solana CLI: If you have the solana command-line tools installed, run: solana airdrop 1 <YOUR_ADDRESS> --url devnet',
          'BACKR Banner: Click the "Solana Faucet" link in the top announcement banner on any page.',
        ],
      },
      {
        type: 'heading',
        level: 2,
        id: 'rate-limits',
        text: 'Handling Faucet Rate Limits',
      },
      {
        type: 'callout',
        variant: 'warning',
        title: 'Faucet 429 Rate Limits',
        text: 'Public Solana faucets limit requests to approximately 1-2 SOL per IP address per hour. If you receive an HTTP 429 or "airdrop limit reached" message, wait 15 minutes or connect through a mobile hotspot before requesting additional test SOL.',
      },
    ],
  },

  'backing-a-project': {
    slug: 'backing-a-project',
    title: 'Backing a Campaign',
    section: 'for-supporters',
    sectionTitle: 'For supporters',
    description: 'How pledging works, memo tagging, and verifying wallet approvals.',
    lastUpdated: 'October 2026',
    headings: [
      { id: 'how-pledging-works', title: 'How Pledging Works', level: 2 },
      { id: 'wallet-approval', title: 'What Your Wallet Prompts', level: 2 },
      { id: 'confirmation-flow', title: 'Confirmation and Receipt', level: 2 },
    ],
    blocks: [
      {
        type: 'heading',
        level: 2,
        id: 'how-pledging-works',
        text: 'How Pledging Works',
      },
      {
        type: 'paragraph',
        text: 'When you back a campaign on BACKR, you transfer Devnet SOL directly to the project’s designated treasury address while concurrently publishing an on-chain SPL Memo instruction.',
      },
      {
        type: 'paragraph',
        text: 'Use the quick amount chips (0.1, 0.5, 1.0, 2.0 SOL) or enter a custom amount. BACKR enforces a self-funding guard: if you are connected with the founder’s wallet address, self-pledges are disabled to prevent skewed backer metrics.',
      },
      {
        type: 'heading',
        level: 2,
        id: 'wallet-approval',
        text: 'What Your Wallet Prompts',
      },
      {
        type: 'paragraph',
        text: 'When you click "Back this project", your wallet displays a single transaction approval request containing two atomic instructions:',
      },
      {
        type: 'list',
        items: [
          'Instruction 1: SystemProgram.transfer — sends the specified SOL amount from your wallet to the project treasury.',
          'Instruction 2: MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr — embeds strict JSON metadata with the matching project ID.',
        ],
      },
      {
        type: 'heading',
        level: 2,
        id: 'confirmation-flow',
        text: 'Confirmation and Receipt',
      },
      {
        type: 'paragraph',
        text: 'Once approved, the transaction is broadcast to Solana Devnet and achieves confirmed finality in under 800 milliseconds. A celebratory burst confirms the pledge, your wallet balance updates, and the contribution is immediately indexed in the campaign ledger.',
      },
      {
        type: 'callout',
        variant: 'tip',
        title: 'Explorer Verification',
        text: 'Click the transaction signature link on the confirmation toast to inspect the raw instructions and balance change on Solana Explorer.',
      },
    ],
  },

  'reading-the-ledger': {
    slug: 'reading-the-ledger',
    title: 'Reading the Ledger',
    section: 'for-supporters',
    sectionTitle: 'For supporters',
    description: 'Navigate the transparent on-chain audit log on Solana Devnet.',
    lastUpdated: 'October 2026',
    headings: [
      { id: 'ledger-columns', title: 'Ledger Columns & Meanings', level: 2 },
      { id: 'filtering', title: 'Filtering by Transaction Type', level: 2 },
      { id: 'explorer-links', title: 'Inspecting Solana Explorer Traces', level: 2 },
    ],
    blocks: [
      {
        type: 'heading',
        level: 2,
        id: 'ledger-columns',
        text: 'Ledger Columns & Meanings',
      },
      {
        type: 'paragraph',
        text: 'The Global On-Chain Funding Ledger displays real-time contribution rows and founder milestone verifications:',
      },
      {
        type: 'table',
        headers: ['Column', 'Description', 'Sample Value'],
        rows: [
          ['Time', 'Relative or timestamp of block finality', '2 mins ago'],
          ['Type', 'Pledge contribution or milestone proof', 'Contribution / Milestone'],
          ['Supporter / Signer', 'Base58 public key of the sending wallet', '7xKp…9qRt'],
          ['Amount (SOL)', 'Net lamports transferred to the project treasury', '1.500 ◎'],
          ['Project / Memo', 'Project identifier and title embedded in memo', 'Project Alpha (#p-101)'],
          ['Signature', 'Solana transaction signature hash', '5hRt…3xZp'],
        ],
      },
      {
        type: 'heading',
        level: 2,
        id: 'filtering',
        text: 'Filtering by Transaction Type',
      },
      {
        type: 'paragraph',
        text: 'Use the filter pills at the top of the table to isolate "All Entries", "Contributions Only", or "Milestones Only". On campaign detail pages, the ledger table is scoped specifically to that project ID.',
      },
      {
        type: 'heading',
        level: 2,
        id: 'explorer-links',
        text: 'Inspecting Solana Explorer Traces',
      },
      {
        type: 'paragraph',
        text: 'Every row includes an external link icon. Clicking it opens the transaction signature on explorer.solana.com with the cluster query set to devnet. You can inspect the signature status, slot, block time, and instruction log.',
      },
    ],
  },

  'verifying-milestones': {
    slug: 'verifying-milestones',
    title: 'Verifying Milestones',
    section: 'for-supporters',
    sectionTitle: 'For supporters',
    description: 'Understand proof of delivery badges and check memo transactions.',
    lastUpdated: 'October 2026',
    headings: [
      { id: 'what-is-a-milestone-proof', title: 'What is a Milestone Proof?', level: 2 },
      { id: 'checking-memo', title: 'Verifying the Memo Proof', level: 2 },
      { id: 'status-states', title: 'Milestone Status Indicators', level: 2 },
    ],
    blocks: [
      {
        type: 'heading',
        level: 2,
        id: 'what-is-a-milestone-proof',
        text: 'What is a Milestone Proof?',
      },
      {
        type: 'paragraph',
        text: 'Unlike platforms where funds are handed over blindly, BACKR structures project roadmaps into verifiable milestones. When a founder achieves a milestone, they broadcast a signed memo from the designated founder wallet documenting the deliverable.',
      },
      {
        type: 'heading',
        level: 2,
        id: 'checking-memo',
        text: 'Verifying the Memo Proof',
      },
      {
        type: 'paragraph',
        text: 'A completed milestone displays a purple "Verified On-Chain" badge. Clicking the badge displays the transaction hash, the exact block time, and the proof link or description supplied by the founder.',
      },
      {
        type: 'callout',
        variant: 'note',
        title: 'Cryptographic Authenticity',
        text: 'Only transactions signed by the exact founder wallet registered during project creation can mark a milestone as completed.',
      },
      {
        type: 'heading',
        level: 2,
        id: 'status-states',
        text: 'Milestone Status Indicators',
      },
      {
        type: 'list',
        items: [
          'Completed: Signed proof broadcasted and confirmed on Solana Devnet.',
          'In Progress: Currently active milestone being developed by the team.',
          'Upcoming: Future roadmap deliverable scheduled for subsequent tranches.',
        ],
      },
    ],
  },

  'creating-a-project': {
    slug: 'creating-a-project',
    title: 'Creating a Campaign',
    section: 'for-founders',
    sectionTitle: 'For founders',
    description: 'Launch your Web3 project with milestone governance in four simple steps.',
    lastUpdated: 'October 2026',
    headings: [
      { id: 'creation-steps', title: 'The 4-Step Creation Flow', level: 2 },
      { id: 'founders-team', title: 'Founders & Leadership Team', level: 2 },
      { id: 'media-requirements', title: 'Media & Upload Guidelines', level: 2 },
      { id: 'treasury-assignment', title: 'Founder & Treasury Wallets', level: 2 },
    ],
    blocks: [
      {
        type: 'heading',
        level: 2,
        id: 'creation-steps',
        text: 'The 4-Step Creation Flow',
      },
      {
        type: 'steps',
        items: [
          {
            step: 1,
            title: 'Basics & Identity',
            description: 'Enter your project name, one-sentence tagline, rich description, primary category, project socials, and founder profiles (at least one founder required, up to 5).',
          },
          {
            step: 2,
            title: 'Funding Goal & Tokenomics',
            description: 'Define your target SOL funding goal, campaign deadline date, and optional token distribution preview parameters.',
          },
          {
            step: 3,
            title: 'Milestone Roadmap',
            description: 'Configure 2 to 5 development milestones, assigning target delivery dates and target SOL amounts per tranche.',
          },
          {
            step: 4,
            title: 'Review & Publish',
            description: 'Preview your live campaign card and publish your project to the BACKR decentralized directory.',
          },
        ],
      },
      {
        type: 'heading',
        level: 2,
        id: 'founders-team',
        text: 'Founders & Leadership Team',
      },
      {
        type: 'paragraph',
        text: 'During Step 1, creators can add up to 5 founders who lead the initiative. At least one named founder is required to launch a campaign.',
      },
      {
        type: 'list',
        items: [
          'Full Name: Required (max 50 characters). Each founder in the project must have a unique name.',
          'Role / Title: Optional (max 40 characters, e.g. Co-founder & CEO, Technical Lead).',
          'Short Bio: Optional (max 160 characters). A concise summary of prior experience and domain background.',
          'Social Links: Optional X (Twitter), LinkedIn, GitHub, Telegram or Discord, and personal website links. Handles and URLs are automatically normalized and validated.',
          'Profile Picture: Optional upload (square 1:1, max 2MB, PNG/JPG/WEBP). If omitted, a unique deterministic vector avatar is automatically generated from the founder ID and name.',
        ],
      },
      {
        type: 'callout',
        variant: 'note',
        title: 'Founder Verification Disclosure',
        text: 'Founder details are self-reported by the project creator and are not verified by BACKR. Only share information you are comfortable making public.',
      },
      {
        type: 'heading',
        level: 2,
        id: 'media-requirements',
        text: 'Media & Upload Guidelines',
      },
      {
        type: 'paragraph',
        text: 'To ensure fast loading and crisp visuals across high-DPI displays, adhere to the following specifications:',
      },
      {
        type: 'table',
        headers: ['Asset', 'Max File Size', 'Recommended Dimensions', 'Supported Formats'],
        rows: [
          ['Project Logo', '2 MB', '400 × 400 px (1:1 ratio)', 'PNG, JPG, WEBP'],
          ['Cover Banner', '4 MB', '1200 × 600 px (2:1 ratio)', 'PNG, JPG, WEBP'],
          ['Founder Profile Photo', '2 MB', '256 × 256 px (1:1 ratio)', 'PNG, JPG, WEBP'],
        ],
      },
      {
        type: 'heading',
        level: 2,
        id: 'treasury-assignment',
        text: 'Founder & Treasury Wallets',
      },
      {
        type: 'callout',
        variant: 'devnet',
        title: 'Automatic Wallet Assignment',
        text: 'Your currently connected Solana wallet address automatically becomes the registered founder wallet and project treasury address for receiving pledges.',
      },
    ],
  },

  'roadmap-and-milestones': {
    slug: 'roadmap-and-milestones',
    title: 'Roadmap & Milestones',
    section: 'for-founders',
    sectionTitle: 'For founders',
    description: 'Best practices for setting funding tranches and delivery criteria.',
    lastUpdated: 'October 2026',
    headings: [
      { id: 'structuring-milestones', title: 'Structuring Milestones', level: 2 },
      { id: 'tranche-allocation', title: 'Allocating Funding Tranches', level: 2 },
      { id: 'verifiable-deliverables', title: 'Writing Verifiable Deliverables', level: 2 },
    ],
    blocks: [
      {
        type: 'heading',
        level: 2,
        id: 'structuring-milestones',
        text: 'Structuring Milestones',
      },
      {
        type: 'paragraph',
        text: 'Supporters evaluate campaigns largely by roadmap clarity. Break large goals into measurable, sequential technical stages (e.g., smart contract testnet deployment, audited SDK release, public alpha launch).',
      },
      {
        type: 'heading',
        level: 2,
        id: 'tranche-allocation',
        text: 'Allocating Funding Tranches',
      },
      {
        type: 'paragraph',
        text: 'Each milestone specifies an unlock SOL allocation. The sum of all milestone allocations should logically align with your total funding goal.',
      },
      {
        type: 'heading',
        level: 2,
        id: 'verifiable-deliverables',
        text: 'Writing Verifiable Deliverables',
      },
      {
        type: 'callout',
        variant: 'tip',
        title: 'Verifiable Proof Guidelines',
        text: 'Good milestone proofs reference public, verifiable artifacts: GitHub commit releases, live testnet demo URLs, or audited contract addresses.',
      },
    ],
  },

  'publishing-milestone-proof': {
    slug: 'publishing-milestone-proof',
    title: 'Publishing Milestone Proof',
    section: 'for-founders',
    sectionTitle: 'For founders',
    description: 'Broadcast cryptographic proofs directly to Solana Devnet.',
    lastUpdated: 'October 2026',
    headings: [
      { id: 'how-to-publish', title: 'Publishing a Proof', level: 2 },
      { id: 'on-chain-memo', title: 'On-Chain Proof Payload', level: 2 },
    ],
    blocks: [
      {
        type: 'heading',
        level: 2,
        id: 'how-to-publish',
        text: 'Publishing a Proof',
      },
      {
        type: 'paragraph',
        text: 'When connected with your registered founder wallet, active milestones display a "Mark milestone complete" button on the project detail roadmap tab.',
      },
      {
        type: 'steps',
        items: [
          {
            step: 1,
            title: 'Open Milestone Verification Modal',
            description: 'Click "Mark milestone complete" on the active milestone row.',
          },
          {
            step: 2,
            title: 'Enter Proof Notes & Artifacts',
            description: 'Provide a brief summary and URL link to the completed deliverable (e.g. GitHub release tag or smart contract explorer trace).',
          },
          {
            step: 3,
            title: 'Sign Memo Transaction',
            description: 'Approve the zero-SOL memo transaction in your wallet. The transaction publishes the structured milestone proof to Solana Devnet.',
          },
        ],
      },
      {
        type: 'heading',
        level: 2,
        id: 'on-chain-memo',
        text: 'On-Chain Proof Payload',
      },
      {
        type: 'code',
        language: 'json',
        label: 'Milestone Memo Schema',
        code: `{\n  "app": "backr",\n  "type": "milestone",\n  "project": "<project-id>",\n  "milestoneId": "<milestone-id>",\n  "milestone": 1,\n  "proof": "<url-or-deliverable-note>",\n  "verifiedAt": 1791730000000\n}`,
      },
    ],
  },

  'evaluating-a-project': {
    slug: 'evaluating-a-project',
    title: 'Evaluating Campaigns',
    section: 'for-investors',
    sectionTitle: 'For investors',
    description: 'Key on-chain metrics, founder accountability, and roadmap velocity.',
    lastUpdated: 'October 2026',
    headings: [
      { id: 'core-metrics', title: 'Key On-Chain Metrics', level: 2 },
      { id: 'roadmap-velocity', title: 'Roadmap Velocity & Delivery', level: 2 },
      { id: 'red-flags', title: 'Due Diligence Checks', level: 2 },
    ],
    blocks: [
      {
        type: 'heading',
        level: 2,
        id: 'core-metrics',
        text: 'Key On-Chain Metrics',
      },
      {
        type: 'paragraph',
        text: 'When evaluating early-stage campaigns on BACKR, look beyond promotional pitch copy to examine objective on-chain evidence:',
      },
      {
        type: 'list',
        items: [
          'Unique Supporters: Check the count of unique sender wallets rather than just aggregate SOL. A campaign backed by 40 distinct wallets reflects broader community conviction than one backed by a single large wallet.',
          'Milestone Velocity: Review the percentage of milestones marked complete with verified on-chain proofs.',
          'Treasury Transparency: Verify that incoming contributions match ledger rows on Solana Explorer.',
        ],
      },
      {
        type: 'heading',
        level: 2,
        id: 'roadmap-velocity',
        text: 'Roadmap Velocity & Delivery',
      },
      {
        type: 'paragraph',
        text: 'Examine past milestone timestamps to evaluate if the team delivers on schedule. Verified milestone proofs can be inspected directly on Solana Explorer.',
      },
      {
        type: 'heading',
        level: 2,
        id: 'red-flags',
        text: 'Due Diligence Checks',
      },
      {
        type: 'callout',
        variant: 'warning',
        title: 'Informational Due Diligence',
        text: 'BACKR is an informational tracking platform. Always perform independent due diligence before backing any crypto project.',
      },
    ],
  },

  tokenomics: {
    slug: 'tokenomics',
    title: 'Tokenomics & Allocation',
    section: 'for-investors',
    sectionTitle: 'For investors',
    description: 'Understand distribution charts and testnet token preview parameters.',
    lastUpdated: 'October 2026',
    headings: [
      { id: 'tokenomics-breakdown', title: 'Allocation Breakdown', level: 2 },
      { id: 'simulation-notice', title: 'Illustrative Token Preview Notice', level: 2 },
    ],
    blocks: [
      {
        type: 'heading',
        level: 2,
        id: 'tokenomics-breakdown',
        text: 'Allocation Breakdown',
      },
      {
        type: 'paragraph',
        text: 'Campaigns on BACKR record proposed token distribution parameters configured during project creation, including Community/Backers, Team, Ecosystem, Liquidity, and Foundation allocations.',
      },
      {
        type: 'heading',
        level: 2,
        id: 'simulation-notice',
        text: 'Illustrative Token Preview Notice',
      },
      {
        type: 'callout',
        variant: 'note',
        title: 'No Real Tokens Minted',
        text: 'The token parameters and supporter distribution schedules displayed in BACKR are illustrative simulations for planning purposes. In this Devnet demonstration, no real SPL tokens are minted or distributed.',
      },
    ],
  },

  'the-transparent-ledger': {
    slug: 'the-transparent-ledger',
    title: 'The Transparent Ledger',
    section: 'how-it-works',
    sectionTitle: 'How it works',
    description: 'How BACKR reads directly from Solana Devnet with zero off-chain manipulation.',
    lastUpdated: 'October 2026',
    headings: [
      { id: 'strict-counting-rules', title: 'Strict Contribution Counting Rules', level: 2 },
      { id: 'zero-storage-reliance', title: 'Zero Off-Chain Reliance', level: 2 },
    ],
    blocks: [
      {
        type: 'heading',
        level: 2,
        id: 'strict-counting-rules',
        text: 'Strict Contribution Counting Rules',
      },
      {
        type: 'paragraph',
        text: 'To guarantee that campaigns cannot fabricate or manipulate funding statistics, BACKR enforces strict on-chain validation rules. A transaction counts toward project P if and only if ALL of the following criteria are met:',
      },
      {
        type: 'steps',
        items: [
          {
            step: 1,
            title: 'Successful Execution (meta.err is null)',
            description: 'The transaction was successfully confirmed by the Solana cluster without runtime errors.',
          },
          {
            step: 2,
            title: 'Block Time >= Project Creation Timestamp',
            description: 'The block time must be greater than or equal to the project creation date, ignoring historical deposits.',
          },
          {
            step: 3,
            title: 'SystemProgram Transfer to Treasury',
            description: 'Must contain an instruction transferring SOL to P.treasuryAddress where the sender is NOT the treasury itself (ignoring self-transfers).',
          },
          {
            step: 4,
            title: 'Matching SPL Memo Instruction',
            description: 'The same transaction must contain an SPL Memo instruction whose parsed JSON has app === "backr" (or "launchpad") and project === P.id (strict equality).',
          },
          {
            step: 5,
            title: 'Exact Lamport Accounting',
            description: 'The amount counted is strictly the lamports of that specific transfer instruction, never account balance changes or third-party airdrops.',
          },
        ],
      },
      {
        type: 'heading',
        level: 2,
        id: 'zero-storage-reliance',
        text: 'Zero Off-Chain Reliance',
      },
      {
        type: 'callout',
        variant: 'tip',
        title: 'Verifiable Integrity',
        text: 'If a project is newly created, it starts at strictly 0 SOL raised and 0 supporters. Random airdrops or unrelated deposits to the founder wallet are completely filtered out.',
      },
    ],
  },

  'memo-format': {
    slug: 'memo-format',
    title: 'On-Chain Memo Protocol',
    section: 'how-it-works',
    sectionTitle: 'How it works',
    description: 'JSON schema standards used by the SPL Memo Program on Solana.',
    lastUpdated: 'October 2026',
    headings: [
      { id: 'contribution-schema', title: 'Contribution Memo Schema', level: 2 },
      { id: 'milestone-schema', title: 'Milestone Memo Schema', level: 2 },
      { id: 'compatibility', title: 'Backward Compatibility', level: 2 },
    ],
    blocks: [
      {
        type: 'heading',
        level: 2,
        id: 'contribution-schema',
        text: 'Contribution Memo Schema',
      },
      {
        type: 'paragraph',
        text: 'When a supporter backs a project, the following JSON payload is encoded as UTF-8 bytes and sent to the Solana SPL Memo Program:',
      },
      {
        type: 'code',
        language: 'json',
        label: 'Contribution JSON Payload',
        code: `{\n  "app": "backr",\n  "type": "contribution",\n  "project": "<project-id>",\n  "title": "<project-title>",\n  "amount": <amount-in-sol>,\n  "time": <unix-timestamp-ms>\n}`,
      },
      {
        type: 'heading',
        level: 2,
        id: 'milestone-schema',
        text: 'Milestone Memo Schema',
      },
      {
        type: 'paragraph',
        text: 'When a founder marks a milestone deliverable as completed, the following JSON payload is signed and submitted:',
      },
      {
        type: 'code',
        language: 'json',
        label: 'Milestone Verification Payload',
        code: `{\n  "app": "backr",\n  "type": "milestone",\n  "project": "<project-id>",\n  "milestoneId": "<milestone-id>",\n  "milestone": <order-integer>,\n  "proof": "<url-or-proof-note>",\n  "verifiedAt": <unix-timestamp-ms>\n}`,
      },
      {
        type: 'heading',
        level: 2,
        id: 'compatibility',
        text: 'Backward Compatibility',
      },
      {
        type: 'callout',
        variant: 'note',
        title: 'Protocol Version Compatibility',
        text: 'BACKR ledger parsers recognize both "app": "backr" and legacy "app": "launchpad" identifiers to ensure historical devnet transactions continue to resolve seamlessly.',
      },
    ],
  },

  'funding-model': {
    slug: 'funding-model',
    title: 'Funding & Calculation Model',
    section: 'how-it-works',
    sectionTitle: 'How it works',
    description: 'Understanding raised amounts, backer counts, and treasury balances.',
    lastUpdated: 'October 2026',
    headings: [
      { id: 'derived-numbers', title: 'Derived Platform Numbers', level: 2 },
      { id: 'raised-vs-treasury', title: 'Raised Funds vs. Live Treasury Balance', level: 2 },
      { id: 'progress-bar', title: 'Progress Bar Mechanics', level: 2 },
    ],
    blocks: [
      {
        type: 'heading',
        level: 2,
        id: 'derived-numbers',
        text: 'Derived Platform Numbers',
      },
      {
        type: 'paragraph',
        text: 'All campaign numbers displayed across BACKR are computed from verified contribution rows:',
      },
      {
        type: 'list',
        items: [
          'Raised (SOL): The exact sum of verified contribution amounts for this project ID only.',
          'Supporters / Backers: The distinct count of unique sending wallet addresses among verified contribution rows.',
          'Progress Bar (%): Computed strictly as (raised / goalSol) * 100.',
        ],
      },
      {
        type: 'heading',
        level: 2,
        id: 'raised-vs-treasury',
        text: 'Raised Funds vs. Live Treasury Balance',
      },
      {
        type: 'paragraph',
        text: 'It is critical to distinguish between verified campaign raise and raw treasury wallet balance:',
      },
      {
        type: 'table',
        headers: ['Metric', 'Source', 'Includes Airdrops / Other Deposits?'],
        rows: [
          ['Raised SOL', 'Sum of validated on-chain memo contributions', 'No (strictly excluded)'],
          ['Treasury Balance', 'Direct Solana getBalance(pubkey) query', 'Yes (reflects entire wallet holdings)'],
        ],
      },
      {
        type: 'heading',
        level: 2,
        id: 'progress-bar',
        text: 'Progress Bar Mechanics',
      },
      {
        type: 'paragraph',
        text: 'When a campaign reaches 100% of its goal, the progress bar caps gracefully at 100% with the brand lavender-to-gold palette, while displaying over-funded percentages (e.g. "140% funded") clearly in text.',
      },
    ],
  },

  'custody-and-risks': {
    slug: 'custody-and-risks',
    title: 'Custody, Architecture & Risks',
    section: 'trust-and-security',
    sectionTitle: 'Trust and security',
    description: 'An honest breakdown of testnet custody models and demo security boundaries.',
    lastUpdated: 'October 2026',
    headings: [
      { id: 'direct-custody', title: 'Current Custody Model', level: 2 },
      { id: 'security-risks', title: 'Transparent Risk Disclosures', level: 2 },
      { id: 'best-practices', title: 'Safe Testing Best Practices', level: 2 },
    ],
    blocks: [
      {
        type: 'heading',
        level: 2,
        id: 'direct-custody',
        text: 'Current Custody Model',
      },
      {
        type: 'paragraph',
        text: 'In this demonstration version of BACKR, contributions transfer test SOL directly from the supporter’s wallet to the founder’s treasury wallet. Funds are currently not locked in an audited smart contract escrow program.',
      },
      {
        type: 'heading',
        level: 2,
        id: 'security-risks',
        text: 'Transparent Risk Disclosures',
      },
      {
        type: 'callout',
        variant: 'warning',
        title: 'Demonstration Software Notice',
        text: 'BACKR is educational demonstration software operating on Solana Devnet. It has not undergone third-party security audits. Never send mainnet cryptocurrency or real digital assets to addresses featured in this app.',
      },
      {
        type: 'list',
        items: [
          'Devnet SOL has zero commercial or cash value.',
          'Founder deliverables are verified via on-chain memo logs, but capital is transferred directly upon pledge in this testnet iteration.',
          'Always use a dedicated burner or testing wallet when experimenting on Solana Devnet.',
        ],
      },
      {
        type: 'heading',
        level: 2,
        id: 'best-practices',
        text: 'Safe Testing Best Practices',
      },
      {
        type: 'paragraph',
        text: 'Never use a wallet containing significant Mainnet assets for devnet exploration. Create a fresh test wallet profile in Phantom or Solflare specifically for testnet decentralized applications.',
      },
    ],
  },

  roadmap: {
    slug: 'roadmap',
    title: 'Protocol Roadmap',
    section: 'trust-and-security',
    sectionTitle: 'Trust and security',
    description: 'Planned architectural evolutions: on-chain escrows, trust scores, and token vesting.',
    lastUpdated: 'October 2026',
    headings: [
      { id: 'planned-features', title: 'Planned Architectural Features', level: 2 },
      { id: 'anchor-escrow', title: 'Anchor Escrow Vaults (Planned)', level: 2 },
      { id: 'reputation-engine', title: 'Founder Trust Scoring (Planned)', level: 2 },
    ],
    blocks: [
      {
        type: 'heading',
        level: 2,
        id: 'planned-features',
        text: 'Planned Architectural Features',
      },
      {
        type: 'paragraph',
        text: 'The following capabilities are actively planned for future iterations of the BACKR protocol. They are clearly labeled as roadmap goals and are not yet active on the testnet demo:',
      },
      {
        type: 'heading',
        level: 2,
        id: 'anchor-escrow',
        text: 'Anchor Escrow Vaults (Planned)',
      },
      {
        type: 'paragraph',
        text: 'A formal Anchor smart contract program will hold pledged SOL in Program Derived Address (PDA) escrow vaults. Funds will only release to founder treasuries when multisig or community governance votes approve verified milestone completions.',
      },
      {
        type: 'heading',
        level: 2,
        id: 'reputation-engine',
        text: 'Founder Trust Scoring (Planned)',
      },
      {
        type: 'paragraph',
        text: 'An autonomous on-chain reputation engine will score founder reliability (0–100) based on historical delivery speed, roadmap adherence, and backer dispute frequency across multiple campaigns.',
      },
      {
        type: 'callout',
        variant: 'note',
        title: 'Coming Soon',
        text: 'Token distribution vesting contracts and automated backer refund safeguards are currently under active design.',
      },
    ],
  },

  troubleshooting: {
    slug: 'troubleshooting',
    title: 'Troubleshooting & FAQs',
    section: 'help',
    sectionTitle: 'Help',
    description: 'Common Devnet errors, wallet disconnection, RPC rate limits, and quick fixes.',
    lastUpdated: 'October 2026',
    headings: [
      { id: 'wallet-issues', title: 'Wallet Detection & Connection', level: 2 },
      { id: 'rpc-rate-limits', title: 'RPC 429 Rate Limits', level: 2 },
      { id: 'failed-transactions', title: 'Transaction Rejections & Balance Issues', level: 2 },
    ],
    blocks: [
      {
        type: 'heading',
        level: 2,
        id: 'wallet-issues',
        text: 'Wallet Detection & Connection',
      },
      {
        type: 'paragraph',
        text: 'If your wallet extension is not detected when opening the Connect modal:',
      },
      {
        type: 'list',
        items: [
          'Ensure the extension is unlocked and enabled in your browser extensions manager.',
          'Refresh the page to allow the provider window.solana object to initialize.',
          'Verify that you have enabled Developer Mode / Solana Devnet in your extension settings.',
        ],
      },
      {
        type: 'heading',
        level: 2,
        id: 'rpc-rate-limits',
        text: 'RPC 429 Rate Limits',
      },
      {
        type: 'callout',
        variant: 'tip',
        title: 'Server Proxy Protection',
        text: 'BACKR routes devnet RPC calls through an internal server proxy with request caching. If you encounter a transient 429 rate limit, wait 3 seconds and retry your request.',
      },
      {
        type: 'heading',
        level: 2,
        id: 'failed-transactions',
        text: 'Transaction Rejections & Balance Issues',
      },
      {
        type: 'paragraph',
        text: 'If a contribution transaction fails to broadcast:',
      },
      {
        type: 'list',
        items: [
          'Insufficient Devnet SOL: Keep at least 0.01 SOL in your wallet to cover network transaction fees.',
          'User Rejection: If you clicked "Cancel" in your wallet popup, click "Back this project" again to re-initiate.',
          'Empty Ledger: Recent transactions can take 1-2 seconds to index across all devnet RPC nodes. Use the Refresh button above the ledger table.',
        ],
      },
    ],
  },

  glossary: {
    slug: 'glossary',
    title: 'Web3 & Solana Glossary',
    section: 'help',
    sectionTitle: 'Help',
    description: 'Definitions of key Solana and crowdfunding terminology.',
    lastUpdated: 'October 2026',
    headings: [
      { id: 'terms', title: 'Common Terms & Definitions', level: 2 },
    ],
    blocks: [
      {
        type: 'heading',
        level: 2,
        id: 'terms',
        text: 'Common Terms & Definitions',
      },
      {
        type: 'table',
        headers: ['Term', 'Definition'],
        rows: [
          ['Devnet', 'A public Solana testnet cluster used by developers to deploy and test applications using free simulated tokens.'],
          ['Lamport', 'The smallest fractional unit of SOL (1 SOL = 1,000,000,000 lamports), named in honor of Leslie Lamport.'],
          ['SOL', 'The native utility token of the Solana blockchain used for transactions, fees, and state rent.'],
          ['Treasury', 'The designated on-chain wallet address belonging to a project where backer contributions are sent.'],
          ['SPL Memo', 'A native Solana program (MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr) that writes arbitrary UTF-8 text or JSON data into a transaction.'],
          ['Signature', 'A base58-encoded cryptographic string that uniquely identifies a transaction on the Solana network.'],
          ['Milestone', 'A sequential technical roadmap deliverable tied to a specific funding tranche and target completion date.'],
          ['Escrow', 'A contractual arrangement in which a trusted program holds assets until predefined conditions are satisfied.'],
          ['PDA', 'Program Derived Address — an account address on Solana controlled exclusively by a specific on-chain smart contract.'],
        ],
      },
    ],
  },
};

export const ALL_DOC_SLUGS: string[] = DOC_SECTIONS.flatMap((s) => s.slugs);

export function getDocBySlug(slug: string): DocPage | undefined {
  return DOC_PAGES[slug];
}

export function getPrevNextDocs(slug: string): { prev?: DocPage; next?: DocPage } {
  const index = ALL_DOC_SLUGS.indexOf(slug);
  if (index === -1) return {};

  const prevSlug = index > 0 ? ALL_DOC_SLUGS[index - 1] : undefined;
  const nextSlug = index < ALL_DOC_SLUGS.length - 1 ? ALL_DOC_SLUGS[index + 1] : undefined;

  return {
    prev: prevSlug ? DOC_PAGES[prevSlug] : undefined,
    next: nextSlug ? DOC_PAGES[nextSlug] : undefined,
  };
}
