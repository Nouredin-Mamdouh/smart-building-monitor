"use client";

import { useState } from "react";
import type { AccountUser } from "@/types/account";
import { FormField, TextInput } from "../common/FormField";

export function PasswordResetDialog({
  user,
  isBusy,
  onCancel,
  onConfirm,
}: {
  user: AccountUser;
  isBusy: boolean;
  onCancel: () => void;
  onConfirm: (password: string) => Promise<void>;
}) {
  const [password, setPassword] = useState("");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4">
      <form
        onSubmit={(event) => {
          event.preventDefault();
          void onConfirm(password);
        }}
        className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-5 shadow-2xl"
      >
        <h2 className="text-lg font-bold text-slate-950">Reset password</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Set a new temporary password for {user.name}. Share it through your approved internal channel.
        </p>

        <div className="mt-4">
          <FormField label="New temporary password">
            <TextInput
              required
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </FormField>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={isBusy}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isBusy}
            className="rounded-lg bg-slate-950 px-3 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
          >
            {isBusy ? "Saving..." : "Reset password"}
          </button>
        </div>
      </form>
    </div>
  );
}
