import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

import { User, Shield, Database } from "lucide-react";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    redirect("/login");
  }

  const userId = session.user.id;

  const [transactionCount, lastTransaction] = await Promise.all([
    prisma.transaction.count({ where: { userId } }),
    prisma.transaction.findFirst({
      where: { userId },
      orderBy: { createdAt: "desc" },
      select: { createdAt: true },
    }),
  ]);

  const lastEntryLabel = lastTransaction
    ? lastTransaction.createdAt.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";

  const settingSections = [
    {
      title: "Profile",
      icon: User,
      settings: [
        { label: "Display Name", value: session.user.name || "—", type: "text" },
        { label: "Email", value: session.user.email || "—", type: "text" },
        { label: "Base Currency", value: "IDR", type: "select" },
        { label: "Timezone", value: "Asia/Jakarta (GMT+7)", type: "select" },
      ],
    },
    {
      title: "Security",
      icon: Shield,
      settings: [
        { label: "Password", value: "••••••••••••", type: "password" },
        { label: "Two-Factor Auth", value: "Disabled", type: "toggle" },
      ],
    },
    {
      title: "Data & Storage",
      icon: Database,
      settings: [
        {
          label: "Total Transactions",
          value: `${transactionCount.toLocaleString()} ${
            transactionCount === 1 ? "entry" : "entries"
          }`,
          type: "info",
        },
        { label: "Last Entry", value: lastEntryLabel, type: "info" },
      ],
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-[oklch(0.93_0.005_260)]">Settings</h1>
        <p className="mt-1 text-[13px] text-[oklch(0.45_0.01_260)]">Manage your account preferences and configuration.</p>
      </div>

      <div className="flex flex-col gap-5">
        {settingSections.map((section) => (
          <div key={section.title} className="overflow-hidden rounded-xl border border-[oklch(0.14_0.005_260)] bg-[oklch(0.05_0.005_260)]">
            <div className="flex items-center gap-2 border-b border-[oklch(0.12_0.005_260)] px-6 py-4">
              <section.icon className="h-4 w-4 text-[oklch(0.45_0.01_260)]" strokeWidth={1.75} />
              <h2 className="text-sm font-semibold text-[oklch(0.88_0.005_260)]">{section.title}</h2>
            </div>
            <div className="divide-y divide-[oklch(0.10_0.005_260)]">
              {section.settings.map((setting) => (
                <div key={setting.label} className="flex items-center justify-between px-6 py-3.5">
                  <span className="text-[13px] text-[oklch(0.65_0.005_260)]">{setting.label}</span>
                  {setting.type === "toggle" ? (
                    <div className={`flex h-6 w-10 items-center rounded-full px-0.5 transition-colors ${setting.value === "Enabled" ? "bg-[oklch(0.70_0.08_230)]" : "bg-[oklch(0.18_0.005_260)]"}`}>
                      <div className={`h-5 w-5 rounded-full bg-white shadow transition-transform ${setting.value === "Enabled" ? "translate-x-4" : "translate-x-0"}`} />
                    </div>
                  ) : setting.type === "password" ? (
                    <div className="flex items-center gap-3">
                      <span className="text-[13px] tracking-wider text-[oklch(0.50_0.01_260)]">{setting.value}</span>
                      <button className="text-[11px] font-medium text-[oklch(0.70_0.08_230)] hover:underline">Change</button>
                    </div>
                  ) : (
                    <span className="text-[13px] font-medium text-[oklch(0.80_0.005_260)]">{setting.value}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between rounded-xl border border-[oklch(0.15_0.02_25)] bg-[oklch(0.06_0.01_25)] p-5">
        <div>
          <h3 className="text-[13px] font-semibold text-[oklch(0.70_0.15_25)]">Danger Zone</h3>
          <p className="mt-0.5 text-[11px] text-[oklch(0.45_0.01_260)]">Permanently delete all data. This action cannot be undone.</p>
        </div>
        <button className="h-9 rounded-lg border border-[oklch(0.25_0.08_25)] px-4 text-[12px] font-semibold text-[oklch(0.65_0.15_25)] transition-colors hover:bg-[oklch(0.12_0.05_25)]">
          Delete Account
        </button>
      </div>
    </div>
  );
}
