import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "../components/ThemeProvider";
import { LanguageProvider } from "../contexts/LanguageContext";
import { DialogProvider } from "../contexts/DialogContext";
import { AuthProvider } from "../contexts/AuthContext";
import { SWRProvider } from "../components/SWRProvider";
import LoginModal from "../components/LoginModal";
import RegisterModal from "../components/RegisterModal";
import ForgotPasswordModal from "../components/ForgotPasswordModal";
import Script from "next/script";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Game Hub",
  description: "Play awesome web games directly in your browser. Discover, play, and share HTML5 games.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const initialLocale = "en";

  return (
    <html lang={initialLocale} suppressHydrationWarning>
      <body className={`${inter.className} overflow-x-hidden antialiased bg-background text-foreground`} suppressHydrationWarning>
        <Script
          id="adsbygoogle-init"
          strategy="afterInteractive"
          crossOrigin="anonymous"
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-7121527745227718"
        />
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <LanguageProvider initialLocale={initialLocale}>
            <SWRProvider>
              <AuthProvider>
                <DialogProvider>
                  {children}
                  <LoginModal />
                  <RegisterModal />
                  <ForgotPasswordModal />
                </DialogProvider>
              </AuthProvider>
            </SWRProvider>
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
