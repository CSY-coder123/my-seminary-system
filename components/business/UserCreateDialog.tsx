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
import { createUser } from "@/app/lib/actions/admin";

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

interface UserCreateDialogProps {
  cohorts: CohortOption[];
  trigger?: React.ReactNode;
}

export function UserCreateDialog({ cohorts, trigger }: UserCreateDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("STUDENT");
  const [cohortId, setCohortId] = useState("");
  const [isPending, startTransition] = useTransition();

  React.useEffect(() => {
    if (open) {
      setName("");
      setEmail("");
      setRole("STUDENT");
      setCohortId("");
    }
  }, [open]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await createUser(null, formData);
      if (result.error) {
        alert(result.error);
      } else {
        setOpen(false);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button>
            <span className="sr-only">Add User</span>
            <span aria-hidden>新增用户</span>
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>新增用户</DialogTitle>
          <DialogDescription>
            填写姓名、邮箱并选择角色。默认密码为 123456。
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="create-name" className="text-right">
                Name
              </Label>
              <Input
                id="create-name"
                name="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="create-email" className="text-right">
                Email
              </Label>
              <Input
                id="create-email"
                name="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="create-role" className="text-right">
                Role
              </Label>
              <select
                id="create-role"
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
            {role === "STUDENT" && (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="create-cohortId" className="text-right">
                  Cohort
                </Label>
                <select
                  id="create-cohortId"
                  name="cohortId"
                  value={cohortId}
                  onChange={(e) => setCohortId(e.target.value)}
                  className="col-span-3 flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="">— 可选 —</option>
                  {cohorts.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              取消
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "创建中..." : "创建"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
