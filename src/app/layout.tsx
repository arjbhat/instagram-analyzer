import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { Navigation } from "@/components/navigation";
import { NavigationProgress } from "@/components/navigation-progress";
import { UploadBanner } from "@/components/upload-banner";
import { Toaster } from "@/components/ui/toast";
import { InstagramDataProvider } from "@/contexts/instagram-data-context";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Instagram Data Analyzer",
  description: "Analyze your Instagram data and connections",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <InstagramDataProvider>
            <NavigationProgress />
            <Navigation />
            <UploadBanner />
            {children}
            <Toaster />
          </InstagramDataProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
