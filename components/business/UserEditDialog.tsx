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
import { Switch } from "@/components/ui/switch";
import { updateUser } from "@/app/lib/actions/admin";

const ROLE_OPTIONS = [
  { value: "ADMIN", label: "管理员" },
  { value: "FACULTY", label: "教师" },
  { value: "STUDENT", label: "学生" },
  { value: "VISA_OFFICER", label: "签证官" },
  { value: "FINANCE", label: "财务" },
  { value: "LIBRARIAN", label: "图书管理员" },
] as const;

export type CohortOption = {
  id: string;
  name: string;
};

export type UserRow = {
  id: string;
  name: string | null;
  email: string;
  role: string;
  cohortId: string | null;
  cohortName: string | null;
  isMonitor?: boolean;
};

interface UserEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: UserRow | null;
  cohorts: CohortOption[];
}

export function UserEditDialog({
  open,
  onOpenChange,
  user,
  cohorts,
}: UserEditDialogProps) {
  const [role, setRole] = useState(user?.role ?? "STUDENT");
  const [cohortId, setCohortId] = useState(user?.cohortId ?? "");
  const [isMonitor, setIsMonitor] = useState(user?.isMonitor ?? false);
  const [isPending, startTransition] = useTransition();

  React.useEffect(() => {
    if (open && user) {
      setRole(user.role);
      setCohortId(user.cohortId ?? "");
      setIsMonitor(user.isMonitor ?? false);
    }
  }, [open, user]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!user) return;
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await updateUser(null, formData);
      if (result.error) {
        alert(result.error);
      } else {
        onOpenChange(false);
      }
    });
  }

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>编辑用户</DialogTitle>
          <DialogDescription>
            {user.name ?? user.email} — 修改角色与所属班级
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <input type="hidden" name="userId" value={user.id} />
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="role" className="text-right">
                角色
              </Label>
              <select
                id="role"
                name="role"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="col-span-3 flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                {ROLE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="cohortId" className="text-right">
                班级
              </Label>
              <select
                id="cohortId"
                name="cohortId"
                value={cohortId}
                onChange={(e) => setCohortId(e.target.value)}
                className="col-span-3 flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="">— 未分配 —</option>
                {cohorts.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            {role === "STUDENT" && (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">班长</Label>
                <div className="col-span-3 flex items-center gap-2">
                  <Switch
                    id="isMonitor"
                    checked={isMonitor}
                    onCheckedChange={setIsMonitor}
                  />
                  <input
                    type="hidden"
                    name="isMonitor"
                    value={isMonitor ? "true" : "false"}
                  />
                  <Label htmlFor="isMonitor" className="font-normal cursor-pointer">
                    设为班长 (Monitor)
                  </Label>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              取消
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "保存中..." : "保存"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
