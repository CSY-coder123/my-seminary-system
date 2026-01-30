import { auth } from "@/auth";
import { Navbar } from "@/components/layout/navbar";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { VisaPageClient } from "./VisaPageClient";
import { VisaRegistryTable } from "./VisaRegistryTable";

function formatLocalDate(utcDate: Date): string {
  const d = new Date(utcDate);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function getDaysLeft(expiryDate: Date): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const exp = new Date(expiryDate);
  exp.setHours(0, 0, 0, 0);
  return Math.ceil((exp.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
}

type BadgeVariant = "destructive" | "warning" | "success";

function getBadgeVariant(daysLeft: number): BadgeVariant {
  if (daysLeft < 30) return "destructive";
  if (daysLeft < 90) return "warning";
  return "success";
}

export default async function VisaPage() {
  const session = await auth();
  if (!session) redirect("/login");

  if ((session.user as { role?: string })?.role !== "VISA_OFFICER") {
    redirect("/dashboard");
  }

  const [totalInternationalCount, internationalWithVisa, internationalNoVisa, allStudents] =
    await Promise.all([
      prisma.user.count({ where: { isInternational: true } }),
      prisma.user.findMany({
        where: { role: "STUDENT", isInternational: true, visaRecord: { isNot: null } },
        include: {
          cohort: { select: { name: true } },
          visaRecord: true,
        },
      }),
      prisma.user.findMany({
        where: { role: "STUDENT", isInternational: true, visaRecord: null },
        include: { cohort: { select: { name: true } } },
      }),
      prisma.user.findMany({
        where: { role: "STUDENT" },
        select: {
          id: true,
          name: true,
          email: true,
          isInternational: true,
          cohort: { select: { name: true } },
        },
        orderBy: { name: "asc" },
      }),
    ]);

  const now = new Date();
  const in90Days = new Date(now);
  in90Days.setDate(in90Days.getDate() + 90);

  const recordsSorted = [...internationalWithVisa]
    .filter((u) => u.visaRecord)
    .sort(
      (a, b) =>
        new Date(a.visaRecord!.expiryDate).getTime() -
        new Date(b.visaRecord!.expiryDate).getTime()
    );

  const expiringIn90Count = recordsSorted.filter(
    (u) => new Date(u.visaRecord!.expiryDate) <= in90Days
  ).length;

  const PENDING_EXPIRY_STR = "2099-12-31";
  const list = recordsSorted.map((u) => {
    const r = u.visaRecord!;
    const daysLeft = getDaysLeft(r.expiryDate);
    const expiryStr = formatLocalDate(r.expiryDate);
    const inputDateStr = new Date(r.expiryDate).toISOString().slice(0, 10);
    const isPendingVerification =
      inputDateStr === PENDING_EXPIRY_STR && !!r.documentUrl;
    return {
      id: r.id,
      userId: u.id,
      passportNumber: r.passportNumber,
      expiryDate: inputDateStr,
      expiryDateDisplay: expiryStr,
      userName: u.name ?? u.email ?? "—",
      cohortName: u.cohort?.name ?? "—",
      daysLeft,
      badgeVariant: getBadgeVariant(daysLeft),
      documentUrl: r.documentUrl ?? null,
      isPendingVerification,
    };
  });

  const noRecordRows = internationalNoVisa.map((u) => ({
    userId: u.id,
    userName: u.name ?? u.email ?? "—",
    cohortName: u.cohort?.name ?? "—",
  }));

  const dialogRecords = list.map((r) => ({
    id: r.id,
    userId: r.userId,
    passportNumber: r.passportNumber,
    expiryDate: r.expiryDate,
    userName: r.userName,
    documentUrl: r.documentUrl ?? undefined,
  }));

  const studentRegistry = allStudents.map((u) => ({
    id: u.id,
    name: u.name ?? u.email ?? "—",
    email: u.email,
    cohortName: u.cohort?.name ?? "—",
    isInternational: u.isInternational,
  }));

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar
        userName={(session.user as { name?: string })?.name ?? "签证官"}
        role="VISA_OFFICER"
      />
      <main className="p-4 sm:p-6 lg:p-8">
        <div className="max-w-5xl mx-auto space-y-6">
          <h1 className="text-2xl font-bold text-slate-800">签证预警看板</h1>

          {/* 统计卡片 */}
          <div className="grid gap-4 sm:grid-cols-2">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>即将过期 (90天内)</CardDescription>
              </CardHeader>
              <CardContent>
                <CardTitle className="text-3xl text-amber-600">
                  {expiringIn90Count}
                </CardTitle>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>总国际生</CardDescription>
              </CardHeader>
              <CardContent>
                <CardTitle className="text-3xl">{totalInternationalCount}</CardTitle>
              </CardContent>
            </Card>
          </div>

          {/* 签证预警列表：仅国际生，含「未登记」+ 创建记录 */}
          <Card>
            <CardHeader>
              <CardTitle>签证列表</CardTitle>
              <CardDescription>
                仅显示国际生；按到期日升序，即将过期的排在最前
              </CardDescription>
            </CardHeader>
            <CardContent>
              <VisaPageClient
                list={list}
                noRecordRows={noRecordRows}
                dialogRecords={dialogRecords}
                studentRegistry={studentRegistry}
              />
            </CardContent>
          </Card>

          {/* 国际生管理：所有学生 + Switch 标记国际生 */}
          <Card>
            <CardHeader>
              <CardTitle>国际生管理 (International Student Registry)</CardTitle>
              <CardDescription>
                所有学生列表，通过开关标记是否为国际生
              </CardDescription>
            </CardHeader>
            <CardContent>
              <VisaRegistryTable studentRegistry={studentRegistry} />
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
