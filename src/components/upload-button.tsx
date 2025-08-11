"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Upload, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import JSZip from 'jszip';
import { InstagramDataParserClient } from '@/lib/instagram-parser-client';
import { useInstagramData } from '@/contexts/instagram-data-context';

export function UploadButton() {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { setData } = useInstagramData();

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".zip")) {
      toast({
        title: "Invalid file type",
        description:
          "Please select a ZIP file from your Instagram data export.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);

    try {
      // Process ZIP file entirely client-side
      const arrayBuffer = await file.arrayBuffer();
      const zip = new JSZip();
      await zip.loadAsync(arrayBuffer);

      // Create client-side parser
      const parser = new InstagramDataParserClient(zip);

      // Load all data using the context
      await setData(parser);

      toast({
        title: "Upload successful!",
        description: "Your Instagram data has been processed.",
      });
    } catch {
      toast({
        title: "Upload failed",
        description:
          "There was an error processing your file. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      // Reset the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

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
        {isUploading ? "Uploading..." : "Upload Data"}
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
