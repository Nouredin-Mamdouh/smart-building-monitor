import type { AccountUser, ProfileAccount } from "@/types/account";
import type {
  ProfilePasswordInput,
  ProfileUpdateInput,
  UserCreateInput,
  UserPasswordResetInput,
  UserUpdateInput,
} from "@/lib/validation";

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
    ...init,
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    throw new Error(payload?.error ?? `Request failed for ${path}: ${response.status}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export function getUsers() {
  return requestJson<AccountUser[]>("/api/users");
}

export function createUser(input: UserCreateInput) {
  return requestJson<AccountUser>("/api/users", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateUser(id: string, input: UserUpdateInput) {
  return requestJson<AccountUser>(`/api/users/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function deleteUser(id: string) {
  return requestJson<void>(`/api/users/${id}`, {
    method: "DELETE",
  });
}

export function resetUserPassword(id: string, input: UserPasswordResetInput) {
  return requestJson<AccountUser>(`/api/users/${id}/password`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function getProfile() {
  return requestJson<ProfileAccount>("/api/profile");
}

export function updateProfile(input: ProfileUpdateInput) {
  return requestJson<ProfileAccount>("/api/profile", {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function changeProfilePassword(input: ProfilePasswordInput) {
  return requestJson<ProfileAccount>("/api/profile/password", {
    method: "POST",
    body: JSON.stringify(input),
  });
}
