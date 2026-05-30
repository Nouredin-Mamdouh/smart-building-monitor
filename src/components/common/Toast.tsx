"use client";

import { useEffect } from "react";

interface ToastProps {
  message: string | null;
  type?: "success" | "error";
  onDismiss: () => void;
}

const styles = {
  success: "border-emerald-200 bg-emerald-50 text-emerald-800",
  error: "border-rose-200 bg-rose-50 text-rose-800",
};

export function Toast({ message, type = "success", onDismiss }: ToastProps) {
  useEffect(() => {
    if (!message) {
      return;
    }

    const timeout = window.setTimeout(onDismiss, 3200);
    return () => window.clearTimeout(timeout);
  }, [message, onDismiss]);

  if (!message) {
    return null;
  }

  return (
    <div className="fixed bottom-5 right-5 z-50 max-w-sm rounded-lg border bg-white px-4 py-3 text-sm font-semibold shadow-xl">
      <div className={`rounded-md border px-3 py-2 ${styles[type]}`}>{message}</div>
    </div>
  );
}
