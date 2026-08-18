import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "../components/ThemeProvider";
import { LanguageProvider } from "../contexts/LanguageContext";
import { DialogProvider } from "../contexts/DialogContext";
import { AuthProvider } from "../contexts/AuthContext";
import LoginModal from "../components/LoginModal";
import { cookies } from "next/headers";
import Script from "next/script";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Game Hub - The Ultimate HTML5 Gaming Platform",
  description: "Play awesome web games directly in your browser. Discover, play, and share HTML5 games.",
};

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
      </head>
      <body className={`${inter.className} overflow-x-hidden antialiased bg-background text-foreground`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <LanguageProvider initialLocale={initialLocale}>
            <AuthProvider>
              <DialogProvider>
                {children}
                <LoginModal />
              </DialogProvider>
            </AuthProvider>
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
