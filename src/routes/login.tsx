import { createFileRoute, Link } from "@tanstack/react-router";
import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Crosshair } from "lucide-react";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Sign in — LSL" }, { name: "description", content: "Sign in to the Lomita Shooters League." }] }),
  component: LoginPage,
});

function LoginPage() {
  return (
    <Layout>
      <div className="container py-16 max-w-md">
        <Card className="glass-strong p-8">
          <div className="text-center mb-6">
            <Crosshair className="h-10 w-10 text-gold mx-auto" style={{ animation: "var(--animate-pulse-glow)" }} />
            <h1 className="text-2xl font-bold mt-3 gradient-gold-text">Welcome back, shooter</h1>
            <p className="text-xs text-muted-foreground mt-1">Sign in to claim your tokens.</p>
          </div>
          <form className="space-y-3" onSubmit={(e) => e.preventDefault()}>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="you@lsl.dev" />
            </div>
            <div>
              <Label htmlFor="pw">Password</Label>
              <Input id="pw" type="password" placeholder="••••••••" />
            </div>
            <Button className="w-full btn-luxury">Sign in</Button>
          </form>
          <div className="text-center text-xs text-muted-foreground mt-4">
            New here? <Link to="/register" className="text-gold hover:underline">Join the League</Link>
          </div>
        </Card>
      </div>
    </Layout>
  );
}
