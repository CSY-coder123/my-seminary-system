"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { CohortCreateDialog } from "@/components/business/CohortCreateDialog";

export function CohortsPageClient() {
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setDialogOpen(true)}>新建班级</Button>
      <CohortCreateDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </>
  );
}
