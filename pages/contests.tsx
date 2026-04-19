import Head from "next/head";
import Menu from "../components/Menu";
import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";

interface Contest {
  id: number;
  name: string;
  description: string;
  type: string;
  leagueType: string;
  entryFee: number;
  prizePool: number;
  maxEntries: number;
  currentEntries: number;
  matchday: number;
  status: string;
}

const TYPE_COLORS: Record<
  string,
  { bg: string; color: string; label: string }
> = {
  mega: { bg: "rgba(255,215,0,0.12)", color: "#FFD700", label: "MEGA" },
  free: { bg: "rgba(0,255,135,0.12)", color: "#00FF87", label: "FREE" },
  public: { bg: "rgba(52,152,219,0.12)", color: "#3498db", label: "PUBLIC" },
  private: { bg: "rgba(155,89,182,0.12)", color: "#9b59b6", label: "PRIVATE" },
};

const TYPE_ICONS: Record<string, string> = {
  mega: "🏆",
  free: "⚽",
  public: "⚡",
  private: "🔒",
};

function ContestCard({
  contest,
  onEnter,
}: {
  contest: Contest;
  onEnter: (c: Contest) => void;
}) {
  const tc = TYPE_COLORS[contest.type] ?? TYPE_COLORS.public;
  const fill = Math.min(
    (contest.currentEntries / contest.maxEntries) * 100,
    100,
  );
  const spotsLeft = contest.maxEntries - contest.currentEntries;

  return (
    <div
      className="card-outer group"
      style={{
        borderLeft: `3px solid ${tc.color}`,
        transition: "all 0.4s cubic-bezier(0.32,0.72,0,1)",
      }}
    >
      <div className="card-inner p-6 flex flex-col gap-4 h-full">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <span className="text-3xl">{TYPE_ICONS[contest.type] ?? "🏅"}</span>
          <span
            className="text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wider flex-shrink-0"
            style={{ background: tc.bg, color: tc.color }}
          >
            {tc.label}
          </span>
        </div>

        <div>
          <h3 className="font-bold text-base leading-tight mb-1">
            {contest.name}
          </h3>
          <p
            className="text-xs leading-relaxed"
            style={{ color: "rgba(255,255,255,0.4)" }}
          >
            {contest.description ||
              `${contest.leagueType} matchday ${contest.matchday} contest`}
          </p>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-3">
          {[
            {
              label: "Entry",
              value:
                contest.entryFee === 0
                  ? "FREE"
                  : `${contest.entryFee.toLocaleString()} FC`,
              highlight: true,
            },
            {
              label: "Prize Pool",
              value: `${contest.prizePool.toLocaleString()} FC`,
              highlight: false,
            },
            {
              label: "Spots Left",
              value: spotsLeft.toLocaleString(),
              highlight: false,
            },
            { label: "League", value: contest.leagueType, highlight: false },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-xl p-3"
              style={{ background: "rgba(255,255,255,0.03)" }}
            >
              <div
                className="text-xs mb-1"
                style={{ color: "rgba(255,255,255,0.35)" }}
              >
                {stat.label}
              </div>
              <div
                className="font-bold text-sm"
                style={{ color: stat.highlight ? "var(--neon)" : "#fff" }}
              >
                {stat.value}
              </div>
            </div>
          ))}
        </div>

        {/* Fill bar */}
        <div>
          <div
            className="flex justify-between text-xs mb-1.5"
            style={{ color: "rgba(255,255,255,0.35)" }}
          >
            <span>{contest.currentEntries.toLocaleString()} entered</span>
            <span>{contest.maxEntries.toLocaleString()} max</span>
          </div>
          <div
            className="rounded-full overflow-hidden"
            style={{ height: "4px", background: "rgba(255,255,255,0.06)" }}
          >
            <div
              className="h-full rounded-full transition-all duration-1000"
              style={{
                width: `${fill}%`,
                background: fill > 80 ? "#ef4444" : "var(--neon)",
                transitionTimingFunction: "var(--spring)",
              }}
            />
          </div>
        </div>

        {/* CTA */}
        <button
          onClick={() => onEnter(contest)}
          disabled={spotsLeft <= 0}
          className="btn-neon w-full justify-center mt-auto"
          style={{
            padding: "0.65rem 1rem",
            fontSize: "0.85rem",
            opacity: spotsLeft <= 0 ? 0.4 : 1,
            cursor: spotsLeft <= 0 ? "not-allowed" : "pointer",
          }}
        >
          {spotsLeft <= 0
            ? "Full"
            : contest.entryFee === 0
              ? "Join Free"
              : `Join · ${contest.entryFee} FC`}
          {spotsLeft > 0 && <span className="btn-icon">→</span>}
        </button>
      </div>
    </div>
  );
}

export default function ContestsPage() {
  const { data: session } = useSession();
  const [contests, setContests] = useState<Contest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [entering, setEntering] = useState<Contest | null>(null);
  const [teamName, setTeamName] = useState("My Dream Team");
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);

  const load = useCallback(async (type = "all") => {
    setLoading(true);
    const url = `/api/contests?status=open${type !== "all" ? `&type=${type}` : ""}`;
    const data = await fetch(url)
      .then((r) => r.json())
      .catch(() => ({ contests: [] }));
    setContests(data.contests ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load(filter);
  }, [filter, load]);

  const handleEnter = async () => {
    if (!entering) return;
    if (!session) {
      setMsg({ text: "Please sign in to enter contests", ok: false });
      return;
    }
    const r = await fetch(`/api/contests/${entering.id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ teamName }),
    });
    const d = await r.json();
    if (r.ok) {
      setMsg({ text: `Entered "${entering.name}" successfully! 🎉`, ok: true });
      setEntering(null);
      load(filter);
    } else {
      setMsg({ text: d.error ?? "Failed to enter", ok: false });
    }
  };

  const FILTERS = ["all", "mega", "free", "public", "private"];

  return (
    <>
      <Head>
        <title>Contests — FantasyKick</title>
      </Head>
      <Menu />

      <main className="main-content" style={{ background: "var(--bg)" }}>
        {/* Hero */}
        <div
          className="py-24 px-4 text-center"
          style={{
            background:
              "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(0,255,135,0.08) 0%, transparent 70%)",
            borderBottom: "1px solid var(--border)",
          }}
        >
          <span className="eyebrow mb-4">This Matchday</span>
          <h1 className="display-lg mt-4 mb-4">
            Open <span className="gradient-text">Contests</span>
          </h1>
          <p
            className="text-base max-w-xl mx-auto"
            style={{ color: "rgba(255,255,255,0.45)" }}
          >
            Pick your squad and compete. Top 20% win prize money every matchday.
          </p>
        </div>

        <div className="max-w-6xl mx-auto px-4 py-12">
          {/* Filter pills */}
          <div className="flex flex-wrap gap-2 mb-10">
            {FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className="px-4 py-2 rounded-full text-sm font-semibold capitalize transition-all duration-300"
                style={{
                  background:
                    filter === f ? "var(--neon)" : "rgba(255,255,255,0.05)",
                  color: filter === f ? "#000" : "rgba(255,255,255,0.6)",
                  border: "1px solid",
                  borderColor:
                    filter === f ? "var(--neon)" : "rgba(255,255,255,0.08)",
                  transitionTimingFunction: "var(--spring)",
                }}
              >
                {f === "all" ? "All Contests" : f}
              </button>
            ))}
          </div>

          {/* Notification */}
          {msg && (
            <div
              className="mb-6 px-5 py-4 rounded-2xl text-sm font-semibold"
              style={{
                background: msg.ok
                  ? "rgba(0,255,135,0.1)"
                  : "rgba(239,68,68,0.1)",
                border: `1px solid ${msg.ok ? "rgba(0,255,135,0.3)" : "rgba(239,68,68,0.3)"}`,
                color: msg.ok ? "var(--neon)" : "#ef4444",
              }}
            >
              {msg.text}
              <button
                onClick={() => setMsg(null)}
                className="ml-3 opacity-50 hover:opacity-100"
              >
                ✕
              </button>
            </div>
          )}

          {/* Grid */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="skeleton"
                  style={{ height: "320px", borderRadius: "1.5rem" }}
                />
              ))}
            </div>
          ) : contests.length === 0 ? (
            <div
              className="text-center py-32"
              style={{ color: "rgba(255,255,255,0.3)" }}
            >
              <div className="text-5xl mb-4">🏟️</div>
              <p className="text-lg font-medium">No open contests right now.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {contests.map((c) => (
                <ContestCard key={c.id} contest={c} onEnter={setEntering} />
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Enter Modal */}
      {entering && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{
            background: "rgba(0,0,0,0.8)",
            backdropFilter: "blur(16px)",
          }}
          onClick={(e) => e.target === e.currentTarget && setEntering(null)}
        >
          <div className="card-outer w-full max-w-md">
            <div className="card-inner p-8">
              <h2 className="font-bold text-xl mb-2">{entering.name}</h2>
              <p
                className="text-sm mb-6"
                style={{ color: "rgba(255,255,255,0.45)" }}
              >
                {entering.entryFee === 0
                  ? "Free entry — no coins required"
                  : `Entry fee: ${entering.entryFee.toLocaleString()} FC`}
              </p>
              <label
                className="block text-xs font-semibold mb-2 uppercase tracking-wider"
                style={{ color: "rgba(255,255,255,0.4)" }}
              >
                Team Name
              </label>
              <input
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                className="w-full px-4 py-3 rounded-xl text-sm font-medium mb-6"
                style={{
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  color: "#fff",
                  outline: "none",
                }}
              />
              <div className="flex gap-3">
                <button
                  onClick={() => setEntering(null)}
                  className="btn-ghost flex-1 justify-center"
                >
                  Cancel
                </button>
                <button
                  onClick={handleEnter}
                  className="btn-neon flex-1 justify-center"
                >
                  Confirm Entry
                  <span className="btn-icon">✓</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
