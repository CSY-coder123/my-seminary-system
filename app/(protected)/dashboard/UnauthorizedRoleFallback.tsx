"use client";

import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";

export function UnauthorizedRoleFallback() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-8">
      <p className="text-slate-800 font-medium mb-4">
        未授权的角色，请联系管理员。
      </p>
      <Button variant="outline" onClick={() => signOut({ callbackUrl: "/login" })}>
        退出登录
      </Button>
    </div>
  );
}
