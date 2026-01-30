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
import { createCourse } from "@/app/lib/actions/admin";

export type FacultyOption = { id: string; name: string | null; email: string };
export type CohortOption = { id: string; name: string };

interface CourseCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  faculties: FacultyOption[];
  cohorts: CohortOption[];
}

const selectClassName =
  "col-span-3 flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";

export function CourseCreateDialog({
  open,
  onOpenChange,
  faculties,
  cohorts,
}: CourseCreateDialogProps) {
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [instructorId, setInstructorId] = useState("");
  const [cohortId, setCohortId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [dayOfWeek, setDayOfWeek] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [isPending, startTransition] = useTransition();

  React.useEffect(() => {
    if (open) {
      setName("");
      setCode("");
      setInstructorId("");
      setCohortId("");
      setStartDate("");
      setEndDate("");
      setDayOfWeek("");
      setStartTime("");
      setEndTime("");
    }
  }, [open]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    formData.set("instructorId", instructorId || "");
    formData.set("cohortId", cohortId);
    formData.set("startDate", startDate);
    formData.set("endDate", endDate);
    formData.set("dayOfWeek", dayOfWeek);
    formData.set("startTime", startTime);
    formData.set("endTime", endTime);
    startTransition(async () => {
      const result = await createCourse(null, formData);
      if (result.error) {
        alert(result.error);
      } else {
        onOpenChange(false);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>新建课程 (New Course)</DialogTitle>
          <DialogDescription>
            输入课程名称、代码，并选择授课教师与所属班级。
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="course-name" className="text-right">
                课程名称
              </Label>
              <Input
                id="course-name"
                name="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="col-span-3"
                placeholder="e.g. New Testament"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="course-code" className="text-right">
                课程代码
              </Label>
              <Input
                id="course-code"
                name="code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="col-span-3"
                placeholder="e.g. NT101"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="course-instructor" className="text-right">
                授课教师
              </Label>
              <select
                id="course-instructor"
                name="instructor"
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
              <Label htmlFor="course-cohort" className="text-right">
                所属班级
              </Label>
              <select
                id="course-cohort"
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
              <Label htmlFor="course-startDate" className="text-right">
                开始日期
              </Label>
              <Input
                id="course-startDate"
                name="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="course-endDate" className="text-right">
                结束日期
              </Label>
              <Input
                id="course-endDate"
                name="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="course-dayOfWeek" className="text-right">
                上课星期
              </Label>
              <select
                id="course-dayOfWeek"
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
              <Label htmlFor="course-startTime" className="text-right">
                开始时间
              </Label>
              <Input
                id="course-startTime"
                name="startTime"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="course-endTime" className="text-right">
                结束时间
              </Label>
              <Input
                id="course-endTime"
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
            <Button type="submit" disabled={isPending || !cohortId}>
              {isPending ? "创建中..." : "创建"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
