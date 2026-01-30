import { auth } from "@/auth";
import { Navbar } from "@/components/layout/navbar";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { CohortsPageClient } from "./CohortsPageClient";

function formatLocalDate(utcDate: Date): string {
  return new Date(utcDate).toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

export default async function AdminCohortsPage() {
  const session = await auth();
  if (!session) redirect("/login");

  if (session.user?.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const cohorts = await prisma.cohort.findMany({
    orderBy: { startDate: "desc" },
    include: {
      _count: { select: { users: true } },
    },
  });

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar userName={session.user?.name ?? "管理员"} role="ADMIN" />
      <main className="p-8">
        <div className="bg-white rounded-xl shadow-sm border p-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-slate-800">班级管理</h1>
            <CohortsPageClient />
          </div>

          <div className="rounded-md border overflow-x-auto">
            <table className="w-full caption-bottom text-sm">
              <thead className="border-b bg-muted/50">
                <tr>
                  <th className="h-10 px-4 text-left align-middle font-medium">
                    名称
                  </th>
                  <th className="h-10 px-4 text-left align-middle font-medium">
                    开始时间
                  </th>
                  <th className="h-10 px-4 text-left align-middle font-medium">
                    学生人数
                  </th>
                </tr>
              </thead>
              <tbody>
                {cohorts.length === 0 ? (
                  <tr>
                    <td
                      colSpan={3}
                      className="p-4 text-center text-muted-foreground"
                    >
                      暂无班级
                    </td>
                  </tr>
                ) : (
                  cohorts.map((c) => (
                    <tr
                      key={c.id}
                      className="border-b transition-colors hover:bg-muted/50"
                    >
                      <td className="p-4 font-medium">{c.name}</td>
                      <td className="p-4 text-muted-foreground">
                        {formatLocalDate(c.startDate)}
                      </td>
                      <td className="p-4">{c._count.users}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
