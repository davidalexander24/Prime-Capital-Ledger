import type { Metadata } from "next";
import { Sidebar } from "@/components/layout/sidebar";

export const metadata: Metadata = {
  title: "Dashboard - Prime Capital Ledger",
  description:
    "Portfolio management dashboard for equity markets. Track holdings, transactions, and performance analytics.",
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex flex-1 flex-col pt-14 lg:pt-0 lg:pl-55">
        <main className="flex-1 px-4 py-4 sm:px-6 lg:px-8 lg:py-6">{children}</main>
      </div>
    </div>
  );
}
