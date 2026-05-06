import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/support")({ component: SupportPage });

function SupportPage() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<any[]>([]);
  const [subject, setSubject] = useState("");
  const load = async () => {
    if (!user) return;
    const { data } = await supabase.from("support_tickets").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
    setTickets(data ?? []);
  };
  useEffect(() => { load(); }, [user?.id]);
  if (!user) return <Layout><div className="container mx-auto p-10">Sign in</div></Layout>;
  const create = async () => {
    if (!subject.trim()) return;
    const { error } = await supabase.from("support_tickets").insert({ user_id: user.id, subject });
    if (error) return toast.error(error.message);
    setSubject(""); load(); toast.success("Ticket created");
  };
  return (
    <Layout>
      <div className="container mx-auto px-4 py-10 max-w-3xl">
        <h1 className="text-3xl font-bold text-primary mb-6">Support</h1>
        <Card className="p-4 mb-6 flex gap-2">
          <Input placeholder="Subject" value={subject} onChange={(e) => setSubject(e.target.value)} />
          <Button onClick={create}>Create ticket</Button>
        </Card>
        <div className="space-y-2">
          {tickets.map((t) => (
            <Card key={t.id} className="p-4 flex justify-between">
              <div><div className="font-bold">{t.subject}</div><div className="text-xs text-muted-foreground">{new Date(t.created_at).toLocaleString()}</div></div>
              <span className="text-xs uppercase">{t.status}</span>
            </Card>
          ))}
        </div>
      </div>
    </Layout>
  );
}
