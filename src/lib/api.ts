import { Project, Milestone } from '../types';
import { INITIAL_PROJECTS } from '../data/seed';

const STORAGE_KEY = 'launchpad_projects_v8';

// Clean up legacy mock/seed storage keys on startup so stale campaigns cannot reappear
if (typeof window !== 'undefined') {
  try {
    localStorage.removeItem('launchpad_projects_v1');
    localStorage.removeItem('launchpad_projects_v2');
    localStorage.removeItem('launchpad_projects_v3');
    localStorage.removeItem('launchpad_projects_v4');
    localStorage.removeItem('launchpad_projects_v5');
    localStorage.removeItem('launchpad_projects_v6');
    localStorage.removeItem('launchpad_projects_v7');
    localStorage.removeItem('launchpad_recent_txs_v1');
  } catch {
    // Ignore storage errors
  }
}

/**
 * Migration helper to strip any legacy stored raised, backers or contributions fields
 */
function sanitizeProjectObject(rawProject: unknown): Project {
  const p = rawProject as Record<string, unknown>;
  const { raisedSol, backerCount, contributions, ...clean } = p;
  return {
    ...clean,
    createdAt: typeof clean.createdAt === 'number' ? clean.createdAt : 1704067200000,
    founders: Array.isArray(clean.founders) ? clean.founders : [],
  } as Project;
}

export function getStoredProjects(): Project[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_PROJECTS));
      return INITIAL_PROJECTS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      if (parsed.length === 0) return [];
      const sanitized = parsed.map(sanitizeProjectObject);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sanitized));
      return sanitized;
    }
    return INITIAL_PROJECTS;
  } catch {
    return INITIAL_PROJECTS;
  }
}

export function saveProject(newProject: Project): boolean {
  try {
    const current = getStoredProjects();
    const cleanProject = sanitizeProjectObject(newProject);
    const updated = [cleanProject, ...current.filter(p => p.id !== cleanProject.id)];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return true;
  } catch (err: unknown) {
    console.error('Failed to save project to localStorage:', err);
    throw new Error('Local storage is full. Please use smaller images or remove older campaigns.');
  }
}

export function getProjectById(id: string): Project | undefined {
  const projects = getStoredProjects();
  return projects.find(p => p.id === id);
}

export function updateProjectMilestone(
  projectId: string,
  milestoneId: string,
  txSignature: string,
  proofNote: string
): Project | undefined {
  const projects = getStoredProjects();
  const project = projects.find(p => p.id === projectId);
  if (!project) return undefined;

  const milestoneIndex = project.milestones.findIndex(m => m.id === milestoneId);
  if (milestoneIndex === -1) return undefined;

  const updatedMilestone: Milestone = {
    ...project.milestones[milestoneIndex],
    status: 'completed',
    txSignature,
    completedAt: new Date().toISOString().split('T')[0],
    proofNote: proofNote || 'Verified on-chain via Solana Memo transaction'
  };

  const updatedMilestones = [...project.milestones];
  updatedMilestones[milestoneIndex] = updatedMilestone;

  // If next milestone exists, set it to in_progress
  if (milestoneIndex + 1 < updatedMilestones.length && updatedMilestones[milestoneIndex + 1].status === 'upcoming') {
    updatedMilestones[milestoneIndex + 1] = {
      ...updatedMilestones[milestoneIndex + 1],
      status: 'in_progress',
    };
  }

  const updatedProject: Project = {
    ...project,
    milestones: updatedMilestones,
  };

  const updatedAll = projects.map(p => (p.id === projectId ? updatedProject : p));
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedAll));
  return updatedProject;
}


