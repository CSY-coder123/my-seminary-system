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
import { Label } from "@/components/ui/label";
import { borrowBook } from "@/app/lib/actions/library";

export type BookOption = {
  id: string;
  title: string;
  isbn: string | null;
  author: string;
  isAvailable: boolean;
};

export type StudentOption = {
  id: string;
  name: string | null;
  email: string;
};

interface BorrowBookDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  books: BookOption[];
  students: StudentOption[];
}

export function BorrowBookDialog({
  open,
  onOpenChange,
  books,
  students,
}: BorrowBookDialogProps) {
  const availableBooks = books.filter((b) => b.isAvailable);
  const [bookId, setBookId] = useState("");
  const [userId, setUserId] = useState("");
  const [isPending, startTransition] = useTransition();

  async function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await borrowBook(null, formData);
      if (result.error) {
        alert(result.error);
      } else {
        onOpenChange(false);
        setBookId("");
        setUserId("");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>借书</DialogTitle>
          <DialogDescription>
            选择可借书籍和学生，登记借阅记录。
          </DialogDescription>
        </DialogHeader>

        <form action={handleSubmit}>
          <input type="hidden" name="bookId" value={bookId} />
          <input type="hidden" name="userId" value={userId} />

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="book" className="text-right">
                书籍
              </Label>
              <select
                id="book"
                name="book"
                required
                value={bookId}
                onChange={(e) => setBookId(e.target.value)}
                className="col-span-3 flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="">请选择书籍</option>
                {availableBooks.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.title} {b.isbn ? `(${b.isbn})` : ""}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="student" className="text-right">
                学生
              </Label>
              <select
                id="student"
                name="student"
                required
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                className="col-span-3 flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="">请选择学生</option>
                {students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name || s.email}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              取消
            </Button>
            <Button type="submit" disabled={isPending || !bookId || !userId}>
              {isPending ? "提交中..." : "确认借书"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
