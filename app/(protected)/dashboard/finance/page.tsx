import { auth } from "@/auth";
import { Navbar } from "@/components/layout/navbar";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { FinancePageClient } from "./FinancePageClient";

export default async function FinancePage() {
  const session = await auth();
  if (!session) redirect("/login");

  if (session.user?.role !== "FINANCE") {
    redirect("/dashboard");
  }

  const students = await prisma.user.findMany({
    where: { role: "STUDENT" },
    select: {
      id: true,
      name: true,
      email: true,
      tuitionPaid: true,
      cohort: { select: { name: true } },
    },
    orderBy: [{ cohortId: "asc" }, { name: "asc" }],
  });

  const studentList = students.map((s) => ({
    id: s.id,
    name: s.name,
    email: s.email,
    tuitionPaid: s.tuitionPaid,
    cohortName: s.cohort?.name ?? "—",
  }));

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar userName={session.user?.name ?? "财务员"} role="财务员" />
      <main className="p-8">
        <div className="bg-white rounded-xl shadow-sm border p-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-slate-800">学费管理看板</h1>
            <FinancePageClient students={studentList} />
          </div>

          <div className="rounded-md border overflow-x-auto">
            <table className="w-full caption-bottom text-sm">
              <thead className="border-b bg-muted/50">
                <tr>
                  <th className="h-10 px-4 text-left align-middle font-medium">姓名</th>
                  <th className="h-10 px-4 text-left align-middle font-medium">班级</th>
                </tr>
              </thead>
              <tbody>
                {studentList.length === 0 ? (
                  <tr>
                    <td colSpan={2} className="p-4 text-center text-muted-foreground">
                      暂无学生数据
                    </td>
                  </tr>
                ) : (
                  studentList.map((s) => (
                    <tr key={s.id} className="border-b transition-colors hover:bg-muted/50">
                      <td className="p-4">
                        <span
                          className={
                            s.tuitionPaid === false
                              ? "font-medium text-orange-600"
                              : "font-medium text-foreground"
                          }
                        >
                          {s.name ?? s.email ?? "—"}
                          {s.tuitionPaid === false ? " ❌ 欠费" : " ✅ 已交"}
                        </span>
                      </td>
                      <td className="p-4 text-muted-foreground">{s.cohortName}</td>
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
