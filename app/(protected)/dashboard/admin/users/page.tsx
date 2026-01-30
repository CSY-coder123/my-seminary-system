import { auth } from "@/auth";
import { Navbar } from "@/components/layout/navbar";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { UserCreateDialog } from "@/components/business/UserCreateDialog";
import { UsersPageClient } from "./UsersPageClient";

export default async function AdminUsersPage() {
  const session = await auth();
  if (!session) redirect("/login");

  if (session.user?.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const [users, cohorts] = await Promise.all([
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        cohortId: true,
        isMonitor: true,
        cohort: { select: { name: true } },
      },
    }),
    prisma.cohort.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  const userList = users.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    cohortId: u.cohortId,
    cohortName: u.cohort?.name ?? null,
    isMonitor: u.isMonitor,
  }));

  const cohortList = cohorts.map((c) => ({ id: c.id, name: c.name }));

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar userName={session.user?.name ?? "管理员"} role="ADMIN" />
      <main className="p-8">
        <div className="bg-white rounded-xl shadow-sm border p-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-slate-800">用户管理</h1>
            <UserCreateDialog cohorts={cohortList} />
          </div>
          <div className="rounded-md border overflow-x-auto">
            <UsersPageClient users={userList} cohorts={cohortList} />
          </div>
        </div>
      </main>
    </div>
  );
}
