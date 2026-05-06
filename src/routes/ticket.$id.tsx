import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Sparkles, Send, ArrowLeft, Ticket as TicketIcon } from "lucide-react";
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
    // Either a support ticket or a bet ticket
    supabase.from("support_tickets").select("*").eq("id", id).maybeSingle().then(({ data }) => {
      if (data) setTicket(data);
    });
    supabase.from("bets").select("*, bet_selections(*)").eq("id", id).maybeSingle().then(({ data }) => {
      if (data) setBet(data);
    });
  }, [id]);

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

  if (bet && !ticket) return <BetTicket bet={bet} />;
  if (!ticket) return <Layout><div className="container py-10">Loading…</div></Layout>;

  async function send() {
    if (!text.trim() || !ticket || !user) return;
    const content = text.trim();
    setText("");
    const { error } = await supabase.from("ticket_messages").insert({ ticket_id: ticket.id, user_id: user.id, content });
    if (error) { toast.error(error.message); return; }

    // If user (not mod) replied, trigger AI follow-up
    if (!isMod) {
      try {
        const { data: ai } = await supabase.functions.invoke("ai-support", { body: { subject: ticket.subject, message: content } });
        if (ai?.reply) {
          await supabase.from("ticket_messages").insert({ ticket_id: ticket.id, user_id: user.id, content: ai.reply, is_ai: true });
        }
      } catch {/* ignore */}
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
                <div className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                  m.is_ai ? "bg-accent/20 border border-accent/40" :
                  m.user_id === user.id ? "bg-primary/20 border border-primary/40" :
                  "bg-secondary"
                }`}>
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

function BetTicket({ bet }: { bet: any }) {
  return (
    <Layout>
      <div className="container py-10 max-w-2xl">
        <Card className="glass-strong p-6 border-primary/40">
          <div className="flex justify-between mb-4">
            <div>
              <div className="text-xs text-muted-foreground">Tracking</div>
              <div className="font-mono font-bold text-primary">{bet.tracking_id}</div>
            </div>
            <div className="text-right">
              <div className="text-xs text-muted-foreground">Booking code</div>
              <div className="font-mono font-bold">{bet.booking_code}</div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 mb-4 text-center">
            <div><div className="text-xs text-muted-foreground">Stake</div><div className="font-bold">{bet.stake.toLocaleString()}</div></div>
            <div><div className="text-xs text-muted-foreground">Total odds</div><div className="font-bold text-primary">{bet.total_odds}</div></div>
            <div><div className="text-xs text-muted-foreground">Payout</div><div className="font-bold">{bet.potential_payout.toLocaleString()}</div></div>
          </div>
          <Badge variant="outline" className="capitalize">{bet.status}</Badge>
          <h3 className="font-bold mt-6 mb-2">Selections</h3>
          <div className="space-y-2">
            {(bet.bet_selections ?? []).map((s: any) => (
              <div key={s.id} className="flex justify-between p-2 bg-secondary/40 rounded text-sm">
                <span>{s.selection_label}</span><span className="text-primary font-bold">{s.locked_odds}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </Layout>
  );
}
