"use client";

import { useState, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import JSZip from 'jszip';
import { InstagramDataParserClient } from '@/lib/instagram-parser-client';
import { useInstagramData } from '@/contexts/instagram-data-context';

export function useFileUpload() {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { setData } = useInstagramData();

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".zip")) {
      toast({
        title: "Invalid file type",
        description: "Please select a ZIP file from your Instagram data export.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const zip = new JSZip();
      await zip.loadAsync(arrayBuffer);

      const parser = new InstagramDataParserClient(zip);
      await setData(parser);

      toast({
        title: "Connection successful!",
        description: "Your Instagram data has been processed.",
      });
      return true; // Success
    } catch {
      toast({
        title: "Connection failed",
        description: "There was an error processing your file. Please try again.",
        variant: "destructive",
      });
      return false; // Failure
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return {
    isUploading,
    fileInputRef,
    handleFileSelect,
    handleFileChange,
  };
}