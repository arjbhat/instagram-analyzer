"use client";

import { useEffect, useState } from "react";
import { FileUploadSection } from "./file-upload-section";

export function UploadBanner() {
  const [hasData, setHasData] = useState(true);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkData = async () => {
      try {
        // Check if we have uploaded data or local data folder
        const dataPath = sessionStorage.getItem("instagramDataPath");
        const queryParam = dataPath
          ? `?dataPath=${encodeURIComponent(dataPath)}`
          : "";

        const response = await fetch(`/api/participants${queryParam}`);
        setHasData(response.ok);
      } catch {
        setHasData(false);
      } finally {
        setIsChecking(false);
      }
    };

    checkData();
  }, []);

  if (isChecking) {
    return null;
  }

  if (hasData) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex items-center justify-center p-8">
      <div className="max-w-2xl w-full">
        <FileUploadSection />
      </div>
    </div>
  );
}
