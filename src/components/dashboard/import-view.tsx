import { FileText, CheckCircle2, History } from "lucide-react";
import { FileUploader } from "@/components/dashboard/file-uploader";

export interface ImportHistoryItem {
  id: string;
  filename: string;
  source: string;
  transactions: number;
  date: string;
}

export function ImportView({ history }: { history: ImportHistoryItem[] }) {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-fg-1">Import</h1>
        <p className="mt-1 text-[13px] text-fg-4">
          Add trades from an Ajaib daily transaction statement. You get a preview before anything is saved.
        </p>
      </div>

      <FileUploader />

      <section className="overflow-hidden surface-card">
        <div className="flex items-center gap-2 border-b border-line-soft px-4 py-4 sm:px-6">
          <History className="size-4 text-fg-4" strokeWidth={1.75} />
          <h2 className="text-sm font-semibold text-fg-1">Import history</h2>
        </div>
        {history.length === 0 ? (
          <div className="px-6 py-10 text-center">
            <p className="text-[13px] text-fg-4">No imports yet. Upload a statement above to get started.</p>
          </div>
        ) : (
          <ul className="divide-y divide-line-soft">
            {history.map((item) => (
              <li
                key={item.id}
                className="flex flex-col gap-2 px-4 py-3.5 transition-colors hover:bg-hover sm:flex-row sm:items-center sm:justify-between sm:px-6"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <FileText className="size-4 shrink-0 text-fg-4" strokeWidth={1.75} />
                  <div className="min-w-0">
                    <span className="block truncate text-[13px] font-medium text-fg-2">{item.filename}</span>
                    <span className="text-[12px] text-fg-4">{item.source}</span>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-x-6 gap-y-1 pl-7 text-[12px] sm:pl-0">
                  <span className="tabular-nums text-fg-3">
                    {item.transactions} {item.transactions === 1 ? "trade" : "trades"}
                  </span>
                  <span className="tabular-nums text-fg-4">{item.date}</span>
                  <span className="flex items-center gap-1 font-medium text-gain">
                    <CheckCircle2 className="size-3.5" strokeWidth={2} />
                    Imported
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
