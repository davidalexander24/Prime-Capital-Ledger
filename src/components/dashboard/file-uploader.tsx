"use client";

import { Upload, File } from "lucide-react";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  parsePdfTransactions,
  commitParsedTransactions,
  type ParsedRow,
} from "@/app/actions/import";
import { ImportPreviewDialog } from "./import-preview-dialog";

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

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragActive(true);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
    setIsDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    const related = e.relatedTarget as Node | null;
    if (related && e.currentTarget.contains(related)) return;
    setIsDragActive(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragActive(false);
    const file = e.dataTransfer.files && e.dataTransfer.files.length > 0
      ? e.dataTransfer.files[0]
      : null;
    applySelectedFile(file);
  };

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
    } catch (err: any) {
      console.error("Parse error:", err);
      setUploadStatus("error");
      setUploadMessage(`Client error: ${err.message || "Failed to parse."}`);
    } finally {
      setIsParsing(false);
    }
  };

  const handleConfirmImport = async () => {
    if (previewRows.length === 0) return;
    setCommitStatus("loading");
    setCommitMessage("");

    try {
      const res = await commitParsedTransactions(previewRows);
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
    } catch (err: any) {
      console.error("Commit error:", err);
      setCommitStatus("error");
      setCommitMessage(`Client error: ${err.message || "Failed to import."}`);
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

  const dropZoneClassName = `rounded-xl border-2 border-dashed p-10 text-center transition-colors ${
    isDragActive
      ? "border-[oklch(0.70_0.08_230)] bg-[oklch(0.10_0.02_230)]"
      : "border-[oklch(0.18_0.005_260)] bg-[oklch(0.04_0.005_260)] hover:border-[oklch(0.25_0.01_230)]"
  }`;

  return (
    <div
      className={dropZoneClassName}
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
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
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[oklch(0.15_0.01_230)] border border-[oklch(0.25_0.01_230)]">
            <File className="h-6 w-6 text-[oklch(0.80_0.01_230)]" strokeWidth={1.75} />
          </div>
          <p className="mt-4 text-[14px] font-medium text-[oklch(0.90_0.005_260)]">{selectedFile.name}</p>
          <p className="mt-1 text-[11px] text-[oklch(0.45_0.01_260)]">{(selectedFile.size / 1024).toFixed(1)} KB</p>

          <div className="mt-6 flex items-center gap-3">
            <button
              onClick={clearSelection}
              disabled={isParsing}
              className="inline-flex h-9 items-center rounded-lg border border-[oklch(0.20_0.005_260)] bg-transparent px-4 text-[12px] font-medium text-[oklch(0.60_0.005_260)] transition-colors hover:bg-[oklch(0.10_0.005_260)] disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleParse}
              disabled={isParsing}
              className="inline-flex h-9 items-center rounded-lg bg-[oklch(0.70_0.08_230)] px-5 text-[12px] font-semibold text-[oklch(0.03_0.005_260)] transition-colors hover:bg-[oklch(0.65_0.08_230)] disabled:opacity-50 disabled:bg-[oklch(0.30_0.005_260)] disabled:text-[oklch(0.70_0.005_260)]"
            >
              {isParsing ? "Parsing..." : "Preview transactions"}
            </button>
          </div>

          {(uploadStatus === "success" || uploadStatus === "error") && (
            <p
              className={`mt-4 text-[12px] font-medium ${
                uploadStatus === "success"
                  ? "text-[oklch(0.65_0.15_155)]"
                  : "text-red-500"
              }`}
            >
              {uploadMessage}
            </p>
          )}
        </div>
      ) : (
        <>
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[oklch(0.10_0.01_230)]">
            <Upload className="h-6 w-6 text-[oklch(0.70_0.08_230)]" strokeWidth={1.75} />
          </div>
          <p className="mt-4 text-[14px] font-medium text-[oklch(0.80_0.005_260)]">
            {isDragActive ? "Drop PDF to upload" : "Drag and drop your files here"}
          </p>
          <p className="mt-1 text-[12px] text-[oklch(0.40_0.01_260)]">Supports Ajaib daily transaction PDF</p>
          <button
            onClick={handleUploadClick}
            className="mt-5 inline-flex h-9 items-center rounded-lg bg-[oklch(0.70_0.08_230)] px-5 text-[12px] font-semibold text-[oklch(0.03_0.005_260)] transition-colors hover:bg-[oklch(0.65_0.08_230)]"
          >
            Browse Files
          </button>
          {uploadStatus === "success" && uploadMessage && (
            <p className="mt-4 text-[12px] font-medium text-[oklch(0.65_0.15_155)]">
              {uploadMessage}
            </p>
          )}
          {uploadStatus === "error" && uploadMessage && (
            <p className="mt-4 text-[12px] font-medium text-red-500">
              {uploadMessage}
            </p>
          )}
        </>
      )}

      <ImportPreviewDialog
        open={previewOpen}
        onOpenChange={handlePreviewOpenChange}
        rows={previewRows}
        sourceDate={sourceDate}
        status={commitStatus}
        statusMessage={commitMessage}
        onConfirm={handleConfirmImport}
      />
    </div>
  );
}
