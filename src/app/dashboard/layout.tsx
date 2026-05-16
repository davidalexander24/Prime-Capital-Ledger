import type { Metadata } from "next";
import { Sidebar } from "@/components/layout/sidebar";
<<<<<<< HEAD
=======
import { Header } from "@/components/layout/header";
>>>>>>> origin/nico

export const metadata: Metadata = {
  title: "Dashboard — Prime Capital Ledger",
  description:
    "Portfolio management dashboard for Indonesian equity markets. Track holdings, transactions, and performance analytics.",
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex flex-1 flex-col pl-[220px]">
<<<<<<< HEAD
=======
        <Header />
>>>>>>> origin/nico
        <main className="flex-1 px-8 py-6">{children}</main>
      </div>
    </div>
  );
}
