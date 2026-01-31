"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const gradeEntrySchema = z.object({
  studentId: z.string().min(1),
  courseId: z.string().min(1),
  score: z.coerce.number().min(0, "分数不能小于0").max(100, "分数不能超过100"),
  feedback: z.string().max(2000).optional(),
});

export type GradeActionState = {
  success?: boolean;
  error?: string;
};

/** 教师：批量更新学生成绩（成绩管理页一键保存） */
export async function updateStudentGrades(
  _prevState: GradeActionState | null,
  formData: FormData
): Promise<GradeActionState> {
  const session = await auth();
  const userId = (session?.user as { id?: string })?.id;
  const role = (session?.user as { role?: string })?.role;

  if (!userId || role !== "FACULTY") {
    return { success: false, error: "仅教师可操作" };
  }

  const entriesJson = formData.get("entries");
  if (typeof entriesJson !== "string") {
    return { success: false, error: "提交数据无效" };
  }

  let entries: { studentId: string; courseId: string; score: number; feedback?: string }[];
  try {
    const raw = z.array(gradeEntrySchema).parse(JSON.parse(entriesJson));
    entries = raw.map((e) => ({
      studentId: e.studentId,
      courseId: e.courseId,
      score: e.score,
      feedback: e.feedback?.trim() || undefined,
    }));
  } catch {
    return { success: false, error: "数据格式有误，请检查分数是否在 0-100 之间" };
  }

  if (entries.length === 0) {
    return { success: false, error: "没有可保存的成绩" };
  }

  const courseId = entries[0].courseId;
  if (entries.some((e) => e.courseId !== courseId)) {
    return { success: false, error: "只能提交同一门课程的成绩" };
  }

  const course = await prisma.course.findFirst({
    where: { id: courseId, instructorId: userId },
  });
  if (!course) {
    return { success: false, error: "无权操作该课程" };
  }

  try {
    for (const e of entries) {
      await prisma.grade.upsert({
        where: {
          studentId_courseId: { studentId: e.studentId, courseId: e.courseId },
        },
        create: {
          studentId: e.studentId,
          courseId: e.courseId,
          score: e.score,
          feedback: e.feedback ?? null,
        },
        update: {
          score: e.score,
          feedback: e.feedback ?? null,
        },
      });
    }

    revalidatePath("/dashboard/faculty");
    revalidatePath(`/dashboard/faculty/grade/${courseId}`);
    revalidatePath("/dashboard/student");
    return { success: true };
  } catch (e) {
    console.error("保存成绩失败:", e);
    return { success: false, error: "保存失败，请稍后重试" };
  }
}
