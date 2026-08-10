import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import { Gamepad2, Settings, LogOut } from "lucide-react";
import { cookies } from "next/headers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Game Hub - Web Game Platform",
  description: "Play awesome web games directly in your browser",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  const role = cookieStore.get("role")?.value;
  
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="min-h-screen bg-[#09090b] text-zinc-50 flex flex-col">
          {/* Navigation Bar */}
          <nav className="sticky top-0 z-50 w-full border-b border-zinc-800 bg-[#09090b]/80 backdrop-blur-md">
            <div className="container mx-auto px-4 h-16 flex items-center justify-between">
              <div className="flex items-center gap-6">
                <Link href="/" className="flex items-center gap-2 text-blue-500 hover:text-blue-400 transition-colors">
                  <Gamepad2 className="w-8 h-8" />
                  <span className="text-xl font-bold tracking-tight">Game Hub</span>
                </Link>
                <div className="hidden md:flex gap-4">
                  <Link href="/" className="text-sm font-medium text-zinc-300 hover:text-white transition-colors">
                    Store
                  </Link>
                  <Link href="/library" className="text-sm font-medium text-zinc-300 hover:text-white transition-colors">
                    Library
                  </Link>
                </div>
              </div>
              <div className="flex items-center gap-4">
                {!token ? (
                  <Link
                    href="/login"
                    className="flex items-center gap-2 px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-500 text-sm font-medium transition-colors"
                  >
                    Sign in
                  </Link>
                ) : (
                  <>
                    {role === "admin" && (
                      <Link
                        href="/admin"
                        className="flex items-center gap-2 px-4 py-2 rounded-md bg-zinc-800 hover:bg-zinc-700 text-sm font-medium transition-colors"
                      >
                        <Settings className="w-4 h-4" />
                        Admin
                      </Link>
                    )}
                    <a
                      href="/api/auth/logout" // A quick route or we can just use a client action. Let's make a logout button.
                      onClick={(e) => {
                        e.preventDefault();
                        document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
                        document.cookie = "role=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
                        window.location.href = "/login";
                      }}
                      className="flex items-center gap-2 px-4 py-2 rounded-md border border-zinc-800 hover:bg-zinc-800 text-sm font-medium transition-colors cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                      Logout
                    </a>
                  </>
                )}
              </div>
            </div>
          </nav>

          {/* Main Content */}
          <main className="flex-1">
            {children}
          </main>
          
          {/* Footer */}
          <footer className="border-t border-zinc-800 py-8 text-center text-zinc-500 text-sm">
            <p>© {new Date().getFullYear()} Game Hub. Built with Next.js & Cloudflare R2.</p>
          </footer>
        </div>
      </body>
    </html>
  );
}
