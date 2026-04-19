import Head from "next/head";
import Menu from "../../components/Menu";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";

interface Achievement {
  id?: number;
  type: string;
  title: string;
  description: string;
  icon: string;
  rarity: string;
  unlocked: boolean;
  earnedAt?: number;
}

const RARITY_COLORS: Record<string, string> = {
  legendary: "#FFD700",
  epic:      "#9b59b6",
  rare:      "#3498db",
  common:    "rgba(255,255,255,0.2)",
};

const RARITY_BG: Record<string, string> = {
  legendary: "rgba(255,215,0,0.08)",
  epic:      "rgba(155,89,182,0.08)",
  rare:      "rgba(52,152,219,0.08)",
  common:    "rgba(255,255,255,0.03)",
};

export default function ProfilePage() {
  const router = useRouter();
  const { id } = router.query;
  const [username, setUsername] = useState<string>("");
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"all" | "unlocked">("all");

  useEffect(() => {
    if (!id) return;
    Promise.all([
      fetch(`/api/user/${id}`).then((r) => r.json()).catch(() => "Player"),
      fetch(`/api/achievements?userId=${id}`).then((r) => r.json()).catch(() => ({ progress: [] })),
    ]).then(([name, achData]) => {
      setUsername(typeof name === "string" ? name : "Player");
      setAchievements(achData.progress ?? []);
      setLoading(false);
    });
  }, [id]);

  const unlocked = achievements.filter((a) => a.unlocked);
  const displayed = tab === "unlocked" ? unlocked : achievements;

  const RARITY_ORDER = ["legendary", "epic", "rare", "common"];
  const sorted = [...displayed].sort(
    (a, b) => RARITY_ORDER.indexOf(a.rarity) - RARITY_ORDER.indexOf(b.rarity)
  );

  return (
    <>
      <Head><title>{username ? `${username} — Profile` : "Profile"} — FantasyKick</title></Head>
      <Menu />

      <main className="main-content" style={{ background: "var(--bg)" }}>
        {/* Profile header */}
        <div
          className="py-20 px-4"
          style={{
            background: "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(0,255,135,0.07) 0%, transparent 70%)",
            borderBottom: "1px solid var(--border)",
          }}
        >
          <div className="max-w-4xl mx-auto flex items-center gap-6">
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center text-3xl font-black flex-shrink-0"
              style={{
                background: "rgba(0,255,135,0.1)",
                border: "2px solid rgba(0,255,135,0.3)",
                boxShadow: "0 0 24px rgba(0,255,135,0.15)",
              }}
            >
              {username ? username[0].toUpperCase() : "?"}
            </div>
            <div>
              <span className="eyebrow mb-2">Manager Profile</span>
              <h1 className="display-md mt-2">{username || "Loading..."}</h1>
              <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.4)" }}>
                {unlocked.length} / {achievements.length} achievements unlocked
              </p>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 py-12">
          {/* Stat pills */}
          {!loading && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
              {[
                { label: "Total Badges", value: unlocked.length, icon: "🏅" },
                { label: "Legendary", value: unlocked.filter((a) => a.rarity === "legendary").length, icon: "👑" },
                { label: "Epic", value: unlocked.filter((a) => a.rarity === "epic").length, icon: "💎" },
                { label: "Rare", value: unlocked.filter((a) => a.rarity === "rare").length, icon: "⭐" },
              ].map((s) => (
                <div key={s.label} className="card-outer">
                  <div className="card-inner p-5 text-center">
                    <div className="text-2xl mb-2">{s.icon}</div>
                    <div className="text-2xl font-black mb-1" style={{ color: "var(--neon)" }}>{s.value}</div>
                    <div className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>{s.label}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Tabs */}
          <div className="flex gap-2 mb-8">
            {(["all", "unlocked"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className="px-5 py-2 rounded-full text-sm font-semibold capitalize transition-all duration-300"
                style={{
                  background: tab === t ? "var(--neon)" : "rgba(255,255,255,0.05)",
                  color: tab === t ? "#000" : "rgba(255,255,255,0.6)",
                  border: "1px solid",
                  borderColor: tab === t ? "var(--neon)" : "rgba(255,255,255,0.08)",
                  transitionTimingFunction: "var(--spring)",
                }}
              >
                {t === "all" ? `All (${achievements.length})` : `Unlocked (${unlocked.length})`}
              </button>
            ))}
          </div>

          {/* Achievement grid */}
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="skeleton" style={{ height: "140px", borderRadius: "1rem" }} />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {sorted.map((ach) => (
                <div
                  key={ach.type}
                  className="badge"
                  style={{
                    background: ach.unlocked ? RARITY_BG[ach.rarity] : "rgba(255,255,255,0.02)",
                    borderColor: ach.unlocked ? RARITY_COLORS[ach.rarity] : "rgba(255,255,255,0.06)",
                    opacity: ach.unlocked ? 1 : 0.4,
                    filter: ach.unlocked ? "none" : "grayscale(1)",
                    position: "relative",
                    transition: "all 0.3s cubic-bezier(0.32,0.72,0,1)",
                  }}
                >
                  {ach.unlocked && (
                    <div
                      className="absolute top-2 right-2 w-4 h-4 rounded-full text-xs flex items-center justify-center"
                      style={{ background: RARITY_COLORS[ach.rarity] + "30", color: RARITY_COLORS[ach.rarity] }}
                    >
                      ✓
                    </div>
                  )}
                  <div className="badge-icon">{ach.icon}</div>
                  <div className="text-sm font-bold text-center">{ach.title}</div>
                  <div className="text-xs text-center leading-tight" style={{ color: "rgba(255,255,255,0.4)" }}>
                    {ach.description}
                  </div>
                  {ach.unlocked && (
                    <div
                      className="text-xs font-bold px-2 py-0.5 rounded-full"
                      style={{
                        background: RARITY_COLORS[ach.rarity] + "18",
                        color: RARITY_COLORS[ach.rarity],
                        textTransform: "uppercase",
                        letterSpacing: "0.1em",
                        fontSize: "0.6rem",
                      }}
                    >
                      {ach.rarity}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
