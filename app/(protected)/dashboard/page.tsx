import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { UnauthorizedRoleFallback } from "./UnauthorizedRoleFallback";

const ROLE_REDIRECT: Record<string, string> = {
  ADMIN: "/dashboard/admin",
  FACULTY: "/dashboard/faculty",
  STUDENT: "/dashboard/student",
  VISA_OFFICER: "/dashboard/visa",
  FINANCE: "/dashboard/finance",
  LIBRARIAN: "/dashboard/library",
};

export default async function DashboardPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const role = (session.user as { role?: string })?.role;
  const target = role ? ROLE_REDIRECT[role] : undefined;

  if (target) {
    redirect(target);
  }

  return <UnauthorizedRoleFallback />;
}
