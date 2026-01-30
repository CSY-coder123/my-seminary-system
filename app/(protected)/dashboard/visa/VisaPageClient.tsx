"use client";

import React, { useState } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge, badgeVariants } from "@/components/ui/badge";
import { VisaUpdateDialog, type VisaRecordRow } from "@/components/business/VisaUpdateDialog";
import { VisaCreateDialog } from "@/components/business/VisaCreateDialog";
import type { StudentRegistryRow } from "./VisaRegistryTable";

export type VisaListItem = {
  id: string;
  userId: string;
  passportNumber: string;
  expiryDateDisplay: string;
  userName: string;
  cohortName: string;
  daysLeft: number;
  badgeVariant: "destructive" | "warning" | "success";
  documentUrl?: string | null;
  /** 学生自助上传、到期日为 2099 待签证官核实 */
  isPendingVerification?: boolean;
};

type NoRecordRow = {
  userId: string;
  userName: string;
  cohortName: string;
};

interface VisaPageClientProps {
  list: VisaListItem[];
  noRecordRows: NoRecordRow[];
  dialogRecords: VisaRecordRow[];
  studentRegistry: StudentRegistryRow[];
}

function getBadgeLabel(daysLeft: number): string {
  if (daysLeft < 30) return "Expires soon";
  if (daysLeft < 90) return "Expiring";
  return "Valid";
}

export function VisaPageClient({
  list,
  noRecordRows,
  dialogRecords,
}: VisaPageClientProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<VisaRecordRow | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [createTarget, setCreateTarget] = useState<NoRecordRow | null>(null);

  const handleOpenDialog = (id: string) => {
    const record = dialogRecords.find((r) => r.id === id) ?? null;
    setSelectedRecord(record);
    setDialogOpen(true);
  };

  const handleOpenCreate = (row: NoRecordRow) => {
    setCreateTarget(row);
    setCreateDialogOpen(true);
  };

  const isEmpty = list.length === 0 && noRecordRows.length === 0;

  if (isEmpty) {
    return (
      <p className="text-sm text-muted-foreground py-4 text-center">
        暂无国际生；请先在下方「国际生管理」中标记学生为国际生
      </p>
    );
  }

  return (
    <>
      <div className="rounded-md border overflow-x-auto">
        <table className="w-full caption-bottom text-sm">
          <thead className="border-b bg-muted/50">
            <tr>
              <th className="h-10 px-4 text-left align-middle font-medium">
                学生姓名
              </th>
              <th className="h-10 px-4 text-left align-middle font-medium">
                班级
              </th>
              <th className="h-10 px-4 text-left align-middle font-medium">
                护照号
              </th>
              <th className="h-10 px-4 text-left align-middle font-medium">
                签证到期日
              </th>
              <th className="h-10 px-4 text-left align-middle font-medium">
                剩余天数
              </th>
              <th className="h-10 px-4 text-left align-middle font-medium">
                状态
              </th>
              <th className="h-10 px-4 text-left align-middle font-medium">
                资料
              </th>
              <th className="h-10 px-4 text-left align-middle font-medium">
                操作
              </th>
            </tr>
          </thead>
          <tbody>
            {list.map((row) => (
              <tr
                key={row.id}
                className={
                  row.isPendingVerification
                    ? "border-b border-amber-200 bg-amber-50/50 transition-colors hover:bg-amber-50"
                    : "border-b transition-colors hover:bg-muted/50"
                }
              >
                <td className="p-4 font-medium">{row.userName}</td>
                <td className="p-4 text-muted-foreground">{row.cohortName}</td>
                <td className="p-4 text-muted-foreground">
                  {row.passportNumber}
                </td>
                <td className="p-4 text-muted-foreground">
                  {row.expiryDateDisplay}
                </td>
                <td className="p-4">
                  {row.daysLeft < 0 ? "已过期" : `${row.daysLeft} 天`}
                </td>
                <td className="p-4">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Badge
                      className={badgeVariants({
                        variant: row.badgeVariant,
                      })}
                    >
                      {getBadgeLabel(row.daysLeft)}
                    </Badge>
                    {row.isPendingVerification && (
                      <Badge
                        className={badgeVariants({ variant: "warning" })}
                      >
                        待签证官审核
                      </Badge>
                    )}
                  </div>
                </td>
                <td className="p-4">
                  {row.documentUrl?.trim() &&
                  !row.documentUrl.includes("placehold.co") ? (
                    <a
                      href={row.documentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      📄 查看资料
                    </a>
                  ) : (
                    <span className="text-muted-foreground">未上传</span>
                  )}
                </td>
                <td className="p-4">
                  <Button
                    className={buttonVariants({ variant: "outline", size: "sm" })}
                    onClick={() => handleOpenDialog(row.id)}
                  >
                    更新签证
                  </Button>
                </td>
              </tr>
            ))}
            {noRecordRows.map((row) => (
              <tr
                key={row.userId}
                className="border-b transition-colors hover:bg-muted/50"
              >
                <td className="p-4 font-medium">{row.userName}</td>
                <td className="p-4 text-muted-foreground">{row.cohortName}</td>
                <td className="p-4 text-muted-foreground" colSpan={4}>
                  未登记签证
                </td>
                <td className="p-4 text-muted-foreground">—</td>
                <td className="p-4">
                  <Button
                    className={buttonVariants({ variant: "outline", size: "sm" })}
                    onClick={() => handleOpenCreate(row)}
                  >
                    创建记录
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <VisaUpdateDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        record={selectedRecord}
      />
      {createTarget && (
        <VisaCreateDialog
          open={createDialogOpen}
          onOpenChange={setCreateDialogOpen}
          userId={createTarget.userId}
          userName={createTarget.userName}
        />
      )}
    </>
  );
}
