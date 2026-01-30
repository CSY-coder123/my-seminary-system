import { auth } from "@/lib/auth";
import { Navbar } from "@/components/layout/navbar";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { CoursesPageClient } from "./CoursesPageClient";

export default async function AdminCoursesPage() {
  const session = await auth();
  if (!session) redirect("/login");

  if ((session.user as { role?: string })?.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const [courses, faculties, cohorts, gradeGroups] = await Promise.all([
    prisma.course.findMany({
      orderBy: { code: "asc" },
      include: {
        instructor: { select: { name: true } },
        cohort: { select: { name: true } },
      },
    }),
    prisma.user.findMany({
      where: { role: "FACULTY" },
      select: { id: true, name: true, email: true },
      orderBy: { name: "asc" },
    }),
    prisma.cohort.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    prisma.grade.groupBy({
      by: ["courseId", "studentId"],
    }),
  ]);

  const studentCountByCourse: Record<string, number> = {};
  for (const g of gradeGroups) {
    studentCountByCourse[g.courseId] =
      (studentCountByCourse[g.courseId] ?? 0) + 1;
  }

  const courseList = courses.map((c) => ({
    id: c.id,
    name: c.name,
    code: c.code,
    cohortId: c.cohortId,
    cohortName: c.cohort.name,
    instructorId: c.instructorId ?? null,
    instructorName: c.instructor?.name ?? "—",
    studentCount: studentCountByCourse[c.id] ?? 0,
    startDate: c.startDate?.toISOString() ?? null,
    endDate: c.endDate?.toISOString() ?? null,
    dayOfWeek: c.dayOfWeek ?? null,
    startTime: c.startTime ?? null,
    endTime: c.endTime ?? null,
  }));

  const facultyList = faculties.map((f) => ({
    id: f.id,
    name: f.name,
    email: f.email,
  }));

  const cohortList = cohorts.map((c) => ({ id: c.id, name: c.name }));

  const coursesForCalendar = courses.map((c) => ({
    id: c.id,
    name: c.name,
    code: c.code,
    startDate: c.startDate?.toISOString() ?? null,
    endDate: c.endDate?.toISOString() ?? null,
    dayOfWeek: c.dayOfWeek ?? null,
    startTime: c.startTime ?? null,
    endTime: c.endTime ?? null,
    instructorName: c.instructor?.name ?? undefined,
    cohortName: c.cohort?.name ?? undefined,
  }));

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar userName={(session.user as { name?: string })?.name ?? "管理员"} role="ADMIN" />
      <main className="p-8">
        <div className="bg-white rounded-xl shadow-sm border p-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-slate-800">
              课程管理 (Course Management)
            </h1>
          </div>
          <CoursesPageClient
            courses={courseList}
            coursesForCalendar={coursesForCalendar}
            faculties={facultyList}
            cohorts={cohortList}
          />
        </div>
      </main>
    </div>
  );
}
