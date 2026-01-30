"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { TuitionUpdateDialog, type StudentOption } from "@/components/business/TuitionUpdateDialog";

type StudentRow = {
  id: string;
  name: string | null;
  email: string;
  tuitionPaid: boolean;
  cohortName: string;
};

export function FinancePageClient({ students }: { students: StudentRow[] }) {
  const [dialogOpen, setDialogOpen] = useState(false);

  const studentOptions: StudentOption[] = students.map((s) => ({
    id: s.id,
    name: s.name,
    email: s.email,
    tuitionPaid: s.tuitionPaid,
  }));

  return (
    <>
      <Button onClick={() => setDialogOpen(true)}>登记缴费</Button>
      <TuitionUpdateDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        students={studentOptions}
      />
    </>
  );
}
