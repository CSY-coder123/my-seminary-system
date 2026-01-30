"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { AssetUpsertDialog, type AssetRow } from "@/components/business/AssetUpsertDialog";

export function AssetsPageClient() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<AssetRow | null>(null);

  return (
    <>
      <Button onClick={() => { setEditingAsset(null); setDialogOpen(true); }}>
        新增资产
      </Button>
      <AssetUpsertDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        asset={editingAsset}
      />
    </>
  );
}
