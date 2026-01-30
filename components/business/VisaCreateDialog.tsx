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
import { createVisaRecord } from "@/app/lib/actions/visa";

interface VisaCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  userName: string;
}

export function VisaCreateDialog({
  open,
  onOpenChange,
  userId,
  userName,
}: VisaCreateDialogProps) {
  const [passportNumber, setPassportNumber] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [documentUrl, setDocumentUrl] = useState("");
  const [isPending, startTransition] = useTransition();

  React.useEffect(() => {
    if (open) {
      setPassportNumber("");
      setExpiryDate("");
      setDocumentUrl("");
    }
  }, [open]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    formData.set("userId", userId);
    startTransition(async () => {
      const result = await createVisaRecord(null, formData);
      if (result.error) {
        alert(result.error);
      } else {
        onOpenChange(false);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>创建签证记录</DialogTitle>
          <DialogDescription>
            {userName} — 登记护照号、到期日与资料链接
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <input type="hidden" name="userId" value={userId} />
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="create-passport" className="text-right">
                护照号
              </Label>
              <Input
                id="create-passport"
                name="passportNumber"
                value={passportNumber}
                onChange={(e) => setPassportNumber(e.target.value)}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="create-expiry" className="text-right">
                到期日
              </Label>
              <Input
                id="create-expiry"
                name="expiryDate"
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="create-documentUrl" className="text-right">
                签证资料链接
              </Label>
              <Input
                id="create-documentUrl"
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
              {isPending ? "创建中..." : "创建"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
