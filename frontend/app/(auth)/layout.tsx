import Link from "next/link"
import { Gamepad2 } from "lucide-react"

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="relative min-h-screen grid lg:grid-cols-2">
      <div className="relative hidden h-full flex-col bg-muted p-10 text-white dark:border-r lg:flex">
        <div className="absolute inset-0 bg-zinc-950" />
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-30 mix-blend-overlay"
          style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1552820728-8b83bb6b773f?q=80&w=2070&auto=format&fit=crop")' }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/80 to-transparent" />
        
        <div className="relative z-20 flex items-center text-2xl font-bold">
          <Gamepad2 className="mr-2 h-8 w-8 text-primary" />
          GameHub
        </div>
        
        <div className="relative z-20 mt-auto">
          <blockquote className="space-y-2">
            <p className="text-lg font-medium leading-relaxed">
              "GameHub is the ultimate destination for discovering, playing, and sharing HTML5 games directly in the browser."
            </p>
            <footer className="text-sm text-zinc-400">Join thousands of players today</footer>
          </blockquote>
        </div>
      </div>
      
      <div className="flex items-center justify-center p-8 h-screen bg-background relative">
        <div className="absolute top-4 right-4 md:top-8 md:right-8">
          <Link href="/" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
            Back to Home
          </Link>
        </div>
        <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[400px]">
          {children}
        </div>
      </div>
    </div>
  )
}
