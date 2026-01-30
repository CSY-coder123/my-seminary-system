"use client";

import React, { useState } from "react";
import { Switch } from "@/components/ui/switch";
import { toggleInternationalStatus } from "@/app/lib/actions/visa";

export type StudentRegistryRow = {
  id: string;
  name: string;
  email: string;
  cohortName: string;
  isInternational: boolean;
};

interface VisaRegistryTableProps {
  studentRegistry: StudentRegistryRow[];
}

export function VisaRegistryTable({ studentRegistry }: VisaRegistryTableProps) {
  const [pendingUserId, setPendingUserId] = useState<string | null>(null);

  async function handleToggle(userId: string, checked: boolean) {
    setPendingUserId(userId);
    try {
      await toggleInternationalStatus(userId, checked);
    } finally {
      setPendingUserId(null);
    }
  }

  if (studentRegistry.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-4 text-center">
        暂无学生
      </p>
    );
  }

  return (
    <div className="rounded-md border overflow-x-auto">
      <table className="w-full caption-bottom text-sm">
        <thead className="border-b bg-muted/50">
          <tr>
            <th className="h-10 px-4 text-left align-middle font-medium">
              姓名
            </th>
            <th className="h-10 px-4 text-left align-middle font-medium">
              邮箱
            </th>
            <th className="h-10 px-4 text-left align-middle font-medium">
              班级
            </th>
            <th className="h-10 px-4 text-left align-middle font-medium">
              国际生
            </th>
          </tr>
        </thead>
        <tbody>
          {studentRegistry.map((row) => (
            <tr
              key={row.id}
              className="border-b transition-colors hover:bg-muted/50"
            >
              <td className="p-4 font-medium">{row.name}</td>
              <td className="p-4 text-muted-foreground">{row.email}</td>
              <td className="p-4 text-muted-foreground">{row.cohortName}</td>
              <td className="p-4">
                <Switch
                  checked={row.isInternational}
                  disabled={pendingUserId === row.id}
                  onCheckedChange={(checked) => handleToggle(row.id, checked)}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
