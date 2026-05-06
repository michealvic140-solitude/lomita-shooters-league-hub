import { createFileRoute } from "@tanstack/react-router";
import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { gangs, shooters } from "@/lib/mock-data";
import { Users, Trophy } from "lucide-react";

export const Route = createFileRoute("/gangs")({
  head: () => ({
    meta: [
      { title: "Gangs — Lomita Shooters League" },
      { name: "description", content: "Meet the factions of the Lomita Shooters League. Allegiance, rivalry, glory." },
      { property: "og:title", content: "LSL · Gangs" },
      { property: "og:description", content: "Pick your gang. Earn your stripes." },
    ],
  }),
  component: GangsPage,
});

function GangsPage() {
  return (
    <Layout>
      <div className="container py-10">
        <h1 className="text-4xl font-bold gradient-gold-text">Gangs of LSL</h1>
        <p className="text-muted-foreground mt-2">Six factions vie for supremacy. Pick yours wisely.</p>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 mt-8">
          {gangs.map((g) => {
            const members = shooters.filter((s) => s.gang === g.name);
            return (
              <Card key={g.id} className="glass p-5 relative overflow-hidden hover:border-[var(--gold)]/60 transition group">
                <div className="absolute -top-10 -right-10 h-32 w-32 rounded-full opacity-20 blur-2xl" style={{ background: g.color }} />
                <div className="relative">
                  <div className="flex items-start gap-3">
                    <div className="h-14 w-14 rounded-lg ring-2 ring-[var(--glass-border)] shrink-0" style={{ background: g.color }} />
                    <div className="min-w-0 flex-1">
                      <h2 className="font-bold text-lg truncate">{g.name}</h2>
                      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{g.tag}</div>
                      <div className="italic text-xs text-muted-foreground mt-1">"{g.motto}"</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 mt-4 text-center">
                    <Stat label="Members" value={g.members.toString()} />
                    <Stat label="Wins" value={g.wins.toString()} />
                    <Stat label="Points" value={g.points.toLocaleString()} />
                  </div>

                  <div className="mt-4 border-t border-[var(--glass-border)] pt-3">
                    <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2 flex items-center gap-1">
                      <Users className="h-3 w-3" /> Featured shooters
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {members.slice(0, 3).map((m) => (
                        <Badge key={m.id} variant="outline" className="text-[10px] border-[var(--gold)]/30 text-gold">{m.alias}</Badge>
                      ))}
                      {members.length === 0 && <span className="text-[10px] text-muted-foreground">Recruiting…</span>}
                    </div>
                  </div>

                  <Button size="sm" variant="outline" className="mt-4 w-full border-[var(--gold)]/40 group-hover:btn-luxury transition">
                    <Trophy className="h-3 w-3 mr-1" /> View gang
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </Layout>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-secondary/40 border border-[var(--glass-border)] py-2">
      <div className="font-bold text-gold">{value}</div>
      <div className="text-[9px] uppercase tracking-widest text-muted-foreground">{label}</div>
    </div>
  );
}
