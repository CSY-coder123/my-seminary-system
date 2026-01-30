"use client";

import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";

export function Navbar({ userName, role }: { userName: string, role: string }) {
  return (
    <nav className="border-b bg-white px-6 py-3 flex justify-between items-center shadow-sm">
      <div className="flex items-center gap-4">
        <span className="font-bold text-xl text-primary">神学院教务系统</span>
        <span className="px-2 py-1 bg-slate-100 text-xs rounded text-slate-600 uppercase">
          {role}
        </span>
      </div>
      
      <div className="flex items-center gap-4">
        <span className="text-sm text-slate-600">欢迎您，{userName}</span>
        <Button 
          variant="destructive" 
          size="sm" 
          onClick={() => signOut({ callbackUrl: "/login" })}
        >
          退出登录
        </Button>
      </div>
    </nav>
  );
}