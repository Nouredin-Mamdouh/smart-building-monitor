"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { changeProfilePassword, getProfile, updateProfile } from "@/lib/account-api";
import { roleMeta } from "@/lib/rbac";
import type { ProfilePasswordInput, ProfileUpdateInput } from "@/lib/validation";
import type { ProfileAccount } from "@/types/account";
import { Card } from "../common/Card";
import { Feedback } from "../common/Feedback";
import { FormField, TextInput } from "../common/FormField";
import { Toast } from "../common/Toast";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

export function ProfileSettings() {
  const router = useRouter();
  const [profile, setProfile] = useState<ProfileAccount | null>(null);
  const [name, setName] = useState("");
  const [passwordValues, setPasswordValues] = useState<ProfilePasswordInput>({
    currentPassword: "",
    newPassword: "",
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const dismissToast = useCallback(() => setFeedback(null), []);

  useEffect(() => {
    let isMounted = true;

    getProfile()
      .then((data) => {
        if (isMounted) {
          setProfile(data);
          setName(data.name);
          setError(null);
        }
      })
      .catch((requestError) => {
        if (isMounted) {
          setError(requestError instanceof Error ? requestError.message : "Failed to load profile.");
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

  const handleProfileSubmit = async (input: ProfileUpdateInput) => {
    setIsSubmitting(true);
    setError(null);
    setFeedback(null);

    try {
      const updatedProfile = await updateProfile(input);
      setProfile(updatedProfile);
      setName(updatedProfile.name);
      setFeedback("Profile updated.");
      router.refresh();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Failed to update profile.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePasswordSubmit = async (input: ProfilePasswordInput) => {
    setIsSubmitting(true);
    setError(null);
    setFeedback(null);

    try {
      const updatedProfile = await changeProfilePassword(input);
      setProfile(updatedProfile);
      setPasswordValues({
        currentPassword: "",
        newPassword: "",
      });
      setFeedback("Password changed.");
    } catch (requestError) {
      setPasswordValues({
        currentPassword: "",
        newPassword: "",
      });
      setError(requestError instanceof Error ? requestError.message : "Failed to change password.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <Card>Loading profile...</Card>;
  }

  const role = profile ? roleMeta[profile.role] : null;

  return (
    <div className="space-y-6">
      {error && <Feedback type="error" message={error} />}
      <Toast message={feedback} onDismiss={dismissToast} />

      {profile && role && (
        <Card title="Account" subtitle="Your current sign-in and access information.">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Email</p>
              <p className="mt-1 font-mono text-sm font-semibold text-slate-800">{profile.email}</p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Role</p>
              <span className={`mt-1 inline-flex rounded-full border px-2.5 py-1 text-xs font-bold ${role.badgeClassName}`}>
                {role.label}
              </span>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Status</p>
              <p className="mt-1 text-sm font-semibold text-slate-800">{profile.isActive ? "Active" : "Inactive"}</p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Password updated</p>
              <p className="mt-1 text-sm font-semibold text-slate-800">{formatDate(profile.passwordUpdatedAt)}</p>
            </div>
          </div>
        </Card>
      )}

      <Card title="Profile" subtitle="Update your display name.">
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void handleProfileSubmit({ name });
          }}
          className="space-y-4"
        >
          <FormField label="Display name">
            <TextInput required value={name} onChange={(event) => setName(event.target.value)} />
          </FormField>

          <div className="flex justify-end border-t border-slate-100 pt-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-lg bg-slate-950 px-3 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
            >
              {isSubmitting ? "Saving..." : "Save profile"}
            </button>
          </div>
        </form>
      </Card>

      <Card title="Password" subtitle="Change your password.">
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void handlePasswordSubmit(passwordValues);
          }}
          className="space-y-4"
        >
          <div className="grid gap-4 md:grid-cols-2">
            <FormField label="Current password">
              <TextInput
                required
                type="password"
                value={passwordValues.currentPassword}
                onChange={(event) =>
                  setPasswordValues((current) => ({
                    ...current,
                    currentPassword: event.target.value,
                  }))
                }
              />
            </FormField>
            <FormField label="New password">
              <TextInput
                required
                type="password"
                value={passwordValues.newPassword}
                onChange={(event) =>
                  setPasswordValues((current) => ({
                    ...current,
                    newPassword: event.target.value,
                  }))
                }
              />
            </FormField>
          </div>
          <p className="text-xs font-medium text-slate-500">
            Use at least 10 characters with uppercase, lowercase, and a number.
          </p>

          <div className="flex justify-end border-t border-slate-100 pt-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-lg bg-slate-950 px-3 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
            >
              {isSubmitting ? "Saving..." : "Change password"}
            </button>
          </div>
        </form>
      </Card>
    </div>
  );
}
