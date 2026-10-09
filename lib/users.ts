import { doc, getDoc, serverTimestamp, setDoc, Timestamp } from 'firebase/firestore';

import { requireDb } from '@/lib/firebase';
import { isUserRole, type UserProfile, type UserRole } from '@/types/user';

const USER_COLLECTION = 'users';

function serializeCreatedAt(value: unknown): string {
  if (value instanceof Timestamp) {
    return value.toDate().toISOString();
  }

  if (typeof value === 'string' && value.length > 0) {
    return value;
  }

  return new Date().toISOString();
}

function mapUserDocument(uid: string, data: Record<string, unknown>): UserProfile {
  const name = typeof data.name === 'string' ? data.name.trim() : '';
  const email = typeof data.email === 'string' ? data.email.trim() : '';

  if (!name || !email || !isUserRole(data.role)) {
    throw new Error('Your account profile is incomplete. Please contact support or register again.');
  }

  return {
    uid,
    name,
    email,
    role: data.role,
    createdAt: serializeCreatedAt(data.createdAt),
    department: typeof data.department === 'string' ? data.department : undefined,
    prn: typeof data.prn === 'string' ? data.prn : undefined,
    batch: typeof data.batch === 'string' ? data.batch : undefined,
    status: typeof data.status === 'string' ? data.status : undefined,
  };
}

export async function createUserProfile(input: {
  uid: string;
  name: string;
  email: string;
  role: UserRole;
}): Promise<void> {
  await setDoc(doc(requireDb(), USER_COLLECTION, input.uid), {
    name: input.name,
    email: input.email,
    role: input.role,
    createdAt: serverTimestamp(),
  });
}

export async function getUserProfile(uid: string): Promise<UserProfile> {
  const snapshot = await getDoc(doc(requireDb(), USER_COLLECTION, uid));

  if (!snapshot.exists()) {
    throw new Error('Your account profile could not be found.');
  }

  return mapUserDocument(uid, snapshot.data());
}

export async function getUserProfileWithRetry(
  uid: string,
  attempts = 3,
  delayMs = 250
): Promise<UserProfile> {
  let lastError: unknown;

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      return await getUserProfile(uid);
    } catch (error) {
      lastError = error;
      const isMissing =
        error instanceof Error && error.message === 'Your account profile could not be found.';

      if (!isMissing || attempt === attempts - 1) {
        throw error;
      }

      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  throw lastError;
}
