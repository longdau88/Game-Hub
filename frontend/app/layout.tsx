import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import { Gamepad2 } from "lucide-react";
import ClientNavbar from "../components/ClientNavbar";
import { ThemeProvider } from "../components/ThemeProvider";
import { LanguageProvider } from "../contexts/LanguageContext";
import MaintenanceOverlay from "../components/MaintenanceOverlay";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Game Hub",
  description: "Play awesome web games directly in your browser",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <LanguageProvider>
            <MaintenanceOverlay />
            <div className="min-h-screen bg-background text-foreground transition-colors selection:bg-blue-500/30">
              {/* Navigation Bar */}
              <nav className="sticky top-0 z-50 bg-white dark:bg-[#050505] shadow-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between h-16">
                <div className="flex items-center gap-8">
                  <Link href="/" className="flex items-center gap-2 group">
                    <div className="p-2 bg-blue-600 rounded-lg group-hover:bg-blue-500 transition-colors">
                      <Gamepad2 className="w-5 h-5 text-zinc-900 dark:text-white" />
                    </div>
                    <span className="font-bold text-xl tracking-tight">Game Hub</span>
                  </Link>
                </div>
                <ClientNavbar />
              </div>
            </div>
          </nav>

              <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {children}
              </main>
            </div>
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
