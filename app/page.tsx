import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-8">
      <h1 className="text-3xl font-bold text-slate-800 mb-6">
        Seminary System v3
      </h1>
      <Button asChild>
        <Link href="/login">登录系统</Link>
      </Button>
    </div>
  );
}
