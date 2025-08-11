"use client";

import { Button } from "@/components/ui/button";
import { Upload, Loader2 } from "lucide-react";
import { useFileUpload } from "@/hooks/use-file-upload";

export function UploadButton() {
  const { isUploading, fileInputRef, handleFileSelect, handleFileChange } = useFileUpload();

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={handleFileSelect}
        disabled={isUploading}
        className="gap-2"
      >
        {isUploading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Upload className="h-4 w-4" />
        )}
        {isUploading ? "Connecting..." : "Connect New Data"}
      </Button>
      <input
        ref={fileInputRef}
        type="file"
        accept=".zip"
        onChange={handleFileChange}
        className="hidden"
      />
    </>
  );
}
