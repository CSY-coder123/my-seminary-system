"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { put } from "@vercel/blob";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { AttendanceStatus } from "@prisma/client";

/** 学生自助创建记录时的占位到期日，待签证官核实后修改 */
const PENDING_EXPIRY = new Date("2099-12-31");

/**
 * 学生端：上传签证资料并 upsert VisaRecord。
 * 强制使用 process.env.BLOB_READ_WRITE_TOKEN（不带 NEXT_PUBLIC，仅服务端读取）。
 * 严禁使用占位图；无 Token 时直接报错，不写入假数据。
 */
export async function updateVisaProfile(prevState: unknown, formData: FormData) {
  const session = await auth();
  const userId = (session?.user as { id?: string })?.id;
  const role = (session?.user as { role?: string })?.role;

  if (!userId || role !== "STUDENT") {
    return { success: false, error: "仅学生本人可更新签证资料" };
  }

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    console.error("TOKEN MISSING IN ENV");
    return {
      success: false,
      error: "服务器存储配置丢失，请联系管理员检查 .env 文件",
    };
  }

  const passportNumber = formData.get("passportNumber");
  if (typeof passportNumber !== "string" || !passportNumber.trim()) {
    return { success: false, error: "请输入护照号" };
  }

  const file = formData.get("file");
  if (!file || !(file instanceof File) || file.size === 0) {
    return { success: false, error: "请选择要上传的图片或 PDF 文件" };
  }

  const allowedTypes = [
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "application/pdf",
  ];
  if (!allowedTypes.includes(file.type)) {
    return { success: false, error: "仅支持图片 (JPEG/PNG/GIF/WebP) 或 PDF" };
  }

  try {
    const result = await put(file.name, file, { access: "public" });
    const url = result?.url;
    if (!url || typeof url !== "string" || !url.trim()) {
      return { success: false, error: "上传失败：未返回有效文件地址，请重试" };
    }

    await prisma.visaRecord.upsert({
      where: { userId },
      create: {
        userId,
        passportNumber: passportNumber.trim(),
        documentUrl: url,
        issueDate: new Date(),
        expiryDate: PENDING_EXPIRY,
        status: "ACTIVE",
      },
      update: {
        passportNumber: passportNumber.trim(),
        documentUrl: url,
      },
    });

    revalidatePath("/dashboard/student");
    revalidatePath("/dashboard/visa");
    return { success: true };
  } catch (e) {
    console.error("更新签证资料失败:", e);
    return { success: false, error: "上传失败，请稍后重试" };
  }
}

/** 班长：指派值日（多选）。权限：仅 isMonitor === true。formData: date, assigneeIds (JSON string array) */
const assignDutySchema = z.object({
  date: z.string().min(1, "请选择日期"),
  assigneeIds: z.string(), // JSON array of user ids
});

export async function assignDuty(prevState: unknown, formData: FormData) {
  const session = await auth();
  const userId = (session?.user as { id?: string })?.id;
  const role = (session?.user as { role?: string })?.role;

  if (!userId || role !== "STUDENT") {
    return { error: "仅学生可操作" };
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { isMonitor: true, cohortId: true },
  });

  if (!user?.isMonitor) {
    return { error: "仅班长可指派值日" };
  }

  if (!user.cohortId) {
    return { error: "您尚未分配班级" };
  }

  const parsed = assignDutySchema.safeParse({
    date: formData.get("date"),
    assigneeIds: formData.get("assigneeIds"),
  });

  if (!parsed.success) {
    const msg = parsed.error.flatten().formErrors[0];
    return { error: msg ?? "参数有误" };
  }

  const { date, assigneeIds: assigneeIdsJson } = parsed.data;
  let assigneeIds: string[];
  try {
    assigneeIds = z.array(z.string().min(1)).parse(JSON.parse(assigneeIdsJson));
  } catch {
    return { error: "请至少选择一名值日生" };
  }

  if (assigneeIds.length === 0) {
    return { error: "请至少选择一名值日生" };
  }

  // 确认所有 assignee 属于本班
  const validUsers = await prisma.user.findMany({
    where: { id: { in: assigneeIds }, cohortId: user.cohortId, role: "STUDENT" },
    select: { id: true },
  });
  const validIds = validUsers.map((u) => u.id);
  if (validIds.length !== assigneeIds.length) {
    return { error: "请只选择本班同学" };
  }

  // 使用 UTC 零点，与 student/faculty 页面查询条件一致，避免时区导致查不到
  const dutyDate = new Date(date + "T00:00:00.000Z");

  try {
    const existing = await prisma.dutyRecord.findFirst({
      where: { cohortId: user.cohortId, date: dutyDate },
    });

    if (existing) {
      await prisma.dutyRecord.update({
        where: { id: existing.id },
        data: { assignees: { set: validIds.map((id) => ({ id })) } },
      });
    } else {
      await prisma.dutyRecord.create({
        data: {
          cohortId: user.cohortId,
          date: dutyDate,
          assignees: { connect: validIds.map((id) => ({ id })) },
        },
      });
    }

    revalidatePath("/dashboard/student");
    revalidatePath("/dashboard/faculty");
    return { success: true };
  } catch (e) {
    console.error("指派值日失败:", e);
    return { error: "指派失败，请稍后重试" };
  }
}

/** 班长：录入/修改考勤。权限：仅 isMonitor === true。使用 upsert：存在则更新 status/recordedBy，不存在则创建。payload: courseId, date, entries (JSON: { studentId: status }[]) */
const recordAttendanceSchema = z.object({
  courseId: z.string().min(1),
  date: z.string().min(1),
  entries: z.string(), // JSON array of { studentId: string, status: AttendanceStatus }
});

const statusEnum = z.enum(["PRESENT", "ABSENT", "LATE"]);

export async function recordAttendance(prevState: unknown, formData: FormData) {
  const session = await auth();
  const userId = (session?.user as { id?: string })?.id;
  const role = (session?.user as { role?: string })?.role;

  if (!userId || role !== "STUDENT") {
    return { error: "仅学生可操作" };
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { isMonitor: true, cohortId: true },
  });

  if (!user?.isMonitor) {
    return { error: "仅班长可录入考勤" };
  }

  if (!user.cohortId) {
    return { error: "您尚未分配班级" };
  }

  const parsed = recordAttendanceSchema.safeParse({
    courseId: formData.get("courseId"),
    date: formData.get("date"),
    entries: formData.get("entries"),
  });

  if (!parsed.success) {
    return { error: "参数有误" };
  }

  const { courseId, date, entries } = parsed.data;
  const entrySchema = z.object({ studentId: z.string(), status: statusEnum });
  let list: { studentId: string; status: "PRESENT" | "ABSENT" | "LATE" }[];
  try {
    list = z.array(entrySchema).parse(JSON.parse(entries)) as { studentId: string; status: "PRESENT" | "ABSENT" | "LATE" }[];
  } catch {
    return { error: "考勤数据格式有误" };
  }

  // 确认课程属于本班
  const course = await prisma.course.findFirst({
    where: { id: courseId, cohortId: user.cohortId },
  });
  if (!course) {
    return { error: "请选择本班课程" };
  }

  // 使用 UTC 零点，与查询条件一致
  const attendanceDate = new Date(date + "T00:00:00.000Z");

  try {
    for (const { studentId, status } of list) {
      const student = await prisma.user.findFirst({
        where: { id: studentId, cohortId: user.cohortId, role: "STUDENT" },
      });
      if (!student) continue;

      await prisma.attendance.upsert({
        where: {
          studentId_courseId_date: {
            studentId,
            courseId,
            date: attendanceDate,
          },
        },
        create: {
          studentId,
          courseId,
          date: attendanceDate,
          status: status as AttendanceStatus,
          recordedById: userId,
        },
        update: {
          status: status as AttendanceStatus,
          recordedById: userId,
        },
      });
    }

    revalidatePath("/dashboard/student");
    revalidatePath("/dashboard/faculty");
    return { success: true };
  } catch (e) {
    console.error("录入考勤失败:", e);
    return { error: "录入失败，请稍后重试" };
  }
}
