"use client";

import { Upload, File } from "lucide-react";
import { useRef, useState } from "react";
import { processPdfImport } from "@/app/actions/import";

export function FileUploader() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<"idle" | "success" | "error">("idle");
  const [uploadMessage, setUploadMessage] = useState("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
      setUploadStatus("idle");
    }
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

  const handleProcessUpload = async () => {
    if (!selectedFile) return;
    setIsUploading(true);
    setUploadStatus("idle");
    setUploadMessage("");

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      const res = await processPdfImport(formData);

      if (res.success) {
        setUploadStatus("success");
        setUploadMessage(res.message);
      } else {
        setUploadStatus("error");
        setUploadMessage(res.error || "Unknown error occurred.");
      }
    } catch (err: any) {
      console.error("Client side action error:", err);
      setUploadStatus("error");
      setUploadMessage(`Client Error: ${err.message || "Failed to connect"}`);
    } finally {
      setIsUploading(false);
      
      // Clear selection after a short delay if successful
      if (uploadStatus !== "error") {
        setTimeout(() => {
          clearSelection();
          setUploadStatus("idle");
          setUploadMessage("");
        }, 4000);
      }
    }
  };

  return (
    <div className="rounded-xl border-2 border-dashed border-[oklch(0.18_0.005_260)] bg-[oklch(0.04_0.005_260)] p-10 text-center transition-colors hover:border-[oklch(0.25_0.01_230)]">
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept=".pdf,.csv"
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
              disabled={isUploading}
              className="inline-flex h-9 items-center rounded-lg border border-[oklch(0.20_0.005_260)] bg-transparent px-4 text-[12px] font-medium text-[oklch(0.60_0.005_260)] transition-colors hover:bg-[oklch(0.10_0.005_260)] disabled:opacity-50"
            >
              Cancel
            </button>
            <button 
              onClick={handleProcessUpload}
              disabled={isUploading || uploadStatus === "success"}
              className="inline-flex h-9 items-center rounded-lg bg-[oklch(0.70_0.08_230)] px-5 text-[12px] font-semibold text-[oklch(0.03_0.005_260)] transition-colors hover:bg-[oklch(0.65_0.08_230)] disabled:opacity-50 disabled:bg-[oklch(0.30_0.005_260)] disabled:text-[oklch(0.70_0.005_260)]"
            >
              {isUploading ? "Processing..." : uploadStatus === "success" ? "Done!" : "Process Upload"}
            </button>
          </div>
          
          {(uploadStatus === "success" || uploadStatus === "error") && (
            <p className={`mt-4 text-[12px] font-medium ${uploadStatus === "success" ? "text-[oklch(0.65_0.15_155)]" : "text-red-500"}`}>
              {uploadMessage}
            </p>
          )}
        </div>
      ) : (
        <>
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[oklch(0.10_0.01_230)]">
            <Upload className="h-6 w-6 text-[oklch(0.70_0.08_230)]" strokeWidth={1.75} />
          </div>
          <p className="mt-4 text-[14px] font-medium text-[oklch(0.80_0.005_260)]">Drag and drop your files here</p>
          <p className="mt-1 text-[12px] text-[oklch(0.40_0.01_260)]">Supports Ajaib PDF, Stockbit PDF, and CSV formats</p>
          <button 
            onClick={handleUploadClick}
            className="mt-5 inline-flex h-9 items-center rounded-lg bg-[oklch(0.70_0.08_230)] px-5 text-[12px] font-semibold text-[oklch(0.03_0.005_260)] transition-colors hover:bg-[oklch(0.65_0.08_230)]"
          >
            Browse Files
          </button>
        </>
      )}
    </div>
  );
}
