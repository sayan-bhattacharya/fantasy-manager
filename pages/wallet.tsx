import Head from "next/head";
import Menu from "../components/Menu";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";

interface Transaction {
  id: number;
  amount: number;
  type: string;
  description: string;
  createdAt: number;
}

interface WalletData {
  wallet: { balance: number; currency: string };
  transactions: Transaction[];
}

const TX_ICONS: Record<string, string> = {
  deposit: "↓",
  withdrawal: "↑",
  contest_entry: "🎮",
  contest_win: "🏆",
  bonus: "🎁",
};
const TX_COLORS: Record<string, string> = {
  deposit: "#22c55e",
  withdrawal: "#ef4444",
  contest_entry: "#f59e0b",
  contest_win: "#00FF87",
  bonus: "#a78bfa",
};

export default function WalletPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [data, setData] = useState<WalletData | null>(null);
  const [loading, setLoading] = useState(true);
  const [amount, setAmount] = useState("1000");
  const [action, setAction] = useState<"deposit" | "withdraw">("deposit");
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/signin");
      return;
    }
    if (status === "authenticated") {
      fetch("/api/wallet")
        .then((r) => r.json())
        .then((d) => {
          setData(d);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [status, router]);

  const handleAction = async () => {
    const r = await fetch("/api/wallet", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, amount: parseFloat(amount) }),
    });
    const d = await r.json();
    if (r.ok) {
      setMsg({
        text:
          action === "deposit"
            ? `Deposited ${amount} FC`
            : `Withdrew ${amount} FC`,
        ok: true,
      });
      setData((prev) =>
        prev
          ? {
              ...prev,
              wallet: { ...prev.wallet, balance: d.balance },
              transactions: [
                {
                  id: Date.now(),
                  amount:
                    action === "deposit"
                      ? parseFloat(amount)
                      : -parseFloat(amount),
                  type: action,
                  description: action,
                  createdAt: Math.floor(Date.now() / 1000),
                },
                ...prev.transactions,
              ],
            }
          : prev,
      );
    } else {
      setMsg({ text: d.error ?? "Action failed", ok: false });
    }
  };

  const QUICK = [500, 1000, 2500, 5000, 10000];

  return (
    <>
      <Head>
        <title>Wallet — FantasyKick</title>
      </Head>
      <Menu />

      <main className="main-content" style={{ background: "var(--bg)" }}>
        {/* Header */}
        <div
          className="py-20 px-4"
          style={{
            background:
              "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(0,255,135,0.07) 0%, transparent 70%)",
            borderBottom: "1px solid var(--border)",
          }}
        >
          <div className="max-w-4xl mx-auto">
            <span className="eyebrow mb-4">Your Account</span>
            <h1 className="display-md mt-4">Fantasy Wallet</h1>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 py-12">
          {loading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="skeleton"
                  style={{ height: "100px", borderRadius: "1.5rem" }}
                />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Balance card */}
              <div
                className="card-outer md:col-span-1"
                style={{
                  background:
                    "linear-gradient(135deg, rgba(0,255,135,0.06) 0%, rgba(0,229,255,0.04) 100%)",
                }}
              >
                <div className="card-inner p-8 text-center">
                  <div
                    className="text-xs font-semibold uppercase tracking-widest mb-3"
                    style={{ color: "rgba(255,255,255,0.4)" }}
                  >
                    Balance
                  </div>
                  <div className="wallet-balance mb-1">
                    {data?.wallet.balance.toLocaleString()}
                  </div>
                  <div
                    className="text-sm font-bold"
                    style={{ color: "var(--neon)" }}
                  >
                    Fantasy Coins
                  </div>

                  <div className="mt-8 space-y-3">
                    {/* Action toggle */}
                    <div
                      className="flex rounded-full p-1"
                      style={{
                        background: "rgba(255,255,255,0.05)",
                        border: "1px solid rgba(255,255,255,0.08)",
                      }}
                    >
                      {(["deposit", "withdraw"] as const).map((a) => (
                        <button
                          key={a}
                          onClick={() => setAction(a)}
                          className="flex-1 py-2 rounded-full text-xs font-bold capitalize transition-all duration-300"
                          style={{
                            background:
                              action === a ? "var(--neon)" : "transparent",
                            color:
                              action === a ? "#000" : "rgba(255,255,255,0.5)",
                            transitionTimingFunction: "var(--spring)",
                          }}
                        >
                          {a}
                        </button>
                      ))}
                    </div>

                    {/* Quick amounts */}
                    <div className="flex flex-wrap gap-1.5 justify-center">
                      {QUICK.map((q) => (
                        <button
                          key={q}
                          onClick={() => setAmount(String(q))}
                          className="px-2.5 py-1 rounded-full text-xs font-semibold transition-all duration-200"
                          style={{
                            background:
                              amount === String(q)
                                ? "rgba(0,255,135,0.2)"
                                : "rgba(255,255,255,0.05)",
                            color:
                              amount === String(q)
                                ? "var(--neon)"
                                : "rgba(255,255,255,0.5)",
                            border: `1px solid ${amount === String(q) ? "rgba(0,255,135,0.4)" : "rgba(255,255,255,0.07)"}`,
                          }}
                        >
                          {q.toLocaleString()}
                        </button>
                      ))}
                    </div>

                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl text-sm font-bold text-center"
                      style={{
                        background: "rgba(255,255,255,0.05)",
                        border: "1px solid rgba(255,255,255,0.1)",
                        color: "#fff",
                        outline: "none",
                      }}
                    />

                    <button
                      onClick={handleAction}
                      className="btn-neon w-full justify-center"
                      style={{ padding: "0.65rem 1rem", fontSize: "0.85rem" }}
                    >
                      {action === "deposit" ? "Add Coins" : "Withdraw"}
                      <span className="btn-icon">
                        {action === "deposit" ? "+" : "-"}
                      </span>
                    </button>

                    {msg && (
                      <p
                        className="text-xs font-semibold"
                        style={{ color: msg.ok ? "var(--neon)" : "#ef4444" }}
                      >
                        {msg.text}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Transaction history */}
              <div className="card-outer md:col-span-2">
                <div className="card-inner p-6">
                  <h2 className="font-bold text-base mb-5">
                    Transaction History
                  </h2>
                  <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                    {(data?.transactions ?? []).length === 0 ? (
                      <p
                        className="text-sm text-center py-8"
                        style={{ color: "rgba(255,255,255,0.25)" }}
                      >
                        No transactions yet
                      </p>
                    ) : (
                      (data?.transactions ?? []).map((tx) => (
                        <div
                          key={tx.id}
                          className="flex items-center justify-between p-3 rounded-xl"
                          style={{ background: "rgba(255,255,255,0.03)" }}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className="w-9 h-9 rounded-full flex items-center justify-center text-sm"
                              style={{ background: "rgba(255,255,255,0.05)" }}
                            >
                              {TX_ICONS[tx.type] ?? "•"}
                            </div>
                            <div>
                              <div className="text-sm font-semibold">
                                {tx.description}
                              </div>
                              <div
                                className="text-xs"
                                style={{ color: "rgba(255,255,255,0.3)" }}
                              >
                                {new Date(
                                  tx.createdAt * 1000,
                                ).toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                          <div
                            className="font-bold text-sm"
                            style={{
                              color:
                                TX_COLORS[tx.type] ??
                                (tx.amount > 0 ? "#22c55e" : "#ef4444"),
                            }}
                          >
                            {tx.amount > 0 ? "+" : ""}
                            {tx.amount.toLocaleString()} FC
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
