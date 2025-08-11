"use client";

import Link from "next/link";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Moon, Sun, BarChart3, Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { UploadButton } from "@/components/upload-button";

export function Navigation() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-40">
      <div className="container mx-auto px-4 sm:px-6 py-3 sm:py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="p-2 bg-gradient-to-br from-purple-500/10 to-blue-500/10 rounded-xl group-hover:from-purple-500/20 group-hover:to-blue-500/20 transition-all duration-300">
              <BarChart3 className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600" />
            </div>
            <h1 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Instagram Analyzer
            </h1>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            <div className="flex gap-1">
              <Link
                href="/"
                prefetch={true}
                className={cn(
                  "px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105",
                  pathname === "/"
                    ? "bg-purple-500/10 text-purple-600 dark:text-purple-400"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
              >
                Analytics
              </Link>
              <Link
                href="/messages"
                prefetch={true}
                className={cn(
                  "px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105",
                  pathname === "/messages"
                    ? "bg-purple-500/10 text-purple-600 dark:text-purple-400"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
              >
                Messages
              </Link>
            </div>
            <div className="flex items-center gap-2">
              <UploadButton />
              {mounted && (
                <Button
                  variant="outline"
                  size="icon"
                  className="h-9 w-9"
                  onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                >
                  {theme === "dark" ? (
                    <Sun className="h-4 w-4" />
                  ) : (
                    <Moon className="h-4 w-4" />
                  )}
                </Button>
              )}
            </div>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center gap-2">
            {mounted && (
              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              >
                {theme === "dark" ? (
                  <Sun className="h-4 w-4" />
                ) : (
                  <Moon className="h-4 w-4" />
                )}
              </Button>
            )}
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="h-4 w-4" />
              ) : (
                <Menu className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-2 pb-2 border-t border-border/50">
            <div className="flex flex-col pt-2">
              <Link
                href="/"
                prefetch={true}
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  "px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                  pathname === "/"
                    ? "bg-purple-500/10 text-purple-600 dark:text-purple-400"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
              >
                Analytics
              </Link>
              <Link
                href="/messages"
                prefetch={true}
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  "px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                  pathname === "/messages"
                    ? "bg-purple-500/10 text-purple-600 dark:text-purple-400"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
              >
                Messages
              </Link>
              <div className="mt-2 pt-2 border-t border-border/30">
                <UploadButton />
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
