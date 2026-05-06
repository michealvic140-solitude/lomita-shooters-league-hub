import { createFileRoute } from "@tanstack/react-router";
import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Shield, Users, Trophy, AlertTriangle } from "lucide-react";
import { matches, shooters } from "@/lib/mock-data";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin — LSL" }, { name: "description", content: "League administration dashboard." }] }),
  component: AdminPage,
});

function AdminPage() {
  return (
    <Layout>
      <div className="container py-10">
        <div className="flex items-center gap-2">
          <Shield className="h-6 w-6 text-emerald" />
          <h1 className="text-3xl font-bold gradient-emerald-text">Admin Console</h1>
          <Badge variant="outline" className="border-[var(--emerald)]/40 text-emerald">Restricted</Badge>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          {[
            { icon: Users, label: "Active users (24h)", value: "287" },
            { icon: Trophy, label: "Open matches", value: matches.filter((m) => m.status !== "ended").length.toString() },
            { icon: AlertTriangle, label: "Flagged wagers", value: "3" },
            { icon: Shield, label: "Pending verifications", value: "12" },
          ].map((s) => (
            <Card key={s.label} className="glass p-4">
              <s.icon className="h-5 w-5 text-gold mb-2" />
              <div className="text-2xl font-bold gradient-gold-text">{s.value}</div>
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{s.label}</div>
            </Card>
          ))}
        </div>

        <div className="grid md:grid-cols-2 gap-6 mt-6">
          <Card className="glass p-5">
            <h2 className="font-bold mb-3">Match Control</h2>
            <div className="space-y-2">
              {matches.map((m) => (
                <div key={m.id} className="flex items-center justify-between text-sm border border-[var(--glass-border)] rounded-md px-3 py-2">
                  <div className="min-w-0">
                    <div className="font-bold truncate">{m.home.tag} vs {m.away.tag}</div>
                    <div className="text-[10px] text-muted-foreground">{m.name}</div>
                  </div>
                  <Badge className={
                    m.status === "live" ? "bg-destructive" :
                    m.status === "ended" ? "bg-secondary text-foreground" :
                    "bg-emerald text-[var(--primary-foreground)]"
                  }>{m.status}</Badge>
                </div>
              ))}
            </div>
          </Card>

          <Card className="glass p-5">
            <h2 className="font-bold mb-3">Pending Verifications</h2>
            <div className="space-y-2">
              {shooters.slice(0, 5).map((s) => (
                <div key={s.id} className="flex items-center justify-between text-sm border border-[var(--glass-border)] rounded-md px-3 py-2">
                  <div>
                    <div className="font-bold">{s.alias}</div>
                    <div className="text-[10px] text-muted-foreground">{s.gang}</div>
                  </div>
                  <div className="flex gap-1">
                    <Button size="sm" variant="outline" className="border-destructive/40 text-destructive">Reject</Button>
                    <Button size="sm" className="btn-luxury">Approve</Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
