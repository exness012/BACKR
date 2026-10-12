import { Project, TrustScoreBreakdown } from '../types';

export function calculateTrustScore(project: Project): TrustScoreBreakdown {
  const totalMilestones = project.milestones.length || 1;
  const completedMilestones = project.milestones.filter(m => m.status === 'completed');
  const onChainVerified = completedMilestones.filter(m => Boolean(m.txSignature)).length;

  // 1. Roadmap Delivery Score (0-35 points)
  // Weighted heavily towards on-chain verified completion
  const completionRatio = completedMilestones.length / totalMilestones;
  const verifiedBonus = onChainVerified / totalMilestones;
  const roadmapDeliveryScore = Math.min(35, Math.round(completionRatio * 20 + verifiedBonus * 15));

  // 2. Treasury Transparency Score (0-25 points)
  // Ratio of unlocked funds vs total goal, plus valid treasury format
  const unlockedSol = completedMilestones.reduce((sum, m) => sum + m.unlockSol, 0);
  const unlockRatio = Math.min(1, unlockedSol / (project.goalSol || 1));
  const transparencyBase = project.treasuryAddress ? 15 : 5;
  const treasuryTransparencyScore = Math.min(25, Math.round(transparencyBase + unlockRatio * 10));

  // 3. Backer Community Traction (0-20 points)
  // Backer count scaling logarithmic-style
  const effectiveBackers = typeof project.backerCount === 'number' ? project.backerCount : 0;
  const backerScore = Math.min(20, Math.round(Math.log10(Math.max(1, effectiveBackers)) * 7));
  const backerCommunityScore = Math.max(5, backerScore);

  // 4. Activity & On-Chain Proofs (0-20 points)
  let activityScore = 10;
  if (onChainVerified >= 2) activityScore += 10;
  else if (onChainVerified === 1) activityScore += 5;
  if (project.websiteUrl && project.twitterUrl) activityScore = Math.min(20, activityScore + 5);

  const overallScore = Math.min(100, Math.max(10, roadmapDeliveryScore + treasuryTransparencyScore + backerCommunityScore + activityScore));

  let ratingLabel = 'Standard Early Stage';
  if (overallScore >= 85) {
    ratingLabel = 'Tier 1 Verified Pioneer';
  } else if (overallScore >= 70) {
    ratingLabel = 'High Trust & Active Delivery';
  } else if (overallScore >= 50) {
    ratingLabel = 'Verified Community Project';
  }

  return {
    overallScore,
    roadmapDeliveryScore,
    treasuryTransparencyScore,
    backerCommunityScore,
    activityScore,
    ratingLabel,
  };
}
