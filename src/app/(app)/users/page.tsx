import { redirect } from "next/navigation";
import { UsersManager } from "@/components/users/UsersManager";
import { requireUser } from "@/lib/auth-users";

export default async function UsersPage() {
  const user = await requireUser();

  if (!user) {
    redirect("/login");
  }

  if (user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  return <UsersManager />;
}
