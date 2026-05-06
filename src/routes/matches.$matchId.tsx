import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { matches, type Match } from "@/lib/mock-data";
import { Countdown } from "@/components/Countdown";
import { ArrowLeft, MapPin, Crosshair } from "lucide-react";

export const Route = createFileRoute("/matches/$matchId")({
  loader: ({ params }) => {
    const match = matches.find((m) => m.id === params.matchId);
    if (!match) throw notFound();
    return { match };
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.match.home.name} vs ${loaderData?.match.away.name} — LSL` },
      { name: "description", content: `Live odds and stats for ${loaderData?.match.name}.` },
    ],
  }),
  component: MatchDetail,
  notFoundComponent: () => (
    <Layout>
      <div className="container py-20 text-center">
        <h1 className="text-3xl font-bold">Match not found</h1>
        <Link to="/matches"><Button className="mt-4 btn-luxury">Back to matches</Button></Link>
      </div>
    </Layout>
  ),
});

function MatchDetail() {
  const { match } = Route.useLoaderData() as { match: Match };
  return (
    <Layout>
      <div className="container py-8">
        <Link to="/matches" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-gold">
          <ArrowLeft className="h-4 w-4" /> All matches
        </Link>

        <Card className="glass-strong p-6 md:p-10 mt-4 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-emerald opacity-5" />
          <div className="relative">
            <div className="flex items-center justify-between text-xs uppercase tracking-widest text-muted-foreground">
              <span>{match.name}</span>
              <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{match.location}</span>
            </div>

            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-6 mt-6">
              <div className="text-center">
                <div className="h-20 w-20 mx-auto rounded-full ring-4 ring-[var(--glass-border)]" style={{ background: match.home.color }} />
                <div className="font-bold mt-3 text-lg">{match.home.name}</div>
                <div className="text-xs text-muted-foreground tracking-widest">{match.home.tag}</div>
                <div className="text-5xl font-bold gradient-gold-text mt-2">{match.homeScore}</div>
              </div>
              <div className="text-center">
                <Crosshair className="h-10 w-10 text-gold mx-auto" style={{ animation: "var(--animate-pulse-glow)" }} />
                <div className="text-xs text-muted-foreground mt-2 uppercase tracking-widest">VS</div>
                {match.status === "scheduled" && <div className="mt-2 text-sm"><Countdown target={match.startTime} /></div>}
                {match.status === "live" && <Badge className="mt-2 bg-destructive">● LIVE</Badge>}
                {match.status === "ended" && <Badge className="mt-2 bg-emerald text-[var(--primary-foreground)]">Final</Badge>}
              </div>
              <div className="text-center">
                <div className="h-20 w-20 mx-auto rounded-full ring-4 ring-[var(--glass-border)]" style={{ background: match.away.color }} />
                <div className="font-bold mt-3 text-lg">{match.away.name}</div>
                <div className="text-xs text-muted-foreground tracking-widest">{match.away.tag}</div>
                <div className="text-5xl font-bold gradient-gold-text mt-2">{match.awayScore}</div>
              </div>
            </div>
          </div>
        </Card>

        <div className="grid md:grid-cols-2 gap-6 mt-6">
          <Card className="glass p-5">
            <h3 className="font-bold text-lg mb-4">{match.market}</h3>
            <div className="grid grid-cols-3 gap-2">
              {match.odds.map((o) => (
                <button key={o.id}
                  className="px-3 py-3 rounded-md bg-secondary/40 border border-[var(--glass-border)] hover:border-[var(--gold)]/70 transition">
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{o.label}</div>
                  <div className="text-lg font-bold gradient-gold-text">{o.value.toFixed(2)}</div>
                </button>
              ))}
            </div>
          </Card>
          <Card className="glass p-5">
            <h3 className="font-bold text-lg mb-4">Round Stats</h3>
            <div className="space-y-3 text-sm">
              {[
                { l: "Avg accuracy", v: "67%" },
                { l: "Avg headshot rate", v: "31%" },
                { l: "Round duration", v: "8m 12s" },
                { l: "Crowd size", v: "1,284" },
              ].map((s) => (
                <div key={s.l} className="flex justify-between border-b border-[var(--glass-border)] pb-2">
                  <span className="text-muted-foreground">{s.l}</span>
                  <span className="font-bold text-gold">{s.v}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
