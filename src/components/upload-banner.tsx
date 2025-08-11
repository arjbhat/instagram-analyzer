"use client";

import { UploadButton } from "./upload-button";
import { useInstagramData } from "@/contexts/instagram-data-context";
import { GlowingCard } from "./ui/glowing-card";
import { CardHeader, CardTitle, CardContent } from "./ui/card";
import { Shield, Zap, Lock, FileArchive } from "lucide-react";

export function UploadBanner() {
  const { isLoaded } = useInstagramData();

  if (isLoaded) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex items-center justify-center p-6">
      <div className="w-full max-w-4xl space-y-6">
        {/* Main Connection Card */}
        <GlowingCard className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-transparent to-blue-500/10" />
          <CardContent className="relative text-center p-8">
            <div className="flex items-center justify-center mb-6">
              <div className="p-4 bg-purple-500/10 rounded-xl">
                <FileArchive className="h-12 w-12 text-purple-500" />
              </div>
            </div>
            
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-4">
              Connect Your Instagram Data
            </h1>
            
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              Analyze your conversations, connections, and engagement patterns with complete privacy
            </p>
            
            <div className="mb-8">
              <UploadButton />
            </div>
            
            <div className="flex items-center justify-center text-sm text-muted-foreground">
              <Shield className="h-4 w-4 text-green-500 mr-2" />
              <span>Everything happens in your browser • No data leaves your device</span>
            </div>
          </CardContent>
        </GlowingCard>

        {/* Instructions */}
        <div className="text-center">
          <p className="text-sm text-muted-foreground mb-2">
            <strong>Need your data?</strong> Instagram → Settings & Privacy → Download your information → Request download → <strong>ZIP format</strong>
          </p>
        </div>
      </div>
    </div>
  );
}
