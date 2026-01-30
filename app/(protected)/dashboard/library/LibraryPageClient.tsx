"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  BorrowBookDialog,
  type BookOption,
  type StudentOption,
} from "@/components/business/BorrowBookDialog";

interface LibraryPageClientProps {
  books: BookOption[];
  students: StudentOption[];
}

export function LibraryPageClient({ books, students }: LibraryPageClientProps) {
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setDialogOpen(true)}>借书</Button>
      <BorrowBookDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        books={books}
        students={students}
      />
    </>
  );
}
