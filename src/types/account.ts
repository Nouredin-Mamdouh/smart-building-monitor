import type { AppRole } from "@/lib/rbac";

export interface AccountUser {
  id: string;
  name: string;
  email: string;
  role: AppRole;
  isActive: boolean;
  deactivatedAt: string | null;
  passwordUpdatedAt: string;
  createdAt: string;
  updatedAt: string;
}

export type ProfileAccount = AccountUser;
