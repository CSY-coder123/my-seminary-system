"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const TuitionSchema = z.object({
  studentId: z.string().min(1, "请选择学生"),
  tuitionPaid: z.boolean(),
});

export async function updateTuitionStatus(prevState: unknown, formData: FormData) {
  const session = await auth();
  if (session?.user?.role !== "FINANCE") {
    return { error: "仅财务角色可操作" };
  }

  const rawData = {
    studentId: formData.get("studentId"),
    tuitionPaid: formData.get("tuitionPaid") === "true",
  };

  const validated = TuitionSchema.safeParse(rawData);
  if (!validated.success) {
    return { error: validated.error.flatten().formErrors[0] ?? "输入无效" };
  }

  const { studentId, tuitionPaid } = validated.data;

  try {
    await prisma.user.update({
      where: { id: studentId },
      data: { tuitionPaid },
    });
    revalidatePath("/dashboard/finance");
    return { success: true };
  } catch (error) {
    console.error("更新缴费状态失败:", error);
    return { error: "更新失败，请稍后重试" };
  }
}
