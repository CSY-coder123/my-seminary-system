"use client";

import React, { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  CourseCreateDialog,
  type FacultyOption,
  type CohortOption,
} from "@/components/business/CourseCreateDialog";
import {
  CourseEditDialog,
  type CourseEditRow,
} from "@/components/business/CourseEditDialog";
import {
  CourseCalendar,
  type CourseForCalendar,
} from "@/components/business/CourseCalendar";
import { deleteCourse } from "@/app/lib/actions/admin";

export type CourseRow = {
  id: string;
  name: string;
  code: string;
  cohortId: string;
  cohortName: string;
  instructorId: string | null;
  instructorName: string;
  studentCount: number;
  startDate: string | null;
  endDate: string | null;
  dayOfWeek: number | null;
  startTime: string | null;
  endTime: string | null;
};

interface CoursesPageClientProps {
  courses: CourseRow[];
  coursesForCalendar: CourseForCalendar[];
  faculties: FacultyOption[];
  cohorts: CohortOption[];
}

function formatCourseDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
    .format(d)
    .replace(/\//g, "-");
}

function formatCourseDateRange(
  startDate: string | null,
  endDate: string | null
): string {
  if (!startDate && !endDate) return "—";
  if (!startDate) return formatCourseDate(endDate);
  if (!endDate) return formatCourseDate(startDate);
  return `${formatCourseDate(startDate)} - ${formatCourseDate(endDate)}`;
}

function rowToEditRow(row: CourseRow): CourseEditRow {
  return {
    id: row.id,
    name: row.name,
    code: row.code,
    cohortId: row.cohortId,
    instructorId: row.instructorId,
    startDate: row.startDate,
    endDate: row.endDate,
    dayOfWeek: row.dayOfWeek,
    startTime: row.startTime,
    endTime: row.endTime,
  };
}

type ViewMode = "list" | "calendar";

export function CoursesPageClient({
  courses,
  coursesForCalendar,
  faculties,
  cohorts,
}: CoursesPageClientProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editCourse, setEditCourse] = useState<CourseEditRow | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleEdit = (row: CourseRow) => {
    setEditCourse(rowToEditRow(row));
    setEditDialogOpen(true);
  };

  const handleDeleteClick = (id: string) => {
    setDeleteTargetId(id);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTargetId) return;
    setIsDeleting(true);
    try {
      const result = await deleteCourse(deleteTargetId);
      if (result.error) {
        alert(result.error);
      } else {
        setDeleteTargetId(null);
      }
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <div className="flex rounded-md border border-input bg-muted/30 p-0.5">
          <button
            type="button"
            onClick={() => setViewMode("list")}
            className={`px-3 py-1.5 text-sm font-medium rounded ${
              viewMode === "list"
                ? "bg-background text-foreground shadow"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            List View
          </button>
          <button
            type="button"
            onClick={() => setViewMode("calendar")}
            className={`px-3 py-1.5 text-sm font-medium rounded ${
              viewMode === "calendar"
                ? "bg-background text-foreground shadow"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Calendar View
          </button>
        </div>
        <Button
          className={buttonVariants({ variant: "default" })}
          onClick={() => setCreateDialogOpen(true)}
        >
          New Course
        </Button>
      </div>
      {viewMode === "calendar" ? (
        <CourseCalendar
          courses={coursesForCalendar}
          defaultView="week"
          height={600}
        />
      ) : (
      <div className="rounded-md border overflow-x-auto">
        <table className="w-full caption-bottom text-sm">
          <thead className="border-b bg-muted/50">
            <tr>
              <th className="h-10 px-4 text-left align-middle font-medium">
                课程名称
              </th>
              <th className="h-10 px-4 text-left align-middle font-medium">
                课程代码
              </th>
              <th className="h-10 px-4 text-left align-middle font-medium">
                所属班级
              </th>
              <th className="h-10 px-4 text-left align-middle font-medium">
                授课教师
              </th>
              <th className="h-10 px-4 text-left align-middle font-medium">
                学生人数
              </th>
              <th className="h-10 px-4 text-left align-middle font-medium">
                课程时间
              </th>
              <th className="h-10 px-4 text-left align-middle font-medium">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {courses.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-muted-foreground">
                  暂无课程，点击「New Course」创建
                </td>
              </tr>
            ) : (
              courses.map((row) => (
                <tr
                  key={row.id}
                  className="border-b transition-colors hover:bg-muted/50"
                >
                  <td className="p-4 font-medium">{row.name}</td>
                  <td className="p-4 text-muted-foreground">{row.code}</td>
                  <td className="p-4 text-muted-foreground">{row.cohortName}</td>
                  <td className="p-4 text-muted-foreground">
                    {row.instructorName}
                  </td>
                  <td className="p-4">{row.studentCount}</td>
                  <td className="p-4 text-muted-foreground">
                    {formatCourseDateRange(row.startDate, row.endDate)}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleEdit(row)}
                        title="编辑"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => handleDeleteClick(row.id)}
                        title="删除"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      )}
      <CourseCreateDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        faculties={faculties}
        cohorts={cohorts}
      />
      <CourseEditDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        course={editCourse}
        faculties={faculties}
        cohorts={cohorts}
      />
      <Dialog open={!!deleteTargetId} onOpenChange={() => setDeleteTargetId(null)}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>确认删除</DialogTitle>
            <DialogDescription>
              确定要删除该课程吗？若课程已有作业或成绩，删除可能失败。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteTargetId(null)}
              disabled={isDeleting}
            >
              取消
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
            >
              {isDeleting ? "删除中..." : "确认删除"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
