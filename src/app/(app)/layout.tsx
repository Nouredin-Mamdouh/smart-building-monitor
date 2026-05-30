import { redirect } from "next/navigation";
import { auth } from "../../../auth";
import { AppShell } from "@/components/layout/AppShell";
import { CurrentUserProvider, type CurrentUser } from "@/components/auth/CurrentUserProvider";
import { isAppRole } from "@/lib/rbac";

export default async function AuthenticatedAppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const currentUser: CurrentUser = {
    id: session.user.id,
    name: session.user.name ?? "Internal User",
    email: session.user.email ?? "",
    role: isAppRole(session.user.role) ? session.user.role : "VIEWER",
  };

  return (
    <CurrentUserProvider user={currentUser}>
      <AppShell>{children}</AppShell>
    </CurrentUserProvider>
  );
}
