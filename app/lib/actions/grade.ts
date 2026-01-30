"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";

// 1. 定义验证规则：分数必须是 0-100 的数字
const GradeSchema = z.object({
  studentId: z.string(),
  courseId: z.string(),
  score: z.coerce.number().min(0, "分数不能小于0").max(100, "分数不能超过100"),
});

export async function updateStudentGrade(prevState: any, formData: FormData) {
  // 2. 权限检查：只有老师能改成绩
  const session = await auth();
  if (session?.user?.role !== "FACULTY") {
    return { error: "无权操作" };
  }

  // 3. 数据提取与验证
  const rawData = {
    studentId: formData.get("studentId"),
    courseId: formData.get("courseId"),
    score: formData.get("score"),
  };

  const validated = GradeSchema.safeParse(rawData);
  if (!validated.success) {
    return { error: "输入无效，请检查分数是否在 0-100 之间" };
  }

  const { studentId, courseId, score } = validated.data;

  try {
    // 4. 数据库操作：查找是否有成绩，有则更新，无则创建
    // 注意：因为 schema 中可能没有设置复合唯一键，我们用 findFirst 手动判断
    const existingGrade = await prisma.grade.findFirst({
      where: {
        studentId: studentId,
        courseId: courseId,
      },
    });

    if (existingGrade) {
      // 如果已经有成绩，就更新它
      await prisma.grade.update({
        where: { id: existingGrade.id },
        data: { score: score },
      });
    } else {
      // 如果没有成绩，就创建新的
      await prisma.grade.create({
        data: {
          score: score,
          studentId: studentId,
          courseId: courseId,
        },
      });
    }

    // 5. 刷新页面数据
    revalidatePath(`/dashboard/faculty/courses/${courseId}`);
    return { success: true };
  } catch (error) {
    console.error("录入成绩失败:", error);
    return { error: "服务器错误，请稍后重试" };
  }
}