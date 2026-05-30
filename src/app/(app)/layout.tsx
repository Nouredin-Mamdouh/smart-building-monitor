import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { CurrentUserProvider, type CurrentUser } from "@/components/auth/CurrentUserProvider";
import { requireUser } from "@/lib/auth-users";

export default async function AuthenticatedAppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await requireUser();

  if (!user) {
    redirect("/login");
  }

  const currentUser: CurrentUser = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };

  return (
    <CurrentUserProvider user={currentUser}>
      <AppShell>{children}</AppShell>
    </CurrentUserProvider>
  );
}
