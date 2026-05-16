"use client";

import { Upload, File, FileUp } from "lucide-react";
import { useRef, useState, useCallback } from "react";
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
      <style jsx>{`
        .upload-zone {
          position: relative;
          overflow: hidden;
          border-radius: 16px;
          border: 2px dashed oklch(0.18 0.005 260);
          background: oklch(0.04 0.005 260);
          padding: 48px 24px;
          text-align: center;
          transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
          cursor: pointer;
        }

        .upload-zone:hover {
          border-color: oklch(0.28 0.02 230);
          background: oklch(0.055 0.005 260);
        }

        /* ── Drag-active state ── */
        .upload-zone.drag-active {
          border-color: oklch(0.60 0.12 230);
          border-style: solid;
          background: oklch(0.08 0.03 230);
          box-shadow:
            0 0 0 4px oklch(0.60 0.12 230 / 0.12),
            inset 0 0 60px oklch(0.60 0.12 230 / 0.04);
          transform: scale(1.008);
        }

        /* Animated shimmer border overlay */
        .upload-zone.drag-active::before {
          content: "";
          position: absolute;
          inset: -2px;
          border-radius: 18px;
          background: conic-gradient(
            from var(--shimmer-angle, 0deg),
            transparent 0%,
            oklch(0.60 0.12 230 / 0.4) 10%,
            transparent 20%
          );
          animation: shimmer-rotate 2s linear infinite;
          z-index: 0;
          pointer-events: none;
        }

        .upload-zone.drag-active::after {
          content: "";
          position: absolute;
          inset: 2px;
          border-radius: 14px;
          background: oklch(0.08 0.03 230);
          z-index: 1;
          pointer-events: none;
        }

        @keyframes shimmer-rotate {
          from { --shimmer-angle: 0deg; }
          to { --shimmer-angle: 360deg; }
        }

        @property --shimmer-angle {
          syntax: "<angle>";
          initial-value: 0deg;
          inherits: false;
        }

        .upload-zone-content {
          position: relative;
          z-index: 2;
        }

        /* Icon container */
        .upload-icon-box {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 64px;
          height: 64px;
          border-radius: 20px;
          background: oklch(0.10 0.02 230);
          transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .upload-zone.drag-active .upload-icon-box {
          background: oklch(0.15 0.06 230);
          transform: translateY(-6px) scale(1.1);
          box-shadow: 0 12px 32px oklch(0.55 0.12 230 / 0.25);
        }

        .upload-icon {
          width: 28px;
          height: 28px;
          color: oklch(0.60 0.08 230);
          transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .upload-zone.drag-active .upload-icon {
          color: oklch(0.80 0.12 230);
          animation: icon-bounce 0.6s ease-in-out infinite alternate;
        }

        @keyframes icon-bounce {
          from { transform: translateY(0); }
          to { transform: translateY(-4px); }
        }

        /* Floating particles on drag */
        .drag-particles {
          position: absolute;
          inset: 0;
          z-index: 2;
          pointer-events: none;
          opacity: 0;
          transition: opacity 0.3s ease;
        }

        .upload-zone.drag-active .drag-particles {
          opacity: 1;
        }

        .drag-particle {
          position: absolute;
          width: 4px;
          height: 4px;
          border-radius: 50%;
          background: oklch(0.65 0.12 230);
        }

        .drag-particle:nth-child(1) { top: 20%; left: 15%; animation: float-particle 2.5s ease-in-out infinite; }
        .drag-particle:nth-child(2) { top: 30%; right: 20%; animation: float-particle 3s ease-in-out infinite 0.5s; }
        .drag-particle:nth-child(3) { bottom: 25%; left: 25%; animation: float-particle 2.8s ease-in-out infinite 1s; }
        .drag-particle:nth-child(4) { bottom: 20%; right: 15%; animation: float-particle 3.2s ease-in-out infinite 0.3s; }
        .drag-particle:nth-child(5) { top: 45%; left: 10%; animation: float-particle 2.6s ease-in-out infinite 0.8s; width: 3px; height: 3px; opacity: 0.6; }
        .drag-particle:nth-child(6) { top: 15%; right: 30%; animation: float-particle 3.1s ease-in-out infinite 1.2s; width: 3px; height: 3px; opacity: 0.6; }

        @keyframes float-particle {
          0%, 100% { transform: translateY(0) scale(1); opacity: 0.4; }
          50% { transform: translateY(-12px) scale(1.3); opacity: 1; }
        }

        /* Text transitions */
        .upload-title {
          margin-top: 20px;
          font-size: 15px;
          font-weight: 600;
          color: oklch(0.80 0.005 260);
          transition: all 0.3s ease;
        }

        .upload-zone.drag-active .upload-title {
          color: oklch(0.90 0.02 230);
        }

        .upload-subtitle {
          margin-top: 6px;
          font-size: 12px;
          color: oklch(0.40 0.01 260);
          transition: all 0.3s ease;
        }

        .upload-zone.drag-active .upload-subtitle {
          color: oklch(0.55 0.04 230);
        }

        /* Browse button */
        .browse-btn {
          display: inline-flex;
          align-items: center;
          height: 38px;
          margin-top: 20px;
          padding: 0 20px;
          border-radius: 10px;
          background: oklch(0.60 0.10 230);
          color: white;
          font-size: 13px;
          font-weight: 600;
          border: none;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .browse-btn:hover {
          background: oklch(0.55 0.10 230);
          box-shadow: 0 4px 16px oklch(0.55 0.10 230 / 0.3);
        }

        .upload-zone.drag-active .browse-btn {
          opacity: 0;
          pointer-events: none;
          transform: translateY(8px);
        }

        /* File selected state */
        .file-info-box {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 60px;
          height: 60px;
          border-radius: 18px;
          background: oklch(0.15 0.01 230);
          border: 1px solid oklch(0.25 0.01 230);
        }

        .file-icon {
          width: 26px;
          height: 26px;
          color: oklch(0.80 0.01 230);
        }

        .file-name {
          margin-top: 16px;
          font-size: 14px;
          font-weight: 600;
          color: oklch(0.90 0.005 260);
        }

        .file-size {
          margin-top: 4px;
          font-size: 11px;
          color: oklch(0.45 0.01 260);
        }

        .file-actions {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-top: 24px;
        }

        .cancel-btn {
          display: inline-flex;
          align-items: center;
          height: 38px;
          padding: 0 16px;
          border-radius: 10px;
          border: 1px solid oklch(0.20 0.005 260);
          background: transparent;
          font-size: 12px;
          font-weight: 500;
          color: oklch(0.60 0.005 260);
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .cancel-btn:hover {
          background: oklch(0.10 0.005 260);
        }

        .cancel-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .parse-btn {
          display: inline-flex;
          align-items: center;
          height: 38px;
          padding: 0 20px;
          border-radius: 10px;
          background: oklch(0.60 0.10 230);
          color: white;
          font-size: 12px;
          font-weight: 600;
          border: none;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .parse-btn:hover:not(:disabled) {
          background: oklch(0.55 0.10 230);
          box-shadow: 0 4px 16px oklch(0.55 0.10 230 / 0.3);
        }

        .parse-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          background: oklch(0.30 0.005 260);
          color: oklch(0.70 0.005 260);
        }

        .status-message {
          margin-top: 16px;
          font-size: 12px;
          font-weight: 500;
        }

        .status-success {
          color: oklch(0.65 0.15 155);
        }

        .status-error {
          color: oklch(0.65 0.18 25);
        }

        /* Supported formats badge */
        .format-badges {
          display: flex;
          justify-content: center;
          gap: 8px;
          margin-top: 14px;
        }

        .format-badge {
          display: inline-flex;
          align-items: center;
          padding: 2px 10px;
          border-radius: 6px;
          background: oklch(0.08 0.005 260);
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: oklch(0.45 0.01 260);
        }
      `}</style>

      <div
        className={`upload-zone ${isDragActive ? "drag-active" : ""}`}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={!selectedFile ? handleUploadClick : undefined}
      >
        {/* Floating particles shown during drag */}
        <div className="drag-particles">
          <div className="drag-particle" />
          <div className="drag-particle" />
          <div className="drag-particle" />
          <div className="drag-particle" />
          <div className="drag-particle" />
          <div className="drag-particle" />
        </div>

        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept=".pdf,application/pdf"
          onChange={handleFileChange}
        />

        <div className="upload-zone-content">
          {selectedFile ? (
            <div className="flex flex-col items-center">
              <div className="file-info-box">
                <File className="file-icon" strokeWidth={1.75} />
              </div>
              <p className="file-name">{selectedFile.name}</p>
              <p className="file-size">{(selectedFile.size / 1024).toFixed(1)} KB</p>

              <div className="file-actions">
                <button
                  onClick={(e) => { e.stopPropagation(); clearSelection(); }}
                  disabled={isParsing}
                  className="cancel-btn"
                >
                  Cancel
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); handleParse(); }}
                  disabled={isParsing}
                  className="parse-btn"
                >
                  {isParsing ? "Parsing..." : "Preview transactions"}
                </button>
              </div>

              {(uploadStatus === "success" || uploadStatus === "error") && (
                <p className={`status-message ${uploadStatus === "success" ? "status-success" : "status-error"}`}>
                  {uploadMessage}
                </p>
              )}
            </div>
          ) : (
            <>
              <div className="upload-icon-box">
                {isDragActive ? (
                  <FileUp className="upload-icon" strokeWidth={1.75} />
                ) : (
                  <Upload className="upload-icon" strokeWidth={1.75} />
                )}
              </div>
              <p className="upload-title">
                {isDragActive ? "Drop your file to upload" : "Drag and drop your files here"}
              </p>
              <p className="upload-subtitle">
                {isDragActive
                  ? "Release to start processing"
                  : "Supports Ajaib daily transaction PDF"}
              </p>
              <div className="format-badges">
                <span className="format-badge">PDF</span>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); handleUploadClick(); }}
                className="browse-btn"
              >
                Browse Files
              </button>
              {uploadStatus === "success" && uploadMessage && (
                <p className="status-message status-success">{uploadMessage}</p>
              )}
              {uploadStatus === "error" && uploadMessage && (
                <p className="status-message status-error">{uploadMessage}</p>
              )}
            </>
          )}
        </div>
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
