import { Suspense } from "react";
import { Building2 } from "lucide-react";
import { LoginForm } from "@/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-12">
      <section className="w-full max-w-md overflow-hidden rounded-lg border border-slate-800 bg-white shadow-2xl">
        <div className="bg-slate-900 px-6 py-8 text-white">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-500 text-slate-950">
              <Building2 size={20} />
            </div>
            <div>
              <h1 className="text-lg font-bold">Smart Building Monitor</h1>
              <p className="text-xs font-medium text-slate-400">Internal operations access</p>
            </div>
          </div>
        </div>
        <div className="px-6 py-6">
          <Suspense>
            <LoginForm />
          </Suspense>
        </div>
      </section>
    </main>
  );
}
