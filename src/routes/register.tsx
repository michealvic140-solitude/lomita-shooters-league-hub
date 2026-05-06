import { createFileRoute, Link } from "@tanstack/react-router";
import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Crosshair } from "lucide-react";
import { gangs } from "@/lib/mock-data";

export const Route = createFileRoute("/register")({
  head: () => ({ meta: [{ title: "Join the League — LSL" }, { name: "description", content: "Create your Lomita Shooters League account." }] }),
  component: RegisterPage,
});

function RegisterPage() {
  return (
    <Layout>
      <div className="container py-16 max-w-md">
        <Card className="glass-strong p-8">
          <div className="text-center mb-6">
            <Crosshair className="h-10 w-10 text-gold mx-auto" style={{ animation: "var(--animate-pulse-glow)" }} />
            <h1 className="text-2xl font-bold mt-3 gradient-gold-text">Join the League</h1>
            <p className="text-xs text-muted-foreground mt-1">Get 1,000 starter tokens on signup.</p>
          </div>
          <form className="space-y-3" onSubmit={(e) => e.preventDefault()}>
            <div>
              <Label htmlFor="name">Full name</Label>
              <Input id="name" placeholder="Marco Reyes" />
            </div>
            <div>
              <Label htmlFor="alias">Alias</Label>
              <Input id="alias" placeholder="Halo" />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="you@lsl.dev" />
            </div>
            <div>
              <Label htmlFor="gang">Gang</Label>
              <select id="gang" className="w-full h-9 rounded-md bg-input border border-[var(--glass-border)] px-3 text-sm">
                <option value="">— Choose your gang —</option>
                {gangs.map((g) => <option key={g.id} value={g.name}>{g.name}</option>)}
              </select>
            </div>
            <div>
              <Label htmlFor="pw">Password</Label>
              <Input id="pw" type="password" placeholder="••••••••" />
            </div>
            <Button className="w-full btn-luxury">Create account</Button>
          </form>
          <div className="text-center text-xs text-muted-foreground mt-4">
            Already a member? <Link to="/login" className="text-gold hover:underline">Sign in</Link>
          </div>
        </Card>
      </div>
    </Layout>
  );
}
