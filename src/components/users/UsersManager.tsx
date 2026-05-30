"use client";

import { useCallback, useEffect, useState } from "react";
import { KeyRound, Pencil, Plus, Power, Trash2 } from "lucide-react";
import { useCurrentUser } from "@/components/auth/CurrentUserProvider";
import {
  createUser,
  deleteUser,
  getUsers,
  resetUserPassword,
  updateUser,
} from "@/lib/account-api";
import { roleMeta } from "@/lib/rbac";
import type { UserCreateInput, UserUpdateInput } from "@/lib/validation";
import type { AccountUser } from "@/types/account";
import { Badge } from "../common/Badge";
import { Card } from "../common/Card";
import { ConfirmDialog } from "../common/ConfirmDialog";
import { EmptyState } from "../common/EmptyState";
import { Feedback } from "../common/Feedback";
import { Toast } from "../common/Toast";
import { PasswordResetDialog } from "./PasswordResetDialog";
import { UserForm } from "./UserForm";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

export function UsersManager() {
  const currentUser = useCurrentUser();
  const [users, setUsers] = useState<AccountUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AccountUser | null>(null);
  const [deletingUser, setDeletingUser] = useState<AccountUser | null>(null);
  const [resettingUser, setResettingUser] = useState<AccountUser | null>(null);
  const dismissToast = useCallback(() => setFeedback(null), []);

  useEffect(() => {
    let isMounted = true;

    getUsers()
      .then((data) => {
        if (isMounted) {
          setUsers(data);
          setError(null);
        }
      })
      .catch((requestError) => {
        if (isMounted) {
          setError(requestError instanceof Error ? requestError.message : "Failed to load users.");
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleCreate = async (input: UserCreateInput | UserUpdateInput) => {
    setIsSubmitting(true);
    setError(null);
    setFeedback(null);

    try {
      const createdUser = await createUser(input as UserCreateInput);
      setUsers((current) => [...current, createdUser].sort((a, b) => a.email.localeCompare(b.email)));
      setIsCreateOpen(false);
      setFeedback("User created.");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Failed to create user.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = async (input: UserCreateInput | UserUpdateInput) => {
    if (!editingUser) {
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setFeedback(null);

    try {
      const updatedUser = await updateUser(editingUser.id, input as UserUpdateInput);
      setUsers((current) => current.map((user) => (user.id === updatedUser.id ? updatedUser : user)));
      setEditingUser(null);
      setFeedback("User updated.");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Failed to update user.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async (user: AccountUser) => {
    setIsSubmitting(true);
    setError(null);
    setFeedback(null);

    try {
      const updatedUser = await updateUser(user.id, {
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: !user.isActive,
      });
      setUsers((current) => current.map((item) => (item.id === updatedUser.id ? updatedUser : item)));
      setFeedback(updatedUser.isActive ? "User reactivated." : "User deactivated.");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Failed to update user status.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPassword = async (password: string) => {
    if (!resettingUser) {
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setFeedback(null);

    try {
      const updatedUser = await resetUserPassword(resettingUser.id, { password });
      setUsers((current) => current.map((item) => (item.id === updatedUser.id ? updatedUser : item)));
      setResettingUser(null);
      setFeedback("Password reset.");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Failed to reset password.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingUser) {
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setFeedback(null);

    try {
      await deleteUser(deletingUser.id);
      setUsers((current) => current.filter((user) => user.id !== deletingUser.id));
      setDeletingUser(null);
      setFeedback("User deleted.");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Failed to delete user.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <Card>Loading users...</Card>;
  }

  return (
    <div className="space-y-6">
      {error && <Feedback type="error" message={error} />}
      <Toast message={feedback} onDismiss={dismissToast} />

      <Card>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-bold text-slate-950">Internal Accounts</p>
            <p className="mt-1 text-xs font-medium text-slate-500">Create accounts and control access for your team.</p>
          </div>
          <button
            type="button"
            onClick={() => {
              setEditingUser(null);
              setIsCreateOpen(true);
            }}
            className="inline-flex items-center gap-2 rounded-lg bg-slate-950 px-3 py-2 text-xs font-semibold text-white transition hover:bg-slate-800"
          >
            <Plus size={15} />
            Add user
          </button>
        </div>
      </Card>

      {isCreateOpen && (
        <Card title="Create User">
          <UserForm
            mode="create"
            isSubmitting={isSubmitting}
            onCancel={() => setIsCreateOpen(false)}
            onSubmit={handleCreate}
          />
        </Card>
      )}

      {editingUser && (
        <Card title="Edit User">
          <UserForm
            mode="edit"
            user={editingUser}
            isSelf={editingUser.id === currentUser.id}
            isSubmitting={isSubmitting}
            onCancel={() => setEditingUser(null)}
            onSubmit={handleEdit}
          />
        </Card>
      )}

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        {users.length === 0 ? (
          <EmptyState title="No users found" message="Create the first internal user account." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1080px] border-collapse text-left">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  <th className="px-5 py-4">User</th>
                  <th className="px-5 py-4 text-center">Role</th>
                  <th className="px-5 py-4 text-center">Status</th>
                  <th className="px-5 py-4 text-center">Password Updated</th>
                  <th className="px-5 py-4 text-center">Created</th>
                  <th className="px-5 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {users.map((user) => {
                  const meta = roleMeta[user.role];
                  const isSelf = user.id === currentUser.id;

                  return (
                    <tr key={user.id} className="transition hover:bg-slate-50">
                      <td className="px-5 py-4">
                        <p className="font-bold text-slate-900">{user.name}</p>
                        <p className="mt-1 font-mono text-xs text-slate-500">{user.email}</p>
                      </td>
                      <td className="px-5 py-4 text-center">
                        <span className={`rounded-full border px-2.5 py-1 text-xs font-bold ${meta.badgeClassName}`}>
                          {meta.label}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-center">
                        <Badge variant={user.isActive ? "success" : "inactive"} showDot>
                          {user.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </td>
                      <td className="px-5 py-4 text-center text-xs font-medium text-slate-500">
                        {formatDate(user.passwordUpdatedAt)}
                      </td>
                      <td className="px-5 py-4 text-center text-xs font-medium text-slate-500">
                        {formatDate(user.createdAt)}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex flex-wrap justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setEditingUser(user)}
                            className="rounded-lg border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-50 hover:text-slate-900"
                            aria-label={`Edit ${user.name}`}
                          >
                            <Pencil size={15} />
                          </button>
                          {!isSelf && (
                            <button
                              type="button"
                              onClick={() => setResettingUser(user)}
                              className="rounded-lg border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-50 hover:text-slate-900"
                              aria-label={`Reset password for ${user.name}`}
                            >
                              <KeyRound size={15} />
                            </button>
                          )}
                          {!isSelf && (
                            <button
                              type="button"
                              disabled={isSubmitting}
                              onClick={() => void handleToggleActive(user)}
                              className="rounded-lg border border-amber-200 p-2 text-amber-600 transition hover:bg-amber-50 disabled:opacity-60"
                              aria-label={`${user.isActive ? "Deactivate" : "Reactivate"} ${user.name}`}
                            >
                              <Power size={15} />
                            </button>
                          )}
                          {!isSelf && (
                            <button
                              type="button"
                              onClick={() => setDeletingUser(user)}
                              className="rounded-lg border border-rose-200 p-2 text-rose-500 transition hover:bg-rose-50"
                              aria-label={`Delete ${user.name}`}
                            >
                              <Trash2 size={15} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {resettingUser && (
        <PasswordResetDialog
          user={resettingUser}
          isBusy={isSubmitting}
          onCancel={() => setResettingUser(null)}
          onConfirm={handleResetPassword}
        />
      )}

      {deletingUser && (
        <ConfirmDialog
          title="Delete user?"
          message={`This permanently removes ${deletingUser.name}'s account. Deactivate the user instead if you need to preserve the account for later use.`}
          isBusy={isSubmitting}
          onCancel={() => setDeletingUser(null)}
          onConfirm={handleDelete}
        />
      )}
    </div>
  );
}
