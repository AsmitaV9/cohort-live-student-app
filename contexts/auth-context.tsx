import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  type User,
} from 'firebase/auth';
import {
  createContext,
  use,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react';

import { getAuthErrorMessage } from '@/lib/firebase-errors';
import { isFirebaseConfigured, missingFirebaseEnvVars, requireAuth } from '@/lib/firebase';
import { createUserProfile, getUserProfile, getUserProfileWithRetry } from '@/lib/users';
import { type UserProfile, type UserRole } from '@/types/user';

type AuthContextValue = {
  firebaseUser: User | null;
  profile: UserProfile | null;
  isLoading: boolean;
  isConfigured: boolean;
  missingEnvVars: string[];
  profileError: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  register: (input: {
    name: string;
    email: string;
    password: string;
  }) => Promise<void>;
  signOut: () => Promise<void>;
  reloadProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const value = use(AuthContext);
  if (!value) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return value;
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isFirebaseConfigured) {
      setIsLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(requireAuth(), async (user) => {
      try {
        if (!user) {
          setFirebaseUser(null);
          setProfile(null);
          setProfileError(null);
          return;
        }

        setFirebaseUser(user);
        const nextProfile = await getUserProfileWithRetry(user.uid);
        setProfile(nextProfile);
        setProfileError(null);
      } catch (error) {
        setProfile(null);
        setProfileError(getAuthErrorMessage(error));
      } finally {
        setIsLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      firebaseUser,
      profile,
      isLoading,
      isConfigured: isFirebaseConfigured,
      missingEnvVars: missingFirebaseEnvVars,
      profileError,
      signIn: async (email, password) => {
        const credential = await signInWithEmailAndPassword(
          requireAuth(),
          email.trim(),
          password
        );
        const nextProfile = await getUserProfile(credential.user.uid);
        if (nextProfile.role !== 'student') {
          await firebaseSignOut(requireAuth());
          throw new Error('Trainer accounts must use the Cohort Live Trainer website.');
        }
        setFirebaseUser(credential.user);
        setProfile(nextProfile);
        setProfileError(null);
      },
      register: async ({ name, email, password }) => {
        const trimmedName = name.trim();
        const trimmedEmail = email.trim();
        const auth = requireAuth();
        const credential = await createUserWithEmailAndPassword(
          auth,
          trimmedEmail,
          password
        );

        try {
          await createUserProfile({
            uid: credential.user.uid,
            name: trimmedName,
            email: trimmedEmail,
            role: 'student',
          });
          const nextProfile = await getUserProfileWithRetry(credential.user.uid);
          setFirebaseUser(credential.user);
          setProfile(nextProfile);
          setProfileError(null);
        } catch (error) {
          await firebaseSignOut(auth);
          setFirebaseUser(null);
          setProfile(null);
          throw error;
        }
      },
      signOut: async () => {
        await firebaseSignOut(requireAuth());
        setFirebaseUser(null);
        setProfile(null);
        setProfileError(null);
      },
      reloadProfile: async () => {
        const user = requireAuth().currentUser;
        if (!user) {
          setProfile(null);
          return;
        }

        const nextProfile = await getUserProfile(user.uid);
        setProfile(nextProfile);
        setProfileError(null);
      },
    }),
    [firebaseUser, isLoading, profile, profileError]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
