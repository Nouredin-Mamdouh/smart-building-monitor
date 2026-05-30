import { redirect } from "next/navigation";
import { auth } from "../../../../auth";
import { Card } from "@/components/common/Card";
import { prisma } from "@/lib/prisma";
import { type AppRole, hasPermission, roleMeta, type Permission } from "@/lib/rbac";

const permissionGroups: Array<{
  label: string;
  permissions: Array<{ label: string; permission: Permission }>;
}> = [
  {
    label: "Rooms",
    permissions: [
      { label: "Create", permission: "room:create" },
      { label: "Edit", permission: "room:update" },
      { label: "Delete", permission: "room:delete" },
    ],
  },
  {
    label: "Sensors",
    permissions: [
      { label: "Create", permission: "sensor:create" },
      { label: "Edit", permission: "sensor:update" },
      { label: "Delete", permission: "sensor:delete" },
    ],
  },
  {
    label: "Alerts",
    permissions: [
      { label: "Create", permission: "alert:create" },
      { label: "Edit or resolve", permission: "alert:update" },
      { label: "Delete", permission: "alert:delete" },
    ],
  },
];

const roles: AppRole[] = ["ADMIN", "OPERATOR", "VIEWER"];

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(value);
}

export default async function UsersRolesPage() {
  const session = await auth();

  if (session?.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const users = await prisma.user.findMany({
    orderBy: [{ role: "asc" }, { email: "asc" }],
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return (
    <div className="space-y-6">
      <Card
        title="Internal Access Model"
        subtitle="This page is read-only. User provisioning remains controlled through secure seed/admin processes."
      >
        <div className="grid gap-4 lg:grid-cols-3">
          {roles.map((role) => {
            const meta = roleMeta[role];

            return (
              <div key={role} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-sm font-bold text-slate-950">{meta.label}</h3>
                  <span className={`rounded-full border px-2.5 py-1 text-xs font-bold ${meta.badgeClassName}`}>
                    {role}
                  </span>
                </div>
                <p className="mt-3 text-sm leading-6 text-slate-600">{meta.description}</p>
              </div>
            );
          })}
        </div>
      </Card>

      <Card title="Permission Matrix" subtitle="UI action visibility mirrors these server-enforced API permissions.">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                <th className="px-5 py-4">Area</th>
                <th className="px-5 py-4">Action</th>
                {roles.map((role) => (
                  <th key={role} className="px-5 py-4 text-center">
                    {roleMeta[role].label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {permissionGroups.flatMap((group) =>
                group.permissions.map((item, index) => (
                  <tr key={`${group.label}-${item.permission}`} className="transition hover:bg-slate-50">
                    <td className="px-5 py-4 font-semibold text-slate-900">{index === 0 ? group.label : ""}</td>
                    <td className="px-5 py-4 text-slate-600">{item.label}</td>
                    {roles.map((role) => {
                      const allowed = hasPermission(role, item.permission);

                      return (
                        <td key={role} className="px-5 py-4 text-center">
                          <span
                            className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-bold ${
                              allowed
                                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                : "border-slate-200 bg-slate-50 text-slate-400"
                            }`}
                          >
                            {allowed ? "Allowed" : "Hidden"}
                          </span>
                        </td>
                      );
                    })}
                  </tr>
                )),
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Card title="Seeded Internal Users" subtitle="Accounts listed here are real database users. No role editing controls are exposed.">
        {users.length === 0 ? (
          <p className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-5 text-sm font-medium text-slate-500">
            No internal users have been seeded yet.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  <th className="px-5 py-4">User</th>
                  <th className="px-5 py-4">Role</th>
                  <th className="px-5 py-4">Created</th>
                  <th className="px-5 py-4">Updated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((user) => {
                  const meta = roleMeta[user.role];

                  return (
                    <tr key={user.id} className="transition hover:bg-slate-50">
                      <td className="px-5 py-4">
                        <p className="font-bold text-slate-900">{user.name}</p>
                        <p className="mt-1 font-mono text-xs text-slate-500">{user.email}</p>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`rounded-full border px-2.5 py-1 text-xs font-bold ${meta.badgeClassName}`}>
                          {meta.label}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-xs font-medium text-slate-500">{formatDate(user.createdAt)}</td>
                      <td className="px-5 py-4 text-xs font-medium text-slate-500">{formatDate(user.updatedAt)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
