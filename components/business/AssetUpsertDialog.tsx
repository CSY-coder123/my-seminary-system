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
import { upsertAsset } from "@/app/lib/actions/asset";

const ASSET_STATUS_OPTIONS = [
  { value: "NORMAL", label: "正常" },
  { value: "DAMAGED", label: "损坏" },
  { value: "REPAIRING", label: "维修中" },
  { value: "DISPOSED", label: "报废" },
] as const;

export type AssetRow = {
  id: string;
  name: string;
  serialNumber: string;
  status: string;
  category: string;
  managerId: string | null;
};

interface AssetUpsertDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  asset?: AssetRow | null;
}

export function AssetUpsertDialog({
  open,
  onOpenChange,
  asset,
}: AssetUpsertDialogProps) {
  const [name, setName] = useState(asset?.name ?? "");
  const [serialNumber, setSerialNumber] = useState(asset?.serialNumber ?? "");
  const [status, setStatus] = useState(asset?.status ?? "NORMAL");
  const [isPending, startTransition] = useTransition();

  React.useEffect(() => {
    if (open) {
      setName(asset?.name ?? "");
      setSerialNumber(asset?.serialNumber ?? "");
      setStatus(asset?.status ?? "NORMAL");
    }
  }, [open, asset]);

  async function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await upsertAsset(null, formData);
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
          <DialogTitle>{asset ? "编辑资产" : "新增资产"}</DialogTitle>
          <DialogDescription>
            填写资产名称、序列号并选择状态。
          </DialogDescription>
        </DialogHeader>

        <form action={handleSubmit}>
          {asset?.id && (
            <input type="hidden" name="id" value={asset.id} />
          )}
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                名称
              </Label>
              <Input
                id="name"
                name="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="serialNumber" className="text-right">
                序列号
              </Label>
              <Input
                id="serialNumber"
                name="serialNumber"
                value={serialNumber}
                onChange={(e) => setSerialNumber(e.target.value)}
                className="col-span-3"
                required
                disabled={!!asset?.id}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="status" className="text-right">
                状态
              </Label>
              <select
                id="status"
                name="status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="col-span-3 flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                {ASSET_STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
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
