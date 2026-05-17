import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";

import { FileText, FileSpreadsheet, Globe, CheckCircle2 } from "lucide-react";
import { FileUploader } from "@/components/dashboard/file-uploader";

interface ImportHistoryItem {
  id: string;
  filename: string;
  source: string;
  transactions: number;
  date: string;
}

const importSources = [
  { id: "ajaib", name: "Ajaib", desc: "Import from Ajaib brokerage PDF statements", icon: FileText, formats: "PDF" },
  { id: "stockbit", name: "Stockbit", desc: "Import from Stockbit PDF confirmations", icon: FileText, formats: "PDF", comingSoon: true },
  { id: "csv", name: "CSV Upload", desc: "Bulk import from CSV spreadsheet", icon: FileSpreadsheet, formats: "CSV", comingSoon: true },
  { id: "api", name: "Broker API", desc: "Automatic sync via broker API", icon: Globe, formats: "API", comingSoon: true },
];

export default async function ImportPage() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    redirect("/login");
  }

  const userId = session.user.id;

  const importSessions = await prisma.importSession.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    include: {
      _count: {
        select: { transactions: true }
      }
    },
    take: 10,
  });

  const importHistory: ImportHistoryItem[] = importSessions.map((s) => ({
    id: s.id,
    filename: s.filename,
    source: s.source,
    transactions: s._count.transactions,
    date: s.createdAt.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    }),
  }));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-[oklch(0.93_0.005_260)]">Import</h1>
        <p className="mt-1 text-[13px] text-[oklch(0.45_0.01_260)]">Import transactions from brokerage statements and CSV files.</p>
      </div>

      <FileUploader />

      <div>
        <h2 className="mb-4 text-sm font-semibold text-[oklch(0.88_0.005_260)]">Import Sources</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {importSources.map((s) => (
            <div key={s.id} className={`rounded-xl border border-[oklch(0.14_0.005_260)] bg-[oklch(0.05_0.005_260)] p-5 transition-colors hover:border-[oklch(0.20_0.005_260)] ${s.comingSoon ? "opacity-50" : "cursor-pointer"}`}>
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[oklch(0.12_0.005_260)]">
                <s.icon className="h-4 w-4 text-[oklch(0.50_0.01_260)]" strokeWidth={1.75} />
              </div>
              <h3 className="mt-3 text-[13px] font-semibold text-[oklch(0.90_0.005_260)]">{s.name}</h3>
              <p className="mt-1 text-[11px] text-[oklch(0.40_0.01_260)]">{s.desc}</p>
              <span className="mt-3 inline-block rounded bg-[oklch(0.10_0.005_260)] px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.08em] text-[oklch(0.45_0.01_260)]">{s.comingSoon ? "Coming Soon" : s.formats}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-[oklch(0.14_0.005_260)] bg-[oklch(0.05_0.005_260)]">
        <div className="border-b border-[oklch(0.12_0.005_260)] px-6 py-4">
          <h2 className="text-sm font-semibold text-[oklch(0.88_0.005_260)]">Import History</h2>
        </div>
        {importHistory.length === 0 ? (
          <div className="px-6 py-10 text-center">
            <p className="text-[12px] text-[oklch(0.45_0.01_260)]">No imports yet. Upload a statement above to get started.</p>
          </div>
        ) : (
          <div className="divide-y divide-[oklch(0.10_0.005_260)]">
            {importHistory.map((item) => (
              <div key={item.id} className="flex flex-col gap-2 px-4 py-3.5 hover:bg-[oklch(0.07_0.005_260)] sm:flex-row sm:items-center sm:justify-between sm:px-6">
                <div className="flex min-w-0 items-center gap-3">
                  <FileText className="h-4 w-4 shrink-0 text-[oklch(0.35_0.01_260)]" strokeWidth={1.75} />
                  <div className="min-w-0">
                    <span className="block truncate text-[12px] font-medium text-[oklch(0.85_0.005_260)]">{item.filename}</span>
                    <span className="text-[10px] text-[oklch(0.40_0.01_260)]">{item.source}</span>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-x-6 gap-y-1 pl-7 sm:pl-0">
                  <span className="text-[11px] text-[oklch(0.40_0.01_260)]">{item.transactions} txns</span>
                  <span className="text-[11px] text-[oklch(0.35_0.01_260)]">{item.date}</span>
                  <div className="flex items-center gap-1 text-[11px] font-medium text-[oklch(0.65_0.15_155)]">
                    <CheckCircle2 className="h-3.5 w-3.5" strokeWidth={2} />
                    Done
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
