"use client";

import { useState, useRef } from "react";
import { useInstagramData } from "@/contexts/instagram-data-context";
import { GlowingCard } from "./ui/glowing-card";
import { CardContent } from "./ui/card";
import { Shield, FileArchive, Upload, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import JSZip from 'jszip';
import { InstagramDataParserClient } from '@/lib/instagram-parser-client';

export function UploadBanner() {
  const { isLoaded, setData } = useInstagramData();
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  if (isLoaded) {
    return null;
  }

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
    } catch {
      toast({
        title: "Connection failed",
        description: "There was an error processing your file. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex items-center justify-center p-6">
      <div className="w-full max-w-4xl space-y-6">
        {/* Main Connection Card - Now Clickable */}
        <div
          className="cursor-pointer transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
          onClick={handleFileSelect}
        >
          <GlowingCard className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-transparent to-blue-500/10" />
            <CardContent className="relative text-center p-8">
            <div className="flex items-center justify-center mb-6">
              <div className={`p-4 rounded-xl transition-all duration-300 ${
                isUploading 
                  ? "bg-blue-500/10" 
                  : "bg-purple-500/10 group-hover:bg-purple-500/20"
              }`}>
                {isUploading ? (
                  <Loader2 className="h-12 w-12 text-blue-500 animate-spin" />
                ) : (
                  <FileArchive className="h-12 w-12 text-purple-500 transition-all duration-300" />
                )}
              </div>
            </div>
            
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-4">
              {isUploading ? "Connecting..." : "Connect Your Instagram Data"}
            </h1>
            
            <p className="text-lg text-muted-foreground mb-6 max-w-2xl mx-auto">
              {isUploading 
                ? "Processing your data securely in your browser..."
                : "Analyze your conversations, connections, and engagement patterns"
              }
            </p>

            {/* Privacy Emphasis */}
            <div className="mb-8 p-4 bg-green-500/10 border border-green-500/20 rounded-xl max-w-lg mx-auto">
              <div className="flex items-center justify-center gap-3 mb-2">
                <Shield className="h-6 w-6 text-green-500" />
                <h3 className="text-lg font-semibold text-green-700 dark:text-green-400">
                  100% Private & Secure
                </h3>
              </div>
              <div className="text-sm text-green-600 dark:text-green-300 space-y-1">
                <div className="flex items-center justify-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  <span>Everything happens in your browser</span>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  <span>No data leaves your device</span>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  <span>Nothing is stored on our servers</span>
                </div>
              </div>
            </div>
            
            {!isUploading && (
              <div className="mb-6">
                <div className="inline-flex items-center gap-2 px-8 py-4 bg-primary text-primary-foreground rounded-xl font-semibold text-lg hover:bg-primary/90 transition-colors">
                  <Upload className="h-6 w-6" />
                  Click to Connect New Data
                </div>
              </div>
            )}
            </CardContent>
          </GlowingCard>
        </div>

        {/* Instructions */}
        <div className="text-center">
          <p className="text-sm text-muted-foreground mb-2">
            <strong>Need your data?</strong> Instagram → Settings & Privacy → Download your information → Request download → <strong>ZIP format</strong>
          </p>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".zip"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>
    </div>
  );
}
