import { auth } from "@/lib/auth";
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
import { StudentVisaCard } from "./StudentVisaCard";
import { MonitorPanelCard } from "./MonitorPanelCard";
import { CourseCalendar } from "@/components/business/CourseCalendar";

function formatLocalDate(utcDate: Date): string {
  return new Date(utcDate).toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

export default async function StudentPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const userId = (session.user as { id?: string })?.id;
  if (!userId || (session.user as { role?: string })?.role !== "STUDENT") {
    redirect("/dashboard");
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      isMonitor: true,
      cohortId: true,
      cohort: {
        select: {
          id: true,
          name: true,
          courses: {
            orderBy: { code: "asc" },
            select: {
              id: true,
              code: true,
              name: true,
              credits: true,
              startDate: true,
              endDate: true,
              dayOfWeek: true,
              startTime: true,
              endTime: true,
              instructor: { select: { name: true } },
              cohort: { select: { name: true } },
            },
          },
        },
      },
      visaRecord: {
        select: { id: true, documentUrl: true, passportNumber: true },
      },
    },
  });

  if (!user) {
    redirect("/dashboard");
  }

  const cohortId = user.cohort?.id;
  const cohortName = user.cohort?.name ?? "未分配班级";
  const courses = user.cohort?.courses ?? [];
  const displayName = user.name ?? user.email ?? "同学";

  // 班务面板数据：今日值日、本周值日、本班成员、本班课程、我的考勤统计
  const todayStart = new Date();
  todayStart.setUTCHours(0, 0, 0, 0);
  const todayEnd = new Date(todayStart);
  todayEnd.setUTCDate(todayEnd.getUTCDate() + 1);
  const weekEnd = new Date(todayStart);
  weekEnd.setUTCDate(weekEnd.getUTCDate() + 7);

  const [todayDutyRecord, weekDutyRecords, cohortMembers, myAttendanceCounts] = cohortId
    ? await Promise.all([
        prisma.dutyRecord.findFirst({
          where: { cohortId, date: { gte: todayStart, lt: todayEnd } },
          include: { assignees: { select: { name: true } } },
        }),
        prisma.dutyRecord.findMany({
          where: { cohortId, date: { gte: todayStart, lt: weekEnd } },
          orderBy: { date: "asc" },
          include: { assignees: { select: { name: true } } },
        }),
        prisma.user.findMany({
          where: { cohortId, role: "STUDENT" },
          select: { id: true, name: true },
          orderBy: { name: "asc" },
        }),
        prisma.attendance.groupBy({
          by: ["status"],
          where: { studentId: userId },
          _count: true,
        }),
      ])
    : [null, [], [], []];

  const todayDuty = todayDutyRecord
    ? {
        assigneeNames: todayDutyRecord.assignees.map((a) => a.name ?? "—"),
      }
    : null;

  const weekDuties = weekDutyRecords.map((r) => ({
    date: r.date.toISOString().slice(0, 10),
    assigneeNames: r.assignees.map((a) => a.name ?? "—"),
  }));

  const myAttendanceStats = {
    present: myAttendanceCounts.find((c) => c.status === "PRESENT")?._count ?? 0,
    absent: myAttendanceCounts.find((c) => c.status === "ABSENT")?._count ?? 0,
    late: myAttendanceCounts.find((c) => c.status === "LATE")?._count ?? 0,
  };

  const cohortCoursesForPanel = courses.map((c) => ({
    id: c.id,
    name: c.name,
    code: c.code,
  }));
  const cohortMembersForPanel = cohortMembers.map((m) => ({
    id: m.id,
    name: m.name,
  }));
  const cohortStudentIds = cohortMembers.map((m) => m.id);

  // 班长考勤预填：该班级各课程近期考勤记录（用于预填充“已有考勤”）
  const courseIds = courses.map((c) => c.id);
  const attRangeStart = new Date(todayStart);
  attRangeStart.setUTCDate(attRangeStart.getUTCDate() - 30);
  const attRangeEnd = new Date(todayStart);
  attRangeEnd.setUTCDate(attRangeEnd.getUTCDate() + 8);
  const existingAttendance =
    courseIds.length > 0
      ? await prisma.attendance.findMany({
          where: {
            courseId: { in: courseIds },
            date: { gte: attRangeStart, lt: attRangeEnd },
          },
          select: { courseId: true, date: true, studentId: true, status: true },
        })
      : [];

  const existingAttendanceForPanel = existingAttendance.map((a) => ({
    courseId: a.courseId,
    date: a.date.toISOString().slice(0, 10),
    studentId: a.studentId,
    status: a.status,
  }));

  const myGrades = await prisma.grade.findMany({
    where: { studentId: userId },
    select: { score: true, feedback: true, course: { select: { name: true, code: true } } },
    orderBy: { course: { code: "asc" } },
  });

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar userName={user.name ?? user.email ?? "学生"} role="STUDENT" />
      <main className="p-4 sm:p-6 lg:p-8">
        <div className="space-y-6 max-w-4xl mx-auto">
          {/* 顶部欢迎栏 */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xl sm:text-2xl">
                欢迎，{displayName} 同学
              </CardTitle>
              <CardDescription>
                所属班级：{cohortName}
              </CardDescription>
            </CardHeader>
          </Card>

          {/* 核心卡片 1：我的课表（日历 + 列表） */}
          <Card>
            <CardHeader>
              <CardTitle>我的课表 (My Schedule)</CardTitle>
              <CardDescription>
                本班级开设的课程，按周/月查看
              </CardDescription>
            </CardHeader>
            <CardContent>
              {courses.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4">
                  暂无课程安排，请留意班级通知。
                </p>
              ) : (
                <>
                  <CourseCalendar
                    courses={courses.map((c) => ({
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
                    }))}
                    defaultView="week"
                    height={420}
                  />
                  <ul className="divide-y divide-border mt-6">
                    {courses.map((course) => (
                      <li
                        key={course.id}
                        className="py-3 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-sm"
                      >
                        <div>
                          <span className="font-medium">{course.name}</span>
                          <span className="text-muted-foreground ml-2">
                            {course.code}
                          </span>
                          <span className="text-muted-foreground ml-2">
                            任课教师：{course.instructor?.name ?? "—"}
                          </span>
                        </div>
                        <span className="text-muted-foreground shrink-0">
                          {course.startDate
                            ? formatLocalDate(course.startDate)
                            : "—"}{" "}
                          ～{" "}
                          {course.endDate
                            ? formatLocalDate(course.endDate)
                            : "—"}{" "}
                          · {course.credits} 学分
                        </span>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </CardContent>
          </Card>

          {/* 我的成绩单：教师录入后实时可见（revalidatePath 刷新） */}
          <Card>
            <CardHeader>
              <CardTitle>我的成绩单 (My Grades)</CardTitle>
              <CardDescription>
                各科成绩与评语，教师更新后自动刷新
              </CardDescription>
            </CardHeader>
            <CardContent>
              {myGrades.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4">
                  暂无成绩记录。
                </p>
              ) : (
                <ul className="divide-y divide-border">
                  {myGrades.map((g, i) => (
                    <li key={i} className="py-3 first:pt-0 last:pb-0">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                        <span className="font-medium">{g.course.name}</span>
                        <span className="text-muted-foreground text-sm">
                          {g.course.code} · 成绩：{g.score}
                        </span>
                      </div>
                      {g.feedback?.trim() && (
                        <p className="text-sm text-muted-foreground mt-1">
                          评语：{g.feedback}
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          {/* 签证资料：上传/更新护照或签证扫描件（无记录时也可直接上传初始化） */}
          <Card>
            <CardHeader>
              <CardTitle>签证资料 (Visa Document)</CardTitle>
              <CardDescription>
                填写护照号并上传护照/签证扫描件（图片或 PDF）；无记录时上传即自动创建
              </CardDescription>
            </CardHeader>
            <CardContent>
              <StudentVisaCard
                documentUrl={user.visaRecord?.documentUrl ?? null}
                passportNumber={user.visaRecord?.passportNumber ?? ""}
              />
            </CardContent>
          </Card>

          {/* 班务面板：班长可指派值日、录入考勤；普通学生可看今日值日与自己的考勤统计 */}
          <Card>
            <CardHeader>
              <CardTitle>班务面板 (Monitor Panel)</CardTitle>
              <CardDescription>
                {user.isMonitor
                  ? "班长可指派值日、录入考勤，全班可见"
                  : "今日值日与考勤统计"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <MonitorPanelCard
                isMonitor={user.isMonitor}
                cohortMembers={cohortMembersForPanel}
                cohortCourses={cohortCoursesForPanel}
                todayDuty={todayDuty}
                weekDuties={weekDuties}
                myAttendanceStats={myAttendanceStats}
                cohortStudentIds={cohortStudentIds}
                existingAttendance={existingAttendanceForPanel}
              />
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
