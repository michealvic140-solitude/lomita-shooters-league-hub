import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Shield, Users, Trophy, Coins, Megaphone, Settings as SettingsIcon, Ticket, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, ROLE_LABELS, type AppRole } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { fetchTeams } from "@/lib/queries";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin — LSL" }, { name: "description", content: "League administration dashboard." }] }),
  component: AdminPage,
});

function AdminPage() {
  const { isAdmin, loading } = useAuth();
  const nav = useNavigate();
  useEffect(() => { if (!loading && !isAdmin) nav({ to: "/" }); }, [isAdmin, loading, nav]);
  if (loading) return <Layout><div className="container py-10">Loading…</div></Layout>;
  if (!isAdmin) return null;

  return (
    <Layout>
      <div className="container py-10 space-y-6">
        <div className="flex items-center gap-2">
          <Shield className="h-6 w-6 text-accent" />
          <h1 className="text-3xl font-bold gradient-emerald-text">Admin Console</h1>
          <Badge variant="outline" className="border-accent/40 text-accent">Restricted</Badge>
        </div>

        <Stats />
        <Tabs defaultValue="users">
          <TabsList className="flex flex-wrap h-auto">
            <TabsTrigger value="users"><Users className="h-3 w-3 mr-1" />Users</TabsTrigger>
            <TabsTrigger value="matches"><Trophy className="h-3 w-3 mr-1" />Matches</TabsTrigger>
            <TabsTrigger value="tokens"><Coins className="h-3 w-3 mr-1" />Tokens</TabsTrigger>
            <TabsTrigger value="tickets"><Ticket className="h-3 w-3 mr-1" />Tickets</TabsTrigger>
            <TabsTrigger value="content"><Megaphone className="h-3 w-3 mr-1" />Content</TabsTrigger>
            <TabsTrigger value="settings"><SettingsIcon className="h-3 w-3 mr-1" />Settings</TabsTrigger>
          </TabsList>
          <TabsContent value="users" className="mt-4"><UsersPanel /></TabsContent>
          <TabsContent value="matches" className="mt-4"><MatchesPanel /></TabsContent>
          <TabsContent value="tokens" className="mt-4"><TokensPanel /></TabsContent>
          <TabsContent value="tickets" className="mt-4"><TicketsPanel /></TabsContent>
          <TabsContent value="content" className="mt-4"><ContentPanel /></TabsContent>
          <TabsContent value="settings" className="mt-4"><SettingsPanel /></TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}

function Stats() {
  const [s, setS] = useState({ users: 0, matches: 0, pending: 0, tokens: 0 });
  useEffect(() => {
    Promise.all([
      supabase.from("profiles").select("id", { count: "exact", head: true }),
      supabase.from("matches").select("id", { count: "exact", head: true }).neq("status", "ended"),
      supabase.from("token_requests").select("id", { count: "exact", head: true }).eq("status", "pending"),
      supabase.from("profiles").select("token_balance"),
    ]).then(([u, m, p, t]) => setS({
      users: u.count ?? 0, matches: m.count ?? 0, pending: p.count ?? 0,
      tokens: (t.data ?? []).reduce((acc: number, x: any) => acc + (x.token_balance ?? 0), 0),
    }));
  }, []);
  const items = [
    { icon: Users, label: "Users", value: s.users.toString() },
    { icon: Trophy, label: "Open matches", value: s.matches.toString() },
    { icon: AlertTriangle, label: "Pending requests", value: s.pending.toString() },
    { icon: Coins, label: "Tokens in circulation", value: s.tokens.toLocaleString() },
  ];
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {items.map((x) => (
        <Card key={x.label} className="glass p-4">
          <x.icon className="h-5 w-5 text-primary mb-2" />
          <div className="text-2xl font-bold gradient-gold-text">{x.value}</div>
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{x.label}</div>
        </Card>
      ))}
    </div>
  );
}

function UsersPanel() {
  const [users, setUsers] = useState<any[]>([]);
  const [rolesByUser, setRolesByUser] = useState<Record<string, string[]>>({});
  const [q, setQ] = useState("");

  async function load() {
    const { data: u } = await supabase.from("profiles").select("*").order("created_at", { ascending: false }).limit(100);
    setUsers(u ?? []);
    const { data: r } = await supabase.from("user_roles").select("user_id,role").in("user_id", (u ?? []).map((x: any) => x.id));
    const m: Record<string, string[]> = {};
    (r ?? []).forEach((x: any) => { (m[x.user_id] ??= []).push(x.role); });
    setRolesByUser(m);
  }
  useEffect(() => { load(); }, []);

  async function setBalance(id: string, balance: number) {
    const { error } = await supabase.from("profiles").update({ token_balance: balance }).eq("id", id);
    if (error) toast.error(error.message); else { toast.success("Updated"); load(); }
  }
  async function toggle(id: string, field: "is_banned" | "is_muted" | "is_restricted", val: boolean) {
    const patch: any = { [field]: val };
    const { error } = await supabase.from("profiles").update(patch).eq("id", id);
    if (error) toast.error(error.message); else load();
  }
  async function addRole(id: string, role: AppRole) {
    const { error } = await supabase.from("user_roles").insert({ user_id: id, role });
    if (error) toast.error(error.message); else load();
  }
  async function removeRole(id: string, role: string) {
    const { error } = await supabase.from("user_roles").delete().eq("user_id", id).eq("role", role as AppRole);
    if (error) toast.error(error.message); else load();
  }

  const filtered = users.filter((u) => !q || u.full_name?.toLowerCase().includes(q.toLowerCase()) || u.email?.toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="space-y-3">
      <Input placeholder="Search by name or email…" value={q} onChange={(e) => setQ(e.target.value)} />
      {filtered.map((u) => (
        <Card key={u.id} className="glass p-4">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div className="min-w-0">
              <div className="font-bold">{u.full_name}</div>
              <div className="text-xs text-muted-foreground">{u.email}</div>
              <div className="text-xs text-muted-foreground">{u.gang_name ?? "Independent"}{u.gang_type && ` · ${u.gang_type}`}</div>
              <div className="flex flex-wrap gap-1 mt-2">
                {(rolesByUser[u.id] ?? []).map((r) => (
                  <Badge key={r} variant="outline" className="text-[10px]">{ROLE_LABELS[r as AppRole]} <button onClick={() => removeRole(u.id, r)} className="ml-1 text-destructive">×</button></Badge>
                ))}
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Tokens</span>
                <Input className="w-28" defaultValue={u.token_balance} onBlur={(e) => Number(e.target.value) !== u.token_balance && setBalance(u.id, Number(e.target.value))} />
              </div>
              <div className="flex flex-wrap gap-1">
                <Select onValueChange={(v) => addRole(u.id, v as AppRole)}>
                  <SelectTrigger className="w-32 h-8 text-xs"><SelectValue placeholder="+ role" /></SelectTrigger>
                  <SelectContent>{(["viewer","shooter","gang_leader","registered","moderator","admin"] as AppRole[]).map((r) => <SelectItem key={r} value={r}>{ROLE_LABELS[r]}</SelectItem>)}</SelectContent>
                </Select>
                <Button size="sm" variant={u.is_muted ? "destructive" : "outline"} onClick={() => toggle(u.id, "is_muted", !u.is_muted)}>{u.is_muted ? "Unmute" : "Mute"}</Button>
                <Button size="sm" variant={u.is_banned ? "destructive" : "outline"} onClick={() => toggle(u.id, "is_banned", !u.is_banned)}>{u.is_banned ? "Unban" : "Ban"}</Button>
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

function MatchesPanel() {
  const [matches, setMatches] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [draft, setDraft] = useState({ name: "", home_team_id: "", away_team_id: "", start_time: "", location: "" });

  async function load() {
    const { data } = await supabase.from("matches").select("*, home_team:home_team_id(name), away_team:away_team_id(name)").order("start_time", { ascending: false });
    setMatches(data ?? []);
    setTeams(await fetchTeams());
  }
  useEffect(() => { load(); }, []);

  async function create() {
    if (!draft.name || !draft.home_team_id || !draft.away_team_id || !draft.start_time) { toast.error("Fill all fields"); return; }
    const { data, error } = await supabase.from("matches").insert({ ...draft, status: "scheduled" }).select().single();
    if (error) { toast.error(error.message); return; }
    const { data: market } = await supabase.from("markets").insert({ match_id: data.id, name: "Match Winner" }).select().single();
    if (market) {
      const home = teams.find((t) => t.id === draft.home_team_id)?.name ?? "Home";
      const away = teams.find((t) => t.id === draft.away_team_id)?.name ?? "Away";
      await supabase.from("odds").insert([
        { market_id: market.id, label: home, value: 2.0 },
        { market_id: market.id, label: "Draw", value: 3.5 },
        { market_id: market.id, label: away, value: 2.0 },
      ]);
    }
    toast.success("Match created"); setDraft({ name: "", home_team_id: "", away_team_id: "", start_time: "", location: "" }); load();
  }

  async function setStatus(id: string, status: string) {
    const { error } = await supabase.from("matches").update({ status: status as any }).eq("id", id);
    if (error) toast.error(error.message); else load();
  }
  async function settle(id: string) {
    const home = prompt("Home score?"); if (home === null) return;
    const away = prompt("Away score?"); if (away === null) return;
    await supabase.from("matches").update({ home_score: Number(home), away_score: Number(away), status: "ended" }).eq("id", id);
    await supabase.from("markets").update({ is_open: false }).eq("match_id", id);
    toast.success("Match settled"); load();
  }

  return (
    <div className="space-y-4">
      <Card className="glass-strong p-4">
        <div className="font-bold mb-3">Create match</div>
        <div className="grid md:grid-cols-2 gap-2">
          <Input placeholder="Name (e.g. Round 14 · Night Hunt)" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
          <Input type="datetime-local" value={draft.start_time} onChange={(e) => setDraft({ ...draft, start_time: e.target.value ? new Date(e.target.value).toISOString() : "" })} />
          <Select value={draft.home_team_id} onValueChange={(v) => setDraft({ ...draft, home_team_id: v })}>
            <SelectTrigger><SelectValue placeholder="Home team" /></SelectTrigger>
            <SelectContent>{teams.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={draft.away_team_id} onValueChange={(v) => setDraft({ ...draft, away_team_id: v })}>
            <SelectTrigger><SelectValue placeholder="Away team" /></SelectTrigger>
            <SelectContent>{teams.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent>
          </Select>
          <Input placeholder="Location" value={draft.location} onChange={(e) => setDraft({ ...draft, location: e.target.value })} />
        </div>
        <Button className="btn-luxury mt-3" onClick={create}>Create match + 1X2 market</Button>
      </Card>

      <div className="space-y-2">
        {matches.map((m: any) => (
          <Card key={m.id} className="glass p-3 flex items-center justify-between gap-3 flex-wrap">
            <div className="min-w-0">
              <div className="font-bold truncate">{m.home_team?.name} vs {m.away_team?.name}</div>
              <div className="text-xs text-muted-foreground">{m.name} · {new Date(m.start_time).toLocaleString()}</div>
            </div>
            <div className="flex gap-1 items-center">
              <Badge variant="outline" className="capitalize">{m.status}</Badge>
              {m.status === "scheduled" && <Button size="sm" onClick={() => setStatus(m.id, "live")}>Go live</Button>}
              {m.status === "live" && <Button size="sm" onClick={() => settle(m.id)}>Settle</Button>}
              {m.status !== "cancelled" && <Button size="sm" variant="outline" onClick={() => setStatus(m.id, "cancelled")}>Cancel</Button>}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function TokensPanel() {
  const [reqs, setReqs] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<Record<string, any>>({});

  async function load() {
    const { data } = await supabase.from("token_requests").select("*").order("created_at", { ascending: false }).limit(50);
    setReqs(data ?? []);
    const ids = Array.from(new Set((data ?? []).map((r: any) => r.user_id)));
    if (ids.length) {
      const { data: p } = await supabase.from("profiles").select("id,full_name,email,token_balance").in("id", ids);
      const m: Record<string, any> = {}; (p ?? []).forEach((x: any) => { m[x.id] = x; }); setProfiles(m);
    }
  }
  useEffect(() => { load(); }, []);

  async function approve(r: any) {
    const prof = profiles[r.user_id]; if (!prof) return;
    const newBal = (prof.token_balance ?? 0) + r.amount;
    const { error } = await supabase.from("profiles").update({ token_balance: newBal }).eq("id", r.user_id);
    if (error) { toast.error(error.message); return; }
    await supabase.from("token_requests").update({ status: "approved", reviewed_at: new Date().toISOString() }).eq("id", r.id);
    await supabase.from("notifications").insert({ user_id: r.user_id, title: "Tokens credited", body: `${r.amount} tokens added to your account.` });
    toast.success("Approved"); load();
  }
  async function reject(r: any) {
    await supabase.from("token_requests").update({ status: "denied", reviewed_at: new Date().toISOString() }).eq("id", r.id);
    await supabase.from("notifications").insert({ user_id: r.user_id, title: "Token request denied", body: `Your request for ${r.amount} tokens was denied.` });
    load();
  }

  return (
    <div className="space-y-2">
      {reqs.length === 0 && <p className="text-muted-foreground text-sm">No requests.</p>}
      {reqs.map((r) => (
        <Card key={r.id} className="glass p-3 flex items-center gap-3 flex-wrap">
          {r.proof_image_url && <a href={r.proof_image_url} target="_blank" rel="noreferrer"><img src={r.proof_image_url} alt="" className="h-14 w-14 object-cover rounded border border-border" /></a>}
          <div className="flex-1 min-w-0">
            <div className="font-bold">{r.amount} tokens · <span className="text-muted-foreground text-sm">{profiles[r.user_id]?.full_name ?? "Unknown"}</span></div>
            <div className="text-xs text-muted-foreground truncate">{r.note || "—"}</div>
          </div>
          <Badge variant="outline" className="capitalize">{r.status}</Badge>
          {r.status === "pending" && (
            <div className="flex gap-1">
              <Button size="sm" variant="outline" onClick={() => reject(r)}>Reject</Button>
              <Button size="sm" className="btn-luxury" onClick={() => approve(r)}>Approve</Button>
            </div>
          )}
        </Card>
      ))}
    </div>
  );
}

function TicketsPanel() {
  const [tickets, setTickets] = useState<any[]>([]);
  useEffect(() => {
    supabase.from("support_tickets").select("*, profiles:user_id(full_name,email)").order("created_at", { ascending: false }).limit(50)
      .then(({ data }) => setTickets(data ?? []));
  }, []);
  async function setStatus(id: string, status: string) {
    await supabase.from("support_tickets").update({ status: status as any }).eq("id", id);
    setTickets((t) => t.map((x) => x.id === id ? { ...x, status } : x));
  }
  return (
    <div className="space-y-2">
      {tickets.length === 0 && <p className="text-muted-foreground text-sm">No tickets.</p>}
      {tickets.map((t) => (
        <Card key={t.id} className="glass p-3 flex items-center gap-3 flex-wrap">
          <div className="flex-1 min-w-0">
            <div className="font-bold truncate">{t.subject}</div>
            <div className="text-xs text-muted-foreground">{t.profiles?.full_name} · {new Date(t.created_at).toLocaleString()}</div>
          </div>
          <Badge variant="outline" className="capitalize">{t.status}</Badge>
          <Select value={t.status} onValueChange={(v) => setStatus(t.id, v)}>
            <SelectTrigger className="w-32 h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>{["open","in_progress","resolved","closed"].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
          </Select>
          <Button size="sm" variant="outline" asChild><a href={`/ticket/${t.id}`}>Open</a></Button>
        </Card>
      ))}
    </div>
  );
}

function ContentPanel() {
  const [anns, setAnns] = useState<any[]>([]);
  const [draft, setDraft] = useState({ title: "", body: "" });
  async function load() { setAnns((await supabase.from("announcements").select("*").order("created_at", { ascending: false })).data ?? []); }
  useEffect(() => { load(); }, []);
  async function add() {
    if (!draft.title) return;
    const { error } = await supabase.from("announcements").insert(draft);
    if (error) toast.error(error.message); else { setDraft({ title: "", body: "" }); load(); }
  }
  async function toggle(id: string, val: boolean) {
    await supabase.from("announcements").update({ is_active: val }).eq("id", id); load();
  }
  return (
    <div className="space-y-3">
      <Card className="glass-strong p-4 space-y-2">
        <div className="font-bold">New announcement</div>
        <Input placeholder="Title" value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
        <Textarea placeholder="Body" value={draft.body} onChange={(e) => setDraft({ ...draft, body: e.target.value })} />
        <Button className="btn-luxury" onClick={add}>Publish</Button>
      </Card>
      {anns.map((a) => (
        <Card key={a.id} className="glass p-3 flex items-center justify-between gap-3">
          <div className="min-w-0"><div className="font-bold truncate">{a.title}</div><div className="text-xs text-muted-foreground truncate">{a.body}</div></div>
          <Button size="sm" variant="outline" onClick={() => toggle(a.id, !a.is_active)}>{a.is_active ? "Hide" : "Show"}</Button>
        </Card>
      ))}
    </div>
  );
}

function SettingsPanel() {
  const [s, setS] = useState<any>(null);
  useEffect(() => { supabase.from("app_settings").select("*").eq("id", 1).maybeSingle().then(({ data }) => setS(data ?? { id: 1 })); }, []);
  if (!s) return null;
  async function save() {
    const { error } = await supabase.from("app_settings").upsert(s);
    if (error) toast.error(error.message); else toast.success("Saved");
  }
  return (
    <Card className="glass-strong p-4 space-y-3 max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <div className="font-bold">Maintenance mode</div>
          <div className="text-xs text-muted-foreground">Blocks all non-admin pages.</div>
        </div>
        <Button variant={s.maintenance_mode ? "destructive" : "outline"} onClick={() => setS({ ...s, maintenance_mode: !s.maintenance_mode })}>
          {s.maintenance_mode ? "ON" : "OFF"}
        </Button>
      </div>
      <Textarea placeholder="Maintenance message" value={s.maintenance_message ?? ""} onChange={(e) => setS({ ...s, maintenance_message: e.target.value })} />
      <Input placeholder="Contact email" value={s.contact_email ?? ""} onChange={(e) => setS({ ...s, contact_email: e.target.value })} />
      <Input placeholder="Contact WhatsApp" value={s.contact_whatsapp ?? ""} onChange={(e) => setS({ ...s, contact_whatsapp: e.target.value })} />
      <Textarea placeholder="About us" rows={3} value={s.about_us ?? ""} onChange={(e) => setS({ ...s, about_us: e.target.value })} />
      <Textarea placeholder="Why trust us" rows={3} value={s.why_trust_us ?? ""} onChange={(e) => setS({ ...s, why_trust_us: e.target.value })} />
      <Textarea placeholder="Terms content" rows={4} value={s.terms_content ?? ""} onChange={(e) => setS({ ...s, terms_content: e.target.value })} />
      <Button className="btn-luxury" onClick={save}>Save settings</Button>
    </Card>
  );
}
