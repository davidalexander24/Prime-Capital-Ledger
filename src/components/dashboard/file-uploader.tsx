"use client";

import { Upload, File, FileUp, Loader2 } from "lucide-react";
import { useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  parsePdfTransactions,
  commitParsedTransactions,
  type ParsedRow,
} from "@/app/actions/import";
import { ImportPreviewDialog } from "./import-preview-dialog";
import { appButton } from "@/components/app/styles";
import { cn } from "@/lib/utils";

export function FileUploader() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragActive, setIsDragActive] = useState(false);

  const [isParsing, setIsParsing] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<"idle" | "success" | "error">("idle");
  const [uploadMessage, setUploadMessage] = useState("");

  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewRows, setPreviewRows] = useState<ParsedRow[]>([]);
  const [sourceDate, setSourceDate] = useState<string | null>(null);

  const [commitStatus, setCommitStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [commitMessage, setCommitMessage] = useState("");

  const applySelectedFile = (file: File | null) => {
    if (!file) return;
    const name = (file.name ?? "").toLowerCase();
    const isPdf = file.type === "application/pdf" || name.endsWith(".pdf");
    if (!isPdf) {
      setUploadStatus("error");
      setUploadMessage("Unsupported file type. Upload a PDF.");
      return;
    }
    setSelectedFile(file);
    setUploadStatus("idle");
    setUploadMessage("");
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files && e.target.files.length > 0 ? e.target.files[0] : null;
    applySelectedFile(file);
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const clearSelection = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const dragCounter = useRef(0);

  const handleDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current++;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragActive(true);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = "copy";
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current--;
    if (dragCounter.current === 0) {
      setIsDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    dragCounter.current = 0;
    const file = e.dataTransfer.files && e.dataTransfer.files.length > 0
      ? e.dataTransfer.files[0]
      : null;
    applySelectedFile(file);
  }, []);

  const handleParse = async () => {
    if (!selectedFile) return;
    setIsParsing(true);
    setUploadStatus("idle");
    setUploadMessage("");

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      const res = await parsePdfTransactions(formData);

      if (res.success) {
        setPreviewRows(res.data.rows);
        setSourceDate(res.data.sourceDate);
        setCommitStatus("idle");
        setCommitMessage("");
        setPreviewOpen(true);
      } else {
        setUploadStatus("error");
        setUploadMessage(res.error || "Unknown parse error.");
      }
    } catch (error: unknown) {
      console.error("Parse error:", error);
      setUploadStatus("error");
      setUploadMessage(
        `Client error: ${error instanceof Error ? error.message : "Failed to parse."}`
      );
    } finally {
      setIsParsing(false);
    }
  };

  const handleConfirmImport = async () => {
    if (previewRows.length === 0) return;
    setCommitStatus("loading");
    setCommitMessage("");

    try {
      const filename = selectedFile?.name || "Unknown_File.pdf";
      const res = await commitParsedTransactions(previewRows, filename);
      if (res.success) {
        setCommitStatus("success");
        setCommitMessage(res.message);
        router.refresh();
        setTimeout(() => {
          setPreviewOpen(false);
          setPreviewRows([]);
          setSourceDate(null);
          clearSelection();
          setUploadStatus("success");
          setUploadMessage(res.message);
        }, 1500);
      } else {
        setCommitStatus("error");
        setCommitMessage(res.message);
      }
    } catch (error: unknown) {
      console.error("Commit error:", error);
      setCommitStatus("error");
      setCommitMessage(
        `Client error: ${error instanceof Error ? error.message : "Failed to import."}`
      );
    }
  };

  const handlePreviewOpenChange = (open: boolean) => {
    if (commitStatus === "loading") return;
    setPreviewOpen(open);
    if (!open) {
      setPreviewRows([]);
      setSourceDate(null);
      setCommitStatus("idle");
      setCommitMessage("");
    }
  };

  return (
    <>
      <div
        className={cn(
          "relative cursor-pointer rounded-2xl border-2 border-dashed px-6 py-12 text-center transition-colors duration-300",
          isDragActive
            ? "border-solid border-brand bg-brand-wash ring-4 ring-brand/10"
            : "border-line-strong bg-sunken hover:border-brand/40 hover:bg-surface",
          selectedFile && "cursor-default"
        )}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={!selectedFile ? handleUploadClick : undefined}
      >
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept=".pdf,application/pdf"
          onChange={handleFileChange}
        />

        {selectedFile ? (
          <div className="flex flex-col items-center">
            <div className="flex size-15 items-center justify-center rounded-2xl border border-line-strong bg-layer-2">
              <File className="size-6.5 text-fg-2" strokeWidth={1.75} />
            </div>
            <p className="mt-4 max-w-full truncate text-[14px] font-semibold text-fg-1">{selectedFile.name}</p>
            <p className="mt-1 text-[12px] tabular-nums text-fg-4">{(selectedFile.size / 1024).toFixed(1)} KB</p>

            <div className="mt-6 flex items-center gap-3">
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); clearSelection(); }}
                disabled={isParsing}
                className={appButton({ tone: "secondary" })}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); handleParse(); }}
                disabled={isParsing}
                className={appButton({ tone: "primary" })}
              >
                {isParsing && <Loader2 className="animate-spin" />}
                {isParsing ? "Reading PDF..." : "Preview transactions"}
              </button>
            </div>

            {uploadStatus === "error" && uploadMessage && (
              <p role="alert" className="mt-4 text-[12px] font-medium text-loss">{uploadMessage}</p>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <div
              className={cn(
                "flex size-16 items-center justify-center rounded-2xl text-brand transition duration-300",
                isDragActive ? "bg-brand/20 motion-safe:-translate-y-1.5" : "bg-brand-wash"
              )}
            >
              {isDragActive ? (
                <FileUp className="size-7" strokeWidth={1.75} />
              ) : (
                <Upload className="size-7" strokeWidth={1.75} />
              )}
            </div>
            <p className={cn("mt-5 text-[15px] font-semibold", isDragActive ? "text-fg-1" : "text-fg-2")}>
              {isDragActive ? "Drop the PDF to upload" : "Drag and drop a PDF here"}
            </p>
            <p className={cn("mt-1.5 text-[12px]", isDragActive ? "text-brand" : "text-fg-4")}>
              {isDragActive ? "Release to start reading it" : "Ajaib daily transaction statement, one file at a time"}
            </p>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); handleUploadClick(); }}
              className={cn(appButton({ tone: "primary" }), "mt-5", isDragActive && "invisible")}
            >
              Browse files
            </button>
            {uploadStatus === "success" && uploadMessage && (
              <p role="status" className="mt-4 text-[12px] font-medium text-gain">{uploadMessage}</p>
            )}
            {uploadStatus === "error" && uploadMessage && (
              <p role="alert" className="mt-4 text-[12px] font-medium text-loss">{uploadMessage}</p>
            )}
          </div>
        )}
      </div>

      <ImportPreviewDialog
        open={previewOpen}
        onOpenChange={handlePreviewOpenChange}
        rows={previewRows}
        sourceDate={sourceDate}
        status={commitStatus}
        statusMessage={commitMessage}
        onConfirm={handleConfirmImport}
      />
    </>
  );
}
