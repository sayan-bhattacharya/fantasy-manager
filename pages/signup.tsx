import { GetStaticProps } from "next";
import { signIn } from "next-auth/react";
import Head from "next/head";
import { useRouter } from "next/router";
import { useEffect, useRef, useState } from "react";
import { Providers, getProviders } from "../types/providers";
import { getData } from "./api/theme";
import { getProviderDetails } from "../components/AuthProviderDetails";
import db from "#database";

interface Props {
  enabledProviders: Providers[];
  enablePasswordSignup: boolean;
}

export default function SignUp({
  enabledProviders,
  enablePasswordSignup,
}: Props) {
  const router = useRouter();
  const callbackUrl = (router.query.callbackUrl as string) ?? "/";
  const error = router.query.error as string;
  const providers = getProviderDetails(enabledProviders);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [focused, setFocused] = useState<"user" | "pass" | "confirm" | null>(
    null,
  );
  const orb1 = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!orb1.current) return;
      const x = (e.clientX / window.innerWidth - 0.5) * 24;
      const y = (e.clientY / window.innerHeight - 0.5) * 24;
      orb1.current.style.transform = `translate(${x}px, ${y}px)`;
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  const mismatch = confirm.length > 0 && password !== confirm;
  const canSubmit =
    username.length >= 3 &&
    password.length >= 6 &&
    password === confirm &&
    !loading;

  const handleSignUp = async () => {
    if (!canSubmit) return;
    setLoading(true);
    await signIn("Sign-Up", { callbackUrl, username, password });
    setLoading(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSignUp();
  };

  const errorMsg =
    error === "CredentialsSignin"
      ? "Username may already be taken."
      : error === "no_username"
        ? "Please fill in all fields."
        : error
          ? "Sign-up failed. Please try again."
          : null;

  return (
    <>
      <Head>
        <title>Create Account — FantasyKick</title>
      </Head>

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
        {/* Ambient orbs */}
        <div
          ref={orb1}
          aria-hidden="true"
          style={{
            position: "fixed",
            top: "-10%",
            right: "-5%",
            width: "50vw",
            height: "50vw",
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
            bottom: "-15%",
            left: "-8%",
            width: "55vw",
            height: "55vw",
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(139,92,246,0.06) 0%, transparent 70%)",
            pointerEvents: "none",
            zIndex: 0,
          }}
        />

        {/* ══ LEFT PANEL ══ */}
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
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
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
              Free to Join
            </div>
            <h1
              style={{
                fontSize: "clamp(2.2rem, 4vw, 3.2rem)",
                fontWeight: 800,
                lineHeight: 1.1,
                letterSpacing: "-0.04em",
                color: "#fff",
                margin: 0,
              }}
            >
              Build your dream
              <br />
              <span
                style={{
                  background: "linear-gradient(90deg, #00FF87, #00cfff)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                squad today
              </span>
            </h1>
            <p
              style={{
                marginTop: "1.2rem",
                fontSize: "0.95rem",
                color: "rgba(255,255,255,0.45)",
                lineHeight: 1.6,
                maxWidth: 380,
              }}
            >
              Pick 11 players, enter contests, win prizes. Join millions of
              managers competing every matchday.
            </p>
          </div>

          {/* Benefits */}
          <div
            style={{ display: "flex", flexDirection: "column", gap: "0.9rem" }}
          >
            {[
              { icon: "🏆", text: "10,000 FC welcome bonus on sign-up" },
              { icon: "⚽", text: "Pick from 500+ Premier League players" },
              { icon: "🎯", text: "Real-time scoring every matchday" },
              { icon: "💰", text: "Win prizes in free and paid contests" },
            ].map(({ icon, text }) => (
              <div
                key={text}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.85rem",
                }}
              >
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: "50%",
                    background: "rgba(0,255,135,0.08)",
                    border: "1px solid rgba(0,255,135,0.15)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "1rem",
                    flexShrink: 0,
                  }}
                >
                  {icon}
                </div>
                <span
                  style={{
                    fontSize: "0.87rem",
                    color: "rgba(255,255,255,0.6)",
                  }}
                >
                  {text}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* ══ RIGHT PANEL — form ══ */}
        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "2rem 1.5rem",
            zIndex: 1,
            position: "relative",
          }}
        >
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
                Create account
              </h2>
              <p
                style={{
                  fontSize: "0.82rem",
                  color: "rgba(255,255,255,0.4)",
                  margin: "0 0 1.8rem",
                }}
              >
                Start your fantasy football journey today.
              </p>

              {/* Error */}
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

              {enablePasswordSignup && (
                <>
                  {/* Username */}
                  <FieldLabel>Username</FieldLabel>
                  <input
                    type="text"
                    autoComplete="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onFocus={() => setFocused("user")}
                    onBlur={() => setFocused(null)}
                    placeholder="Choose a username (min. 3 chars)"
                    style={inputStyle(focused === "user")}
                  />

                  {/* Password */}
                  <div style={{ marginTop: "1rem" }}>
                    <FieldLabel>Password</FieldLabel>
                    <div style={{ position: "relative" }}>
                      <input
                        type={showPass ? "text" : "password"}
                        autoComplete="new-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        onKeyDown={handleKeyDown}
                        onFocus={() => setFocused("pass")}
                        onBlur={() => setFocused(null)}
                        placeholder="Min. 6 characters"
                        style={{
                          ...inputStyle(focused === "pass"),
                          paddingRight: "3rem",
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
                      >
                        {showPass ? "🙈" : "👁"}
                      </button>
                    </div>
                    {password.length > 0 && password.length < 6 && (
                      <p
                        style={{
                          fontSize: "0.72rem",
                          color: "#FCA5A5",
                          margin: "4px 0 0",
                        }}
                      >
                        At least 6 characters required
                      </p>
                    )}
                  </div>

                  {/* Confirm password */}
                  <div style={{ marginTop: "1rem", marginBottom: "1.6rem" }}>
                    <FieldLabel>Confirm Password</FieldLabel>
                    <input
                      type={showPass ? "text" : "password"}
                      autoComplete="new-password"
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      onKeyDown={handleKeyDown}
                      onFocus={() => setFocused("confirm")}
                      onBlur={() => setFocused(null)}
                      placeholder="Re-enter your password"
                      style={{
                        ...inputStyle(focused === "confirm"),
                        borderColor: mismatch
                          ? "#EF4444"
                          : focused === "confirm"
                            ? "#00FF87"
                            : "rgba(255,255,255,0.09)",
                        boxShadow: mismatch
                          ? "0 0 0 3px rgba(239,68,68,0.15)"
                          : focused === "confirm"
                            ? "0 0 0 3px rgba(0,255,135,0.12)"
                            : "none",
                      }}
                    />
                    {mismatch && (
                      <p
                        style={{
                          fontSize: "0.72rem",
                          color: "#FCA5A5",
                          margin: "4px 0 0",
                        }}
                      >
                        Passwords don't match
                      </p>
                    )}
                  </div>

                  <button
                    className="btn-neon"
                    onClick={handleSignUp}
                    disabled={!canSubmit}
                    style={{
                      width: "100%",
                      justifyContent: "space-between",
                      opacity: canSubmit ? 1 : 0.45,
                    }}
                  >
                    <span>
                      {loading ? "Creating account…" : "Create Account"}
                    </span>
                    <span className="btn-icon">
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
                    </span>
                  </button>
                </>
              )}

              {/* OAuth */}
              {providers.length > 0 && (
                <>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.75rem",
                      margin: enablePasswordSignup ? "1.4rem 0" : "0 0 1.2rem",
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
                      {enablePasswordSignup
                        ? "or sign up with"
                        : "sign up with"}
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
                        }}
                        onMouseLeave={(e) => {
                          (
                            e.currentTarget as HTMLButtonElement
                          ).style.background = "rgba(255,255,255,0.05)";
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

              {/* Footer */}
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
                  Already have an account?{" "}
                  <a
                    href={`/signin${router.query.callbackUrl ? "?callbackUrl=" + encodeURIComponent(router.query.callbackUrl as string) : ""}`}
                    style={{
                      color: "#00FF87",
                      textDecoration: "none",
                      fontWeight: 600,
                    }}
                  >
                    Sign in
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

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label
      style={{
        display: "block",
        fontSize: "0.7rem",
        fontWeight: 600,
        letterSpacing: "0.1em",
        textTransform: "uppercase",
        color: "rgba(255,255,255,0.45)",
        marginBottom: 6,
      }}
    >
      {children}
    </label>
  );
}

function inputStyle(active: boolean): React.CSSProperties {
  return {
    width: "100%",
    boxSizing: "border-box",
    background: "rgba(255,255,255,0.04)",
    border: `1px solid ${active ? "#00FF87" : "rgba(255,255,255,0.09)"}`,
    borderRadius: "0.85rem",
    padding: "0.85rem 1rem",
    color: "#fff",
    fontSize: "0.9rem",
    outline: "none",
    boxShadow: active ? "0 0 0 3px rgba(0,255,135,0.12)" : "none",
    transition: "border-color 0.2s, box-shadow 0.2s",
    fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
    display: "block",
  };
}

export const getStaticProps: GetStaticProps = async (ctx) => {
  const enabledProviders = getProviders();
  const enablePasswordSignup =
    enabledProviders.length === 0 ||
    (await db
      .selectFrom("data")
      .selectAll()
      .where("value1", "=", "configEnablePasswordSignup")
      .where("value2", "=", "1")
      .executeTakeFirst()) !== undefined;

  return {
    props: {
      enabledProviders,
      enablePasswordSignup,
      t: await getData(ctx),
    },
  };
};
