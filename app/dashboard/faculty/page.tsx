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
import { CourseCalendar } from "@/components/business/CourseCalendar";

export default async function FacultyPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const userId = (session.user as { id?: string })?.id;
  if (!userId || (session.user as { role?: string })?.role !== "FACULTY") {
    redirect("/dashboard");
  }

  const courses = await prisma.course.findMany({
    where: { instructorId: userId },
    orderBy: { code: "asc" },
    select: {
      id: true,
      code: true,
      name: true,
      cohortId: true,
      startDate: true,
      endDate: true,
      dayOfWeek: true,
      startTime: true,
      endTime: true,
      cohort: { select: { name: true } },
      instructor: { select: { name: true } },
      _count: { select: { submissions: true } },
      grades: { select: { studentId: true } },
    },
  });

  const displayName = (session.user as { name?: string })?.name ?? session.user?.email ?? "Professor";

  // 班务监督：各班级今日值日、各课程最近一次考勤
  const cohortIds = Array.from(new Set(courses.map((c) => c.cohortId).filter(Boolean))) as string[];
  const todayStart = new Date();
  todayStart.setUTCHours(0, 0, 0, 0);
  const todayEnd = new Date(todayStart);
  todayEnd.setUTCDate(todayEnd.getUTCDate() + 1);

  const [todayDuties, latestAttendances] = await Promise.all([
    cohortIds.length > 0
      ? prisma.dutyRecord.findMany({
          where: {
            cohortId: { in: cohortIds },
            date: { gte: todayStart, lt: todayEnd },
          },
          orderBy: { date: "asc" },
          include: { assignees: { select: { name: true } } },
        })
      : [],
    prisma.attendance.findMany({
      where: { courseId: { in: courses.map((c) => c.id) } },
      orderBy: { date: "desc" },
      select: {
        courseId: true,
        date: true,
        status: true,
        student: { select: { name: true } },
      },
    }),
  ]);

  const dutyByCohortId: Record<string, string> = Object.fromEntries(
    todayDuties.map((d) => [
      d.cohortId,
      d.assignees.map((a) => a.name ?? "—").filter(Boolean).join("、") || "—",
    ])
  );

  // 每门课取最近一次考勤日期下的所有记录
  const attendanceByCourseId: Record<
    string,
    { date: string; entries: { studentName: string | null; status: string }[] }
  > = {};
  for (const c of courses) {
    const forCourse = latestAttendances.filter((a) => a.courseId === c.id);
    if (forCourse.length === 0) continue;
    const latestDate = forCourse[0].date;
    const latestDayStr = latestDate.toISOString().slice(0, 10);
    const onThatDate = forCourse.filter(
      (a) => a.date.toISOString().slice(0, 10) === latestDayStr
    );
    attendanceByCourseId[c.id] = {
      date: latestDayStr,
      entries: onThatDate.map((a) => ({
        studentName: a.student?.name ?? null,
        status: a.status,
      })),
    };
  }

  const courseList = courses.map((c) => ({
    id: c.id,
    code: c.code,
    name: c.name,
    cohortId: c.cohortId ?? null,
    cohortName: c.cohort?.name ?? "—",
    submissionCount: c._count.submissions,
    studentCount: new Set(c.grades.map((g) => g.studentId)).size,
    todayDutyName: c.cohortId ? dutyByCohortId[c.cohortId] ?? null : null,
    latestAttendance: attendanceByCourseId[c.id] ?? null,
  }));

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
      <Navbar userName={displayName} role="FACULTY" />
      <main className="p-4 sm:p-6 lg:p-8">
        <div className="max-w-5xl mx-auto space-y-6">
          {/* 顶部欢迎语 */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xl sm:text-2xl">
                Welcome, Professor {displayName}
              </CardTitle>
              <CardDescription>
                教师工作台
              </CardDescription>
            </CardHeader>
          </Card>

          {/* 课程日历 */}
          {coursesForCalendar.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>课程日历 (Schedule)</CardTitle>
                <CardDescription>
                  按周/月查看授课安排
                </CardDescription>
              </CardHeader>
              <CardContent>
                <CourseCalendar
                  courses={coursesForCalendar}
                  defaultView="week"
                  height={420}
                />
              </CardContent>
            </Card>
          )}

          {/* 核心区域：课程卡片或空状态 */}
          {courseList.length === 0 ? (
            <Card>
              <CardContent className="py-12 px-6 text-center">
                <p className="text-muted-foreground text-base">
                  您当前学期没有分配课程，请联系管理员分配。
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {courseList.map((course) => (
                <Card key={course.id} className="flex flex-col">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">{course.name}</CardTitle>
                    <CardDescription>
                      {course.code} · {course.cohortName}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1 space-y-4">
                    <p className="text-sm text-muted-foreground">
                      学生数：{course.studentCount} · 作业提交：{course.submissionCount}
                    </p>
                    {/* 班务监督：只读，今日值日 + 最近考勤（由班长录入，教师仅可查看） */}
                    <div className="rounded-md border bg-muted/30 p-3 text-sm space-y-2">
                      <p className="font-medium text-foreground">班务监督</p>
                      <p className="text-muted-foreground text-xs">
                        由班长录入，教师仅可查看；如有误请告知班长修正。
                      </p>
                      <p className="text-muted-foreground">
                        今日值日生：{course.todayDutyName ?? "—"}
                      </p>
                      {course.latestAttendance ? (
                        <div>
                          <p className="text-muted-foreground mb-1">
                            最近考勤（{course.latestAttendance.date}）
                          </p>
                          <ul className="text-muted-foreground text-xs space-y-0.5 max-h-24 overflow-y-auto">
                            {course.latestAttendance.entries.slice(0, 8).map((e, i) => (
                              <li key={i}>
                                {e.studentName ?? "—"}：{e.status === "PRESENT" ? "出勤" : e.status === "LATE" ? "迟到" : "缺勤"}
                              </li>
                            ))}
                            {course.latestAttendance.entries.length > 8 && (
                              <li>…共 {course.latestAttendance.entries.length} 人</li>
                            )}
                          </ul>
                        </div>
                      ) : (
                        <p className="text-muted-foreground text-xs">暂无考勤记录</p>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/dashboard/faculty/grade/${course.id}`}>
                          成绩管理 (Grade)
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
