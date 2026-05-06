import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Layout } from "@/components/Layout";
import { MatchCard } from "@/components/MatchCard";
import { matches } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/matches")({
  head: () => ({
    meta: [
      { title: "Matches — Lomita Shooters League" },
      { name: "description", content: "Browse live, upcoming and completed Lomita Shooters League matches with live odds." },
      { property: "og:title", content: "LSL · Matches" },
      { property: "og:description", content: "Live odds and match schedules across Season 4." },
    ],
  }),
  component: MatchesPage,
});

type Filter = "all" | "live" | "scheduled" | "ended";

function MatchesPage() {
  const [filter, setFilter] = useState<Filter>("all");
  const [picks, setPicks] = useState<Map<string, string>>(new Map());
  const handlePick = (mid: string, oid: string) => {
    setPicks((p) => { const n = new Map(p); n.get(mid) === oid ? n.delete(mid) : n.set(mid, oid); return n; });
  };
  const filtered = matches.filter((m) => filter === "all" || m.status === filter);

  return (
    <Layout>
      <div className="container py-10">
        <h1 className="text-4xl font-bold gradient-gold-text">All Matches</h1>
        <p className="text-muted-foreground mt-2">Season 4 · Round 14 of 18</p>

        <div className="flex gap-2 mt-6 overflow-x-auto">
          {(["all", "live", "scheduled", "ended"] as Filter[]).map((f) => (
            <Button key={f} size="sm" variant={filter === f ? "default" : "outline"}
              className={filter === f ? "btn-luxury" : "border-[var(--glass-border)]"}
              onClick={() => setFilter(f)}>
              {f === "all" ? "All" : f.charAt(0).toUpperCase() + f.slice(1)}
            </Button>
          ))}
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
          {filtered.map((m) => (
            <MatchCard key={m.id} match={m}
              selectedOddIds={new Set(picks.get(m.id) ? [picks.get(m.id)!] : [])}
              onPick={handlePick} />
          ))}
        </div>
      </div>
    </Layout>
  );
}
