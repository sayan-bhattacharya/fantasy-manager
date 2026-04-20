import { useCallback, useEffect, useRef, useState } from "react";

// ─── Logical coordinate space ─────────────────────────────────────────────────
const S = 300; // 300×300 virtual units

// ─── Player definitions ───────────────────────────────────────────────────────
const DEFS = [
  {
    id: 0,
    role: "gk",
    hx: 150,
    hy: 46,
    range: 16,
    color: "#FBBF24",
    glow: "rgba(251,191,36,0.7)",
  },
  {
    id: 1,
    role: "def",
    hx: 80,
    hy: 100,
    range: 38,
    color: "#3B82F6",
    glow: "rgba(59,130,246,0.7)",
  },
  {
    id: 2,
    role: "def",
    hx: 148,
    hy: 92,
    range: 38,
    color: "#3B82F6",
    glow: "rgba(59,130,246,0.7)",
  },
  {
    id: 3,
    role: "def",
    hx: 218,
    hy: 100,
    range: 38,
    color: "#3B82F6",
    glow: "rgba(59,130,246,0.7)",
  },
  {
    id: 4,
    role: "mid",
    hx: 52,
    hy: 162,
    range: 60,
    color: "#A855F7",
    glow: "rgba(168,85,247,0.7)",
  },
  {
    id: 5,
    role: "mid",
    hx: 120,
    hy: 152,
    range: 60,
    color: "#A855F7",
    glow: "rgba(168,85,247,0.7)",
  },
  {
    id: 6,
    role: "mid",
    hx: 182,
    hy: 152,
    range: 60,
    color: "#A855F7",
    glow: "rgba(168,85,247,0.7)",
  },
  {
    id: 7,
    role: "mid",
    hx: 248,
    hy: 162,
    range: 60,
    color: "#A855F7",
    glow: "rgba(168,85,247,0.7)",
  },
  {
    id: 8,
    role: "fwd",
    hx: 88,
    hy: 226,
    range: 54,
    color: "#EF4444",
    glow: "rgba(239,68,68,0.7)",
  },
  {
    id: 9,
    role: "fwd",
    hx: 150,
    hy: 234,
    range: 54,
    color: "#EF4444",
    glow: "rgba(239,68,68,0.7)",
  },
  {
    id: 10,
    role: "fwd",
    hx: 212,
    hy: 226,
    range: 54,
    color: "#EF4444",
    glow: "rgba(239,68,68,0.7)",
  },
] as const;

type Def = (typeof DEFS)[number];

interface Player extends Omit<Def, "range"> {
  x: number;
  y: number;
  px: number;
  py: number; // perlin offset phases
  pf: number; // perlin frequency multiplier
}

interface Ball {
  x: number;
  y: number;
  trail: { x: number; y: number; a: number }[];
  holderId: number;
  state: "held" | "passing" | "shooting" | "celebration";
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  cpX: number;
  cpY: number; // bezier control point
  t: number; // 0→1 progress
  speed: number;
  heldFor: number; // frames held
  holdMax: number;
  flashAlpha: number;
}

// ─── Crowd Audio (Web Audio API, synthesised — no external file) ─────────────
function buildAudio() {
  try {
    const AC =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    if (!AC) return null;
    const ctx = new AC();

    const master = ctx.createGain();
    master.gain.value = 0.22;
    master.connect(ctx.destination);

    // Build 4-second pink noise buffer (Paul Kellet's algo — sounds like real crowd)
    const len = ctx.sampleRate * 4;
    const buf = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let c = 0; c < 2; c++) {
      const d = buf.getChannelData(c);
      let b0 = 0,
        b1 = 0,
        b2 = 0,
        b3 = 0,
        b4 = 0,
        b5 = 0,
        b6 = 0;
      for (let i = 0; i < len; i++) {
        const w = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + w * 0.0555179;
        b1 = 0.99332 * b1 + w * 0.0750759;
        b2 = 0.969 * b2 + w * 0.153852;
        b3 = 0.8665 * b3 + w * 0.3104856;
        b4 = 0.55 * b4 + w * 0.5329522;
        b5 = -0.7616 * b5 - w * 0.016898;
        d[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362) * 0.11;
        b6 = w * 0.115926;
      }
    }

    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.loop = true;

    // Bandpass — crowd hum zone 400-1200 Hz
    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = 680;
    bp.Q.value = 0.45;

    // Low-shelf — stadium rumble
    const ls = ctx.createBiquadFilter();
    ls.type = "lowshelf";
    ls.frequency.value = 220;
    ls.gain.value = 9;

    // High-shelf rolloff — take harsh edge off
    const hs = ctx.createBiquadFilter();
    hs.type = "highshelf";
    hs.frequency.value = 3500;
    hs.gain.value = -8;

    src.connect(bp);
    bp.connect(ls);
    ls.connect(hs);
    hs.connect(master);
    src.start();

    return {
      ctx,
      master,
      unmuted: false,
      cheer(intensity = 1.0) {
        if (!this.unmuted) return;
        const now = ctx.currentTime;
        master.gain.cancelScheduledValues(now);
        master.gain.setValueAtTime(master.gain.value, now);
        master.gain.linearRampToValueAtTime(
          Math.min(0.6 * intensity, 0.6),
          now + 0.35,
        );
        master.gain.exponentialRampToValueAtTime(0.22, now + 4.5);
      },
      setUnmuted(on: boolean) {
        this.unmuted = on;
        if (ctx.state === "suspended") ctx.resume();
        const now = ctx.currentTime;
        master.gain.cancelScheduledValues(now);
        master.gain.setValueAtTime(master.gain.value, now);
        master.gain.setTargetAtTime(on ? 0.22 : 0, now, 0.25);
      },
    };
  } catch {
    return null;
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const clamp = (v: number, lo: number, hi: number) =>
  Math.max(lo, Math.min(hi, v));
const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t);

/** Quadratic Bezier position */
function bezier(
  t: number,
  p0x: number,
  p0y: number,
  p1x: number,
  p1y: number,
  p2x: number,
  p2y: number,
) {
  const mt = 1 - t;
  return {
    x: mt * mt * p0x + 2 * mt * t * p1x + t * t * p2x,
    y: mt * mt * p0y + 2 * mt * t * p1y + t * t * p2y,
  };
}

/** Pick a random integer in [lo, hi) */
const rng = (lo: number, hi: number) =>
  Math.floor(Math.random() * (hi - lo) + lo);

// ─── Main component ────────────────────────────────────────────────────────────
export default function AnimatedPitch() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioRef = useRef<ReturnType<typeof buildAudio>>(null);
  const rafRef = useRef<number>(0);
  const [muted, setMuted] = useState(true);

  const toggleSound = useCallback(() => {
    setMuted((prev) => {
      const next = !prev;
      if (!audioRef.current) {
        audioRef.current = buildAudio();
      }
      audioRef.current?.setUnmuted(next);
      return next;
    });
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // ── Retina scaling ──
    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const css = canvas.getBoundingClientRect();
      canvas.width = css.width * dpr;
      canvas.height = css.height * dpr;
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    // ── Initialise players ──
    const players: Player[] = DEFS.map((d) => ({
      ...d,
      x: d.hx,
      y: d.hy,
      px: Math.random() * Math.PI * 2,
      py: Math.random() * Math.PI * 2,
      pf: 0.6 + Math.random() * 0.8,
    }));

    // ── Initialise ball ──
    const ball: Ball = {
      x: 150,
      y: 152,
      trail: [],
      holderId: 5,
      state: "held",
      fromX: 150,
      fromY: 152,
      toX: 150,
      toY: 152,
      cpX: 150,
      cpY: 152,
      t: 0,
      speed: 0.028,
      heldFor: 0,
      holdMax: rng(80, 160),
      flashAlpha: 0,
    };

    let frame = 0;
    let celebFrames = 0;

    // ── Pick next pass target ──
    const pickPass = (fromId: number, toId: number | null = null) => {
      // Prefer adjacent roles, occasionally long ball
      const from = DEFS[fromId];
      const longBall = Math.random() < 0.15;
      let candidates = DEFS.filter((d) => d.id !== fromId);
      if (!longBall) {
        // filter to same or ±1 role depth
        const order = ["gk", "def", "mid", "fwd"];
        const ri = order.indexOf(from.role);
        candidates = candidates.filter(
          (d) => Math.abs(order.indexOf(d.role) - ri) <= 1,
        );
      }
      if (candidates.length === 0)
        candidates = DEFS.filter((d) => d.id !== fromId);
      const pick =
        toId !== null ? DEFS[toId] : candidates[rng(0, candidates.length)];
      return pick.id;
    };

    const startPass = (fromId: number, toId: number, speed = 0.028) => {
      const from = players[fromId];
      const to = players[toId];
      ball.fromX = ball.x;
      ball.fromY = ball.y;
      ball.toX = to.x;
      ball.toY = to.y;
      // slight arc — perpendicular offset
      const dx = to.x - from.x,
        dy = to.y - from.y;
      const perp = 0.25 * (Math.random() > 0.5 ? 1 : -1);
      ball.cpX = (from.x + to.x) / 2 - dy * perp;
      ball.cpY = (from.y + to.y) / 2 + dx * perp;
      ball.holderId = -1;
      ball.state = "passing";
      ball.speed = speed;
      ball.t = 0;
    };

    const startShot = () => {
      ball.fromX = ball.x;
      ball.fromY = ball.y;
      // Shoot toward top goal centre, slightly off target
      ball.toX = 130 + Math.random() * 40;
      ball.toY = 5 + Math.random() * 30;
      ball.cpX = ball.x + (Math.random() - 0.5) * 60;
      ball.cpY = (ball.y + ball.toY) / 2;
      ball.holderId = -1;
      ball.state = "shooting";
      ball.speed = 0.048;
      ball.t = 0;
    };

    // ── Shot timer ──
    let shotCountdown = rng(340, 520); // frames until next shot

    // ── Draw utilities ──
    const ctx2 = canvas.getContext("2d")!;

    const drawPitch = (_sc: number) => {
      // Background
      ctx2.fillStyle = "#050b05";
      ctx2.fillRect(0, 0, canvas.width, canvas.height);

      ctx2.save();
      ctx2.scale(canvas.width / S, canvas.height / S);

      // Subtle pitch stripe pattern
      for (let i = 0; i < 6; i++) {
        ctx2.fillStyle =
          i % 2 === 0 ? "rgba(0,40,0,0.35)" : "rgba(0,30,0,0.35)";
        ctx2.fillRect(0, i * 50, S, 50);
      }

      // Pitch lines
      ctx2.strokeStyle = "rgba(255,255,255,0.1)";
      ctx2.lineWidth = 0.8;

      // Outer boundary
      ctx2.strokeRect(10, 10, S - 20, S - 20);
      // Halfway line
      ctx2.beginPath();
      ctx2.moveTo(10, S / 2);
      ctx2.lineTo(S - 10, S / 2);
      ctx2.stroke();
      // Centre circle
      ctx2.beginPath();
      ctx2.arc(S / 2, S / 2, 38, 0, Math.PI * 2);
      ctx2.stroke();
      // Centre dot
      ctx2.fillStyle = "rgba(0,255,135,0.5)";
      ctx2.beginPath();
      ctx2.arc(S / 2, S / 2, 2.5, 0, Math.PI * 2);
      ctx2.fill();
      // Penalty areas
      ctx2.strokeRect(85, 10, 130, 65);
      ctx2.strokeRect(85, S - 75, 130, 65);
      // Goal boxes
      ctx2.strokeRect(115, 10, 70, 28);
      ctx2.strokeRect(115, S - 38, 70, 28);
      // Goals (bright)
      ctx2.strokeStyle = "rgba(0,255,135,0.22)";
      ctx2.lineWidth = 1.5;
      ctx2.strokeRect(126, 5, 48, 12);
      ctx2.strokeRect(126, S - 17, 48, 12);

      ctx2.restore();
    };

    const drawPlayers = (_sc: number) => {
      ctx2.save();
      ctx2.scale(canvas.width / S, canvas.height / S);

      players.forEach((p) => {
        const hasball = p.id === ball.holderId;
        const radius = hasball ? 5.5 : 4.2;
        const glowR = hasball ? 22 : 14;

        // Outer glow
        const grad = ctx2.createRadialGradient(p.x, p.y, 0, p.x, p.y, glowR);
        grad.addColorStop(0, p.glow.replace("0.7", hasball ? "0.85" : "0.45"));
        grad.addColorStop(1, "rgba(0,0,0,0)");
        ctx2.fillStyle = grad;
        ctx2.beginPath();
        ctx2.arc(p.x, p.y, glowR, 0, Math.PI * 2);
        ctx2.fill();

        // Player dot
        ctx2.fillStyle = p.color;
        ctx2.shadowColor = p.glow;
        ctx2.shadowBlur = hasball ? 10 : 5;
        ctx2.beginPath();
        ctx2.arc(p.x, p.y, radius, 0, Math.PI * 2);
        ctx2.fill();
        ctx2.shadowBlur = 0;

        // Pulsing ring on ball holder
        if (hasball) {
          const pulse = 0.55 + 0.45 * Math.sin(frame * 0.14);
          ctx2.strokeStyle = p.color;
          ctx2.globalAlpha = pulse * 0.8;
          ctx2.lineWidth = 1.2;
          ctx2.beginPath();
          ctx2.arc(p.x, p.y, 8.5 + pulse * 3, 0, Math.PI * 2);
          ctx2.stroke();
          ctx2.globalAlpha = 1;
        }
      });

      ctx2.restore();
    };

    const drawBall = () => {
      ctx2.save();
      ctx2.scale(canvas.width / S, canvas.height / S);

      // Trail
      ball.trail.forEach((pt, i) => {
        const frac = (i + 1) / ball.trail.length;
        ctx2.globalAlpha = pt.a * frac * frac;
        ctx2.fillStyle = "#ffffff";
        ctx2.beginPath();
        ctx2.arc(pt.x, pt.y, 2 + frac * 1.5, 0, Math.PI * 2);
        ctx2.fill();
      });
      ctx2.globalAlpha = 1;

      // Ball glow
      const bg = ctx2.createRadialGradient(
        ball.x,
        ball.y,
        0,
        ball.x,
        ball.y,
        12,
      );
      bg.addColorStop(0, "rgba(255,255,255,0.4)");
      bg.addColorStop(1, "rgba(0,0,0,0)");
      ctx2.fillStyle = bg;
      ctx2.beginPath();
      ctx2.arc(ball.x, ball.y, 12, 0, Math.PI * 2);
      ctx2.fill();

      // Ball body
      ctx2.fillStyle = "#ffffff";
      ctx2.shadowColor = "rgba(255,255,255,0.9)";
      ctx2.shadowBlur = 8;
      ctx2.beginPath();
      ctx2.arc(ball.x, ball.y, 3.5, 0, Math.PI * 2);
      ctx2.fill();
      ctx2.shadowBlur = 0;

      // Flash on shot/celebration
      if (ball.flashAlpha > 0.01) {
        const fg = ctx2.createRadialGradient(
          ball.x,
          ball.y,
          0,
          ball.x,
          ball.y,
          60 * ball.flashAlpha,
        );
        fg.addColorStop(0, `rgba(255,220,50,${ball.flashAlpha * 0.8})`);
        fg.addColorStop(0.4, `rgba(255,140,0,${ball.flashAlpha * 0.3})`);
        fg.addColorStop(1, "rgba(0,0,0,0)");
        ctx2.fillStyle = fg;
        ctx2.beginPath();
        ctx2.arc(ball.x, ball.y, 60, 0, Math.PI * 2);
        ctx2.fill();
        ball.flashAlpha *= 0.88;
      }

      ctx2.restore();
    };

    // ── Simulation step ───────────────────────────────────────────────────────
    const tick = () => {
      frame++;

      // Player drift — smooth sinusoidal wander around home
      players.forEach((p) => {
        const t = frame * 0.008 * p.pf;
        const wobbleX = Math.sin(t + p.px) * DEFS[p.id].range * 0.55;
        const wobbleY = Math.cos(t * 1.3 + p.py) * DEFS[p.id].range * 0.35;

        // Pull toward ball if holding or close
        let pullX = 0,
          pullY = 0;
        if (p.id === ball.holderId) {
          pullX = (ball.x - p.x) * 0.3;
          pullY = (ball.y - p.y) * 0.3;
        }

        const tx = clamp(DEFS[p.id].hx + wobbleX + pullX, 12, S - 12);
        const ty = clamp(DEFS[p.id].hy + wobbleY + pullY, 12, S - 12);

        p.x = lerp(p.x, tx, 0.04);
        p.y = lerp(p.y, ty, 0.04);
      });

      // Ball logic
      switch (ball.state) {
        case "held": {
          // Snap ball to holder's feet
          const h = players[ball.holderId];
          ball.x = lerp(ball.x, h.x, 0.35);
          ball.y = lerp(ball.y, h.y, 0.35);
          ball.heldFor++;

          shotCountdown--;
          if (shotCountdown <= 0 && ball.holderId >= 8) {
            // Forward shoots!
            startShot();
            shotCountdown = rng(340, 520);
          } else if (ball.heldFor >= ball.holdMax) {
            const nextId = pickPass(ball.holderId);
            startPass(ball.holderId, nextId);
          }
          break;
        }

        case "passing": {
          ball.t = clamp(ball.t + ball.speed, 0, 1);
          const et = easeInOut(ball.t);
          const pos = bezier(
            et,
            ball.fromX,
            ball.fromY,
            ball.cpX,
            ball.cpY,
            ball.toX,
            ball.toY,
          );
          // Add trail
          ball.trail.push({ x: ball.x, y: ball.y, a: 0.85 });
          if (ball.trail.length > 14) ball.trail.shift();
          ball.x = pos.x;
          ball.y = pos.y;

          if (ball.t >= 1) {
            // Find nearest player to landing spot
            let nearest = 0,
              bestD = 99999;
            players.forEach((p) => {
              const d = Math.hypot(p.x - ball.x, p.y - ball.y);
              if (d < bestD) {
                bestD = d;
                nearest = p.id;
              }
            });
            ball.holderId = nearest;
            ball.state = "held";
            ball.heldFor = 0;
            ball.holdMax = rng(70, 160);
            ball.trail = [];
            audioRef.current?.cheer(0.35);
          }
          break;
        }

        case "shooting": {
          ball.t = clamp(ball.t + ball.speed, 0, 1);
          const et = easeInOut(ball.t);
          const pos = bezier(
            et,
            ball.fromX,
            ball.fromY,
            ball.cpX,
            ball.cpY,
            ball.toX,
            ball.toY,
          );
          ball.trail.push({ x: ball.x, y: ball.y, a: 0.95 });
          if (ball.trail.length > 20) ball.trail.shift();
          ball.x = pos.x;
          ball.y = pos.y;

          if (ball.t >= 1) {
            // GOAL! flash + celebration then reset
            ball.flashAlpha = 1.0;
            ball.state = "celebration";
            celebFrames = 90;
            audioRef.current?.cheer(1.0);
          }
          break;
        }

        case "celebration": {
          celebFrames--;
          // GK runs toward the ball
          const gk = players[0];
          gk.x = lerp(gk.x, ball.x, 0.06);
          gk.y = lerp(gk.y, ball.y, 0.06);

          if (celebFrames <= 0) {
            // Reset: GK kick-out from goal
            ball.x = 150;
            ball.y = 45;
            ball.trail = [];
            ball.state = "held";
            ball.holderId = 0; // GK has it
            ball.heldFor = 0;
            ball.holdMax = rng(60, 100);
          }
          break;
        }
      }

      // ── Draw ──────────────────────────────────────────────────────────────
      drawPitch(1);
      drawPlayers(1);
      drawBall();

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafRef.current);
      ro.disconnect();
    };
  }, []);

  return (
    <div
      style={{
        position: "relative",
        width: "min(340px, 90%)",
        aspectRatio: "1",
      }}
    >
      {/* Canvas pitch */}
      <canvas
        ref={canvasRef}
        style={{
          width: "100%",
          height: "100%",
          borderRadius: "1.5rem",
          display: "block",
          border: "1px solid rgba(255,255,255,0.07)",
        }}
      />

      {/* Live badge */}
      <div
        style={{
          position: "absolute",
          top: "0.75rem",
          left: "0.85rem",
          display: "flex",
          alignItems: "center",
          gap: 5,
          background: "rgba(0,0,0,0.65)",
          backdropFilter: "blur(8px)",
          borderRadius: "999px",
          padding: "3px 10px",
          border: "1px solid rgba(239,68,68,0.35)",
        }}
      >
        <span
          style={{
            width: 12,
            height: 12,
            borderRadius: "50%",
            background: "#EF4444",
            boxShadow: "0 0 6px #EF4444",
            display: "inline-block",
            animation: "pulse 1.4s ease-in-out infinite",
          }}
        />
        <span
          style={{
            fontSize: "0.6rem",
            fontWeight: 700,
            letterSpacing: "0.12em",
            color: "#fff",
            textTransform: "uppercase",
          }}
        >
          Live
        </span>
      </div>

      {/* Sound toggle */}
      <button
        onClick={toggleSound}
        title={muted ? "Unmute crowd" : "Mute crowd"}
        style={{
          position: "absolute",
          bottom: "0.75rem",
          right: "0.85rem",
          width: 34,
          height: 34,
          borderRadius: "50%",
          background: muted ? "rgba(0,0,0,0.65)" : "rgba(0,255,135,0.15)",
          border: `1px solid ${muted ? "rgba(255,255,255,0.15)" : "rgba(0,255,135,0.4)"}`,
          backdropFilter: "blur(8px)",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "all 0.25s cubic-bezier(0.32,0.72,0,1)",
          padding: 0,
          color: muted ? "rgba(255,255,255,0.5)" : "#00FF87",
        }}
      >
        {muted ? (
          // Mute icon
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          >
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
            <line x1="23" y1="9" x2="17" y2="15" />
            <line x1="17" y1="9" x2="23" y2="15" />
          </svg>
        ) : (
          // Volume icon
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          >
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
            <path d="M15.54 8.46a5 5 0 0 1 0 7.07M19.07 4.93a10 10 0 0 1 0 14.14" />
          </svg>
        )}
      </button>

      {/* CSS pulse animation */}
      <style>{`@keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.45;transform:scale(0.75)} }`}</style>
    </div>
  );
}
