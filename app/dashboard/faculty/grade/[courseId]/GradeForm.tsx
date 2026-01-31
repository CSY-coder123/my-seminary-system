"use client";

import { useActionState, useEffect, useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { updateStudentGrades } from "@/app/lib/actions/faculty";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export type GradeRow = {
  studentId: string;
  name: string;
  email: string;
  score: number | "";
  feedback: string;
};

type ActionState = {
  success?: boolean;
  error?: string;
};

type GradeFormProps = {
  courseId: string;
  initialRows: { studentId: string; name: string; email: string; score: number | ""; feedback: string }[];
};

export function GradeForm({ courseId, initialRows }: GradeFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [state, formAction] = useActionState<ActionState, FormData>(
    updateStudentGrades,
    { success: false }
  );
  const [rows, setRows] = useState<GradeRow[]>(
    initialRows.map((r) => ({
      ...r,
      score: r.score === "" ? "" : (r.score as number),
      feedback: r.feedback ?? "",
    }))
  );

  useEffect(() => {
    if (state?.success) {
      toast.success("成绩已保存");
      router.refresh();
    }
    if (state?.error) toast.error(state.error);
  }, [state, router]);

  const setScore = (studentId: string, value: string) => {
    const num = value === "" ? "" : parseFloat(value);
    if (num !== "" && (Number.isNaN(num) || num < 0 || num > 100)) return;
    setRows((prev) =>
      prev.map((r) => (r.studentId === studentId ? { ...r, score: num } : r))
    );
  };

  const setFeedback = (studentId: string, value: string) => {
    setRows((prev) =>
      prev.map((r) => (r.studentId === studentId ? { ...r, feedback: value } : r))
    );
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const entries = rows.map((r) => ({
      studentId: r.studentId,
      courseId,
      score: r.score === "" ? 0 : Number(r.score),
      feedback: r.feedback.trim() || undefined,
    }));
    const fd = new FormData();
    fd.set("entries", JSON.stringify(entries));
    startTransition(() => {
      formAction(fd);
    });
  };

  if (rows.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-6">
        该班级暂无学生，无法录入成绩。
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex justify-end">
        <Button type="submit" disabled={isPending}>
          {isPending ? "保存中..." : "一键保存全部 (Save All)"}
        </Button>
      </div>
      <div className="overflow-x-auto rounded-md border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="text-left p-3 font-medium">学生姓名</th>
              <th className="text-left p-3 font-medium">学号</th>
              <th className="text-left p-3 font-medium w-28">当前成绩</th>
              <th className="text-left p-3 font-medium min-w-[200px]">评语</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.studentId} className="border-b last:border-0">
                <td className="p-3">{r.name}</td>
                <td className="p-3 text-muted-foreground">{r.email}</td>
                <td className="p-3">
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    step={0.5}
                    placeholder="0–100"
                    value={r.score === "" ? "" : r.score}
                    onChange={(e) => setScore(r.studentId, e.target.value)}
                    className="h-9 w-24"
                  />
                </td>
                <td className="p-3">
                  <Input
                    type="text"
                    placeholder="选填"
                    value={r.feedback}
                    onChange={(e) => setFeedback(r.studentId, e.target.value)}
                    className="h-9"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </form>
  );
}
