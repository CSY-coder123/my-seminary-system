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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateVisa } from "@/app/lib/actions/visa";

export type VisaRecordRow = {
  id: string;
  userId: string;
  passportNumber: string;
  expiryDate: string; // YYYY-MM-DD for input
  userName: string | null;
  documentUrl?: string | null;
};

interface VisaUpdateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  record: VisaRecordRow | null;
}

function toInputDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toISOString().slice(0, 10);
}

export function VisaUpdateDialog({
  open,
  onOpenChange,
  record,
}: VisaUpdateDialogProps) {
  const [passportNumber, setPassportNumber] = useState(record?.passportNumber ?? "");
  const [expiryDate, setExpiryDate] = useState(
    record ? toInputDate(record.expiryDate) : ""
  );
  const [documentUrl, setDocumentUrl] = useState(record?.documentUrl ?? "");
  const [isPending, startTransition] = useTransition();

  React.useEffect(() => {
    if (open && record) {
      setPassportNumber(record.passportNumber);
      setExpiryDate(toInputDate(record.expiryDate));
      setDocumentUrl(record.documentUrl ?? "");
    }
  }, [open, record]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!record) return;
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await updateVisa(null, formData);
      if (result.error) {
        alert(result.error);
      } else {
        onOpenChange(false);
      }
    });
  }

  if (!record) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>更新签证</DialogTitle>
          <DialogDescription>
            {record.userName ?? "学生"} — 修改护照号与到期日
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <input type="hidden" name="recordId" value={record.id} />
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="visa-passport" className="text-right">
                护照号
              </Label>
              <Input
                id="visa-passport"
                name="passportNumber"
                value={passportNumber}
                onChange={(e) => setPassportNumber(e.target.value)}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="visa-expiry" className="text-right">
                到期日
              </Label>
              <Input
                id="visa-expiry"
                name="expiryDate"
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="visa-documentUrl" className="text-right">
                签证资料链接
              </Label>
              <Input
                id="visa-documentUrl"
                name="documentUrl"
                type="url"
                placeholder="https://..."
                value={documentUrl}
                onChange={(e) => setDocumentUrl(e.target.value)}
                className="col-span-3"
              />
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
            <Button type="submit" disabled={isPending}>
              {isPending ? "保存中..." : "保存"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
