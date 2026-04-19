import Head from "next/head";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useEffect, useRef, useState } from "react";

const LIVE_SCORES = [
  { home: "Arsenal", away: "Man City", score: "2–1", minute: "67'" },
  { home: "Liverpool", away: "Chelsea", score: "1–1", minute: "43'" },
  { home: "Bayern", away: "Dortmund", score: "3–0", minute: "FT" },
  { home: "PSG", away: "Lyon", score: "0–2", minute: "82'" },
  { home: "Real Madrid", away: "Atletico", score: "1–0", minute: "HT" },
];

const FEATURES = [
  {
    icon: "⚽",
    title: "Dream Squad Builder",
    desc: "Pick 11 players from 500+ EPL stars within a 100M budget. Every transfer decision counts.",
  },
  {
    icon: "🏆",
    title: "Mega Contests",
    desc: "Compete in public leagues with prize pools up to 50,000 FC. Win big every matchday.",
  },
  {
    icon: "⚡",
    title: "Live Scoring",
    desc: "Watch your points update in real-time as goals, assists and clean sheets happen live.",
  },
  {
    icon: "💰",
    title: "Fantasy Wallet",
    desc: "Manage your Fantasy Coins. Enter contests, win prizes, and climb the all-time leaderboard.",
  },
  {
    icon: "🎯",
    title: "Match Predictions",
    desc: "Predict scorelines for bonus points. Nail the exact score for a massive multiplier.",
  },
  {
    icon: "🥇",
    title: "Achievements",
    desc: "Earn legendary badges, unlock exclusive rewards, and show off your status to rivals.",
  },
];

const STATS = [
  { label: "Active Players", value: "2.4M+" },
  { label: "Contests Hosted", value: "18,000+" },
  { label: "Prize Pool Distributed", value: "₹4.2Cr+" },
  { label: "Leagues Supported", value: "12+" },
];

function useSectionReveal() {
  useEffect(() => {
    const els = document.querySelectorAll(".reveal");
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("visible");
            obs.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    els.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, []);
}

export default function Home() {
  const { data: session } = useSession();
  useSectionReveal();
  const [activeScore, setActiveScore] = useState(0);

  // Rotate live scores display
  useEffect(() => {
    const t = setInterval(
      () => setActiveScore((p) => (p + 1) % LIVE_SCORES.length),
      2500
    );
    return () => clearInterval(t);
  }, []);

  return (
    <>
      <Head>
        <title>FantasyKick — Premium Fantasy Football</title>
      </Head>

      {/* ── Floating Nav ─────────────────────────────── */}
      <nav className="nav-pill">
        <Link href="/" className="flex items-center gap-2 px-2 mr-2">
          <span className="text-lg">⚽</span>
          <span
            className="font-bold text-sm tracking-tight"
            style={{ color: "var(--neon)" }}
          >
            FantasyKick
          </span>
        </Link>
        <div className="hidden md:flex items-center gap-1">
          {[
            { href: "/contests", label: "Contests" },
            { href: "/leagues", label: "Leagues" },
            { href: "/wallet", label: "Wallet" },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="px-3 py-1.5 rounded-full text-sm font-medium text-white/60 hover:text-white hover:bg-white/8 transition-all duration-300"
              style={{ transitionTimingFunction: "var(--spring)" }}
            >
              {item.label}
            </Link>
          ))}
        </div>
        <div className="flex items-center gap-2 ml-2">
          {session ? (
            <Link href="/leagues" className="btn-neon" style={{ padding: "0.45rem 1rem", fontSize: "0.8rem" }}>
              My Leagues
              <span className="btn-icon">→</span>
            </Link>
          ) : (
            <>
              <Link href="/signin" className="btn-ghost" style={{ padding: "0.45rem 1rem", fontSize: "0.8rem" }}>
                Sign In
              </Link>
              <Link href="/signup" className="btn-neon" style={{ padding: "0.45rem 1rem", fontSize: "0.8rem" }}>
                Play Free
                <span className="btn-icon">→</span>
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* ── Live Ticker ──────────────────────────────── */}
      <div
        className="fixed top-0 left-0 right-0 z-50 overflow-hidden"
        style={{ background: "rgba(0,255,135,0.08)", borderBottom: "1px solid rgba(0,255,135,0.12)", height: "2rem" }}
      >
        <div className="flex items-center h-full ticker-track whitespace-nowrap px-4 gap-8">
          {[...LIVE_SCORES, ...LIVE_SCORES].map((s, i) => (
            <span key={i} className="text-xs font-semibold" style={{ color: "var(--neon)" }}>
              <span className="text-white/50 mr-1">{s.minute}</span>
              {s.home} <span className="text-white/30 mx-1">vs</span> {s.away}
              <span className="ml-2 px-1.5 py-0.5 rounded text-xs font-bold"
                style={{ background: "rgba(0,255,135,0.15)", color: "var(--neon)" }}>
                {s.score}
              </span>
            </span>
          ))}
        </div>
      </div>

      <main
        style={{
          background: "var(--bg)",
          minHeight: "100dvh",
          paddingTop: "2rem",
        }}
      >
        {/* ── Hero ─────────────────────────────────── */}
        <section
          className="relative flex flex-col items-center justify-center text-center px-4"
          style={{
            minHeight: "100dvh",
            background: "var(--bg) var(--hero-mesh) no-repeat",
            paddingTop: "8rem",
            paddingBottom: "6rem",
          }}
        >
          {/* Glow orb */}
          <div
            className="absolute rounded-full pointer-events-none"
            style={{
              width: "600px",
              height: "600px",
              top: "10%",
              left: "50%",
              transform: "translateX(-50%)",
              background: "radial-gradient(circle, rgba(0,255,135,0.08) 0%, transparent 70%)",
              filter: "blur(60px)",
            }}
          />

          <div className="relative z-10 max-w-5xl mx-auto">
            <div className="reveal flex justify-center mb-6">
              <span className="eyebrow">⚽ Season 2025/26 is LIVE</span>
            </div>

            <h1 className="display-xl reveal reveal-delay-1 mb-6">
              Build Your{" "}
              <span className="gradient-text">Dream Squad.</span>
              <br />
              Win Every{" "}
              <span className="gradient-text">Matchday.</span>
            </h1>

            <p
              className="reveal reveal-delay-2 text-lg md:text-xl max-w-2xl mx-auto mb-10"
              style={{ color: "rgba(255,255,255,0.55)", lineHeight: 1.7 }}
            >
              The most advanced open-source fantasy football platform. Draft players,
              enter mega contests, predict scorelines, and dominate 2.4 million rivals.
            </p>

            <div className="reveal reveal-delay-3 flex flex-wrap items-center justify-center gap-4 mb-16">
              <Link href="/signup" className="btn-neon" style={{ padding: "0.9rem 2rem", fontSize: "1rem" }}>
                Start for Free
                <span className="btn-icon">↗</span>
              </Link>
              <Link href="/contests" className="btn-ghost" style={{ padding: "0.9rem 2rem", fontSize: "1rem" }}>
                Browse Contests
              </Link>
            </div>

            {/* Live Score Pill */}
            <div className="reveal reveal-delay-4 flex justify-center">
              <div
                className="card-outer inline-flex"
                style={{ padding: "0.25rem" }}
              >
                <div
                  className="card-inner flex items-center gap-3 px-5 py-3"
                >
                  <span
                    className="w-2 h-2 rounded-full animate-pulse-slow"
                    style={{ background: "var(--neon)", boxShadow: "0 0 8px var(--neon)" }}
                  />
                  <span className="text-sm font-medium" style={{ color: "rgba(255,255,255,0.5)" }}>
                    Live
                  </span>
                  <span className="text-sm font-bold">
                    {LIVE_SCORES[activeScore].home}
                  </span>
                  <span
                    className="px-2 py-0.5 rounded font-black text-sm"
                    style={{ background: "rgba(0,255,135,0.12)", color: "var(--neon)" }}
                  >
                    {LIVE_SCORES[activeScore].score}
                  </span>
                  <span className="text-sm font-bold">
                    {LIVE_SCORES[activeScore].away}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded" style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.4)" }}>
                    {LIVE_SCORES[activeScore].minute}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Stats Strip ──────────────────────────── */}
        <section className="py-16 px-4" style={{ borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)" }}>
          <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
            {STATS.map((s, i) => (
              <div
                key={s.label}
                className={`reveal reveal-delay-${i + 1} text-center`}
              >
                <div className="stat-number mb-1">{s.value}</div>
                <div className="text-sm font-medium" style={{ color: "rgba(255,255,255,0.4)" }}>
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Features Bento ───────────────────────── */}
        <section className="py-32 px-4 max-w-6xl mx-auto">
          <div className="text-center mb-20 reveal">
            <span className="eyebrow mb-6">Everything You Need</span>
            <h2 className="display-lg mt-6">
              Built for{" "}
              <span className="gradient-text">Champions</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {FEATURES.map((f, i) => (
              <div
                key={f.title}
                className={`card-outer reveal reveal-delay-${(i % 3) + 1} group cursor-default`}
              >
                <div className="card-inner p-7 flex flex-col gap-4 h-full" style={{ minHeight: "200px" }}>
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl"
                    style={{ background: "rgba(0,255,135,0.08)" }}
                  >
                    {f.icon}
                  </div>
                  <h3 className="font-bold text-lg">{f.title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.5)" }}>
                    {f.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Contest Preview ───────────────────────── */}
        <section
          className="py-32 px-4"
          style={{ background: "radial-gradient(ellipse 80% 50% at 50% 50%, rgba(0,255,135,0.04) 0%, transparent 70%)" }}
        >
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-16 reveal">
              <span className="eyebrow mb-6">This Matchday</span>
              <h2 className="display-lg mt-6">
                Open <span className="gradient-text">Contests</span>
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
              {[
                { name: "Premier League Mega", type: "mega", fee: "500 FC", pool: "50,000 FC", entries: "8,241 / 10,000", badge: "🏆" },
                { name: "Free Kick Challenge", type: "free", fee: "FREE", pool: "1,000 FC", entries: "2,100 / 5,000", badge: "⚽" },
                { name: "Bundesliga Blitz", type: "public", fee: "250 FC", pool: "10,000 FC", entries: "312 / 500", badge: "⚡" },
              ].map((c, i) => (
                <div key={c.name} className={`card-outer reveal reveal-delay-${i + 1} contest-${c.type}`}>
                  <div className="card-inner p-5">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-2xl">{c.badge}</span>
                      <span
                        className="text-xs font-bold px-2 py-1 rounded-full uppercase tracking-wide"
                        style={{
                          background: c.type === "mega" ? "rgba(255,215,0,0.1)" :
                                      c.type === "free" ? "rgba(0,255,135,0.1)" : "rgba(52,152,219,0.1)",
                          color: c.type === "mega" ? "#FFD700" :
                                 c.type === "free" ? "var(--neon)" : "#3498db",
                        }}
                      >
                        {c.type}
                      </span>
                    </div>
                    <h3 className="font-bold text-base mb-3">{c.name}</h3>
                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between text-sm">
                        <span style={{ color: "rgba(255,255,255,0.4)" }}>Entry</span>
                        <span className="font-semibold" style={{ color: "var(--neon)" }}>{c.fee}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span style={{ color: "rgba(255,255,255,0.4)" }}>Prize Pool</span>
                        <span className="font-bold">{c.pool}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span style={{ color: "rgba(255,255,255,0.4)" }}>Spots</span>
                        <span>{c.entries}</span>
                      </div>
                    </div>
                    {/* Entry bar */}
                    <div className="rounded-full overflow-hidden mb-4" style={{ height: "4px", background: "rgba(255,255,255,0.08)" }}>
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${(parseInt(c.entries) / parseInt(c.entries.split(" / ")[1])) * 100}%`,
                          background: "var(--neon)",
                          transition: "width 1s var(--spring)",
                        }}
                      />
                    </div>
                    <Link href="/contests" className="btn-neon w-full justify-center" style={{ padding: "0.6rem 1rem", fontSize: "0.8rem" }}>
                      Join Now
                      <span className="btn-icon">→</span>
                    </Link>
                  </div>
                </div>
              ))}
            </div>

            <div className="text-center reveal">
              <Link href="/contests" className="btn-ghost">
                View All Contests →
              </Link>
            </div>
          </div>
        </section>

        {/* ── CTA Banner ───────────────────────────── */}
        <section className="py-40 px-4">
          <div className="max-w-4xl mx-auto text-center reveal">
            <div
              className="card-outer"
              style={{
                background: "linear-gradient(135deg, rgba(0,255,135,0.06) 0%, rgba(0,229,255,0.04) 100%)",
              }}
            >
              <div className="card-inner py-20 px-8">
                <span className="eyebrow mb-6">Season 2025/26</span>
                <h2 className="display-lg mt-6 mb-6">
                  Your Squad Awaits.
                </h2>
                <p className="text-lg mb-10" style={{ color: "rgba(255,255,255,0.5)" }}>
                  Free to play. Real glory. Join 2.4 million managers today.
                </p>
                <div className="flex flex-wrap gap-4 justify-center">
                  <Link href="/signup" className="btn-neon" style={{ padding: "1rem 2.5rem", fontSize: "1.05rem" }}>
                    Create Your Team
                    <span className="btn-icon">↗</span>
                  </Link>
                  <Link href="/signin" className="btn-ghost" style={{ padding: "1rem 2.5rem", fontSize: "1.05rem" }}>
                    Sign In
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Footer ───────────────────────────────── */}
        <footer
          className="py-12 px-4"
          style={{ borderTop: "1px solid var(--border)" }}
        >
          <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <span className="text-xl">⚽</span>
              <span className="font-bold" style={{ color: "var(--neon)" }}>FantasyKick</span>
            </div>
            <div className="flex flex-wrap gap-6 text-sm" style={{ color: "rgba(255,255,255,0.35)" }}>
              <Link href="/leagues" className="hover:text-white transition-colors">Leagues</Link>
              <Link href="/contests" className="hover:text-white transition-colors">Contests</Link>
              <Link href="/wallet" className="hover:text-white transition-colors">Wallet</Link>
              <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
            </div>
            <p className="text-xs" style={{ color: "rgba(255,255,255,0.2)" }}>
              © 2025 FantasyKick. Open-source &amp; free to play.
            </p>
          </div>
        </footer>
      </main>
    </>
  );
}
