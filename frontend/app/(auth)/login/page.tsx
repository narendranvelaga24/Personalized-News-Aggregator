"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { Zap, Loader2 } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { login, isAuthed } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAuthed) router.replace("/for-you");
  }, [isAuthed, router]);

  if (isAuthed) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      router.replace("/for-you");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen editorial-stage flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex items-center gap-2 justify-center mb-8">
          <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center">
            <Zap className="w-6 h-6 text-white" />
          </div>
          <span className="font-display text-2xl text-black">NewsFlow</span>
        </div>

        <div className="glass rounded-3xl border border-black/12 bg-white/85 p-8 space-y-6">
          <div>
            <h1 className="font-display text-3xl text-black">Welcome back</h1>
            <p className="text-sm text-black/60 mt-1">Sign in to your personalized feed</p>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg px-4 py-3 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-black/55 mb-1.5">Email</label>
              <input
                type="email"
                className="w-full rounded-2xl border border-black/20 bg-white px-3 py-2.5 text-sm text-black placeholder:text-black/45 focus:outline-none focus:ring-2 focus:ring-black/20"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-black/55 mb-1.5">Password</label>
              <input
                type="password"
                className="w-full rounded-2xl border border-black/20 bg-white px-3 py-2.5 text-sm text-black placeholder:text-black/45 focus:outline-none focus:ring-2 focus:ring-black/20"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>
            <button type="submit" className="btn-primary w-full flex items-center justify-center gap-2" disabled={loading}>
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Sign in
            </button>
          </form>

          <p className="text-sm text-center text-black/60">
            No account?{" "}
            <Link href="/register" className="text-black hover:text-black/70 font-medium underline-offset-2 hover:underline">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
