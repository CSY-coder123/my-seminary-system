"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import bcrypt from "bcryptjs";

const RoleEnum = z.enum([
  "ADMIN",
  "FACULTY",
  "STUDENT",
  "VISA_OFFICER",
  "FINANCE",
  "LIBRARIAN",
]);

const CreateUserSchema = z.object({
  name: z.string().min(1, "请输入姓名"),
  email: z.string().email("请输入有效邮箱"),
  role: RoleEnum,
  cohortId: z.string().optional().nullable(),
});

export async function createUser(prevState: unknown, formData: FormData) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return { error: "仅管理员可操作" };
  }

  const raw = {
    name: formData.get("name"),
    email: formData.get("email"),
    role: formData.get("role"),
    cohortId: formData.get("cohortId") || undefined,
  };

  const parsed = CreateUserSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.flatten().formErrors[0] ?? "输入无效" };
  }

  const { name, email, role, cohortId } = parsed.data;

  const existing = await prisma.user.findUnique({
    where: { email },
  });
  if (existing) {
    return { error: "该邮箱已被使用" };
  }

  const hashedPassword = await bcrypt.hash("123456", 10);

  try {
    await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role,
        cohortId:
          role === "STUDENT" && cohortId?.trim()
            ? cohortId.trim()
            : null,
      },
    });
    revalidatePath("/dashboard/admin/users");
    return { success: true };
  } catch (e) {
    console.error("创建用户失败:", e);
    return { error: "操作失败，请稍后重试" };
  }
}

const UpdateUserSchema = z.object({
  userId: z.string().min(1, "用户 ID 必填"),
  role: RoleEnum,
  cohortId: z.string().optional().nullable(),
  isMonitor: z
    .string()
    .optional()
    .transform((v) => v === "true"),
});

export async function updateUser(prevState: unknown, formData: FormData) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return { error: "仅管理员可操作" };
  }

  const raw = {
    userId: formData.get("userId"),
    role: formData.get("role"),
    cohortId: formData.get("cohortId") || undefined,
    isMonitor: formData.get("isMonitor") ?? undefined,
  };

  const parsed = UpdateUserSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.flatten().formErrors[0] ?? "输入无效" };
  }

  const { userId, role, cohortId, isMonitor } = parsed.data;

  try {
    await prisma.user.update({
      where: { id: userId },
      data: {
        role,
        cohortId: cohortId ?? null,
        isMonitor: role === "STUDENT" ? (isMonitor ?? false) : false,
      },
    });
    revalidatePath("/dashboard/admin/users");
    revalidatePath("/dashboard/student");
    return { success: true };
  } catch (e) {
    console.error("更新用户失败:", e);
    return { error: "操作失败，请稍后重试" };
  }
}

const CreateCohortSchema = z.object({
  name: z.string().min(1, "请输入班级名称"),
  startDate: z.string().min(1, "请选择开始日期"),
});

export async function createCohort(prevState: unknown, formData: FormData) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return { error: "仅管理员可操作" };
  }

  const raw = {
    name: formData.get("name"),
    startDate: formData.get("startDate"),
  };

  const parsed = CreateCohortSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.flatten().formErrors[0] ?? "输入无效" };
  }

  const { name, startDate } = parsed.data;

  try {
    await prisma.cohort.create({
      data: {
        name,
        startDate: new Date(startDate),
      },
    });
    revalidatePath("/dashboard/admin/cohorts");
    return { success: true };
  } catch (e) {
    console.error("创建班级失败:", e);
    return { error: "操作失败，请稍后重试" };
  }
}

const CreateCourseSchema = z.object({
  name: z.string().min(1, "请输入课程名称"),
  code: z.string().min(1, "请输入课程代码"),
  instructorId: z.string().optional().nullable(),
  cohortId: z.string().min(1, "请选择所属班级"),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  dayOfWeek: z.coerce.number().int().min(0).max(6).optional().nullable(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
});

export async function createCourse(prevState: unknown, formData: FormData) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return { error: "仅管理员可操作" };
  }

  const raw = {
    name: formData.get("name"),
    code: formData.get("code"),
    instructorId: formData.get("instructorId") || undefined,
    cohortId: formData.get("cohortId"),
    startDate: formData.get("startDate") || undefined,
    endDate: formData.get("endDate") || undefined,
    dayOfWeek: formData.get("dayOfWeek") ?? undefined,
    startTime: formData.get("startTime") || undefined,
    endTime: formData.get("endTime") || undefined,
  };

  const parsed = CreateCourseSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.flatten().formErrors[0] ?? "输入无效" };
  }

  const {
    name,
    code,
    instructorId,
    cohortId,
    startDate: startDateStr,
    endDate: endDateStr,
    dayOfWeek,
    startTime,
    endTime,
  } = parsed.data;

  if (instructorId?.trim()) {
    const instructor = await prisma.user.findUnique({
      where: { id: instructorId.trim() },
      select: { role: true },
    });
    if (instructor?.role !== "FACULTY") {
      return { error: "所选教师必须是 FACULTY 角色" };
    }
  }

  const cohort = await prisma.cohort.findUnique({
    where: { id: cohortId },
    select: { startDate: true, endDate: true },
  });
  if (!cohort) {
    return { error: "所选班级不存在" };
  }

  const startDateVal = startDateStr?.trim()
    ? new Date(startDateStr)
    : cohort.startDate;
  const endDateVal = endDateStr?.trim()
    ? new Date(endDateStr)
    : cohort.endDate ??
      new Date(cohort.startDate.getTime() + 180 * 24 * 60 * 60 * 1000);

  try {
    await prisma.course.create({
      data: {
        name: name.trim(),
        code: code.trim(),
        credits: 3,
        startDate: startDateVal,
        endDate: endDateVal,
        cohortId,
        instructorId: instructorId?.trim() || null,
        dayOfWeek: dayOfWeek ?? null,
        startTime: startTime?.trim() || null,
        endTime: endTime?.trim() || null,
      },
    });
    revalidatePath("/dashboard/admin/courses");
    return { success: true };
  } catch (e: unknown) {
    console.error("创建课程失败:", e);
    const err = e as { code?: string };
    if (err?.code === "P2002") {
      return { error: "该班级下课程代码已存在，请更换代码" };
    }
    return { error: "操作失败，请稍后重试" };
  }
}

const UpdateCourseSchema = z.object({
  courseId: z.string().min(1, "课程 ID 必填"),
  name: z.string().min(1, "请输入课程名称"),
  code: z.string().min(1, "请输入课程代码"),
  instructorId: z.string().optional().nullable(),
  cohortId: z.string().min(1, "请选择所属班级"),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  dayOfWeek: z.coerce.number().int().min(0).max(6).optional().nullable(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
});

export async function updateCourse(prevState: unknown, formData: FormData) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return { error: "仅管理员可操作" };
  }

  const raw = {
    courseId: formData.get("courseId"),
    name: formData.get("name"),
    code: formData.get("code"),
    instructorId: formData.get("instructorId") || undefined,
    cohortId: formData.get("cohortId"),
    startDate: formData.get("startDate") || undefined,
    endDate: formData.get("endDate") || undefined,
    dayOfWeek: formData.get("dayOfWeek") ?? undefined,
    startTime: formData.get("startTime") || undefined,
    endTime: formData.get("endTime") || undefined,
  };

  const parsed = UpdateCourseSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.flatten().formErrors[0] ?? "输入无效" };
  }

  const {
    courseId,
    name,
    code,
    instructorId,
    cohortId,
    startDate,
    endDate,
    dayOfWeek,
    startTime,
    endTime,
  } = parsed.data;

  if (instructorId?.trim()) {
    const instructor = await prisma.user.findUnique({
      where: { id: instructorId.trim() },
      select: { role: true },
    });
    if (instructor?.role !== "FACULTY") {
      return { error: "所选教师必须是 FACULTY 角色" };
    }
  }

  const existing = await prisma.course.findUnique({
    where: { id: courseId },
    select: { cohortId: true },
  });
  if (!existing) {
    return { error: "课程不存在" };
  }

  const duplicateCode = await prisma.course.findFirst({
    where: {
      cohortId,
      code: code.trim(),
      id: { not: courseId },
    },
  });
  if (duplicateCode) {
    return { error: "该班级下课程代码已存在，请更换代码" };
  }

  try {
    await prisma.course.update({
      where: { id: courseId },
      data: {
        name: name.trim(),
        code: code.trim(),
        cohortId,
        instructorId: instructorId?.trim() || null,
        startDate: startDate?.trim() ? new Date(startDate) : null,
        endDate: endDate?.trim() ? new Date(endDate) : null,
        dayOfWeek: dayOfWeek ?? null,
        startTime: startTime?.trim() || null,
        endTime: endTime?.trim() || null,
      },
    });
    revalidatePath("/dashboard/admin/courses");
    return { success: true };
  } catch (e: unknown) {
    console.error("更新课程失败:", e);
    const err = e as { code?: string };
    if (err?.code === "P2002") {
      return { error: "该班级下课程代码已存在，请更换代码" };
    }
    return { error: "操作失败，请稍后重试" };
  }
}

export async function deleteCourse(courseId: string) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return { error: "仅管理员可操作" };
  }

  try {
    await prisma.course.delete({
      where: { id: courseId },
    });
    revalidatePath("/dashboard/admin/courses");
    return { success: true };
  } catch (e: unknown) {
    console.error("删除课程失败:", e);
    const err = e as { code?: string };
    if (err?.code === "P2025") {
      return { error: "记录不存在或已被删除" };
    }
    return { error: "删除失败，请稍后重试（若课程已有作业/成绩，请先处理）" };
  }
}
