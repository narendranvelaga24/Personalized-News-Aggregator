import Link from "next/link";
import { Sparkles, Newspaper, ShieldCheck, Orbit, WandSparkles, ArrowUpRight } from "lucide-react";

export default function Home() {
  return (
    <div className="relative overflow-hidden min-h-screen editorial-stage scene-3d">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 hero-grid opacity-40" />
        <div className="depth-plane">
          <div className="spell-orb spell-orb-1 absolute" />
          <div className="spell-orb spell-orb-2 absolute" />
          <div className="spell-orb spell-orb-3 absolute" />
          <div className="floating-rune rune-a" />
          <div className="floating-rune rune-b" />
          <div className="floating-rune rune-c" />
        </div>
      </div>

      <main className="relative mx-auto w-full max-w-6xl px-5 py-14 sm:px-8 md:py-20">
        <section className="float-in paper-panel deco-border p-6 sm:p-10 md:p-14">
          <div className="mb-8 flex flex-col items-start justify-between gap-5 md:flex-row md:items-center">
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.28em] text-black/60">
              <WandSparkles className="h-4 w-4" />
              <span>NewsFlow Atelier</span>
            </div>
            <span className="rounded-full border border-black/20 bg-white/70 px-3 py-1.5 text-xs uppercase tracking-[0.14em] text-black/60">
              Ivory edition
            </span>
          </div>

          <h1 className="font-display max-w-5xl text-5xl leading-[1.06] text-black sm:text-6xl md:text-7xl">
            Editorial-grade news,
            <span className="gradient-text"> tuned to your pattern of thought.</span>
          </h1>

          <p className="stagger stagger-1 mt-8 max-w-2xl text-base leading-relaxed text-black/70 sm:text-lg">
            A minimal yet premium reading surface that learns your preferences, curates from diverse sources, and keeps every session elegantly focused.
          </p>

          <div className="stagger stagger-2 mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link
              href="/register"
              className="btn-primary spell-cta rounded-full px-8 py-3 text-sm font-semibold uppercase tracking-[0.14em]"
            >
              Enter NewsFlow
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center justify-center rounded-full border border-black/25 px-8 py-3 text-sm font-semibold uppercase tracking-[0.14em] text-black transition-colors hover:bg-black hover:text-white"
            >
              Sign in
            </Link>
            <Link
              href="/latest"
              className="inline-flex items-center justify-center rounded-full px-5 py-3 text-sm font-medium text-black/65 transition-colors hover:text-black"
            >
              Browse latest
            </Link>
          </div>

          <div className="stagger stagger-3 mt-14 grid grid-cols-1 gap-5 md:grid-cols-[1.18fr_1fr]">
            <article className="reveal tilt-card tilt-subtle relative overflow-hidden rounded-3xl border border-black/15 bg-black/5 p-6">
              <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1495020689067-958852a7765e?auto=format&fit=crop&w=1600&q=80')] bg-cover bg-center opacity-15" />
              <div className="relative">
                <Newspaper className="mb-3 h-5 w-5 text-black" />
                <h2 className="font-display text-2xl text-black">Multi-source, single narrative</h2>
                <p className="mt-2 text-sm leading-relaxed text-black/70">Currents, GNews, NewsData, and Feedbin are shaped into one coherent reading front.</p>
                <div className="mt-4 text-xs uppercase tracking-[0.15em] text-black/50">Signal from 4 providers, ranked in real time</div>
              </div>
            </article>

            <div className="grid gap-5">
              <article className="reveal tilt-card tilt-subtle overflow-hidden rounded-3xl border border-black/15 bg-white/75 p-6 backdrop-blur-sm">
                <Orbit className="mb-3 h-5 w-5 text-black" />
                <h2 className="font-display text-xl text-black">Adaptive relevance loop</h2>
                <p className="mt-2 text-sm leading-relaxed text-black/70">Your feed shifts subtly as you read, save, and hide stories across sessions.</p>
              </article>

              <article className="reveal tilt-card tilt-subtle overflow-hidden rounded-3xl border border-black/15 bg-white/75 p-6 backdrop-blur-sm">
                <ShieldCheck className="mb-3 h-5 w-5 text-black" />
                <h2 className="font-display text-xl text-black">Private by design</h2>
                <p className="mt-2 text-sm leading-relaxed text-black/70">Credential encryption and route protection are deeply integrated into the core architecture.</p>
              </article>
            </div>
          </div>

          <div className="mt-10 flex flex-wrap items-center gap-2 text-xs text-black/65">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-black/20 bg-white/60 px-3 py-1.5">
              <Sparkles className="h-3.5 w-3.5" />
              Design spell: Minimal Luxury
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-black/20 bg-white/60 px-3 py-1.5">
              <ArrowUpRight className="h-3.5 w-3.5" />
              Parallax hero with smooth micro-motion
            </span>
          </div>
        </section>
      </main>
    </div>
  );
}
