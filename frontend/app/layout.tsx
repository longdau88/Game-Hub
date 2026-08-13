import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import { Gamepad2 } from "lucide-react";
import ClientNavbar from "../components/ClientNavbar";
import { ThemeProvider } from "../components/ThemeProvider";
import { LanguageProvider } from "../contexts/LanguageContext";
import { DialogProvider } from "../contexts/DialogContext";
import { AuthProvider } from "../contexts/AuthContext";
import MaintenanceOverlay from "../components/MaintenanceOverlay";
import Footer from "../components/Footer";
import LoginModal from "../components/LoginModal";
import { cookies } from "next/headers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Game Hub - Chơi game hành động 3D, game giải đố miễn phí",
  description: "Play awesome web games directly in your browser. Nền tảng chơi game trực tuyến miễn phí với hàng ngàn tựa game hành động 3D, game giải đố, phiêu lưu hấp dẫn.",
  keywords: ["chơi game miễn phí", "chơi game web", "game hành động 3D", "game giải đố miễn phí", "game html5", "chơi game trực tuyến", "game hub"],
  other: {
    "google-adsense-account": "ca-pub-7121527745227718"
  }
};

import Script from "next/script";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const localeCookie = cookieStore.get("NEXT_LOCALE")?.value as "en" | "vi" | undefined;
  const initialLocale = localeCookie === "vi" ? "vi" : "en";

  return (
    <html lang={initialLocale} suppressHydrationWarning>
      <head>
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-7121527745227718"
          crossOrigin="anonymous"
          strategy="beforeInteractive"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              "name": "Game Hub",
              "url": "https://game-hub.best",
              "potentialAction": {
                "@type": "SearchAction",
                "target": "https://game-hub.best/?search={search_term_string}",
                "query-input": "required name=search_term_string"
              }
            })
          }}
        />
      </head>
      <body className={`${inter.className} overflow-x-hidden`}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
          <LanguageProvider initialLocale={initialLocale}>
            <AuthProvider>
              <DialogProvider>
              <div className="min-h-screen flex flex-col bg-background text-foreground transition-colors selection:bg-blue-500/30">
                {/* Navigation Bar */}
                <nav className="sticky top-4 z-50 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 mb-4">
                  <div className="bg-white/70 dark:bg-zinc-900/70 backdrop-blur-xl border border-white/20 dark:border-zinc-800/50 shadow-lg shadow-blue-500/5 rounded-2xl px-4 sm:px-6">
                    <div className="flex items-center justify-between h-16">
                      <div className="flex items-center gap-8">
                        <Link href="/" className="flex items-center gap-3 group">
                          <div className="p-2.5 bg-gradient-to-br from-blue-500 to-violet-600 rounded-xl group-hover:shadow-lg group-hover:shadow-blue-500/30 transition-all duration-300 group-hover:scale-105">
                            <Gamepad2 className="w-5 h-5 text-white" />
                          </div>
                          <span className="font-extrabold text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-zinc-900 to-zinc-600 dark:from-white dark:to-zinc-400">Game Hub</span>
                        </Link>
                      </div>
                      <ClientNavbar />
                    </div>
                  </div>
                </nav>

                <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex-1 flex flex-col w-full">
                  <MaintenanceOverlay>
                    {children}
                  </MaintenanceOverlay>
                </main>

                <Footer />
                <LoginModal />
              </div>
              </DialogProvider>
            </AuthProvider>
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
