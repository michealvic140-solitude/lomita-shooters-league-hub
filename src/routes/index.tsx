import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { MatchCardLive } from "@/components/MatchCardLive";
import { EventBanner } from "@/components/EventBanner";
import { AnnouncementSlider, HighlightsRow, AdsRow } from "@/components/HomeContent";
import { Crosshair, Flame, Trophy, Megaphone, ChevronRight, Skull, Target, Zap, Coins, X } from "lucide-react";
import hero from "@/assets/hero.jpg";
import { fetchMatches, fetchAnnouncements, type MatchRow } from "@/lib/queries";
import { useBetSlip } from "@/contexts/BetSlipContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "@tanstack/react-router";

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
  const [matches, setMatches] = useState<MatchRow[]>([]);
  const [ann, setAnn] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([fetchMatches(), fetchAnnouncements()]).then(([m, a]) => {
      setMatches(m); setAnn(a);
    }).finally(() => setLoading(false));

    const ch = supabase.channel("matches-feed")
      .on("postgres_changes", { event: "*", schema: "public", table: "matches" }, () => fetchMatches().then(setMatches))
      .on("postgres_changes", { event: "*", schema: "public", table: "odds" }, () => fetchMatches().then(setMatches))
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const live = matches.filter((m) => m.status === "live");
  const upcoming = matches.filter((m) => m.status === "scheduled");
  const featured = matches.find((m) => m.is_featured) ?? upcoming[0];

  return (
    <Layout>
      <section className="relative overflow-hidden">
        <img src={hero} alt="" width={1920} height={1080} className="absolute inset-0 h-full w-full object-cover opacity-40" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/80 to-background" />
        <div className="container relative py-20 md:py-32">
          <Badge variant="outline" className="border-primary/50 text-primary mb-4">
            <Flame className="h-3 w-3 mr-1" /> Season 4 · Live
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
            <Link to="/matches"><Button size="lg" className="btn-luxury">View Matches <ChevronRight className="h-4 w-4 ml-1" /></Button></Link>
            <Link to="/leaderboard"><Button size="lg" variant="outline" className="border-primary/40">See Leaderboard</Button></Link>
            <Link to="/checkout"><Button size="lg" variant="outline" className="border-accent/40 text-accent"><Coins className="h-4 w-4 mr-1" />Buy Tokens</Button></Link>
          </div>
        </div>
      </section>

      <EventBanner />

      {ann[0] && (
        <section className="container -mt-4 mb-10">
          <Card className="glass-strong p-4 flex items-center gap-3 border-accent/30">
            <div className="h-10 w-10 rounded-full bg-gradient-emerald grid place-items-center shrink-0">
              <Megaphone className="h-5 w-5 text-primary-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-bold">{ann[0].title}</div>
              <div className="text-sm text-muted-foreground truncate">{ann[0].body}</div>
            </div>
            <Badge className="bg-accent text-accent-foreground hidden sm:inline-flex">New</Badge>
          </Card>
        </section>
      )}

      <section className="container grid lg:grid-cols-[1fr_360px] gap-6">
        <div className="space-y-10">
          {loading && <p className="text-muted-foreground">Loading league…</p>}
          {!loading && live.length > 0 && (
            <div>
              <SectionHeader icon={Flame} title="Live Now" subtitle="Live odds. Markets close round-by-round." />
              <div className="grid md:grid-cols-2 gap-4 mt-4">
                {live.map((m) => <MatchCardLive key={m.id} match={m} />)}
              </div>
            </div>
          )}
          {!loading && (
            <div>
              <SectionHeader icon={Crosshair} title="Upcoming Matches" subtitle="Lock your picks before the round starts." />
              {upcoming.length === 0 ? (
                <p className="text-muted-foreground mt-4 text-sm">No upcoming matches scheduled. Check back soon.</p>
              ) : (
                <div className="grid md:grid-cols-2 gap-4 mt-4">
                  {upcoming.slice(0, 6).map((m) => <MatchCardLive key={m.id} match={m} />)}
                </div>
              )}
            </div>
          )}
          {featured && (
            <div>
              <SectionHeader icon={Trophy} title="Featured Match" subtitle="The biggest matchup of the round." />
              <div className="mt-4"><MatchCardLive match={featured} /></div>
            </div>
          )}
        </div>

        <aside className="lg:sticky lg:top-20 self-start">
          <BetSlipPanel />
          <Card className="glass p-4 mt-4">
            <div className="flex items-center gap-2 mb-2">
              <Skull className="h-4 w-4 text-primary" />
              <div className="font-bold tracking-widest text-sm">LEAGUE STATS</div>
            </div>
            <Stat label="Active matches" value={matches.filter((m) => m.status !== "ended").length.toString()} />
            <Stat label="Live now" value={live.length.toString()} />
            <Stat label="Tokens in play" value="—" />
          </Card>
        </aside>
      </section>
    </Layout>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between py-1.5 border-b border-border last:border-0 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-bold text-primary">{value}</span>
    </div>
  );
}

function BetSlipPanel() {
  const { selections, remove, clear, totalOdds } = useBetSlip();
  const { user, profile, refresh } = useAuth();
  const nav = useNavigate();
  const [stake, setStake] = useState<number>(100);
  const [placing, setPlacing] = useState(false);

  const placeBet = async () => {
    if (!user) { nav({ to: "/login" }); return; }
    if (!profile) return;
    if (stake < 10) { toast.error("Minimum stake is 10 tokens"); return; }
    if (stake > profile.token_balance) { toast.error("Insufficient tokens"); return; }
    if (selections.length === 0) return;
    setPlacing(true);
    try {
      const potential = Math.round(stake * totalOdds);
      const { data: bet, error } = await supabase.from("bets").insert({
        user_id: user.id, stake, total_odds: totalOdds, potential_payout: potential, status: "open",
      }).select().single();
      if (error) throw error;
      const sels = selections.map((s) => ({
        bet_id: bet.id, match_id: s.match_id, market_id: s.market_id,
        odd_id: s.odd_id, selection_label: s.selection_label, locked_odds: s.odds,
      }));
      const { error: e2 } = await supabase.from("bet_selections").insert(sels);
      if (e2) throw e2;
      await supabase.from("profiles").update({ token_balance: profile.token_balance - stake }).eq("id", user.id);
      await supabase.from("notifications").insert({ user_id: user.id, title: "Bet placed", body: `${selections.length} pick(s) @ ${totalOdds.toFixed(2)} — staked ${stake} tokens.`, link: `/ticket/${bet.id}` });
      toast.success("Bet placed!");
      clear(); await refresh();
      nav({ to: "/ticket/$id", params: { id: bet.id } });
    } catch (e: any) { toast.error(e.message); }
    finally { setPlacing(false); }
  };

  return (
    <Card className="glass-strong p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="font-bold tracking-widest text-sm">TICKET SLIP</div>
        <Badge variant="outline" className="border-primary/40 text-primary">{selections.length}</Badge>
      </div>
      {selections.length === 0 ? (
        <div className="text-sm text-muted-foreground py-8 text-center">Tap any odds to add a pick.</div>
      ) : (
        <div className="space-y-2">
          {selections.map((s) => (
            <div key={s.odd_id} className="flex items-center justify-between text-sm border border-border rounded-md px-2 py-1.5 gap-2">
              <div className="min-w-0 flex-1">
                <div className="font-bold truncate text-xs">{s.match_name}</div>
                <div className="text-[10px] text-muted-foreground truncate">{s.market_name} · {s.selection_label}</div>
              </div>
              <div className="font-mono text-primary text-sm">{s.odds.toFixed(2)}</div>
              <button onClick={() => remove(s.odd_id)} className="text-muted-foreground hover:text-destructive"><X className="h-3 w-3" /></button>
            </div>
          ))}
          <div className="border-t border-border pt-3 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Combined odds</span>
              <span className="font-bold gradient-gold-text">{totalOdds.toFixed(2)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Input type="number" min={10} value={stake} onChange={(e) => setStake(Number(e.target.value))} className="text-sm" />
              <span className="text-xs text-muted-foreground">tokens</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Potential payout</span>
              <span className="font-bold text-accent">{Math.round(stake * totalOdds).toLocaleString()}</span>
            </div>
            <Button className="w-full btn-luxury" disabled={placing} onClick={placeBet}>
              {placing ? "Placing…" : user ? "Place Bet" : "Sign in to Bet"}
            </Button>
            {profile && <p className="text-[10px] text-center text-muted-foreground">Balance: {profile.token_balance.toLocaleString()} tokens</p>}
          </div>
        </div>
      )}
    </Card>
  );
}

function SectionHeader({ icon: Icon, title, subtitle }: { icon: any; title: string; subtitle: string }) {
  return (
    <div className="flex items-end justify-between border-b border-border pb-2">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2"><Icon className="h-5 w-5 text-primary" />{title}</h2>
        <p className="text-xs text-muted-foreground">{subtitle}</p>
      </div>
    </div>
  );
}
