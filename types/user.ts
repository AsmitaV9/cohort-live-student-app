export const USER_ROLES = ['student'] as const;

export type UserRole = (typeof USER_ROLES)[number];

export type UserProfile = {
  uid: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: string;
  /** Set on the web portal (profile completion / registration); used for Mock Tests. */
  department?: string;
  prn?: string;
  batch?: string;
  /** pending | active | disabled (portal approval); missing for older app-only accounts. */
  status?: string;
};

export function isUserRole(value: unknown): value is UserRole {
  return value === 'student';
}
