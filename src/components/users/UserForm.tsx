"use client";

import { useState } from "react";
import type { AppRole } from "@/lib/rbac";
import type { UserCreateInput, UserUpdateInput } from "@/lib/validation";
import type { AccountUser } from "@/types/account";
import { FormField, SelectInput, TextInput } from "../common/FormField";

type UserFormMode = "create" | "edit";

export function UserForm({
  mode,
  user,
  isSelf = false,
  isSubmitting,
  onCancel,
  onSubmit,
}: {
  mode: UserFormMode;
  user?: AccountUser | null;
  isSelf?: boolean;
  isSubmitting: boolean;
  onCancel: () => void;
  onSubmit: (input: UserCreateInput | UserUpdateInput) => Promise<void>;
}) {
  const [values, setValues] = useState({
    name: user?.name ?? "",
    email: user?.email ?? "",
    role: (user?.role ?? "VIEWER") as AppRole,
    isActive: user?.isActive ?? true,
    password: "",
  });

  const setValue = (name: keyof typeof values, value: string | boolean) => {
    setValues((current) => ({
      ...current,
      [name]: value,
    }));
  };

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();

        if (mode === "create") {
          void onSubmit({
            name: values.name,
            email: values.email,
            role: values.role,
            password: values.password,
          });
          return;
        }

        void onSubmit({
          name: values.name,
          email: values.email,
          role: values.role,
          isActive: values.isActive,
        });
      }}
      className="space-y-4"
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <FormField label="Name">
          <TextInput
            required
            value={values.name}
            onChange={(event) => setValue("name", event.target.value)}
          />
        </FormField>
        <FormField label="Email">
          <TextInput
            required
            type="email"
            value={values.email}
            onChange={(event) => setValue("email", event.target.value)}
          />
        </FormField>
        <FormField label="Role">
          <SelectInput
            value={values.role}
            disabled={mode === "edit" && isSelf}
            onChange={(event) => setValue("role", event.target.value as AppRole)}
          >
            <option value="ADMIN">Admin</option>
            <option value="OPERATOR">Operator</option>
            <option value="VIEWER">Viewer</option>
          </SelectInput>
        </FormField>
        {mode === "edit" ? (
          <FormField label="Status">
            <SelectInput
              value={values.isActive ? "ACTIVE" : "INACTIVE"}
              disabled={isSelf}
              onChange={(event) => setValue("isActive", event.target.value === "ACTIVE")}
            >
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </SelectInput>
          </FormField>
        ) : (
          <FormField label="Temporary password">
            <TextInput
              required
              type="password"
              value={values.password}
              onChange={(event) => setValue("password", event.target.value)}
            />
          </FormField>
        )}
      </div>

      {mode === "create" && (
        <p className="text-xs font-medium text-slate-500">
          Passwords are hashed immediately and are not shown again after the account is created.
        </p>
      )}

      <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-lg bg-slate-950 px-3 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
        >
          {isSubmitting ? "Saving..." : mode === "create" ? "Create user" : "Save user"}
        </button>
      </div>
    </form>
  );
}
