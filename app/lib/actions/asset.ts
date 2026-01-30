"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const AssetStatusEnum = z.enum(["NORMAL", "DAMAGED", "REPAIRING", "DISPOSED"]);

const AssetSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "请输入名称"),
  serialNumber: z.string().min(1, "请输入序列号"),
  status: AssetStatusEnum,
  category: z.string().optional(),
  purchasedAt: z.string().optional(),
  price: z.coerce.number().optional().nullable(),
  managerId: z.string().optional().nullable(),
});

export async function upsertAsset(prevState: unknown, formData: FormData) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return { error: "仅管理员可操作" };
  }

  const raw = {
    id: formData.get("id") || undefined,
    name: formData.get("name"),
    serialNumber: formData.get("serialNumber"),
    status: formData.get("status"),
    category: formData.get("category") || undefined,
    purchasedAt: formData.get("purchasedAt") || undefined,
    price: formData.get("price") || undefined,
    managerId: formData.get("managerId") || undefined,
  };

  const parsed = AssetSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.flatten().formErrors[0] ?? "输入无效" };
  }

  const { id, name, serialNumber, status, category, purchasedAt, price, managerId } =
    parsed.data;

  try {
    const data = {
      name,
      serialNumber,
      status,
      category: category ?? "未分类",
      purchasedAt: purchasedAt ? new Date(purchasedAt) : new Date(),
      price: price ?? null,
      managerId: managerId || null,
    };

    if (id) {
      await prisma.fixedAsset.update({
        where: { id },
        data,
      });
    } else {
      await prisma.fixedAsset.upsert({
        where: { serialNumber },
        create: data,
        update: {
          name,
          status,
          category: data.category,
          price: data.price,
          managerId: data.managerId,
        },
      });
    }

    revalidatePath("/dashboard/admin/assets");
    return { success: true };
  } catch (e) {
    console.error("资产保存失败:", e);
    return { error: "操作失败，请稍后重试" };
  }
}
