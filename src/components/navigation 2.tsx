"use client";

import Link from "next/link";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { UploadButton } from "@/components/upload-button";

export function Navigation() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <nav className="border-b">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">Instagram Analyzer</h1>
          <div className="flex items-center gap-6">
            <div className="flex gap-4">
              <Link
                href="/"
                prefetch={true}
                className={cn(
                  "transition-colors duration-200 hover:scale-105",
                  pathname === "/"
                    ? "text-foreground font-medium"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Analytics
              </Link>
              <Link
                href="/messages"
                prefetch={true}
                className={cn(
                  "transition-colors duration-200 hover:scale-105",
                  pathname === "/messages"
                    ? "text-foreground font-medium"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Messages
              </Link>
            </div>
            <div className="flex items-center gap-3">
              <UploadButton />
              {mounted && (
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                >
                  {theme === "dark" ? (
                    <Sun className="h-5 w-5" />
                  ) : (
                    <Moon className="h-5 w-5" />
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
