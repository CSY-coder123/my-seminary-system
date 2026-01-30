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
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateStudentGrade } from "@/app/lib/actions/grade";

interface Props {
  studentId: string;
  studentName: string;
  courseId: string;
  currentScore?: number | null;
}

export function GradeEntryDialog({
  studentId,
  studentName,
  courseId,
  currentScore,
}: Props) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  // 提交表单的处理函数
  async function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await updateStudentGrade(null, formData);
      
      if (result.error) {
        alert(result.error); // 简单报错
      } else {
        setOpen(false); // 关闭弹窗
        // alert("录入成功！"); // 可选：提示成功
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          {currentScore !== undefined && currentScore !== null 
            ? String(currentScore) // 如果有分，显示分数
            : "录入"               // 没分，显示“录入”
          }
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>录入成绩</DialogTitle>
          <DialogDescription>
            正在为 <b>{studentName}</b> 录入成绩。
          </DialogDescription>
        </DialogHeader>
        
        {/* 表单区域 */}
        <form action={handleSubmit}>
          <input type="hidden" name="studentId" value={studentId} />
          <input type="hidden" name="courseId" value={courseId} />
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="score" className="text-right">
                分数
              </Label>
              <Input
                id="score"
                name="score"
                type="number"
                step="0.1"
                defaultValue={currentScore ?? ""}
                className="col-span-3"
                placeholder="0-100"
                required
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending ? "保存中..." : "保存成绩"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}