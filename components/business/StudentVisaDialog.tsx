"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
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
import { updateVisaProfile } from "@/app/lib/actions/student";

interface StudentVisaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** 已有记录时预填护照号；无记录时为空 */
  initialPassportNumber?: string;
}

export function StudentVisaDialog({
  open,
  onOpenChange,
  initialPassportNumber = "",
}: StudentVisaDialogProps) {
  const [passportNumber, setPassportNumber] = useState(initialPassportNumber);
  const [file, setFile] = useState<File | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  React.useEffect(() => {
    if (open) {
      setPassportNumber(initialPassportNumber);
      setFile(null);
    }
  }, [open, initialPassportNumber]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!passportNumber.trim()) {
      alert("请输入护照号");
      return;
    }
    if (!file) {
      alert("请选择要上传的图片或 PDF 文件");
      return;
    }
    const formData = new FormData();
    formData.set("passportNumber", passportNumber.trim());
    formData.set("file", file);
    startTransition(async () => {
      const result = await updateVisaProfile(null, formData);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("上传成功，签证官可见");
        onOpenChange(false);
        router.refresh();
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>上传签证资料</DialogTitle>
          <DialogDescription>
            填写护照号并上传护照/签证扫描件（图片或 PDF），用于存档
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
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
                placeholder="请填写护照号"
                disabled={isPending}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="visa-file" className="text-right">
                选择文件
              </Label>
              <div className="col-span-3 space-y-2">
                <Input
                  id="visa-file"
                  name="file"
                  type="file"
                  accept="image/*,application/pdf"
                  disabled={isPending}
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                  className="cursor-pointer"
                />
                {file && (
                  <p className="text-xs text-muted-foreground">
                    已选：{file.name}
                  </p>
                )}
              </div>
            </div>
            {isPending && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin shrink-0" />
                <span>上传中，请勿重复点击</span>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              取消
            </Button>
            <Button
              type="submit"
              disabled={isPending || !file || !passportNumber.trim()}
            >
              {isPending ? "上传中..." : "上传"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
