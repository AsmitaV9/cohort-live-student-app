export const USER_ROLES = ['student'] as const;

export type UserRole = (typeof USER_ROLES)[number];

export type UserProfile = {
  uid: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: string;
};

export function isUserRole(value: unknown): value is UserRole {
  return value === 'student';
}
