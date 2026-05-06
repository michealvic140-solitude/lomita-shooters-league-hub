import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MatchCard } from "@/components/MatchCard";
import { matches, gangs, shooters, announcements } from "@/lib/mock-data";
import { Crosshair, Flame, Trophy, Megaphone, ChevronRight, Skull, Target, Zap } from "lucide-react";
import hero from "@/assets/hero.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Lomita Shooters League — Virtual Token Shooting League" },
      { name: "description", content: "Live matches, gang leaderboards and virtual-token wagering for the Lomita Shooters League." },
      { property: "og:title", content: "Lomita Shooters League" },
      { property: "og:description", content: "Where gangs clash and legends are gold-plated. Virtual tokens only." },
      { property: "og:image", content: hero },
    ],
  }),
  component: Index,
});

function Index() {
  const [picks, setPicks] = useState<Map<string, string>>(new Map());
  const live = matches.filter((m) => m.status === "live");
  const upcoming = matches.filter((m) => m.status === "scheduled");
  const ann = announcements[0];

  const slip = useMemo(() => {
    return Array.from(picks.entries()).map(([mid, oid]) => {
      const m = matches.find((x) => x.id === mid)!;
      const o = m.odds.find((x) => x.id === oid)!;
      return { matchId: mid, name: `${m.home.tag} vs ${m.away.tag}`, label: o.label, value: o.value };
    });
  }, [picks]);

  const totalOdds = slip.reduce((acc, s) => acc * s.value, 1);

  const handlePick = (matchId: string, oddId: string) => {
    setPicks((prev) => {
      const next = new Map(prev);
      if (next.get(matchId) === oddId) next.delete(matchId);
      else next.set(matchId, oddId);
      return next;
    });
  };

  return (
    <Layout>
      {/* HERO */}
      <section className="relative overflow-hidden">
        <img src={hero} alt="" width={1920} height={1080}
          className="absolute inset-0 h-full w-full object-cover opacity-40" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[var(--background)]/80 to-[var(--background)]" />
        <div className="container relative py-20 md:py-32">
          <Badge variant="outline" className="border-[var(--gold)]/50 text-gold mb-4">
            <Flame className="h-3 w-3 mr-1" /> Season 4 · Round 14 Live
          </Badge>
          <h1 className="text-4xl md:text-7xl font-bold leading-tight max-w-3xl">
            Where gangs clash and{" "}
            <span className="gradient-gold-text">legends</span> are{" "}
            <span className="gradient-emerald-text">gold-plated</span>.
          </h1>
          <p className="mt-5 max-w-xl text-lg text-muted-foreground">
            The Lomita Shooters League is a virtual-token competitive shooting circuit. Pick your gang, place your wagers, and climb the leaderboard.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link to="/matches"><Button size="lg" className="btn-luxury">View Live Matches <ChevronRight className="h-4 w-4 ml-1" /></Button></Link>
            <Link to="/leaderboard"><Button size="lg" variant="outline" className="border-[var(--gold)]/40">See Leaderboard</Button></Link>
          </div>

          <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl">
            {[
              { icon: Target, label: "Active Shooters", value: "324" },
              { icon: Skull, label: "Active Gangs", value: "18" },
              { icon: Trophy, label: "Matches / Season", value: "84" },
              { icon: Zap, label: "Tokens In Play", value: "2.4M" },
            ].map((s) => (
              <Card key={s.label} className="glass p-4">
                <s.icon className="h-5 w-5 text-gold mb-2" />
                <div className="text-2xl font-bold gradient-gold-text">{s.value}</div>
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{s.label}</div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ANNOUNCEMENT */}
      <section className="container -mt-4 mb-10">
        <Card className="glass-strong p-4 flex items-center gap-3 border-[var(--emerald)]/30">
          <div className="h-10 w-10 rounded-full bg-gradient-emerald grid place-items-center shrink-0">
            <Megaphone className="h-5 w-5 text-[var(--primary-foreground)]" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-bold">{ann.title}</div>
            <div className="text-sm text-muted-foreground truncate">{ann.body}</div>
          </div>
          <Badge className="bg-emerald text-[var(--primary-foreground)] hidden sm:inline-flex">New</Badge>
        </Card>
      </section>

      {/* MAIN GRID */}
      <section className="container grid lg:grid-cols-[1fr_360px] gap-6">
        <div className="space-y-10">
          {/* LIVE */}
          {live.length > 0 && (
            <div>
              <SectionHeader icon={Flame} title="Live Now" subtitle="Live odds. Markets close round-by-round." />
              <div className="grid md:grid-cols-2 gap-4 mt-4">
                {live.map((m) => (
                  <MatchCard key={m.id} match={m}
                    selectedOddIds={new Set(picks.get(m.id) ? [picks.get(m.id)!] : [])}
                    onPick={handlePick} />
                ))}
              </div>
            </div>
          )}

          {/* UPCOMING */}
          <div>
            <SectionHeader icon={Crosshair} title="Upcoming Matches"
              subtitle="Lock your picks before the round starts." />
            <div className="grid md:grid-cols-2 gap-4 mt-4">
              {upcoming.map((m) => (
                <MatchCard key={m.id} match={m}
                  selectedOddIds={new Set(picks.get(m.id) ? [picks.get(m.id)!] : [])}
                  onPick={handlePick} />
              ))}
            </div>
          </div>

          {/* TOP GANGS */}
          <div>
            <SectionHeader icon={Skull} title="Top Gangs" subtitle="Faction standings, Season 4." />
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3 mt-4">
              {gangs.slice(0, 6).map((g, i) => (
                <Card key={g.id} className="glass p-4 flex items-center gap-3 hover:border-[var(--gold)]/60 transition">
                  <div className="text-3xl font-bold gradient-gold-text w-8 text-center">{i + 1}</div>
                  <div className="h-10 w-10 rounded-md" style={{ background: g.color }} />
                  <div className="min-w-0 flex-1">
                    <div className="font-bold truncate">{g.name}</div>
                    <div className="text-[10px] text-muted-foreground tracking-widest uppercase">{g.tag} · {g.members} members</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-gold">{g.points.toLocaleString()}</div>
                    <div className="text-[10px] text-muted-foreground">pts</div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>

        {/* SIDEBAR — BET SLIP */}
        <aside className="lg:sticky lg:top-20 self-start">
          <Card className="glass-strong p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="font-bold tracking-widest text-sm">TICKET SLIP</div>
              <Badge variant="outline" className="border-[var(--gold)]/40 text-gold">{slip.length}</Badge>
            </div>
            {slip.length === 0 ? (
              <div className="text-sm text-muted-foreground py-8 text-center">
                Tap any odds to add a pick.
              </div>
            ) : (
              <div className="space-y-2">
                {slip.map((s) => (
                  <div key={s.matchId} className="flex items-center justify-between text-sm border border-[var(--glass-border)] rounded-md px-2 py-1.5">
                    <div className="min-w-0">
                      <div className="font-bold truncate">{s.name}</div>
                      <div className="text-[10px] text-muted-foreground">{s.label}</div>
                    </div>
                    <div className="font-mono text-gold">{s.value.toFixed(2)}</div>
                  </div>
                ))}
                <div className="border-t border-[var(--glass-border)] pt-3 flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Combined odds</span>
                  <span className="font-bold gradient-gold-text">{totalOdds.toFixed(2)}</span>
                </div>
                <Button className="w-full btn-luxury">Place 100 Token Wager</Button>
                <p className="text-[10px] text-center text-muted-foreground">Demo only · No real money. Sign in to wager.</p>
              </div>
            )}
          </Card>

          <Card className="glass p-4 mt-4">
            <div className="flex items-center gap-2 mb-3">
              <Trophy className="h-4 w-4 text-gold" />
              <div className="font-bold tracking-widest text-sm">TOP SHOOTERS</div>
            </div>
            <ol className="space-y-2 text-sm">
              {shooters.slice(0, 5).map((s, i) => (
                <li key={s.id} className="flex items-center gap-2">
                  <span className="w-5 text-center text-gold font-bold">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold truncate">{s.alias}</div>
                    <div className="text-[10px] text-muted-foreground truncate">{s.gang}</div>
                  </div>
                  <span className="font-mono text-gold">{s.points.toLocaleString()}</span>
                </li>
              ))}
            </ol>
            <Link to="/leaderboard" className="block mt-3 text-center text-xs text-emerald hover:underline">View full leaderboard →</Link>
          </Card>
        </aside>
      </section>
    </Layout>
  );
}

function SectionHeader({ icon: Icon, title, subtitle }: { icon: any; title: string; subtitle: string }) {
  return (
    <div className="flex items-end justify-between border-b border-[var(--glass-border)] pb-2">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2"><Icon className="h-5 w-5 text-gold" />{title}</h2>
        <p className="text-xs text-muted-foreground">{subtitle}</p>
      </div>
    </div>
  );
}
