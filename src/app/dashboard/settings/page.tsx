import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

import { User, Shield, Database, LogOut } from "lucide-react";
import prisma from "@/lib/prisma";
import { LogoutButton } from "@/components/dashboard/logout-button";
import { BaseCurrencySelect } from "@/components/dashboard/base-currency-select";
import { formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    redirect("/login");
  }

  const userId = session.user.id;

  const [transactionCount, lastTransaction, userRecord, oauthAccount] = await Promise.all([
    prisma.transaction.count({ where: { userId } }),
    prisma.transaction.findFirst({
      where: { userId },
      orderBy: { date: "desc" },
      select: { date: true },
    }),
    prisma.user.findUnique({
      where: { id: userId },
      select: { baseCurrency: true }
    }),
    prisma.account.findFirst({
      where: { userId, provider: "google" }
    }),
  ]);
  
  const isGoogleAuth = !!oauthAccount;

  const baseCurrency = userRecord?.baseCurrency || "IDR";

  const lastEntryLabel = lastTransaction ? formatDate(lastTransaction.date) : "—";

  const settingSections = [
    {
      title: "Profile",
      icon: User,
      settings: [
        { label: "Display Name", value: session.user.name || "—", type: "text" },
        { label: "Email", value: session.user.email || "—", type: "text" },
        { label: "Base Currency", value: baseCurrency, type: "currency-select" },
        { label: "Timezone", value: "Asia/Jakarta (GMT+7)", type: "select" },
      ],
    },
    {
      title: "Security",
      icon: Shield,
      settings: [
        { 
          label: "Password", 
          value: isGoogleAuth ? "Authenticated via Google" : "••••••••••••", 
          type: isGoogleAuth ? "info" : "password" 
        },
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
        <h1 className="text-xl font-semibold tracking-tight text-fg-1">Settings</h1>
        <p className="mt-1 text-[13px] text-fg-4">Manage your account preferences and configuration.</p>
      </div>

      <div className="flex flex-col gap-5">
        {settingSections.map((section) => (
          <div key={section.title} className="overflow-hidden surface-card">
            <div className="flex items-center gap-2 border-b border-line-soft px-6 py-4">
              <section.icon className="h-4 w-4 text-fg-4" strokeWidth={1.75} />
              <h2 className="text-sm font-semibold text-fg-2">{section.title}</h2>
            </div>
            <div className="divide-y divide-line-soft">
              {section.settings.map((setting) => (
                <div key={setting.label} className="flex flex-col gap-2 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                  <span className="text-[13px] text-fg-3">{setting.label}</span>
                  {setting.type === "toggle" ? (
                    <div className={`flex h-6 w-10 items-center rounded-full px-0.5 transition-colors ${setting.value === "Enabled" ? "bg-brand" : "bg-layer-3"}`}>
                      <div className={`h-5 w-5 rounded-full bg-white shadow transition-transform ${setting.value === "Enabled" ? "translate-x-4" : "translate-x-0"}`} />
                    </div>
                  ) : setting.type === "password" ? (
                    <div className="flex items-center gap-3">
                      <span className="text-[13px] tracking-wider text-fg-4">{setting.value}</span>
                      <button className="text-[11px] font-medium text-brand hover:underline">Change</button>
                    </div>
                  ) : setting.type === "currency-select" ? (
                    <BaseCurrencySelect initialValue={setting.value} />
                  ) : (
                    <span className="text-[13px] font-medium text-fg-2">{setting.value}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="overflow-hidden surface-card">
        <div className="flex items-center gap-2 border-b border-line-soft px-6 py-4">
          <LogOut className="h-4 w-4 text-fg-4" strokeWidth={1.75} />
          <h2 className="text-sm font-semibold text-fg-2">Session</h2>
        </div>
        <div className="flex flex-col gap-3 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <span className="break-all text-[13px] text-fg-3">
            Signed in as <span className="text-fg-2">{session.user.email}</span>
          </span>
          <LogoutButton />
        </div>
      </div>

      <div className="flex flex-col gap-3 rounded-xl border border-loss/20 bg-loss-wash/40 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-[13px] font-semibold text-loss">Danger Zone</h3>
          <p className="mt-0.5 text-[11px] text-fg-4">Permanently delete all data. This action cannot be undone.</p>
        </div>
        <button className="h-9 self-start rounded-lg border border-loss/35 px-4 text-[12px] font-semibold text-loss transition-colors hover:bg-loss-wash sm:self-auto">
          Delete Account
        </button>
      </div>
    </div>
  );
}
