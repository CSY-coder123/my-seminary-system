import { auth } from "@/auth";
import { Navbar } from "@/components/layout/navbar";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { AssetsPageClient } from "./AssetsPageClient";

const STATUS_LABEL: Record<string, string> = {
  NORMAL: "可用",
  DAMAGED: "损坏",
  REPAIRING: "维修中",
  DISPOSED: "报废",
};

const STATUS_BADGE_VARIANT: Record<string, "success" | "destructive" | "warning" | "muted"> = {
  NORMAL: "success",
  DAMAGED: "destructive",
  REPAIRING: "warning",
  DISPOSED: "muted",
};

export default async function AdminAssetsPage() {
  const session = await auth();
  if (!session) redirect("/login");

  if (session.user?.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const assets = await prisma.fixedAsset.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      serialNumber: true,
      status: true,
      category: true,
      managerId: true,
    },
  });

  const total = assets.length;
  const repairingCount = assets.filter((a) => a.status === "REPAIRING").length;

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar userName={session.user?.name ?? "管理员"} role="ADMIN" />
      <main className="p-8">
        <div className="bg-white rounded-xl shadow-sm border p-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-slate-800">固定资产管理</h1>
            <AssetsPageClient />
          </div>

          <div className="grid gap-4 mb-6 sm:grid-cols-2">
            <div className="rounded-lg border bg-card p-4 text-card-foreground shadow-sm">
              <p className="text-sm text-muted-foreground">总资产数</p>
              <p className="text-2xl font-bold">{total}</p>
            </div>
            <div className="rounded-lg border bg-card p-4 text-card-foreground shadow-sm">
              <p className="text-sm text-muted-foreground">维修中数量</p>
              <p className="text-2xl font-bold text-amber-600">{repairingCount}</p>
            </div>
          </div>

          <div className="rounded-md border overflow-x-auto">
            <table className="w-full caption-bottom text-sm">
              <thead className="border-b bg-muted/50">
                <tr>
                  <th className="h-10 px-4 text-left align-middle font-medium">
                    名称
                  </th>
                  <th className="h-10 px-4 text-left align-middle font-medium">
                    序列号
                  </th>
                  <th className="h-10 px-4 text-left align-middle font-medium">
                    状态
                  </th>
                  <th className="h-10 px-4 text-left align-middle font-medium">
                    登记人
                  </th>
                </tr>
              </thead>
              <tbody>
                {assets.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="p-4 text-center text-muted-foreground"
                    >
                      暂无资产
                    </td>
                  </tr>
                ) : (
                  assets.map((asset) => (
                    <tr
                      key={asset.id}
                      className="border-b transition-colors hover:bg-muted/50"
                    >
                      <td className="p-4 font-medium">{asset.name}</td>
                      <td className="p-4 text-muted-foreground">
                        {asset.serialNumber}
                      </td>
                      <td className="p-4">
                        <Badge
                          variant={
                            STATUS_BADGE_VARIANT[asset.status] ?? "secondary"
                          }
                        >
                          {STATUS_LABEL[asset.status] ?? asset.status}
                        </Badge>
                      </td>
                      <td className="p-4 text-muted-foreground">
                        {asset.managerId ?? "—"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
