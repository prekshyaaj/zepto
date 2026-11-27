"use client";

import { ArrowRight, Heart, Lock, Mail, Phone, Search, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/logo";
import { PageShell } from "@/components/page-shell";
import { Button } from "@/components/ui/button";
import { signup } from "@/lib/api";
import { useUser } from "@/lib/store";
import { ui } from "@/lib/tokens";
import { cn } from "@/lib/utils";

export default function SignupPage() {
  const router = useRouter();
  const { setCurrentUser } = useUser();
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submitSignup = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const session = await signup({ email, phone, password });
      setCurrentUser({
        userId: session.userId,
        profile: session.user,
      });
      router.push("/profile");
    } catch (signupError) {
      const message = signupError instanceof Error ? signupError.message : "";
      setError(message.includes("already registered") ? "This account already exists." : "Could not create your account.");
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
        <h1 className="mt-5 text-2xl font-extrabold">Create your Zepto account</h1>
        <p className="mt-2 text-sm font-semibold text-surface/75">Save your details, track orders and get recommendations from your own history.</p>
      </section>
      <form onSubmit={submitSignup} className={cn(ui.card, "space-y-4 p-4")}>
        <label className="block">
          <span className="text-xs font-extrabold text-muted">Email</span>
          <div className={cn(ui.input, "mt-2 flex h-14 items-center gap-3 px-4")}>
            <Mail className="h-5 w-5 text-primary" />
            <input
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="min-w-0 flex-1 bg-transparent font-semibold outline-none"
              placeholder="Enter email"
              type="email"
              required
            />
          </div>
        </label>
        <label className="block">
          <span className="text-xs font-extrabold text-muted">Mobile number</span>
          <div className={cn(ui.input, "mt-2 flex h-14 items-center gap-3 px-4")}>
            <Phone className="h-5 w-5 text-primary" />
            <span className="text-base font-extrabold">+91</span>
            <input
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              className="min-w-0 flex-1 bg-transparent font-semibold outline-none"
              placeholder="Enter phone number"
              inputMode="numeric"
            />
          </div>
        </label>
        <label className="block">
          <span className="text-xs font-extrabold text-muted">Password</span>
          <div className={cn(ui.input, "mt-2 flex h-14 items-center gap-3 px-4")}>
            <Lock className="h-5 w-5 text-primary" />
            <input
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="min-w-0 flex-1 bg-transparent font-semibold outline-none"
              placeholder="Create password"
              type="password"
              minLength={6}
              required
            />
          </div>
        </label>
        <label className="block">
          <span className="text-xs font-extrabold text-muted">Confirm password</span>
          <div className={cn(ui.input, "mt-2 flex h-14 items-center gap-3 px-4")}>
            <Lock className="h-5 w-5 text-primary" />
            <input
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              className="min-w-0 flex-1 bg-transparent font-semibold outline-none"
              placeholder="Confirm password"
              type="password"
              minLength={6}
              required
            />
          </div>
        </label>
        {error ? <p className="text-sm font-bold text-coral">{error}</p> : null}
        <Button type="submit" disabled={loading} className="w-full">
          {loading ? "Creating account..." : "Sign up"} <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
        <Link href="/login" className={cn(ui.pill, "flex h-12 w-full items-center justify-center text-sm font-extrabold")}>
          Already have an account? Login
        </Link>
      </form>
      <section className="flex items-start gap-3 rounded-md bg-primary-light p-4 text-sm font-semibold text-primary">
        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" />
        Your account is created in Supabase using the existing users_final table.
      </section>
    </PageShell>
  );
}
