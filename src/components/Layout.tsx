import { Link, useNavigate } from "@tanstack/react-router";
import { Crosshair, LogOut, User as UserIcon, Shield, MessageSquare, Home, Trophy, Ticket, LifeBuoy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth, ROLE_COLORS, ROLE_LABELS } from "@/contexts/AuthContext";
import { NotificationBell } from "@/components/NotificationBell";
import { ReactNode } from "react";

export const Layout = ({ children }: { children: ReactNode }) => {
  const { user, profile, roles, isAdmin, signOut } = useAuth();
  const nav = useNavigate();

  return (
    <div className="relative min-h-screen">
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-40 -left-40 h-96 w-96 rounded-full bg-primary/10 blur-3xl animate-pulse-glow" />
        <div className="absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-accent/10 blur-3xl animate-pulse-glow" />
      </div>
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-card/60 border-b border-border">
        <div className="container mx-auto px-4 flex h-16 items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-2 group">
            <Crosshair className="h-7 w-7 text-primary animate-slow-spin" />
            <div className="leading-tight">
              <div className="text-sm font-bold tracking-widest text-primary">LOMITA</div>
              <div className="text-[10px] text-muted-foreground tracking-[0.3em]">SHOOTERS LEAGUE</div>
            </div>
          </Link>
          <nav className="hidden md:flex items-center gap-1">
            <Link to="/matches"><Button variant="ghost" size="sm">Matches</Button></Link>
            <Link to="/leaderboard"><Button variant="ghost" size="sm">Leaderboard</Button></Link>
            {user && <Link to="/chat"><Button variant="ghost" size="sm"><MessageSquare className="h-4 w-4" />Chat</Button></Link>}
            {user && <Link to="/dashboard"><Button variant="ghost" size="sm">Dashboard</Button></Link>}
            {user && <Link to="/checkout"><Button variant="ghost" size="sm">Buy Tokens</Button></Link>}
            {user && <Link to="/support"><Button variant="ghost" size="sm">Support</Button></Link>}
            {isAdmin && <Link to="/admin"><Button variant="ghost" size="sm" className="text-destructive"><Shield className="h-4 w-4" />Admin</Button></Link>}
          </nav>
          <div className="flex items-center gap-2">
            {user && profile ? (
              <>
                <div className="hidden sm:flex flex-col items-end leading-tight">
                  <span className="text-xs text-muted-foreground">Tokens</span>
                  <span className="text-sm font-bold text-primary">{profile.token_balance.toLocaleString()}</span>
                </div>
                <Link to="/notifications"><Button variant="ghost" size="icon"><Bell className="h-4 w-4" /></Button></Link>
                <Link to="/profile">
                  <Button variant="ghost" size="sm" className="gap-2">
                    <UserIcon className="h-4 w-4" />
                    <span className="hidden sm:inline text-xs">{profile.full_name}</span>
                  </Button>
                </Link>
                <Button variant="ghost" size="icon" onClick={async () => { await signOut(); nav({ to: "/" }); }}>
                  <LogOut className="h-4 w-4" />
                </Button>
              </>
            ) : (
              <>
                <Link to="/login"><Button variant="ghost" size="sm">Sign in</Button></Link>
                <Link to="/register"><Button size="sm">Join League</Button></Link>
              </>
            )}
          </div>
        </div>
        {user && roles.length > 0 && (
          <div className="container mx-auto px-4 pb-2 flex flex-wrap gap-1">
            {roles.map((r) => <Badge key={r} variant="outline" className={ROLE_COLORS[r]}>{ROLE_LABELS[r]}</Badge>)}
          </div>
        )}
      </header>
      <main className="relative">{children}</main>
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 backdrop-blur-xl bg-card/80 border-t border-border">
        <div className="overflow-x-auto">
          <div className="flex items-center gap-1 px-2 py-2 min-w-max">
            <MobLink to="/" icon={Home} label="Home" />
            <MobLink to="/matches" icon={Crosshair} label="Matches" />
            <MobLink to="/leaderboard" icon={Trophy} label="Top" />
            {user && <>
              <MobLink to="/dashboard" icon={Ticket} label="Bets" />
              <MobLink to="/chat" icon={MessageSquare} label="Chat" />
              <MobLink to="/profile" icon={UserIcon} label="Profile" />
              <MobLink to="/support" icon={LifeBuoy} label="Help" />
            </>}
            {isAdmin && <MobLink to="/admin" icon={Shield} label="Admin" />}
          </div>
        </div>
      </nav>
      <div className="md:hidden h-20" />
      <footer className="border-t border-border mt-20 backdrop-blur-xl bg-card/40">
        <div className="container mx-auto px-4 py-8 text-center text-sm text-muted-foreground">
          <div className="font-bold tracking-widest mb-2 text-primary">LOMITA SHOOTERS LEAGUE</div>
          <p>Virtual token-only platform · No real money gambling</p>
        </div>
      </footer>
    </div>
  );
};

function MobLink({ to, icon: Icon, label }: { to: string; icon: any; label: string }) {
  return (
    <Link to={to} className="flex flex-col items-center px-3 py-1 rounded-lg text-[10px] min-w-[60px] text-muted-foreground [&.active]:text-primary [&.active]:bg-primary/10" activeProps={{ className: "active" }}>
      <Icon className="h-5 w-5 mb-0.5" />
      {label}
    </Link>
  );
}
