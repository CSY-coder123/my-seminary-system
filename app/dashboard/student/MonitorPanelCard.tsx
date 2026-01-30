"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { assignDuty, recordAttendance } from "@/app/lib/actions/student";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export type CohortMember = { id: string; name: string | null };
export type CohortCourse = { id: string; name: string; code: string };
/** 今日值日：多选名字列表 */
export type TodayDuty = { assigneeNames: string[] } | null;
/** 本周值日安排（用于普通学生只读展示） */
export type WeekDutyItem = { date: string; assigneeNames: string[] };
export type MyAttendanceStats = { present: number; absent: number; late: number };
/** 已有考勤记录，用于班长预填（courseId + date 唯一，每条含 studentId + status） */
export type ExistingAttendanceItem = { courseId: string; date: string; studentId: string; status: string };

export type MonitorPanelCardProps = {
  isMonitor: boolean;
  cohortMembers: CohortMember[];
  cohortCourses: CohortCourse[];
  todayDuty: TodayDuty;
  weekDuties?: WeekDutyItem[];
  myAttendanceStats: MyAttendanceStats;
  cohortStudentIds: string[];
  /** 该班级近期考勤记录，用于班长打开面板时预填“已有考勤” */
  existingAttendance?: ExistingAttendanceItem[];
};

const STATUS_OPTIONS = [
  { value: "PRESENT", label: "出勤" },
  { value: "ABSENT", label: "缺勤" },
  { value: "LATE", label: "迟到" },
] as const;

function todayDateString() {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}

export function MonitorPanelCard({
  isMonitor,
  cohortMembers,
  cohortCourses,
  todayDuty,
  weekDuties = [],
  myAttendanceStats,
  cohortStudentIds,
  existingAttendance = [],
}: MonitorPanelCardProps) {
  const router = useRouter();
  const [dutyState, dutyAction, isDutyPending] = useActionState(assignDuty, null);
  const [attState, attAction, isAttPending] = useActionState(recordAttendance, null);
  const [attCourseId, setAttCourseId] = useState("");
  const [attDate, setAttDate] = useState(todayDateString());
  const [attEntries, setAttEntries] = useState<Record<string, "PRESENT" | "ABSENT" | "LATE">>({});
  const [selectedDutyIds, setSelectedDutyIds] = useState<Set<string>>(new Set());

  // 已有考勤按 courseId-date 聚合，便于预填
  const existingByKey = useMemo(() => {
    const map: Record<string, Record<string, "PRESENT" | "ABSENT" | "LATE">> = {};
    for (const a of existingAttendance) {
      const key = `${a.courseId}-${a.date}`;
      if (!map[key]) map[key] = {};
      map[key][a.studentId] = a.status as "PRESENT" | "ABSENT" | "LATE";
    }
    return map;
  }, [existingAttendance]);

  // 切换课程或日期时，用该课程+日期的已有考勤预填，无则默认出勤
  useEffect(() => {
    if (!attCourseId || !cohortStudentIds.length) {
      setAttEntries({});
      return;
    }
    const key = `${attCourseId}-${attDate}`;
    const existing = existingByKey[key];
    const defaultEntries: Record<string, "PRESENT" | "ABSENT" | "LATE"> = {};
    for (const id of cohortStudentIds) {
      defaultEntries[id] = (existing?.[id] ?? "PRESENT") as "PRESENT" | "ABSENT" | "LATE";
    }
    setAttEntries(defaultEntries);
  }, [attCourseId, attDate, existingByKey, cohortStudentIds]);

  const hasExistingForCurrent =
    attCourseId && attDate && Object.keys(existingByKey[`${attCourseId}-${attDate}`] ?? {}).length > 0;

  useEffect(() => {
    if (dutyState?.success) {
      toast.success("值日已指派");
      router.refresh();
    }
    if (dutyState?.error) toast.error(dutyState.error);
  }, [dutyState, router]);

  useEffect(() => {
    if (attState?.success) toast.success("考勤已保存");
    if (attState?.error) toast.error(attState.error);
    if (attState?.success) router.refresh();
  }, [attState, router]);

  const attendanceEntriesJson = useMemo(
    () =>
      JSON.stringify(
        cohortStudentIds.map((studentId) => ({
          studentId,
          status: (attEntries[studentId] ?? "PRESENT") as "PRESENT" | "ABSENT" | "LATE",
        }))
      ),
    [cohortStudentIds, attEntries]
  );

  const dutyAssigneeIdsJson = useMemo(
    () => JSON.stringify(Array.from(selectedDutyIds)),
    [selectedDutyIds]
  );

  const toggleDutySelect = (id: string) => {
    setSelectedDutyIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <>
      {/* 值日：班长可多选指派，普通学生只读今日/本周 */}
      <div className="rounded-lg border bg-muted/30 p-4 text-sm">
        <p className="font-medium mb-2">值日安排</p>
        {isMonitor ? (
          <form action={dutyAction} className="space-y-3">
            <div>
              <Label htmlFor="duty-date">日期</Label>
              <input
                id="duty-date"
                name="date"
                type="date"
                required
                defaultValue={todayDateString()}
                className="mt-1 flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
              />
            </div>
            <div>
              <Label>值日生（可多选）</Label>
              <input type="hidden" name="assigneeIds" value={dutyAssigneeIdsJson} />
              <ul className="mt-2 max-h-40 overflow-y-auto rounded border border-input bg-background p-2 space-y-1.5">
                {cohortMembers.map((m) => (
                  <li key={m.id} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id={`duty-${m.id}`}
                      checked={selectedDutyIds.has(m.id)}
                      onChange={() => toggleDutySelect(m.id)}
                      className="h-4 w-4 rounded border-input"
                    />
                    <label htmlFor={`duty-${m.id}`} className="cursor-pointer text-sm">
                      {m.name ?? m.id}
                    </label>
                  </li>
                ))}
              </ul>
            </div>
            <Button
              type="submit"
              size="sm"
              disabled={isDutyPending || selectedDutyIds.size === 0}
            >
              {isDutyPending ? "提交中…" : "指派值日"}
            </Button>
          </form>
        ) : (
          <div className="space-y-3 text-muted-foreground">
            <p>
              <span className="font-medium text-foreground">今日值日：</span>
              {todayDuty && todayDuty.assigneeNames.length > 0
                ? todayDuty.assigneeNames.join("、")
                : "暂无值日安排"}
            </p>
            {weekDuties.length > 0 ? (
              <div>
                <p className="font-medium text-foreground mb-1">本周值日安排</p>
                <ul className="space-y-1 text-sm">
                  {weekDuties.map((w) => (
                    <li key={w.date}>
                      {w.date}：{w.assigneeNames.length ? w.assigneeNames.join("、") : "—"}
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <p className="text-sm">暂无本周值日安排</p>
            )}
          </div>
        )}
      </div>

      {/* 考勤录入（班长）/ 我的考勤统计（普通学生） */}
      <div className="rounded-lg border bg-muted/30 p-4 text-sm">
        <p className="font-medium mb-2">考勤</p>
        {isMonitor ? (
          <form action={attAction} className="space-y-3">
            <div className="grid gap-2 sm:grid-cols-2">
              <div>
                <Label htmlFor="att-course">课程</Label>
                <select
                  id="att-course"
                  name="courseId"
                  required
                  value={attCourseId}
                  onChange={(e) => setAttCourseId(e.target.value)}
                  className="mt-1 flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                >
                  <option value="">请选择</option>
                  {cohortCourses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.code})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="att-date">日期</Label>
                <input
                  id="att-date"
                  name="date"
                  type="date"
                  required
                  value={attDate}
                  onChange={(e) => setAttDate(e.target.value)}
                  className="mt-1 flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                />
              </div>
            </div>
            <input type="hidden" name="entries" value={attendanceEntriesJson} />
            <div className="space-y-2">
              <Label>学生出勤状态</Label>
              <ul className="space-y-1.5 rounded border p-2 bg-background max-h-48 overflow-y-auto">
                {cohortMembers.map((m) => (
                  <li key={m.id} className="flex items-center justify-between gap-2">
                    <span className="truncate">{m.name ?? m.id}</span>
                    <select
                      className="h-8 w-24 rounded border border-input bg-background px-2 text-xs"
                      value={attEntries[m.id] ?? "PRESENT"}
                      onChange={(e) =>
                        setAttEntries((prev) => ({
                          ...prev,
                          [m.id]: e.target.value as "PRESENT" | "ABSENT" | "LATE",
                        }))
                      }
                    >
                      {STATUS_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  </li>
                ))}
              </ul>
            </div>
            <Button type="submit" size="sm" disabled={!attCourseId || isAttPending}>
              {isAttPending ? "提交中…" : hasExistingForCurrent ? "修改/更新考勤" : "提交考勤"}
            </Button>
          </form>
        ) : (
          <p className="text-muted-foreground">
            我的考勤统计：出勤 {myAttendanceStats.present} 次，缺勤 {myAttendanceStats.absent} 次，迟到 {myAttendanceStats.late} 次
          </p>
        )}
      </div>
    </>
  );
}
