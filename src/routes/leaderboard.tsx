import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, Coins, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/leaderboard")({
  head: () => ({ meta: [{ title: "Leaderboard — LSL" }, { name: "description", content: "Top shooters and gangs in the Lomita Shooters League." }] }),
  component: Page,
});

function Page() {
  const [users, setUsers] = useState<any[]>([]);
  const [gangs, setGangs] = useState<any[]>([]);

  useEffect(() => {
    supabase.from("profiles")
      .select("id,full_name,gang_name,gang_type,token_balance,avatar_url")
      .order("token_balance", { ascending: false })
      .limit(50)
      .then(({ data }) => setUsers(data ?? []));
    supabase.from("profiles")
      .select("gang_name,gang_type,token_balance")
      .not("gang_name", "is", null)
      .then(({ data }) => {
        const map = new Map<string, { name: string; type: string | null; total: number; members: number }>();
        (data ?? []).forEach((p: any) => {
          if (!p.gang_name) return;
          const k = p.gang_name;
          const cur = map.get(k) ?? { name: k, type: p.gang_type, total: 0, members: 0 };
          cur.total += p.token_balance ?? 0; cur.members += 1;
          map.set(k, cur);
        });
        setGangs(Array.from(map.values()).sort((a, b) => b.total - a.total).slice(0, 30));
      });
  }, []);

  return (
    <Layout>
      <div className="container py-10">
        <div className="flex items-center gap-2 mb-6">
          <Trophy className="h-7 w-7 text-primary" />
          <h1 className="text-3xl font-bold gradient-gold-text">Leaderboard</h1>
        </div>
        <Tabs defaultValue="shooters">
          <TabsList>
            <TabsTrigger value="shooters">Top Shooters</TabsTrigger>
            <TabsTrigger value="gangs">Top Gangs</TabsTrigger>
          </TabsList>
          <TabsContent value="shooters" className="mt-4 space-y-2">
            {users.length === 0 && <p className="text-muted-foreground text-sm">No shooters yet.</p>}
            {users.map((u, i) => (
              <Card key={u.id} className="glass p-3 flex items-center gap-3">
                <div className="text-2xl font-bold gradient-gold-text w-10 text-center">{i + 1}</div>
                <div className="h-10 w-10 rounded-full bg-gradient-gold grid place-items-center text-primary-foreground font-bold text-xs">
                  {(u.full_name ?? "?").slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-bold truncate">{u.full_name}</div>
                  <div className="text-xs text-muted-foreground truncate">{u.gang_name ?? "Independent"}{u.gang_type && ` · ${u.gang_type}`}</div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-primary flex items-center gap-1"><Coins className="h-3 w-3" />{u.token_balance.toLocaleString()}</div>
                </div>
              </Card>
            ))}
          </TabsContent>
          <TabsContent value="gangs" className="mt-4 space-y-2">
            {gangs.length === 0 && <p className="text-muted-foreground text-sm">No gangs yet.</p>}
            {gangs.map((g, i) => (
              <Card key={g.name} className="glass p-3 flex items-center gap-3">
                <div className="text-2xl font-bold gradient-gold-text w-10 text-center">{i + 1}</div>
                <div className="min-w-0 flex-1">
                  <div className="font-bold truncate">{g.name}</div>
                  <div className="text-xs text-muted-foreground">{g.members} members{g.type && ` · ${g.type}`}</div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-accent flex items-center gap-1"><TrendingUp className="h-3 w-3" />{g.total.toLocaleString()}</div>
                  <Badge variant="outline" className="text-[10px]">total tokens</Badge>
                </div>
              </Card>
            ))}
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
