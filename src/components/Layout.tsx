import { Link } from "@tanstack/react-router";
import { Crosshair, Bell, Shield, MessageSquare, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { ReactNode } from "react";

const navItems = [
  { to: "/matches", label: "Matches" },
  { to: "/leaderboard", label: "Leaderboard" },
  { to: "/gangs", label: "Gangs" },
  { to: "/about", label: "About" },
] as const;

export function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-screen">
      {/* Decorative ambient glow */}
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute top-0 left-1/4 h-96 w-96 rounded-full bg-[var(--emerald)] opacity-10 blur-3xl" />
        <div className="absolute bottom-0 right-1/4 h-96 w-96 rounded-full bg-[var(--gold)] opacity-10 blur-3xl" />
      </div>

      <header className="sticky top-0 z-50 glass border-b border-[var(--glass-border)]">
        <div className="container flex h-16 items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="relative">
              <Crosshair className="h-7 w-7 text-gold" style={{ animation: "var(--animate-slow-spin)" }} />
              <div className="absolute inset-0 bg-[var(--gold)] opacity-30 blur-lg group-hover:opacity-60 transition" />
            </div>
            <div className="leading-tight">
              <div className="text-sm font-bold gradient-gold-text tracking-[0.25em]">LOMITA</div>
              <div className="text-[10px] text-muted-foreground tracking-[0.3em]">SHOOTERS LEAGUE</div>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((n) => (
              <Link key={n.to} to={n.to} activeProps={{ className: "text-gold" }}>
                <Button variant="ghost" size="sm">{n.label}</Button>
              </Link>
            ))}
            <Link to="/chat"><Button variant="ghost" size="sm" className="gap-1"><MessageSquare className="h-4 w-4" />Chat</Button></Link>
            <Link to="/admin"><Button variant="ghost" size="sm" className="gap-1 text-emerald"><Shield className="h-4 w-4" />Admin</Button></Link>
          </nav>

          <div className="flex items-center gap-2">
            <div className="hidden sm:flex flex-col items-end leading-tight">
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Tokens</span>
              <span className="text-sm font-bold text-gold">12,450</span>
            </div>
            <Button variant="ghost" size="icon"><Bell className="h-4 w-4" /></Button>
            <Link to="/login"><Button variant="ghost" size="sm" className="gap-1"><User className="h-4 w-4" />Sign in</Button></Link>
            <Link to="/register"><Button size="sm" className="btn-luxury">Join League</Button></Link>
          </div>
        </div>
        <div className="container pb-2 hidden md:flex flex-wrap gap-1">
          <Badge variant="outline" className="border-[var(--gold)]/40 text-gold">Season 4 · Live</Badge>
          <Badge variant="outline" className="border-[var(--emerald)]/40 text-emerald">Virtual tokens only</Badge>
        </div>
      </header>

      <main className="relative">{children}</main>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-50 glass border-t border-[var(--glass-border)]">
        <div className="grid grid-cols-4 text-xs">
          {navItems.map((n) => (
            <Link key={n.to} to={n.to} className="py-3 text-center text-muted-foreground"
              activeProps={{ className: "py-3 text-center text-gold" }}>
              {n.label}
            </Link>
          ))}
        </div>
      </nav>
      <div className="md:hidden h-16" />

      <footer className="glass border-t border-[var(--glass-border)] mt-20">
        <div className="container py-10 grid gap-6 md:grid-cols-3 text-sm text-muted-foreground">
          <div>
            <div className="gradient-gold-text font-bold tracking-[0.25em] mb-2">LOMITA SHOOTERS LEAGUE</div>
            <p className="text-xs">A virtual token-only competitive shooting league. No real money gambling — just glory, gangs, and gold.</p>
          </div>
          <div>
            <div className="font-bold text-foreground mb-2">League</div>
            <ul className="space-y-1 text-xs">
              <li><Link to="/matches" className="hover:text-gold">Matches</Link></li>
              <li><Link to="/leaderboard" className="hover:text-gold">Leaderboard</Link></li>
              <li><Link to="/gangs" className="hover:text-gold">Gangs</Link></li>
            </ul>
          </div>
          <div>
            <div className="font-bold text-foreground mb-2">Support</div>
            <ul className="space-y-1 text-xs">
              <li><Link to="/about" className="hover:text-gold">About LSL</Link></li>
              <li><Link to="/chat" className="hover:text-gold">Community Chat</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-[var(--glass-border)] py-4 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} Lomita Shooters League · All rights reserved.
        </div>
      </footer>
    </div>
  );
}
