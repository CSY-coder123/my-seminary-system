import { auth } from "@/lib/auth";
import { Navbar } from "@/components/layout/navbar";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { GradeForm } from "./GradeForm";

export default async function FacultyGradePage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const session = await auth();
  if (!session) redirect("/login");

  const userId = (session.user as { id?: string })?.id;
  const role = (session.user as { role?: string })?.role;
  if (!userId || role !== "FACULTY") redirect("/dashboard");

  const { courseId } = await params;

  const course = await prisma.course.findFirst({
    where: { id: courseId, instructorId: userId },
    select: {
      id: true,
      name: true,
      code: true,
      cohortId: true,
      cohort: { select: { name: true } },
    },
  });

  if (!course?.cohortId) notFound();

  const [students, grades] = await Promise.all([
    prisma.user.findMany({
      where: { cohortId: course.cohortId, role: "STUDENT" },
      select: { id: true, name: true, email: true },
      orderBy: { name: "asc" },
    }),
    prisma.grade.findMany({
      where: { courseId },
      select: { studentId: true, score: true, feedback: true },
    }),
  ]);

  const gradeByStudentId = Object.fromEntries(
    grades.map((g) => [g.studentId, { score: g.score, feedback: g.feedback ?? "" }])
  );

  const rows = students.map((s) => ({
    studentId: s.id,
    name: s.name ?? "—",
    email: s.email,
    score: gradeByStudentId[s.id]?.score ?? "",
    feedback: gradeByStudentId[s.id]?.feedback ?? "",
  }));

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar
        userName={(session.user as { name?: string })?.name ?? "教师"}
        role="FACULTY"
      />
      <main className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
        <div className="mb-4">
          <Link
            href="/dashboard/faculty"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            ← 返回教师工作台
          </Link>
        </div>
        <div className="rounded-xl border bg-white shadow-sm p-6">
          <h1 className="text-xl font-bold text-slate-800 mb-1">
            {course.name}（{course.code}）
          </h1>
          <p className="text-sm text-muted-foreground mb-6">
            {course.cohort?.name} · 成绩管理
          </p>
          <GradeForm courseId={courseId} initialRows={rows} />
        </div>
      </main>
    </div>
  );
}
