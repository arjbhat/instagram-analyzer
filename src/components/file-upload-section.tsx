"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, FileArchive, CheckCircle, AlertCircle, Shield, Lock } from "lucide-react";
import { cn } from "@/lib/utils";

interface FileUploadSectionProps {
  onUploadSuccess?: (dataPath: string) => void;
  className?: string;
}

export function FileUploadSection({
  onUploadSuccess,
  className,
}: FileUploadSectionProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileUpload = async (file: File) => {
    if (!file.name.toLowerCase().endsWith(".zip")) {
      setError("Please upload a ZIP file");
      return;
    }

    setIsUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Upload failed");
      }

      setUploadedFile(file.name);

      // Store the data path in sessionStorage
      sessionStorage.setItem("instagramDataPath", data.dataPath);

      if (onUploadSuccess) {
        onUploadSuccess(data.dataPath);
      }

      // Reload the page to fetch new data
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload file");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    const zipFile = files.find((file) =>
      file.name.toLowerCase().endsWith(".zip")
    );

    if (zipFile) {
      handleFileUpload(zipFile);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  if (uploadedFile && !error) {
    return (
      <Card className={cn("", className)}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            Instagram Data Uploaded
          </CardTitle>
          <CardDescription>
            Successfully uploaded: {uploadedFile}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            variant="outline"
            onClick={() => {
              sessionStorage.removeItem("instagramDataPath");
              window.location.reload();
            }}
          >
            Upload Different File
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      className={cn(
        "border-2 border-dashed transition-colors",
        isDragging && "border-primary bg-primary/5",
        className
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileArchive className="h-5 w-5" />
          Upload Instagram Data
        </CardTitle>
        <CardDescription>
          Upload your Instagram data export ZIP file to analyze your account
        </CardDescription>
        
        {/* VERY PROMINENT PRIVACY NOTICE */}
        <div className="bg-green-50 dark:bg-green-900/20 border-2 border-green-500 rounded-lg p-4 mt-4">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="h-5 w-5 text-green-600" />
            <h3 className="font-bold text-green-800 dark:text-green-200">🔒 YOUR DATA STAYS PRIVATE</h3>
          </div>
          <div className="space-y-2 text-sm text-green-700 dark:text-green-300">
            <div className="flex items-center gap-2">
              <Lock className="h-4 w-4" />
              <span><strong>100% LOCAL PROCESSING:</strong> Files never leave your browser</span>
            </div>
            <div className="flex items-center gap-2">
              <Lock className="h-4 w-4" />
              <span><strong>NO SERVER STORAGE:</strong> Nothing is uploaded or saved</span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded-md">
              <AlertCircle className="h-4 w-4" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          <div className="text-center space-y-4">
            <div className="p-8 border rounded-lg bg-muted/20">
              <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground mb-4">
                Drag and drop your Instagram ZIP file here, or click to browse
              </p>

              <input
                type="file"
                accept=".zip"
                onChange={handleFileInput}
                disabled={isUploading}
                className="hidden"
                id="file-upload"
              />

              <label htmlFor="file-upload">
                <Button
                  variant="default"
                  disabled={isUploading}
                  className="cursor-pointer"
                  asChild
                >
                  <span>{isUploading ? "Uploading..." : "Choose File"}</span>
                </Button>
              </label>
            </div>

            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 mb-4">
              <p className="text-red-800 dark:text-red-200 font-bold text-center text-sm">
                ⚠️ WE NEVER STORE YOUR DATA - EVERYTHING IS PROCESSED LOCALLY ⚠️
              </p>
            </div>
            
            <div className="text-left space-y-2 text-sm text-muted-foreground">
              <p className="font-semibold">How to get your Instagram data:</p>
              <ol className="list-decimal list-inside space-y-1">
                <li>Go to Instagram Settings</li>
                <li>
                  Navigate to &quot;Your activity&quot; → &quot;Download your information&quot;
                </li>
                <li>Select &quot;Some of your information&quot;</li>
                <li>
                  Choose the data types you want (Messages, Followers, etc.)
                </li>
                <li>Select JSON format</li>
                <li>Download and upload the ZIP file here</li>
              </ol>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
