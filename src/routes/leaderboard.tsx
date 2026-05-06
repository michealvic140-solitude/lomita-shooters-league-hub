import { createFileRoute } from "@tanstack/react-router";
import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { shooters, gangs } from "@/lib/mock-data";
import { Crown, Trophy, Skull } from "lucide-react";

export const Route = createFileRoute("/leaderboard")({
  head: () => ({
    meta: [
      { title: "Leaderboard — Lomita Shooters League" },
      { name: "description", content: "Top shooters and gangs ranked across Season 4 of the Lomita Shooters League." },
      { property: "og:title", content: "LSL · Leaderboard" },
      { property: "og:description", content: "See who's claiming the gold this season." },
    ],
  }),
  component: LeaderboardPage,
});

function LeaderboardPage() {
  return (
    <Layout>
      <div className="container py-10">
        <h1 className="text-4xl font-bold gradient-gold-text">Leaderboard</h1>
        <p className="text-muted-foreground mt-2">Season 4 standings · updated every round.</p>

        <div className="grid md:grid-cols-2 gap-6 mt-8">
          <Card className="glass p-6">
            <h2 className="font-bold mb-4 flex items-center gap-2"><Crown className="h-5 w-5 text-gold" />Top Gangs</h2>
            <div className="space-y-2">
              {gangs.map((g, i) => (
                <div key={g.id} className="flex items-center gap-3 p-2 rounded-md hover:bg-secondary/30 transition">
                  <div className="w-8 text-center font-bold gradient-gold-text">{i + 1}</div>
                  <div className="h-9 w-9 rounded-md" style={{ background: g.color }} />
                  <div className="flex-1 min-w-0">
                    <div className="font-bold truncate">{g.name}</div>
                    <div className="text-[10px] text-muted-foreground">{g.members} members · {g.wins} wins</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-gold">{g.points.toLocaleString()}</div>
                    <div className="text-[10px] text-muted-foreground">pts</div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="glass p-6">
            <h2 className="font-bold mb-4 flex items-center gap-2"><Trophy className="h-5 w-5 text-gold" />Top Shooters</h2>
            <div className="space-y-2">
              {shooters.map((s, i) => (
                <div key={s.id} className="flex items-center gap-3 p-2 rounded-md hover:bg-secondary/30 transition">
                  <div className="w-8 text-center font-bold gradient-gold-text">{i + 1}</div>
                  <div className="h-9 w-9 rounded-full bg-gradient-emerald grid place-items-center text-[var(--primary-foreground)] font-bold text-xs">
                    {s.alias.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold truncate flex items-center gap-2">{s.alias} <Badge variant="outline" className="text-[9px] border-[var(--gold)]/30 text-gold">{s.role}</Badge></div>
                    <div className="text-[10px] text-muted-foreground truncate">{s.name} · {s.gang}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-gold">{s.points.toLocaleString()}</div>
                    <div className="text-[10px] text-muted-foreground">K/D {s.kdr}</div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <Card className="glass p-6 mt-6">
          <h2 className="font-bold mb-3 flex items-center gap-2"><Skull className="h-5 w-5 text-gold" />Hall of Fame</h2>
          <p className="text-sm text-muted-foreground">Past season champions, immortalized in gold.</p>
          <div className="mt-4 grid sm:grid-cols-3 gap-3">
            {["Season 3 · Iron Phantoms", "Season 2 · Crimson Vipers", "Season 1 · Golden Wolves"].map((t) => (
              <div key={t} className="px-3 py-4 rounded-md text-center border border-[var(--gold)]/30 bg-gradient-luxury">
                <Trophy className="h-6 w-6 text-gold mx-auto" />
                <div className="mt-2 text-sm font-bold">{t}</div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </Layout>
  );
}
