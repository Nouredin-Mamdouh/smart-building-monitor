"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { AppRole } from "@/lib/rbac";

export interface CurrentUser {
  id: string;
  name: string;
  email: string;
  role: AppRole;
}

const CurrentUserContext = createContext<CurrentUser | null>(null);

export function CurrentUserProvider({ user, children }: { user: CurrentUser; children: ReactNode }) {
  return <CurrentUserContext.Provider value={user}>{children}</CurrentUserContext.Provider>;
}

export function useCurrentUser() {
  const user = useContext(CurrentUserContext);

  if (!user) {
    throw new Error("useCurrentUser must be used inside CurrentUserProvider");
  }

  return user;
}
