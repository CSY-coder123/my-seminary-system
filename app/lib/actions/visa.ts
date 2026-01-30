"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const UpdateVisaSchema = z.object({
  recordId: z.string().min(1, "记录 ID 必填"),
  passportNumber: z.string().min(1, "请输入护照号"),
  expiryDate: z.string().min(1, "请选择到期日"),
  documentUrl: z.string().optional(),
});

export async function updateVisa(prevState: unknown, formData: FormData) {
  const session = await auth();
  if (session?.user?.role !== "VISA_OFFICER") {
    return { error: "仅签证官可操作" };
  }

  const raw = {
    recordId: formData.get("recordId"),
    passportNumber: formData.get("passportNumber"),
    expiryDate: formData.get("expiryDate"),
    documentUrl: formData.get("documentUrl") ?? undefined,
  };

  const parsed = UpdateVisaSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.flatten().formErrors[0] ?? "输入无效" };
  }

  const { recordId, passportNumber, expiryDate, documentUrl } = parsed.data;

  try {
    await prisma.visaRecord.update({
      where: { id: recordId },
      data: {
        passportNumber,
        expiryDate: new Date(expiryDate),
        documentUrl: documentUrl === "" ? null : documentUrl ?? undefined,
      },
    });
    revalidatePath("/dashboard/visa");
    return { success: true };
  } catch (e) {
    console.error("更新签证失败:", e);
    return { error: "操作失败，请稍后重试" };
  }
}

export async function toggleInternationalStatus(userId: string, status: boolean) {
  const session = await auth();
  if (session?.user?.role !== "VISA_OFFICER") {
    return { error: "仅签证官可操作" };
  }

  try {
    await prisma.user.update({
      where: { id: userId },
      data: { isInternational: status },
    });
    revalidatePath("/dashboard/visa");
    return { success: true };
  } catch (e) {
    console.error("切换国际生状态失败:", e);
    return { error: "操作失败，请稍后重试" };
  }
}

const CreateVisaSchema = z.object({
  userId: z.string().min(1, "用户 ID 必填"),
  passportNumber: z.string().min(1, "请输入护照号"),
  expiryDate: z.string().min(1, "请选择到期日"),
  documentUrl: z.string().optional(),
});

export async function createVisaRecord(prevState: unknown, formData: FormData) {
  const session = await auth();
  if (session?.user?.role !== "VISA_OFFICER") {
    return { error: "仅签证官可操作" };
  }

  const raw = {
    userId: formData.get("userId"),
    passportNumber: formData.get("passportNumber"),
    expiryDate: formData.get("expiryDate"),
    documentUrl: formData.get("documentUrl") ?? undefined,
  };

  const parsed = CreateVisaSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.flatten().formErrors[0] ?? "输入无效" };
  }

  const { userId, passportNumber, expiryDate, documentUrl } = parsed.data;

  try {
    const expiry = new Date(expiryDate);
    const issueDate = new Date();
    await prisma.visaRecord.create({
      data: {
        userId,
        passportNumber,
        issueDate,
        expiryDate: expiry,
        documentUrl: documentUrl === "" ? null : documentUrl ?? null,
        status: "ACTIVE",
      },
    });
    revalidatePath("/dashboard/visa");
    return { success: true };
  } catch (e) {
    console.error("创建签证记录失败:", e);
    return { error: "操作失败，请稍后重试（该学生可能已有记录）" };
  }
}
