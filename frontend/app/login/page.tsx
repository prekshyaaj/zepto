"use client";

import { ArrowRight, Heart, Mail, Phone, Search, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/logo";
import { PageShell } from "@/components/page-shell";
import { Button } from "@/components/ui/button";
import { login } from "@/lib/api";
import { useUser } from "@/lib/store";
import { ui } from "@/lib/tokens";
import { cn } from "@/lib/utils";

export default function LoginPage() {
  const router = useRouter();
  const { setCurrentUser } = useUser();
  const [identifier, setIdentifier] = useState("");
  const [mode, setMode] = useState<"phone" | "email">("phone");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submitLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const session = await login(identifier);
      setCurrentUser({
        userId: session.userId,
        profile: session.user,
      });
      router.push("/profile");
    } catch {
      setError("No matching Supabase user was found.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageShell className="space-y-6">
      <header className="flex items-center justify-end gap-3">
        <Link href="/wishlist" className={cn(ui.pill, "grid h-11 w-11 place-items-center")} aria-label="Open wishlist">
          <Heart className="h-5 w-5 text-coral" />
        </Link>
        <Link href="/search" className={cn(ui.pill, "grid h-11 w-11 place-items-center")} aria-label="Search groceries">
          <Search className="h-5 w-5 text-primary" />
        </Link>
      </header>
      <section className="rounded-md bg-primary p-5 text-surface shadow-floating">
        <Logo className="h-16 w-16" />
        <h1 className="mt-5 text-2xl font-extrabold">Login to Zepto</h1>
        <p className="mt-2 text-sm font-semibold text-surface/75">Track orders, buy again faster and unlock smarter recommendations.</p>
      </section>
      <form onSubmit={submitLogin} className={cn(ui.card, "space-y-4 p-4")}>
        <label className="block">
          <span className="text-xs font-extrabold text-muted">{mode === "phone" ? "Mobile number" : "Email"}</span>
          <div className={cn(ui.input, "mt-2 flex h-14 items-center gap-3 px-4")}>
            {mode === "phone" ? <Phone className="h-5 w-5 text-primary" /> : <Mail className="h-5 w-5 text-primary" />}
            {mode === "phone" ? <span className="text-base font-extrabold">+91</span> : null}
            <input value={identifier} onChange={(event) => setIdentifier(event.target.value)} className="min-w-0 flex-1 bg-transparent font-semibold outline-none" placeholder={mode === "phone" ? "Enter phone number" : "Enter email"} />
          </div>
        </label>
        {error ? <p className="text-sm font-bold text-coral">{error}</p> : null}
        <Button type="submit" disabled={loading} className="w-full">
          {loading ? "Connecting..." : "Continue"} <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
        <button type="button" onClick={() => { setMode(mode === "phone" ? "email" : "phone"); setIdentifier(""); setError(""); }} className={cn(ui.pill, "flex h-12 w-full items-center justify-center gap-2 text-sm font-extrabold")}>
          <Mail className="h-4 w-4 text-primary" />
          {mode === "phone" ? "Continue with email" : "Continue with phone"}
        </button>
        <Link href="/signup" className={cn(ui.pill, "flex h-12 w-full items-center justify-center text-sm font-extrabold")}>
          Create a new account
        </Link>
      </form>
      <section className="flex items-start gap-3 rounded-md bg-primary-light p-4 text-sm font-semibold text-primary">
        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" />
        Your account is protected with one-time password verification.
      </section>
    </PageShell>
  );
}
