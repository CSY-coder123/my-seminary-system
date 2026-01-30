"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UserEditDialog, type UserRow } from "@/components/business/UserEditDialog";

type CohortOption = { id: string; name: string };

interface UsersPageClientProps {
  users: UserRow[];
  cohorts: CohortOption[];
}

export function UsersPageClient({ users, cohorts }: UsersPageClientProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserRow | null>(null);

  return (
    <>
      <table className="w-full caption-bottom text-sm">
        <thead className="border-b bg-muted/50">
          <tr>
            <th className="h-10 px-4 text-left align-middle font-medium">姓名</th>
            <th className="h-10 px-4 text-left align-middle font-medium">邮箱</th>
            <th className="h-10 px-4 text-left align-middle font-medium">角色</th>
            <th className="h-10 px-4 text-left align-middle font-medium">所属班级</th>
            <th className="h-10 px-4 text-left align-middle font-medium">操作</th>
          </tr>
        </thead>
        <tbody>
          {users.length === 0 ? (
            <tr>
              <td colSpan={5} className="p-4 text-center text-muted-foreground">
                暂无用户
              </td>
            </tr>
          ) : (
            users.map((u) => (
              <tr
                key={u.id}
                className="border-b transition-colors hover:bg-muted/50"
              >
                <td className="p-4 font-medium">
                  {u.name ?? "—"}
                  {u.role === "STUDENT" && u.isMonitor && (
                    <Badge variant="default" className="ml-2 bg-blue-600 hover:bg-blue-700">
                      班长
                    </Badge>
                  )}
                </td>
                <td className="p-4 text-muted-foreground">{u.email}</td>
                <td className="p-4">{u.role}</td>
                <td className="p-4 text-muted-foreground">{u.cohortName ?? "—"}</td>
                <td className="p-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditingUser(u);
                      setDialogOpen(true);
                    }}
                  >
                    编辑
                  </Button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
      <UserEditDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        user={editingUser}
        cohorts={cohorts}
      />
    </>
  );
}
