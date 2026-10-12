import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  query,
  orderBy,
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
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
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
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// In-memory cache for synchronous fallbacks
let cachedProjects: Project[] = [];

/**
 * Migration helper to strip any financial fields (raisedSol, backerCount, contributions)
 * so on-chain Solana remains the sole source of truth for funds.
 */
export function sanitizeProjectObject(rawProject: unknown): Project {
  const p = (rawProject || {}) as Record<string, unknown>;
  const { raisedSol, backerCount, contributions, ...clean } = p;
  return {
    ...clean,
    createdAt: typeof clean.createdAt === 'number' ? clean.createdAt : Date.now(),
    founders: Array.isArray(clean.founders) ? clean.founders : [],
    milestones: Array.isArray(clean.milestones) ? clean.milestones : [],
  } as Project;
}

/**
 * Synchronous project getter from cache (keeps compatibility with existing components)
 */
export function getStoredProjects(): Project[] {
  return cachedProjects;
}

/**
 * Fetch all projects from Firestore (with milestones subcollection merged)
 */
export async function listProjects(): Promise<Project[]> {
  const path = 'projects';
  try {
    const q = query(collection(db, path), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    const projects: Project[] = [];

    for (const projectDoc of snapshot.docs) {
      const data = projectDoc.data();
      const project = sanitizeProjectObject({ ...data, id: projectDoc.id });

      // Fetch milestones subcollection
      try {
        const milestonesSnap = await getDocs(
          query(collection(db, `projects/${projectDoc.id}/milestones`), orderBy('order', 'asc'))
        );
        if (!milestonesSnap.empty) {
          project.milestones = milestonesSnap.docs.map((mDoc) => ({
            ...mDoc.data(),
            id: mDoc.id,
          })) as Milestone[];
        }
      } catch (mErr) {
        console.warn(`Could not fetch milestones subcollection for ${projectDoc.id}:`, mErr);
      }

      projects.push(project);
    }

    cachedProjects = projects;
    return projects;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

/**
 * Subscribe to real-time project updates
 */
export function subscribeProjects(
  onUpdate: (projects: Project[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const path = 'projects';
  const q = query(collection(db, path), orderBy('createdAt', 'desc'));

  return onSnapshot(
    q,
    async (snapshot) => {
      try {
        const projects: Project[] = [];
        for (const projectDoc of snapshot.docs) {
          const project = sanitizeProjectObject({ ...projectDoc.data(), id: projectDoc.id });
          try {
            const milestonesSnap = await getDocs(
              query(collection(db, `projects/${projectDoc.id}/milestones`), orderBy('order', 'asc'))
            );
            if (!milestonesSnap.empty) {
              project.milestones = milestonesSnap.docs.map((mDoc) => ({
                ...mDoc.data(),
                id: mDoc.id,
              })) as Milestone[];
            }
          } catch {
            // Milestone subcollection optional fallback
          }
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
}

/**
 * Fetch a single project by ID (including milestones subcollection)
 */
export async function getProject(id: string): Promise<Project | null> {
  const path = `projects/${id}`;
  try {
    const docSnap = await getDoc(doc(db, 'projects', id));
    if (!docSnap.exists()) {
      return null;
    }

    const project = sanitizeProjectObject({ ...docSnap.data(), id: docSnap.id });

    // Fetch subcollection milestones
    try {
      const milestonesSnap = await getDocs(
        query(collection(db, `projects/${id}/milestones`), orderBy('order', 'asc'))
      );
      if (!milestonesSnap.empty) {
        project.milestones = milestonesSnap.docs.map((mDoc) => ({
          ...mDoc.data(),
          id: mDoc.id,
        })) as Milestone[];
      }
    } catch (mErr) {
      console.warn(`Could not fetch milestones subcollection for ${id}:`, mErr);
    }

    // Update in cachedProjects
    const index = cachedProjects.findIndex((p) => p.id === id);
    if (index >= 0) {
      cachedProjects[index] = project;
    } else {
      cachedProjects.push(project);
    }

    return project;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

/**
 * Backward-compatible synchronous getter with cache lookup
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
    async (docSnap) => {
      try {
        if (!docSnap.exists()) {
          onUpdate(null);
          return;
        }

        const project = sanitizeProjectObject({ ...docSnap.data(), id: docSnap.id });

        try {
          const milestonesSnap = await getDocs(
            query(collection(db, `projects/${id}/milestones`), orderBy('order', 'asc'))
          );
          if (!milestonesSnap.empty) {
            project.milestones = milestonesSnap.docs.map((mDoc) => ({
              ...mDoc.data(),
              id: mDoc.id,
            })) as Milestone[];
          }
        } catch {
          // ignore subcollection read errors
        }

        const idx = cachedProjects.findIndex((p) => p.id === id);
        if (idx >= 0) cachedProjects[idx] = project;
        else cachedProjects.push(project);

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
  onStatusUpdate?: (step: string) => void;
  onLogoProgress?: (progress: number) => void;
  onBannerProgress?: (progress: number) => void;
  onFounderProgress?: (founderId: string, progress: number) => void;
}

/**
 * Creates a project in Firestore, uploading images to Firebase Storage first
 */
export async function createProject(
  rawProject: Project,
  callbacks?: CreateProjectProgressCallbacks
): Promise<Project> {
  const projectId = rawProject.id || crypto.randomUUID();
  callbacks?.onStatusUpdate?.('Uploading project assets to Firebase Storage…');

  let finalLogoUrl = rawProject.logoUrl;
  let finalBannerUrl = rawProject.bannerUrl;

  // 1. Upload Logo if data URL
  if (rawProject.logoUrl && rawProject.logoUrl.startsWith('data:')) {
    try {
      callbacks?.onStatusUpdate?.('Uploading logo…');
      finalLogoUrl = await uploadProjectAsset(
        `projects/${projectId}/logo.webp`,
        rawProject.logoUrl,
        callbacks?.onLogoProgress
      );
    } catch (err) {
      console.warn('Failed to upload logo to Storage, preserving data URL fallback:', err);
    }
  }

  // 2. Upload Banner if data URL
  if (rawProject.bannerUrl && rawProject.bannerUrl.startsWith('data:')) {
    try {
      callbacks?.onStatusUpdate?.('Uploading banner…');
      finalBannerUrl = await uploadProjectAsset(
        `projects/${projectId}/banner.webp`,
        rawProject.bannerUrl,
        callbacks?.onBannerProgress
      );
    } catch (err) {
      console.warn('Failed to upload banner to Storage, preserving data URL fallback:', err);
    }
  }

  // 3. Upload Founder Avatars if data URLs
  const updatedFounders = [];
  if (rawProject.founders && rawProject.founders.length > 0) {
    for (const f of rawProject.founders) {
      let avatar = f.avatar;
      if (avatar && avatar.startsWith('data:')) {
        try {
          callbacks?.onStatusUpdate?.(`Uploading avatar for ${f.name}…`);
          avatar = await uploadProjectAsset(
            `projects/${projectId}/founders/${f.id}.webp`,
            avatar,
            (progress) => callbacks?.onFounderProgress?.(f.id, progress)
          );
        } catch (err) {
          console.warn(`Failed to upload avatar for ${f.name}:`, err);
        }
      }
      updatedFounders.push({ ...f, avatar });
    }
  }

  callbacks?.onStatusUpdate?.('Saving campaign metadata to Firestore…');

  const cleanProject: Project = sanitizeProjectObject({
    ...rawProject,
    id: projectId,
    logoUrl: finalLogoUrl,
    bannerUrl: finalBannerUrl,
    founders: updatedFounders,
    schemaVersion: 1,
  });

  const path = `projects/${projectId}`;
  try {
    // Save main project document (excluding subcollection milestones in main document if preferred,
    // or keeping milestones array on doc for quick listing while syncing subcollection)
    await setDoc(doc(db, 'projects', projectId), cleanProject);

    // Save milestones to subcollection projects/{id}/milestones
    if (cleanProject.milestones && cleanProject.milestones.length > 0) {
      for (const milestone of cleanProject.milestones) {
        const milestonePath = `projects/${projectId}/milestones/${milestone.id}`;
        try {
          await setDoc(doc(db, 'projects', projectId, 'milestones', milestone.id), {
            id: milestone.id,
            order: milestone.order,
            title: milestone.title,
            description: milestone.description,
            targetDate: milestone.targetDate,
            unlockSol: milestone.unlockSol,
            status: milestone.status,
            txSignature: milestone.txSignature || '',
            completedAt: milestone.completedAt || '',
            proofNote: milestone.proofNote || '',
          });
        } catch (mErr) {
          console.error(`Failed to write subcollection milestone at ${milestonePath}:`, mErr);
        }
      }
    }

    cachedProjects = [cleanProject, ...cachedProjects.filter((p) => p.id !== projectId)];
    return cleanProject;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
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
    // 1. Fetch current project
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

    // Advance next milestone to in_progress if upcoming
    if (
      milestoneIndex + 1 < updatedMilestones.length &&
      updatedMilestones[milestoneIndex + 1].status === 'upcoming'
    ) {
      updatedMilestones[milestoneIndex + 1] = {
        ...updatedMilestones[milestoneIndex + 1],
        status: 'in_progress',
      };
    }

    // 2. Update Firestore subcollection milestone document
    try {
      await updateDoc(doc(db, 'projects', projectId, 'milestones', milestoneId), {
        status: 'completed',
        txSignature,
        completedAt,
        proofNote: updatedMilestone.proofNote,
      });

      if (
        milestoneIndex + 1 < updatedMilestones.length &&
        updatedMilestones[milestoneIndex + 1].status === 'in_progress'
      ) {
        await updateDoc(
          doc(db, 'projects', projectId, 'milestones', updatedMilestones[milestoneIndex + 1].id),
          { status: 'in_progress' }
        );
      }
    } catch (subErr) {
      console.warn('Subcollection update notice:', subErr);
    }

    // 3. Update main project document
    const updatedProject: Project = {
      ...project,
      milestones: updatedMilestones,
    };

    await updateDoc(doc(db, 'projects', projectId), {
      milestones: updatedMilestones,
    });

    // Update in cache
    const idx = cachedProjects.findIndex((p) => p.id === projectId);
    if (idx >= 0) cachedProjects[idx] = updatedProject;

    return updatedProject;
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}
