"use client";

import React, { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateCourse } from "@/app/lib/actions/admin";

export type FacultyOption = { id: string; name: string | null; email: string };
export type CohortOption = { id: string; name: string };

export type CourseEditRow = {
  id: string;
  name: string;
  code: string;
  cohortId: string;
  instructorId: string | null;
  startDate: string | null;
  endDate: string | null;
  dayOfWeek: number | null;
  startTime: string | null;
  endTime: string | null;
};

interface CourseEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  course: CourseEditRow | null;
  faculties: FacultyOption[];
  cohorts: CohortOption[];
}

const selectClassName =
  "col-span-3 flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";

function toInputDate(d: Date | string | null): string {
  if (!d) return "";
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toISOString().slice(0, 10);
}

export function CourseEditDialog({
  open,
  onOpenChange,
  course,
  faculties,
  cohorts,
}: CourseEditDialogProps) {
  const [name, setName] = useState(course?.name ?? "");
  const [code, setCode] = useState(course?.code ?? "");
  const [instructorId, setInstructorId] = useState(course?.instructorId ?? "");
  const [cohortId, setCohortId] = useState(course?.cohortId ?? "");
  const [startDate, setStartDate] = useState(
    course?.startDate ? toInputDate(course.startDate) : ""
  );
  const [endDate, setEndDate] = useState(
    course?.endDate ? toInputDate(course.endDate) : ""
  );
  const [dayOfWeek, setDayOfWeek] = useState(
    course?.dayOfWeek != null ? String(course.dayOfWeek) : ""
  );
  const [startTime, setStartTime] = useState(course?.startTime ?? "");
  const [endTime, setEndTime] = useState(course?.endTime ?? "");
  const [isPending, startTransition] = useTransition();

  React.useEffect(() => {
    if (open && course) {
      setName(course.name);
      setCode(course.code);
      setInstructorId(course.instructorId ?? "");
      setCohortId(course.cohortId);
      setStartDate(course.startDate ? toInputDate(course.startDate) : "");
      setEndDate(course.endDate ? toInputDate(course.endDate) : "");
      setDayOfWeek(
        course.dayOfWeek != null ? String(course.dayOfWeek) : ""
      );
      setStartTime(course.startTime ?? "");
      setEndTime(course.endTime ?? "");
    }
  }, [open, course]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!course) return;
    const form = e.currentTarget;
    const formData = new FormData(form);
    formData.set("courseId", course.id);
    formData.set("instructorId", instructorId || "");
    formData.set("cohortId", cohortId);
    formData.set("startDate", startDate);
    formData.set("endDate", endDate);
    formData.set("dayOfWeek", dayOfWeek);
    formData.set("startTime", startTime);
    formData.set("endTime", endTime);
    startTransition(async () => {
      const result = await updateCourse(null, formData);
      if (result.error) {
        alert(result.error);
      } else {
        onOpenChange(false);
      }
    });
  }

  if (!course) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>编辑课程 (Edit Course)</DialogTitle>
          <DialogDescription>
            修改课程名称、代码、教师、班级及时间。
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <input type="hidden" name="courseId" value={course.id} />
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-course-name" className="text-right">
                课程名称
              </Label>
              <Input
                id="edit-course-name"
                name="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-course-code" className="text-right">
                课程代码
              </Label>
              <Input
                id="edit-course-code"
                name="code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-course-instructor" className="text-right">
                授课教师
              </Label>
              <select
                id="edit-course-instructor"
                name="instructorId"
                value={instructorId}
                onChange={(e) => setInstructorId(e.target.value)}
                className={selectClassName}
              >
                <option value="">请选择教师（可选）</option>
                {faculties.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name ?? f.email}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-course-cohort" className="text-right">
                所属班级
              </Label>
              <select
                id="edit-course-cohort"
                name="cohort"
                value={cohortId}
                onChange={(e) => setCohortId(e.target.value)}
                className={selectClassName}
                required
              >
                <option value="">请选择班级</option>
                {cohorts.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-course-startDate" className="text-right">
                开始日期
              </Label>
              <Input
                id="edit-course-startDate"
                name="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-course-endDate" className="text-right">
                结束日期
              </Label>
              <Input
                id="edit-course-endDate"
                name="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-course-dayOfWeek" className="text-right">
                上课星期
              </Label>
              <select
                id="edit-course-dayOfWeek"
                name="dayOfWeek"
                value={dayOfWeek}
                onChange={(e) => setDayOfWeek(e.target.value)}
                className={selectClassName}
              >
                <option value="">请选择（可选）</option>
                <option value="0">Sunday 周日</option>
                <option value="1">Monday 周一</option>
                <option value="2">Tuesday 周二</option>
                <option value="3">Wednesday 周三</option>
                <option value="4">Thursday 周四</option>
                <option value="5">Friday 周五</option>
                <option value="6">Saturday 周六</option>
              </select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-course-startTime" className="text-right">
                开始时间
              </Label>
              <Input
                id="edit-course-startTime"
                name="startTime"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-course-endTime" className="text-right">
                结束时间
              </Label>
              <Input
                id="edit-course-endTime"
                name="endTime"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="col-span-3"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              取消
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "保存中..." : "保存"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
