"use client";

import React, { useState } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { StudentVisaDialog } from "@/components/business/StudentVisaDialog";

interface StudentVisaCardProps {
  documentUrl: string | null;
  /** 已有记录时预填护照号；无记录时为空 */
  passportNumber?: string;
}

export function StudentVisaCard({
  documentUrl,
  passportNumber = "",
}: StudentVisaCardProps) {
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <div className="space-y-4">
      {documentUrl ? (
        <p className="text-sm">
          <a
            href={documentUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            📄 查看已上传资料
          </a>
        </p>
      ) : (
        <p className="text-sm text-muted-foreground">尚未上传签证资料</p>
      )}
      <Button
        className={buttonVariants({ variant: "outline", size: "sm" })}
        onClick={() => setDialogOpen(true)}
      >
        {documentUrl ? "更新资料" : "上传资料"}
      </Button>
      <StudentVisaDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        initialPassportNumber={passportNumber}
      />
    </div>
  );
}
