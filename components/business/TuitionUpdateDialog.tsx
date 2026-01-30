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
import { updateTuitionStatus } from "@/app/lib/actions/tuition";

export type StudentOption = {
  id: string;
  name: string | null;
  email: string;
  tuitionPaid: boolean;
};

interface TuitionUpdateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  students: StudentOption[];
}

export function TuitionUpdateDialog({
  open,
  onOpenChange,
  students,
}: TuitionUpdateDialogProps) {
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [tuitionPaid, setTuitionPaid] = useState(true);
  const [isPending, startTransition] = useTransition();

  async function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await updateTuitionStatus(null, formData);
      if (result.error) {
        alert(result.error);
      } else {
        onOpenChange(false);
        setSelectedStudentId("");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>登记缴费</DialogTitle>
          <DialogDescription>
            选择学生并设置其缴费状态（已缴费/未缴费）。
          </DialogDescription>
        </DialogHeader>

        <form action={handleSubmit}>
          <input type="hidden" name="studentId" value={selectedStudentId} />
          <input type="hidden" name="tuitionPaid" value={String(tuitionPaid)} />

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="student" className="text-right">
                学生
              </Label>
              <select
                id="student"
                name="student"
                required
                value={selectedStudentId}
                onChange={(e) => {
                  const id = e.target.value;
                  setSelectedStudentId(id);
                  const s = students.find((x) => x.id === id);
                  if (s) setTuitionPaid(s.tuitionPaid);
                }}
                className="col-span-3 flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="">请选择学生</option>
                {students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name || s.email} {s.tuitionPaid ? "（已缴费）" : "（未缴费）"}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">缴费状态</Label>
              <label className="col-span-3 flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={tuitionPaid}
                  onChange={(e) => setTuitionPaid(e.target.checked)}
                  className="h-4 w-4 rounded border-input"
                />
                <span className="text-sm">已缴费</span>
              </label>
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
            <Button type="submit" disabled={isPending || !selectedStudentId}>
              {isPending ? "保存中..." : "保存"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
