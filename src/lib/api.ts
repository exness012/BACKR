import {
  collection,
  doc,
  getDocs,
  getDoc,
  writeBatch,
  updateDoc,
  query,
  orderBy,
  limit,
  onSnapshot,
  Unsubscribe,
} from 'firebase/firestore';
import { db, auth } from './firebase';
import { Project, Milestone } from '../types';
import { uploadProjectAsset } from './storage';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  code?: string;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errCode = (error as { code?: string })?.code;
  const errMsg = error instanceof Error ? error.message : String(error);

  const errInfo: FirestoreErrorInfo = {
    error: errMsg,
    code: errCode,
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };

  console.error('Firestore Error:', JSON.stringify(errInfo));
  if (import.meta.env?.DEV) {
    console.error('[BACKR Firebase Error Detail]', {
      code: errCode,
      message: errMsg,
      path,
      operationType,
    });
  }

  throw new Error(JSON.stringify(errInfo));
}

// In-memory cache for fast UI access
let cachedProjects: Project[] = [];

/**
 * Migration helper to strip any financial fields (raisedSol, backerCount, contributions)
 * and ensure no undefined fields exist before database operations.
 */
export function sanitizeProjectObject(rawProject: unknown): Project {
  const p = (rawProject || {}) as Record<string, unknown>;
  const { raisedSol, backerCount, contributions, ...clean } = p;

  return {
    id: typeof clean.id === 'string' ? clean.id : '',
    name: typeof clean.name === 'string' ? clean.name : '',
    tagline: typeof clean.tagline === 'string' ? clean.tagline : '',
    description: typeof clean.description === 'string' ? clean.description : '',
    category: typeof clean.category === 'string' ? clean.category : 'Infrastructure & AI',
    founderAddress: typeof clean.founderAddress === 'string' ? clean.founderAddress : '',
    treasuryAddress: typeof clean.treasuryAddress === 'string' ? clean.treasuryAddress : '',
    goalSol: typeof clean.goalSol === 'number' && !isNaN(clean.goalSol) ? clean.goalSol : 0,
    deadline: typeof clean.deadline === 'string' ? clean.deadline : '',
    launchDate: typeof clean.launchDate === 'string' ? clean.launchDate : 'Q4 2026',
    type: (typeof clean.type === 'string' ? clean.type : 'Crowdfund') as Project['type'],
    allocation: typeof clean.allocation === 'string' ? clean.allocation : '10% Supply',
    status: (typeof clean.status === 'string' ? clean.status : 'live') as Project['status'],
    websiteUrl: typeof clean.websiteUrl === 'string' ? clean.websiteUrl : '',
    twitterUrl: typeof clean.twitterUrl === 'string' ? clean.twitterUrl : '',
    discordUrl: typeof clean.discordUrl === 'string' ? clean.discordUrl : '',
    logoUrl: typeof clean.logoUrl === 'string' ? clean.logoUrl : '',
    bannerUrl: typeof clean.bannerUrl === 'string' ? clean.bannerUrl : '',
    createdAt: typeof clean.createdAt === 'number' ? clean.createdAt : Date.now(),
    milestones: Array.isArray(clean.milestones) ? clean.milestones : [],
    founders: Array.isArray(clean.founders) ? clean.founders : [],
    tokenomics: clean.tokenomics ? (clean.tokenomics as Project['tokenomics']) : {
      tokenName: '',
      tokenSymbol: '',
      totalSupply: '100,000,000',
      backerTokensPerSol: 1000,
      vestingNote: '',
      distribution: [],
    },
  };
}

/**
 * Builds the exact document payload that matches the Firestore security rules.
 * Never includes undefined values: strings default to "" and numbers to 0.
 */
export function buildFirestoreProjectPayload(project: Project): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    id: project.id || '',
    name: (project.name || '').trim().slice(0, 100),
    tagline: (project.tagline || '').trim().slice(0, 200),
    description: (project.description || '').trim().slice(0, 5000),
    category: (project.category || 'Infrastructure & AI').trim().slice(0, 100),
    founderAddress: (project.founderAddress || '').trim().slice(0, 64),
    treasuryAddress: (project.treasuryAddress || '').trim().slice(0, 64),
    goalSol: typeof project.goalSol === 'number' && !isNaN(project.goalSol) ? project.goalSol : 0,
    deadline: (project.deadline || new Date().toISOString().split('T')[0]).slice(0, 50),
    type: (project.type || 'Crowdfund').slice(0, 50),
    status: (project.status || 'live').slice(0, 50),
    // Extra allowed fields
    logoUrl: project.logoUrl || '',
    bannerUrl: project.bannerUrl || '',
    createdAt: typeof project.createdAt === 'number' ? project.createdAt : Date.now(),
    launchDate: project.launchDate || 'Q4 2026',
    allocation: project.allocation || '10% Supply',
    websiteUrl: project.websiteUrl || '',
    twitterUrl: project.twitterUrl || '',
    discordUrl: project.discordUrl || '',
    founders: (project.founders || []).map((f) => ({
      id: f.id || '',
      name: f.name || '',
      role: f.role || '',
      bio: f.bio || '',
      avatar: f.avatar || '',
      socials: {
        x: f.socials?.x || '',
        linkedin: f.socials?.linkedin || '',
        github: f.socials?.github || '',
        telegram: f.socials?.telegram || '',
        discord: f.socials?.discord || '',
        website: f.socials?.website || '',
      },
    })),
    tokenomics: project.tokenomics || {
      tokenName: '',
      tokenSymbol: '',
      totalSupply: '100,000,000',
      backerTokensPerSol: 1000,
      vestingNote: '',
      distribution: [],
    },
    schemaVersion: 1,
  };

  return payload;
}

/**
 * Builds the exact milestone document payload for projects/{id}/milestones/{milestoneId}
 */
export function buildFirestoreMilestonePayload(milestone: Milestone, defaultIndex = 1): Record<string, unknown> {
  return {
    id: milestone.id || '',
    order: typeof milestone.order === 'number' ? milestone.order : defaultIndex,
    title: (milestone.title || `Phase ${defaultIndex}`).slice(0, 120),
    description: (milestone.description || '').slice(0, 1000),
    targetDate: milestone.targetDate || '',
    unlockSol: typeof milestone.unlockSol === 'number' ? milestone.unlockSol : 0,
    status: milestone.status || 'upcoming',
    txSignature: milestone.txSignature || '',
    completedAt: milestone.completedAt || '',
    proofNote: milestone.proofNote || '',
  };
}

/**
 * Synchronous project getter from cache
 */
export function getStoredProjects(): Project[] {
  return cachedProjects;
}

/**
 * Optimistically add or update a project in cache without waiting for refetches
 */
export function addProjectToCache(project: Project): void {
  const index = cachedProjects.findIndex((p) => p.id === project.id);
  if (index >= 0) {
    cachedProjects[index] = project;
  } else {
    cachedProjects = [project, ...cachedProjects];
  }
}

/**
 * Fetch projects from Firestore with optional limit (defaults to 20 for faster startup)
 */
export async function listProjects(limitCount = 20): Promise<Project[]> {
  const path = 'projects';
  try {
    const q = query(collection(db, path), orderBy('createdAt', 'desc'), limit(limitCount));
    const snapshot = await getDocs(q);
    const projects: Project[] = [];

    for (const projectDoc of snapshot.docs) {
      const data = projectDoc.data();
      const project = sanitizeProjectObject({ ...data, id: projectDoc.id });

      // If milestones array is not on doc, fetch from subcollection
      if (!project.milestones || project.milestones.length === 0) {
        try {
          const milestonesSnap = await getDocs(
            query(collection(db, `projects/${projectDoc.id}/milestones`), orderBy('order', 'asc'))
          );
          if (!milestonesSnap.empty) {
            project.milestones = milestonesSnap.docs.map((mDoc) => {
              const mData = mDoc.data();
              return {
                id: mDoc.id,
                order: typeof mData.order === 'number' ? mData.order : 1,
                title: mData.title || '',
                description: mData.description || '',
                targetDate: mData.targetDate || '',
                unlockSol: typeof mData.unlockSol === 'number' ? mData.unlockSol : 0,
                status: mData.status || 'upcoming',
                txSignature: mData.txSignature || '',
                completedAt: mData.completedAt || '',
                proofNote: mData.proofNote || '',
              };
            });
          }
        } catch {
          // ignore subcollection milestone read failures
        }
      }

      projects.push(project);
    }

    cachedProjects = projects;
    return projects;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

let activeCollectionUnsubscribe: Unsubscribe | null = null;

/**
 * Subscribe to real-time project updates (limited to 20 documents, cleans up prior listener)
 */
export function subscribeProjects(
  onUpdate: (projects: Project[]) => void,
  limitCount = 20,
  onError?: (err: Error) => void
): Unsubscribe {
  if (activeCollectionUnsubscribe) {
    activeCollectionUnsubscribe();
    activeCollectionUnsubscribe = null;
  }

  const path = 'projects';
  const q = query(collection(db, path), orderBy('createdAt', 'desc'), limit(limitCount));

  const unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      try {
        const projects: Project[] = [];
        for (const projectDoc of snapshot.docs) {
          const project = sanitizeProjectObject({ ...projectDoc.data(), id: projectDoc.id });
          projects.push(project);
        }
        cachedProjects = projects;
        onUpdate(projects);
      } catch (err) {
        if (onError) onError(err instanceof Error ? err : new Error(String(err)));
      }
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );

  activeCollectionUnsubscribe = unsubscribe;
  return () => {
    unsubscribe();
    if (activeCollectionUnsubscribe === unsubscribe) {
      activeCollectionUnsubscribe = null;
    }
  };
}

/**
 * Fetch a single project by ID (including milestones)
 */
export async function getProject(id: string): Promise<Project | null> {
  const path = `projects/${id}`;
  try {
    const docSnap = await getDoc(doc(db, 'projects', id));
    if (!docSnap.exists()) {
      return null;
    }

    const project = sanitizeProjectObject({ ...docSnap.data(), id: docSnap.id });

    if (!project.milestones || project.milestones.length === 0) {
      try {
        const milestonesSnap = await getDocs(
          query(collection(db, `projects/${id}/milestones`), orderBy('order', 'asc'))
        );
        if (!milestonesSnap.empty) {
          project.milestones = milestonesSnap.docs.map((mDoc) => {
            const mData = mDoc.data();
            return {
              id: mDoc.id,
              order: typeof mData.order === 'number' ? mData.order : 1,
              title: mData.title || '',
              description: mData.description || '',
              targetDate: mData.targetDate || '',
              unlockSol: typeof mData.unlockSol === 'number' ? mData.unlockSol : 0,
              status: mData.status || 'upcoming',
              txSignature: mData.txSignature || '',
              completedAt: mData.completedAt || '',
              proofNote: mData.proofNote || '',
            };
          });
        }
      } catch (mErr) {
        console.warn(`Could not fetch milestones subcollection for ${id}:`, mErr);
      }
    }

    addProjectToCache(project);
    return project;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

/**
 * Synchronous getter with cache lookup
 */
export function getProjectById(id: string): Project | undefined {
  return cachedProjects.find((p) => p.id === id);
}

/**
 * Real-time subscription to a single project
 */
export function subscribeProject(
  id: string,
  onUpdate: (project: Project | null) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const path = `projects/${id}`;
  return onSnapshot(
    doc(db, 'projects', id),
    (docSnap) => {
      try {
        if (!docSnap.exists()) {
          onUpdate(null);
          return;
        }

        const project = sanitizeProjectObject({ ...docSnap.data(), id: docSnap.id });
        addProjectToCache(project);
        onUpdate(project);
      } catch (err) {
        if (onError) onError(err instanceof Error ? err : new Error(String(err)));
      }
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    }
  );
}

export interface CreateProjectProgressCallbacks {
  onStepProgress?: (step: 'uploading' | 'saving' | 'done') => void;
  onStatusUpdate?: (status: string) => void;
  onOverallProgress?: (progress: number) => void;
}

/**
 * Creates a project document and its milestones in a single atomic batch write.
 * Image uploads are non-blocking: saves immediately with fallbacks if uploads take >20s,
 * then background-updates image URLs in Firestore.
 */
export async function createProject(
  rawProject: Project,
  callbacks?: CreateProjectProgressCallbacks
): Promise<Project> {
  const isDev = import.meta.env?.DEV;
  const startTime = performance.now();
  const projectId = rawProject.id || crypto.randomUUID();

  callbacks?.onStepProgress?.('saving');
  callbacks?.onStatusUpdate?.('Writing project and milestones in atomic batch…');

  // Clean local representations
  const cleanProject: Project = sanitizeProjectObject({
    ...rawProject,
    id: projectId,
  });

  const path = `projects/${projectId}`;
  const projectDocPayload = buildFirestoreProjectPayload(cleanProject);

  if (isDev) {
    console.log('[BACKR Save Payload - Project Doc]', projectDocPayload);
  }

  // 1. Atomic writeBatch for project doc + all subcollection milestones
  const batch = writeBatch(db);
  const projectRef = doc(db, 'projects', projectId);
  batch.set(projectRef, projectDocPayload);

  if (cleanProject.milestones && cleanProject.milestones.length > 0) {
    for (let i = 0; i < cleanProject.milestones.length; i++) {
      const m = cleanProject.milestones[i];
      const milestoneRef = doc(db, 'projects', projectId, 'milestones', m.id);
      const milestonePayload = buildFirestoreMilestonePayload(m, i + 1);
      if (isDev) {
        console.log(`[BACKR Save Payload - Milestone ${m.id}]`, milestonePayload);
      }
      batch.set(milestoneRef, milestonePayload);
    }
  }

  const writeStart = performance.now();
  try {
    await batch.commit();

    const writeElapsed = performance.now() - writeStart;
    const totalElapsed = performance.now() - startTime;
    if (isDev) {
      console.log(`[BACKR Perf] Firestore writeBatch committed in ${writeElapsed.toFixed(1)}ms (total ${totalElapsed.toFixed(1)}ms)`);
    }

    callbacks?.onStepProgress?.('done');
    callbacks?.onStatusUpdate?.('Campaign saved successfully!');

    // Optimistically update cache immediately
    addProjectToCache(cleanProject);

    // 2. Non-blocking background image attachment (if any pending uploads remain)
    triggerNonBlockingImageUpdates(projectId, rawProject);

    return cleanProject;
  } catch (error) {
    if (isDev) {
      const errObj = error as { code?: string; message?: string };
      console.error('[BACKR writeBatch FAILED]', {
        code: errObj?.code,
        message: errObj?.message,
        payload: projectDocPayload,
      });
    }
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Background updater: uploads data-URL images (logo, banner, founders) with 20s timeout,
 * and patches Firestore document with the resulting public download URLs.
 */
function triggerNonBlockingImageUpdates(projectId: string, rawProject: Project) {
  setTimeout(async () => {
    try {
      const updates: Record<string, unknown> = {};

      if (rawProject.logoUrl && rawProject.logoUrl.startsWith('data:')) {
        try {
          const logoUrl = await uploadProjectAsset(`projects/${projectId}/logo.webp`, rawProject.logoUrl, undefined, 20000);
          updates.logoUrl = logoUrl;
        } catch (e) {
          console.warn('[BACKR Background Logo Upload]', e);
        }
      }

      if (rawProject.bannerUrl && rawProject.bannerUrl.startsWith('data:')) {
        try {
          const bannerUrl = await uploadProjectAsset(`projects/${projectId}/banner.webp`, rawProject.bannerUrl, undefined, 20000);
          updates.bannerUrl = bannerUrl;
        } catch (e) {
          console.warn('[BACKR Background Banner Upload]', e);
        }
      }

      if (rawProject.founders && rawProject.founders.length > 0) {
        const updatedFounders = [];
        let hasFounderUpload = false;
        for (const f of rawProject.founders) {
          if (f.avatar && f.avatar.startsWith('data:')) {
            try {
              const avatarUrl = await uploadProjectAsset(`projects/${projectId}/founders/${f.id}.webp`, f.avatar, undefined, 20000);
              updatedFounders.push({ ...f, avatar: avatarUrl });
              hasFounderUpload = true;
            } catch {
              updatedFounders.push(f);
            }
          } else {
            updatedFounders.push(f);
          }
        }
        if (hasFounderUpload) {
          updates.founders = updatedFounders;
        }
      }

      if (Object.keys(updates).length > 0) {
        await updateDoc(doc(db, 'projects', projectId), updates);
        console.log(`[BACKR Background Image Update Completed for ${projectId}]`);
      }
    } catch (err) {
      console.warn('[BACKR Background image update notice]:', err);
    }
  }, 50);
}

/**
 * Backward compatibility alias for saveProject
 */
export async function saveProject(
  newProject: Project,
  callbacks?: CreateProjectProgressCallbacks
): Promise<boolean> {
  await createProject(newProject, callbacks);
  return true;
}

/**
 * Update project milestone completion with on-chain signature proof
 */
export async function updateProjectMilestone(
  projectId: string,
  milestoneId: string,
  txSignature: string,
  proofNote: string
): Promise<Project | undefined> {
  const path = `projects/${projectId}/milestones/${milestoneId}`;
  try {
    const project = await getProject(projectId);
    if (!project) return undefined;

    const milestoneIndex = project.milestones.findIndex((m) => m.id === milestoneId);
    if (milestoneIndex === -1) return undefined;

    const completedAt = new Date().toISOString().split('T')[0];
    const updatedMilestone: Milestone = {
      ...project.milestones[milestoneIndex],
      status: 'completed',
      txSignature,
      completedAt,
      proofNote: proofNote || 'Verified on-chain via Solana Memo transaction',
    };

    const updatedMilestones = [...project.milestones];
    updatedMilestones[milestoneIndex] = updatedMilestone;

    if (
      milestoneIndex + 1 < updatedMilestones.length &&
      updatedMilestones[milestoneIndex + 1].status === 'upcoming'
    ) {
      updatedMilestones[milestoneIndex + 1] = {
        ...updatedMilestones[milestoneIndex + 1],
        status: 'in_progress',
      };
    }

    const updatedProject: Project = {
      ...project,
      milestones: updatedMilestones,
    };

    // Atomic batch update for milestone document and parent project document
    const batch = writeBatch(db);
    const mRef = doc(db, 'projects', projectId, 'milestones', milestoneId);
    batch.update(mRef, {
      status: 'completed',
      txSignature,
      completedAt,
      proofNote: updatedMilestone.proofNote,
    });

    if (
      milestoneIndex + 1 < updatedMilestones.length &&
      updatedMilestones[milestoneIndex + 1].status === 'in_progress'
    ) {
      const nextRef = doc(
        db,
        'projects',
        projectId,
        'milestones',
        updatedMilestones[milestoneIndex + 1].id
      );
      batch.update(nextRef, { status: 'in_progress' });
    }

    const pRef = doc(db, 'projects', projectId);
    batch.update(pRef, { milestones: updatedMilestones });

    await batch.commit();

    addProjectToCache(updatedProject);
    return updatedProject;
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}
