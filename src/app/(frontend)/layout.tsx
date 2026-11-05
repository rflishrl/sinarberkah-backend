import type { Metadata, Viewport } from "next";
import { Montserrat } from "next/font/google";

import { ThemeProvider } from "@/components/providers/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";

import "../globals.css";

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Sinar Berkah | Konveksi & Sablon Berkualitas",
    template: "%s | Sinar Berkah",
  },
  description: "Pusat produksi konveksi seragam, kaos sablon, dan cetak pola berkualitas.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#221c1c",
};

export default function FrontendLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="id"
      suppressHydrationWarning
      className={cn(montserrat.variable)}
    >
      <body className="min-h-screen bg-background text-foreground antialiased font-sans">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[60] focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
        >
          Lewati ke konten utama
        </a>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster richColors position="top-right" />
        </ThemeProvider>
      </body>
    </html>
  );
}
