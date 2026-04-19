import { GetStaticProps } from "next";
import { signIn } from "next-auth/react";
import Head from "next/head";
import { useRouter } from "next/router";
import { useEffect, useRef, useState } from "react";
import { Providers, getProviders } from "../types/providers";
import { getData } from "./api/theme";
import { getProviderDetails } from "../components/AuthProviderDetails";
import AnimatedPitch from "../components/AnimatedPitch";

interface Props {
  enabledProviders: Providers[];
}

export default function SignIn({ enabledProviders }: Props) {
  const router = useRouter();
  const callbackUrl = (router.query.callbackUrl as string) ?? "/";
  const error = router.query.error as string;
  const providers = getProviderDetails(enabledProviders);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [focused, setFocused] = useState<"user" | "pass" | null>(null);
  const orb1 = useRef<HTMLDivElement>(null);

  // Subtle orb parallax on mouse move
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!orb1.current) return;
      const x = (e.clientX / window.innerWidth - 0.5) * 30;
      const y = (e.clientY / window.innerHeight - 0.5) * 30;
      orb1.current.style.transform = `translate(${x}px, ${y}px)`;
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  const handleSignIn = async () => {
    if (!username || !password) return;
    setLoading(true);
    await signIn("Sign-In", { callbackUrl, username, password });
    setLoading(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSignIn();
  };

  const errorMsg =
    error === "CredentialsSignin"
      ? "Incorrect username or password."
      : error === "no_username"
        ? "Please enter a username and password."
        : error
          ? "Sign-in failed. Please try again."
          : null;

  return (
    <>
      <Head>
        <title>Sign In — FantasyKick</title>
      </Head>

      {/* Full-bleed layout */}
      <div
        style={{
          minHeight: "100dvh",
          display: "flex",
          background: "#050505",
          position: "relative",
          overflow: "hidden",
          fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
        }}
      >
        {/* ── Ambient orbs ── */}
        <div
          ref={orb1}
          aria-hidden="true"
          style={{
            position: "fixed",
            top: "-15%",
            left: "-10%",
            width: "55vw",
            height: "55vw",
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(0,255,135,0.07) 0%, transparent 70%)",
            pointerEvents: "none",
            transition: "transform 0.8s cubic-bezier(0.32,0.72,0,1)",
            zIndex: 0,
          }}
        />
        <div
          aria-hidden="true"
          style={{
            position: "fixed",
            bottom: "-20%",
            right: "-10%",
            width: "60vw",
            height: "60vw",
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(139,92,246,0.06) 0%, transparent 70%)",
            pointerEvents: "none",
            zIndex: 0,
          }}
        />

        {/* ══ LEFT PANEL (desktop only) ══ */}
        <div
          className="hidden md:flex"
          style={{
            flex: "0 0 52%",
            flexDirection: "column",
            justifyContent: "center",
            padding: "4rem 3.5rem",
            position: "relative",
            zIndex: 1,
          }}
        >
          {/* Logo */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              marginBottom: "3.5rem",
            }}
          >
            <span style={{ fontSize: "2rem" }}>⚽</span>
            <span
              style={{
                fontSize: "1.35rem",
                fontWeight: 800,
                color: "#fff",
                letterSpacing: "-0.02em",
              }}
            >
              Fantasy<span style={{ color: "#00FF87" }}>Kick</span>
            </span>
          </div>

          {/* Headline */}
          <div style={{ marginBottom: "2.5rem" }}>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                background: "rgba(0,255,135,0.08)",
                border: "1px solid rgba(0,255,135,0.2)",
                borderRadius: "999px",
                padding: "4px 14px",
                fontSize: "0.65rem",
                fontWeight: 600,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: "#00FF87",
                marginBottom: "1.2rem",
              }}
            >
              Season 2025/26 Live
            </div>
            <h1
              style={{
                fontSize: "clamp(2.2rem, 4vw, 3.4rem)",
                fontWeight: 800,
                lineHeight: 1.08,
                letterSpacing: "-0.04em",
                color: "#fff",
                margin: 0,
              }}
            >
              The Ultimate
              <br />
              <span
                style={{
                  background: "linear-gradient(90deg, #00FF87, #00cfff)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                Fantasy Football
              </span>
              <br />
              Experience
            </h1>
          </div>

          {/* Stats strip */}
          <div
            style={{ display: "flex", gap: "2.5rem", marginBottom: "3.5rem" }}
          >
            {[
              { val: "2.4M+", label: "Active Players" },
              { val: "18K+", label: "Live Contests" },
              { val: "£500K", label: "Prize Pool" },
            ].map(({ val, label }) => (
              <div key={label}>
                <div
                  style={{
                    fontSize: "1.5rem",
                    fontWeight: 800,
                    color: "#00FF87",
                    letterSpacing: "-0.03em",
                  }}
                >
                  {val}
                </div>
                <div
                  style={{
                    fontSize: "0.72rem",
                    color: "rgba(255,255,255,0.45)",
                    fontWeight: 500,
                    marginTop: 2,
                  }}
                >
                  {label}
                </div>
              </div>
            ))}
          </div>

          {/* Live animated pitch */}
          <AnimatedPitch />
        </div>

        {/* ══ RIGHT PANEL — auth form ══ */}
        <div
          style={{
            flex: "1",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "2rem 1.5rem",
            zIndex: 1,
            position: "relative",
          }}
        >
          {/* Outer bezel */}
          <div
            style={{
              width: "100%",
              maxWidth: "420px",
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "2rem",
              padding: "6px",
            }}
          >
            {/* Inner core */}
            <div
              style={{
                background: "#0d0d14",
                borderRadius: "calc(2rem - 6px)",
                padding: "2.5rem 2rem",
                boxShadow: "inset 0 1px 1px rgba(255,255,255,0.06)",
              }}
            >
              {/* Mobile logo */}
              <div
                className="flex md:hidden"
                style={{ alignItems: "center", gap: 8, marginBottom: "1.8rem" }}
              >
                <span style={{ fontSize: "1.5rem" }}>⚽</span>
                <span
                  style={{ fontSize: "1.1rem", fontWeight: 800, color: "#fff" }}
                >
                  Fantasy<span style={{ color: "#00FF87" }}>Kick</span>
                </span>
              </div>

              <h2
                style={{
                  fontSize: "1.65rem",
                  fontWeight: 800,
                  color: "#fff",
                  letterSpacing: "-0.03em",
                  margin: "0 0 0.3rem",
                }}
              >
                Welcome back
              </h2>
              <p
                style={{
                  fontSize: "0.82rem",
                  color: "rgba(255,255,255,0.4)",
                  margin: "0 0 1.8rem",
                }}
              >
                Sign in to manage your squad and join contests.
              </p>

              {/* Error banner */}
              {errorMsg && (
                <div
                  style={{
                    background: "rgba(239,68,68,0.1)",
                    border: "1px solid rgba(239,68,68,0.25)",
                    borderRadius: "0.75rem",
                    padding: "0.75rem 1rem",
                    fontSize: "0.8rem",
                    color: "#FCA5A5",
                    marginBottom: "1.2rem",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <span style={{ fontSize: "1rem" }}>⚠</span> {errorMsg}
                </div>
              )}

              {/* Username */}
              <div style={{ marginBottom: "1rem" }}>
                <label
                  style={{
                    display: "block",
                    fontSize: "0.7rem",
                    fontWeight: 600,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    color: "rgba(255,255,255,0.45)",
                    marginBottom: "6px",
                  }}
                >
                  Username
                </label>
                <input
                  type="text"
                  autoComplete="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onFocus={() => setFocused("user")}
                  onBlur={() => setFocused(null)}
                  placeholder="Enter your username"
                  style={{
                    width: "100%",
                    boxSizing: "border-box",
                    background: "rgba(255,255,255,0.04)",
                    border: `1px solid ${focused === "user" ? "#00FF87" : "rgba(255,255,255,0.09)"}`,
                    borderRadius: "0.85rem",
                    padding: "0.85rem 1rem",
                    color: "#fff",
                    fontSize: "0.9rem",
                    outline: "none",
                    boxShadow:
                      focused === "user"
                        ? "0 0 0 3px rgba(0,255,135,0.12)"
                        : "none",
                    transition: "border-color 0.2s, box-shadow 0.2s",
                  }}
                />
              </div>

              {/* Password */}
              <div style={{ marginBottom: "1.6rem" }}>
                <label
                  style={{
                    display: "block",
                    fontSize: "0.7rem",
                    fontWeight: 600,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    color: "rgba(255,255,255,0.45)",
                    marginBottom: "6px",
                  }}
                >
                  Password
                </label>
                <div style={{ position: "relative" }}>
                  <input
                    type={showPass ? "text" : "password"}
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onFocus={() => setFocused("pass")}
                    onBlur={() => setFocused(null)}
                    placeholder="••••••••"
                    style={{
                      width: "100%",
                      boxSizing: "border-box",
                      background: "rgba(255,255,255,0.04)",
                      border: `1px solid ${focused === "pass" ? "#00FF87" : "rgba(255,255,255,0.09)"}`,
                      borderRadius: "0.85rem",
                      padding: "0.85rem 3rem 0.85rem 1rem",
                      color: "#fff",
                      fontSize: "0.9rem",
                      outline: "none",
                      boxShadow:
                        focused === "pass"
                          ? "0 0 0 3px rgba(0,255,135,0.12)"
                          : "none",
                      transition: "border-color 0.2s, box-shadow 0.2s",
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass((p) => !p)}
                    style={{
                      position: "absolute",
                      right: "0.85rem",
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: "rgba(255,255,255,0.35)",
                      fontSize: "0.85rem",
                      padding: 0,
                    }}
                    aria-label={showPass ? "Hide password" : "Show password"}
                  >
                    {showPass ? "🙈" : "👁"}
                  </button>
                </div>
              </div>

              {/* CTA — Sign In */}
              <button
                className="btn-neon"
                onClick={handleSignIn}
                disabled={loading || !username || !password}
                style={{
                  width: "100%",
                  justifyContent: "space-between",
                  opacity: loading ? 0.7 : 1,
                }}
              >
                <span>{loading ? "Signing in…" : "Sign In"}</span>
                <span className="btn-icon">
                  {loading ? (
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                    >
                      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                    </svg>
                  ) : (
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                    >
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  )}
                </span>
              </button>

              {/* Divider + OAuth */}
              {providers.length > 0 && (
                <>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.75rem",
                      margin: "1.4rem 0",
                    }}
                  >
                    <div
                      style={{
                        flex: 1,
                        height: 1,
                        background: "rgba(255,255,255,0.08)",
                      }}
                    />
                    <span
                      style={{
                        fontSize: "0.72rem",
                        color: "rgba(255,255,255,0.28)",
                        fontWeight: 600,
                      }}
                    >
                      or continue with
                    </span>
                    <div
                      style={{
                        flex: 1,
                        height: 1,
                        background: "rgba(255,255,255,0.08)",
                      }}
                    />
                  </div>

                  <div style={{ display: "flex", gap: "0.75rem" }}>
                    {providers.map((p) => (
                      <button
                        key={p.name}
                        onClick={() => signIn(p.name, { callbackUrl })}
                        style={{
                          flex: 1,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 8,
                          background: "rgba(255,255,255,0.05)",
                          border: "1px solid rgba(255,255,255,0.1)",
                          borderRadius: "0.85rem",
                          padding: "0.75rem",
                          color: "rgba(255,255,255,0.8)",
                          fontSize: "0.82rem",
                          fontWeight: 600,
                          cursor: "pointer",
                          transition: "all 0.2s cubic-bezier(0.32,0.72,0,1)",
                          fontFamily: "inherit",
                        }}
                        onMouseEnter={(e) => {
                          (
                            e.currentTarget as HTMLButtonElement
                          ).style.background = "rgba(255,255,255,0.1)";
                          (
                            e.currentTarget as HTMLButtonElement
                          ).style.borderColor = "rgba(255,255,255,0.2)";
                        }}
                        onMouseLeave={(e) => {
                          (
                            e.currentTarget as HTMLButtonElement
                          ).style.background = "rgba(255,255,255,0.05)";
                          (
                            e.currentTarget as HTMLButtonElement
                          ).style.borderColor = "rgba(255,255,255,0.1)";
                        }}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={p.logo}
                          alt={p.name}
                          width={18}
                          height={18}
                          style={{
                            filter: p.name === "github" ? "invert(1)" : "none",
                          }}
                        />
                        <span style={{ textTransform: "capitalize" }}>
                          {p.name}
                        </span>
                      </button>
                    ))}
                  </div>
                </>
              )}

              {/* Footer links */}
              <div
                style={{
                  marginTop: "1.6rem",
                  paddingTop: "1.2rem",
                  borderTop: "1px solid rgba(255,255,255,0.06)",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <p
                  style={{
                    fontSize: "0.78rem",
                    color: "rgba(255,255,255,0.35)",
                    margin: 0,
                  }}
                >
                  No account?{" "}
                  <a
                    href={`/signup${router.query.callbackUrl ? "?callbackUrl=" + encodeURIComponent(router.query.callbackUrl as string) : ""}`}
                    style={{
                      color: "#00FF87",
                      textDecoration: "none",
                      fontWeight: 600,
                    }}
                  >
                    Sign up free
                  </a>
                </p>
                <a
                  href="/privacy"
                  style={{
                    fontSize: "0.72rem",
                    color: "rgba(255,255,255,0.2)",
                    textDecoration: "none",
                  }}
                >
                  Privacy
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export const getStaticProps: GetStaticProps = async (ctx) => {
  return {
    props: {
      enabledProviders: getProviders(),
      t: await getData(ctx),
    },
  };
};
