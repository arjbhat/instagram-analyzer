"use client";

import { useInstagramData } from "@/contexts/instagram-data-context";
import { GlowingCard } from "./ui/glowing-card";
import { CardContent } from "./ui/card";
import { Shield, FileArchive, Upload, Loader2, X } from "lucide-react";
import { useFileUpload } from "@/hooks/use-file-upload";

interface UploadBannerProps {
  forceShow?: boolean;
  onClose?: () => void;
}

export function UploadBanner({ forceShow = false, onClose }: UploadBannerProps) {
  const { isLoaded } = useInstagramData();
  const { isUploading, fileInputRef, handleFileSelect, handleFileChange } = useFileUpload();

  if (isLoaded && !forceShow) {
    return null;
  }

  const handleFileChangeWithClose = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const success = await handleFileChange(event);
    if (success) {
      onClose?.();
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
              {/* Close Button - only show if data is already loaded */}
              {isLoaded && onClose && (
                <div className="absolute top-4 right-4">
                  <button
                    onClick={onClose}
                    className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-full transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}
              
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
                <div className="inline-flex items-center gap-2 text-primary font-medium">
                  <Upload className="h-5 w-5" />
                  <span>Click to select your ZIP file</span>
                </div>
              </div>
            )}
            </CardContent>
          </GlowingCard>
        </div>

        {/* Instructions */}
        <div className="text-center space-y-2">
          <p className="text-sm text-muted-foreground">
            <strong>Need your data?</strong> Visit{" "}
            <a 
              href="https://accountscenter.instagram.com/info_and_permissions/dyi/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-purple-600 hover:text-purple-700 underline font-medium"
            >
              Instagram Data Export
            </a>
            {" "}(login required)
          </p>
          <p className="text-xs text-muted-foreground">
            Or: Accounts Center → Your information and permissions → Download your information
          </p>
          <p className="text-xs text-blue-600 dark:text-blue-400">
            Select <strong>JSON format</strong> and <strong>download to device</strong> when creating your export
          </p>
          <p className="text-xs text-orange-600 dark:text-orange-400">
            Mobile tip: If your phone auto-extracts the ZIP, try using a file manager app to select the original ZIP file
          </p>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".zip,application/zip,application/x-zip-compressed"
          onChange={handleFileChangeWithClose}
          className="hidden"
        />
      </div>
    </div>
  );
}
