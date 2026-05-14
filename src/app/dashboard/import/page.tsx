import { Upload, FileText, FileSpreadsheet, Globe, CheckCircle2 } from "lucide-react";

const importHistory = [
  { id: 1, filename: "ajaib_jul_2025.pdf", source: "Ajaib PDF", date: "17 Jul 2025", transactions: 8, status: "success" },
  { id: 2, filename: "stockbit_jun_2025.pdf", source: "Stockbit PDF", date: "28 Jun 2025", transactions: 12, status: "success" },
  { id: 3, filename: "portfolio_may.csv", source: "CSV Import", date: "01 Jun 2025", transactions: 24, status: "success" },
];

const importSources = [
  { id: "ajaib", name: "Ajaib", desc: "Import from Ajaib brokerage PDF statements", icon: FileText, formats: "PDF" },
  { id: "stockbit", name: "Stockbit", desc: "Import from Stockbit PDF confirmations", icon: FileText, formats: "PDF" },
  { id: "csv", name: "CSV Upload", desc: "Bulk import from CSV spreadsheet", icon: FileSpreadsheet, formats: "CSV" },
  { id: "api", name: "Broker API", desc: "Automatic sync via broker API", icon: Globe, formats: "API", comingSoon: true },
];

export default function ImportPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-[oklch(0.93_0.005_260)]">Import</h1>
        <p className="mt-1 text-[13px] text-[oklch(0.45_0.01_260)]">Import transactions from brokerage statements and CSV files.</p>
      </div>

      <div className="rounded-xl border-2 border-dashed border-[oklch(0.18_0.005_260)] bg-[oklch(0.04_0.005_260)] p-10 text-center transition-colors hover:border-[oklch(0.25_0.01_230)]">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[oklch(0.10_0.01_230)]">
          <Upload className="h-6 w-6 text-[oklch(0.70_0.08_230)]" strokeWidth={1.75} />
        </div>
        <p className="mt-4 text-[14px] font-medium text-[oklch(0.80_0.005_260)]">Drag and drop your files here</p>
        <p className="mt-1 text-[12px] text-[oklch(0.40_0.01_260)]">Supports Ajaib PDF, Stockbit PDF, and CSV formats</p>
        <button className="mt-5 inline-flex h-9 items-center rounded-lg bg-[oklch(0.70_0.08_230)] px-5 text-[12px] font-semibold text-[oklch(0.03_0.005_260)] transition-colors hover:bg-[oklch(0.65_0.08_230)]">Browse Files</button>
      </div>

      <div>
        <h2 className="mb-4 text-sm font-semibold text-[oklch(0.88_0.005_260)]">Import Sources</h2>
        <div className="grid grid-cols-4 gap-4">
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
        <div className="divide-y divide-[oklch(0.10_0.005_260)]">
          {importHistory.map((item) => (
            <div key={item.id} className="flex items-center justify-between px-6 py-3.5 hover:bg-[oklch(0.07_0.005_260)]">
              <div className="flex items-center gap-3">
                <FileText className="h-4 w-4 text-[oklch(0.35_0.01_260)]" strokeWidth={1.75} />
                <div>
                  <span className="text-[12px] font-medium text-[oklch(0.85_0.005_260)]">{item.filename}</span>
                  <span className="ml-2 text-[10px] text-[oklch(0.40_0.01_260)]">{item.source}</span>
                </div>
              </div>
              <div className="flex items-center gap-6">
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
      </div>
    </div>
  );
}
