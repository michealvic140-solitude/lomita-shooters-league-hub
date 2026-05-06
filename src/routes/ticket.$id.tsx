import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/ticket/$id")({ component: TicketPage });

function TicketPage() {
  const { id } = Route.useParams();
  const [bet, setBet] = useState<any>(null);
  useEffect(() => {
    supabase.from("bets").select("*, bet_selections(*)").eq("id", id).maybeSingle()
      .then(({ data }) => setBet(data));
  }, [id]);
  if (!bet) return <Layout><div className="container mx-auto p-10">Loading…</div></Layout>;
  return (
    <Layout>
      <div className="container mx-auto px-4 py-10 max-w-2xl">
        <Card className="p-6 border-primary/40">
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
          <Badge variant="outline">{bet.status}</Badge>
          <h3 className="font-bold mt-6 mb-2">Selections</h3>
          <div className="space-y-2">
            {(bet.bet_selections ?? []).map((s: any) => (
              <div key={s.id} className="flex justify-between p-2 bg-muted/50 rounded text-sm">
                <span>{s.selection_label}</span><span className="text-primary font-bold">{s.locked_odds}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </Layout>
  );
}
