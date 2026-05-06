import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Sparkles, Send, ArrowLeft, Ticket as TicketIcon, Crosshair, Copy, Check, X, DollarSign } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/ticket/$id")({
  head: () => ({ meta: [{ title: "Ticket — LSL" }] }),
  component: TicketPage,
});

function TicketPage() {
  const { id } = Route.useParams();
  const { user, isMod } = useAuth();
  const [ticket, setTicket] = useState<any>(null);
  const [bet, setBet] = useState<any>(null);
  const [msgs, setMsgs] = useState<any[]>([]);
  const [text, setText] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    supabase.from("support_tickets").select("*").eq("id", id).maybeSingle().then(({ data }) => { if (data) setTicket(data); });
    loadBet();
    const ch = supabase.channel(`bet-${id}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "bets", filter: `id=eq.${id}` }, loadBet)
      .on("postgres_changes", { event: "*", schema: "public", table: "matches" }, loadBet)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function loadBet() {
    const { data } = await supabase.from("bets")
      .select("*, bet_selections(*, matches:match_id(name, status, home_score, away_score, home_team:home_team_id(name,logo_url), away_team:away_team_id(name,logo_url)), markets:market_id(name))")
      .eq("id", id).maybeSingle();
    if (data) setBet(data);
  }

  useEffect(() => {
    if (!ticket) return;
    supabase.from("ticket_messages").select("*").eq("ticket_id", ticket.id).order("created_at", { ascending: true })
      .then(({ data }) => setMsgs(data ?? []));
    const ch = supabase.channel(`tm-${ticket.id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "ticket_messages", filter: `ticket_id=eq.${ticket.id}` },
        (p) => setMsgs((prev) => [...prev, p.new]))
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [ticket?.id]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs]);

  if (!user) return <Layout><div className="container py-10"><Link to="/login" className="text-primary underline">Sign in</Link> to view tickets.</div></Layout>;
  if (bet && !ticket) return <BetTicket bet={bet} reload={loadBet} />;
  if (!ticket) return <Layout><div className="container py-10">Loading…</div></Layout>;

  async function send() {
    if (!text.trim() || !ticket || !user) return;
    const content = text.trim();
    setText("");
    const { error } = await supabase.from("ticket_messages").insert({ ticket_id: ticket.id, user_id: user.id, content });
    if (error) { toast.error(error.message); return; }
    if (!isMod) {
      try {
        const { data: ai } = await supabase.functions.invoke("ai-support", { body: { subject: ticket.subject, message: content } });
        if (ai?.reply) await supabase.from("ticket_messages").insert({ ticket_id: ticket.id, user_id: user.id, content: ai.reply, is_ai: true });
      } catch {/* ignore */ }
    }
  }

  return (
    <Layout>
      <div className="container py-10 max-w-3xl">
        <Link to="/support" className="text-muted-foreground text-sm flex items-center gap-1 hover:text-primary"><ArrowLeft className="h-4 w-4" />All tickets</Link>
        <Card className="glass-strong p-5 mt-3">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold flex items-center gap-2"><TicketIcon className="h-5 w-5 text-primary" />{ticket.subject}</h1>
            <Badge variant="outline" className="capitalize">{ticket.status}</Badge>
          </div>
        </Card>

        <Card className="glass mt-3 flex flex-col h-[55vh]">
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {msgs.map((m) => (
              <div key={m.id} className={`flex ${m.is_ai ? "justify-start" : m.user_id === user.id ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${m.is_ai ? "bg-accent/20 border border-accent/40" : m.user_id === user.id ? "bg-primary/20 border border-primary/40" : "bg-secondary"}`}>
                  {m.is_ai && <div className="text-[10px] text-accent flex items-center gap-1 mb-1"><Sparkles className="h-3 w-3" />AI Assistant</div>}
                  <div className="whitespace-pre-wrap">{m.content}</div>
                </div>
              </div>
            ))}
            <div ref={endRef} />
          </div>
          <div className="p-3 border-t border-border flex gap-2">
            <Input value={text} onChange={(e) => setText(e.target.value)} placeholder="Reply…" onKeyDown={(e) => e.key === "Enter" && send()} />
            <Button onClick={send} className="btn-luxury"><Send className="h-4 w-4" /></Button>
          </div>
        </Card>
      </div>
    </Layout>
  );
}

function BetTicket({ bet, reload }: { bet: any; reload: () => void }) {
  const { user, refresh } = useAuth();
  const [cashing, setCashing] = useState(false);

  const sels = bet.bet_selections ?? [];
  const allEnded = sels.length > 0 && sels.every((s: any) => s.matches?.status === "ended");
  const anyLost = sels.some((s: any) => s.result === "lost");
  const allWon = sels.length > 0 && sels.every((s: any) => s.result === "won");
  const liveCount = sels.filter((s: any) => s.matches?.status === "live").length;
  const canCashout = bet.status === "open" && !anyLost && liveCount === 0 && sels.some((s: any) => s.matches?.status !== "ended");

  const statusBadge =
    bet.status === "won" ? { label: "WON", cls: "bg-emerald-500/20 text-emerald-400 border-emerald-500/40" }
    : bet.status === "lost" ? { label: "LOST", cls: "bg-destructive/20 text-destructive border-destructive/40" }
    : bet.status === "cashed_out" ? { label: "CASHED OUT", cls: "bg-amber-500/20 text-amber-400 border-amber-500/40" }
    : { label: "OPEN", cls: "bg-primary/20 text-primary border-primary/40" };

  function copy(t: string) { navigator.clipboard.writeText(t); toast.success("Copied"); }

  async function cashout() {
    if (!user) return;
    // Compute partial cashout: stake + (winnings so far * factor 0.7)
    const wonOdds = sels.filter((s: any) => s.matches?.status === "ended" && s.result === "won").reduce((a: number, s: any) => a * Number(s.locked_odds), 1);
    const cashAmt = Math.max(Math.round(bet.stake * 0.85), Math.round(bet.stake * wonOdds * 0.7));
    if (!confirm(`Cash out for ${cashAmt} tokens? Your bet will be closed.`)) return;
    setCashing(true);
    const { data: prof } = await supabase.from("profiles").select("token_balance").eq("id", user.id).single();
    if (prof) await supabase.from("profiles").update({ token_balance: (prof.token_balance ?? 0) + cashAmt }).eq("id", user.id);
    await supabase.from("bets").update({ status: "cashed_out" as any, cashout_amount: cashAmt, cashed_out_at: new Date().toISOString(), settled_at: new Date().toISOString() }).eq("id", bet.id);
    await supabase.from("notifications").insert({ user_id: user.id, title: "Bet cashed out", body: `+${cashAmt} tokens credited.`, link: `/ticket/${bet.id}` });
    setCashing(false); toast.success("Cashed out"); refresh(); reload();
  }

  return (
    <Layout>
      <div className="container py-10 max-w-2xl">
        <Link to="/dashboard" className="text-muted-foreground text-sm flex items-center gap-1 hover:text-primary mb-3"><ArrowLeft className="h-4 w-4" />My bets</Link>

        <Card className="glass-strong p-0 overflow-hidden border-primary/40 relative">
          {/* Branded header */}
          <div className="bg-gradient-emerald p-4 text-primary-foreground">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Crosshair className="h-6 w-6" />
                <div>
                  <div className="text-[10px] tracking-widest opacity-80">LOMITA SHOOTERS LEAGUE</div>
                  <div className="font-extrabold text-lg tracking-wider">BET TICKET</div>
                </div>
              </div>
              <Badge className={`text-sm font-bold px-3 py-1 border ${statusBadge.cls}`}>{statusBadge.label}</Badge>
            </div>
          </div>

          {/* Codes */}
          <div className="p-5 grid grid-cols-2 gap-3 border-b border-dashed border-border">
            <div>
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Booking code</div>
              <button onClick={() => copy(bet.booking_code)} className="font-mono font-bold text-lg flex items-center gap-1 hover:text-primary">{bet.booking_code} <Copy className="h-3 w-3" /></button>
            </div>
            <div className="text-right">
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Tracking ID</div>
              <button onClick={() => copy(bet.tracking_id)} className="font-mono font-bold flex items-center gap-1 ml-auto hover:text-primary">{bet.tracking_id} <Copy className="h-3 w-3" /></button>
            </div>
          </div>

          {/* Selections */}
          <div className="p-5 space-y-3">
            <div className="text-xs uppercase tracking-widest text-muted-foreground">Selections ({sels.length})</div>
            {sels.map((s: any) => {
              const m = s.matches;
              const live = m?.status === "live";
              const ended = m?.status === "ended";
              const sBadge = s.result === "won" ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40"
                : s.result === "lost" ? "bg-destructive/20 text-destructive border-destructive/40"
                : live ? "bg-amber-500/20 text-amber-400 border-amber-500/40"
                : "bg-muted text-muted-foreground border-border";
              const sLabel = s.result ? s.result.toUpperCase() : live ? "LIVE" : ended ? "—" : "PENDING";
              return (
                <div key={s.id} className="rounded-lg border border-border bg-card/50 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-xs text-muted-foreground">{s.markets?.name}</div>
                    <Badge variant="outline" className={`text-[10px] ${sBadge}`}>{sLabel}</Badge>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    {m?.home_team?.logo_url && <img src={m.home_team.logo_url} className="h-5 w-5 rounded-full object-cover" alt="" />}
                    <div className="font-bold text-sm flex-1 truncate">{m?.home_team?.name} vs {m?.away_team?.name}</div>
                    {m?.away_team?.logo_url && <img src={m.away_team.logo_url} className="h-5 w-5 rounded-full object-cover" alt="" />}
                  </div>
                  <div className="flex items-center justify-between mt-2 text-sm">
                    <div>
                      <div className="text-[10px] text-muted-foreground">Pick</div>
                      <div className="font-bold">{s.selection_label}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-[10px] text-muted-foreground">{ended ? "Final" : live ? "Live" : "Score"}</div>
                      <div className={`font-mono font-bold ${live ? "text-amber-400 animate-pulse" : ""}`}>{m ? `${m.home_score}–${m.away_score}` : "—"}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] text-muted-foreground">Odds</div>
                      <div className="font-mono font-bold text-primary">{Number(s.locked_odds).toFixed(2)}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Totals */}
          <div className="p-5 border-t border-dashed border-border grid grid-cols-3 gap-3 text-center">
            <div><div className="text-[10px] uppercase tracking-widest text-muted-foreground">Stake</div><div className="font-bold text-lg">{bet.stake.toLocaleString()}</div></div>
            <div><div className="text-[10px] uppercase tracking-widest text-muted-foreground">Total Odds</div><div className="font-bold text-lg gradient-gold-text">{Number(bet.total_odds).toFixed(2)}</div></div>
            <div><div className="text-[10px] uppercase tracking-widest text-muted-foreground">{bet.status === "cashed_out" ? "Cashed out" : "Potential payout"}</div><div className="font-bold text-lg text-accent">{(bet.cashout_amount ?? bet.potential_payout).toLocaleString()}</div></div>
          </div>

          <div className="px-5 pb-5 flex justify-between items-center text-[10px] text-muted-foreground">
            <span>Booked {new Date(bet.created_at).toLocaleString()}</span>
            {bet.settled_at && <span>Settled {new Date(bet.settled_at).toLocaleString()}</span>}
          </div>

          {canCashout && (
            <div className="p-5 border-t border-border">
              <Button className="w-full btn-luxury" disabled={cashing} onClick={cashout}>
                <DollarSign className="h-4 w-4 mr-1" />{cashing ? "Processing…" : "Cash Out"}
              </Button>
            </div>
          )}

          {bet.status === "won" && allWon && allEnded && (
            <div className="p-5 border-t border-border bg-emerald-500/10 text-emerald-400 text-center font-bold flex items-center justify-center gap-2"><Check className="h-5 w-5" />Tokens credited to your wallet</div>
          )}
          {bet.status === "lost" && (
            <div className="p-5 border-t border-border bg-destructive/10 text-destructive text-center font-bold flex items-center justify-center gap-2"><X className="h-5 w-5" />Better luck next round</div>
          )}
        </Card>
      </div>
    </Layout>
  );
}
