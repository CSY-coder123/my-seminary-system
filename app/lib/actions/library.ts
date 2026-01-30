"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const BorrowSchema = z.object({
  bookId: z.string().min(1, "请选择书籍"),
  userId: z.string().min(1, "请选择学生"),
});

export async function borrowBook(prevState: unknown, formData: FormData) {
  const session = await auth();
  if (session?.user?.role !== "LIBRARIAN") {
    return { error: "仅图书管理员可操作" };
  }

  const raw = {
    bookId: formData.get("bookId"),
    userId: formData.get("userId"),
  };
  const parsed = BorrowSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.flatten().formErrors[0] ?? "输入无效" };
  }

  const { bookId, userId } = parsed.data;

  try {
    const book = await prisma.book.findUnique({
      where: { id: bookId },
      select: { isAvailable: true },
    });
    if (!book || !book.isAvailable) {
      return { error: "该书不可借" };
    }

    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 30);

    await prisma.$transaction([
      prisma.book.update({
        where: { id: bookId },
        data: { isAvailable: false },
      }),
      prisma.borrowRecord.create({
        data: {
          bookId,
          userId,
          dueDate,
        },
      }),
    ]);

    revalidatePath("/dashboard/library");
    return { success: true };
  } catch (e) {
    console.error("借书失败:", e);
    return { error: "操作失败，请稍后重试" };
  }
}

export async function returnBook(bookId: string) {
  // 1. 权限检查：确保是 LIBRARIAN
  const session = await auth();
  if (session?.user?.role !== "LIBRARIAN") {
    return { error: "仅图书管理员可操作" };
  }

  if (!bookId?.trim()) {
    return { error: "参数无效" };
  }

  try {
    const now = new Date();
    // 2. 更新书籍：isAvailable = true
    // 3. 更新记录：该书未还的借阅记录设置 returnDate
    await prisma.$transaction([
      prisma.book.update({
        where: { id: bookId },
        data: { isAvailable: true },
      }),
      prisma.borrowRecord.updateMany({
        where: { bookId, returnDate: null },
        data: { returnDate: now },
      }),
    ]);

    // 4. 刷新
    revalidatePath("/dashboard/library");
    return { success: true };
  } catch (e) {
    console.error("还书失败:", e);
    return { error: "操作失败，请稍后重试" };
  }
}
