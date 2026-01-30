import { auth } from "@/lib/auth";
import { Navbar } from "@/components/layout/navbar";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

function formatLocalDate(utcDate: Date): string {
  return new Date(utcDate).toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function AdminPage() {
  const session = await auth();
  if (!session) redirect("/login");

  if ((session.user as { role?: string })?.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const [studentCount, facultyCount, cohortCount, courseCount, repairingAssetCount, recentStudents] =
    await Promise.all([
      prisma.user.count({ where: { role: "STUDENT" } }),
      prisma.user.count({ where: { role: "FACULTY" } }),
      prisma.cohort.count(),
      prisma.course.count(),
      prisma.fixedAsset.count({ where: { status: "REPAIRING" } }),
      prisma.user.findMany({
        where: { role: "STUDENT" },
        select: { id: true, name: true, email: true, createdAt: true },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
    ]);

  const stats = [
    { label: "学生总数", value: studentCount },
    { label: "教师总数", value: facultyCount },
    { label: "班级总数", value: cohortCount },
    { label: "总课程数", value: courseCount },
    { label: "待处理资产维修数", value: repairingAssetCount },
  ];

  const quickActions = [
    { href: "/dashboard/admin/users", label: "用户管理" },
    { href: "/dashboard/admin/cohorts", label: "班级管理" },
    { href: "/dashboard/admin/courses", label: "课程管理 (Courses)" },
    { href: "/dashboard/admin/assets", label: "资产管理" },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar userName={session.user?.name ?? "管理员"} role="ADMIN" />
      <main className="p-8">
        <div className="space-y-8">
          <h1 className="text-2xl font-bold text-slate-800">系统管理控制台</h1>

          {/* 顶部统计栏 */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat) => (
              <Card key={stat.label}>
                <CardHeader className="pb-2">
                  <CardDescription>{stat.label}</CardDescription>
                </CardHeader>
                <CardContent>
                  <CardTitle className="text-3xl">{stat.value}</CardTitle>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* 功能快捷入口 */}
          <Card>
            <CardHeader>
              <CardTitle>快捷入口</CardTitle>
              <CardDescription>常用管理功能</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {quickActions.map((action) => (
                  <Button key={action.href} variant="outline" size="lg" asChild>
                    <Link href={action.href} className="h-auto py-4 flex flex-col items-center justify-center gap-1">
                      <span className="font-medium">{action.label}</span>
                    </Link>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* 最近加入学生 */}
          <Card>
            <CardHeader>
              <CardTitle>最近加入学生</CardTitle>
              <CardDescription>前 5 名，按注册时间倒序</CardDescription>
            </CardHeader>
            <CardContent>
              {recentStudents.length === 0 ? (
                <p className="text-sm text-muted-foreground">暂无学生数据</p>
              ) : (
                <ul className="divide-y divide-border">
                  {recentStudents.map((s) => (
                    <li
                      key={s.id}
                      className="py-3 flex justify-between items-center text-sm"
                    >
                      <span className="font-medium">
                        {s.name ?? s.email ?? "—"}
                      </span>
                      <span className="text-muted-foreground">
                        {formatLocalDate(s.createdAt)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
