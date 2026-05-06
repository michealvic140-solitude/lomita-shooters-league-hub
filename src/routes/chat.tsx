import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageSquare, Send } from "lucide-react";

export const Route = createFileRoute("/chat")({
  head: () => ({ meta: [{ title: "Community Chat — LSL" }, { name: "description", content: "Chat with other shooters and gangs." }] }),
  component: ChatPage,
});

interface Msg { id: string; user: string; gang: string; text: string; time: string }

const seed: Msg[] = [
  { id: "1", user: "Halo", gang: "Golden Wolves", text: "Vipers looking shaky on Bay 3 tonight 👀", time: "21:04" },
  { id: "2", user: "Vex", gang: "Crimson Vipers", text: "Talk after Round 14, Wolf boy.", time: "21:05" },
  { id: "3", user: "Reap", gang: "Emerald Reapers", text: "Anyone got the over/under on headshots?", time: "21:07" },
  { id: "4", user: "Bone", gang: "Skull Syndicate", text: "Skulls running 3-1 streak. Keep up.", time: "21:09" },
];

function ChatPage() {
  const [msgs, setMsgs] = useState<Msg[]>(seed);
  const [text, setText] = useState("");
  const send = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    setMsgs((m) => [...m, { id: Date.now().toString(), user: "You", gang: "Guest", text, time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) }]);
    setText("");
  };
  return (
    <Layout>
      <div className="container py-10 max-w-3xl">
        <h1 className="text-3xl font-bold gradient-gold-text flex items-center gap-2"><MessageSquare className="h-6 w-6" />Community Chat</h1>
        <p className="text-muted-foreground text-sm mt-1">League-wide channel · be respectful, no real-money talk.</p>

        <Card className="glass-strong mt-6 flex flex-col h-[60vh]">
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {msgs.map((m) => (
              <div key={m.id} className="flex gap-3">
                <div className="h-9 w-9 rounded-full bg-gradient-gold grid place-items-center text-[var(--primary-foreground)] font-bold text-xs shrink-0">
                  {m.user.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className="text-xs">
                    <span className="font-bold text-gold">{m.user}</span>
                    <span className="text-muted-foreground ml-1">· {m.gang} · {m.time}</span>
                  </div>
                  <div className="text-sm">{m.text}</div>
                </div>
              </div>
            ))}
          </div>
          <form onSubmit={send} className="p-3 border-t border-[var(--glass-border)] flex gap-2">
            <Input value={text} onChange={(e) => setText(e.target.value)} placeholder="Say something…" />
            <Button type="submit" className="btn-luxury"><Send className="h-4 w-4" /></Button>
          </form>
        </Card>
      </div>
    </Layout>
  );
}
