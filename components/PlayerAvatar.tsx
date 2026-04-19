import { useState } from "react";

export type AvatarSize = "xs" | "sm" | "md" | "lg" | "xl";

export interface PlayerAvatarProps {
  name: string;
  uid?: string;
  pictureID?: number | null;
  downloaded?: boolean;
  position?: string;
  size?: AvatarSize;
  starred?: boolean;
  style?: React.CSSProperties;
}

const SIZE_PX: Record<AvatarSize, number> = {
  xs: 28,
  sm: 36,
  md: 48,
  lg: 60,
  xl: 80,
};

// Accepts both DB values (gk/def/mid/att/bench) and display values (goalkeeper/etc.)
const RING_COLOR: Record<string, string> = {
  gk: "#FBBF24",
  goalkeeper: "#FBBF24",
  def: "#3B82F6",
  defender: "#3B82F6",
  mid: "#A855F7",
  midfielder: "#A855F7",
  att: "#EF4444",
  forward: "#EF4444",
  bench: "#6B7280",
  unknown: "#6B7280",
};

const GRAD_COLORS: Record<string, readonly [string, string]> = {
  gk: ["#F59E0B", "#78350F"],
  goalkeeper: ["#F59E0B", "#78350F"],
  def: ["#3B82F6", "#1E3A5F"],
  defender: ["#3B82F6", "#1E3A5F"],
  mid: ["#A855F7", "#3B0764"],
  midfielder: ["#A855F7", "#3B0764"],
  att: ["#EF4444", "#7F1D1D"],
  forward: ["#EF4444", "#7F1D1D"],
  bench: ["#6B7280", "#111827"],
  unknown: ["#6B7280", "#111827"],
};

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// SVG IDs must not contain spaces or special chars
function toSvgId(s: string): string {
  return "pav_" + s.replace(/[^a-zA-Z0-9]/g, "_").slice(0, 32);
}

export default function PlayerAvatar({
  name,
  uid,
  pictureID,
  downloaded,
  position = "bench",
  size = "md",
  starred = false,
  style,
}: PlayerAvatarProps) {
  const [imgFailed, setImgFailed] = useState(false);

  const px = SIZE_PX[size] ?? 48;
  const ring = RING_COLOR[position] ?? "#6B7280";
  const [c1, c2] = GRAD_COLORS[position] ?? GRAD_COLORS.bench;
  const initials = getInitials(name);
  const showPhoto =
    downloaded && pictureID != null && pictureID > 0 && !imgFailed;
  const gradId = toSvgId(uid ?? name);
  const starPx = Math.max(10, Math.round(px * 0.3));
  const starOff = -Math.floor(starPx / 3);

  return (
    <div
      style={{
        width: px,
        height: px,
        position: "relative",
        flexShrink: 0,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        ...style,
      }}
    >
      {/* Position-coloured ring */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: -2,
          borderRadius: "50%",
          border: `2px solid ${ring}`,
          boxShadow: `0 0 8px ${ring}55`,
          pointerEvents: "none",
          zIndex: 2,
        }}
      />

      {/* Avatar face */}
      <div
        style={{
          width: px,
          height: px,
          borderRadius: "50%",
          overflow: "hidden",
          background: "#0d0d1a",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {showPhoto ? (
          <img
            src={`/api/picture/${pictureID}`}
            alt={name}
            width={px}
            height={px}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              objectPosition: "top center",
              display: "block",
            }}
            onError={() => setImgFailed(true)}
          />
        ) : (
          /* Initials-based SVG avatar — no external network calls */
          <svg
            width={px}
            height={px}
            viewBox="0 0 40 40"
            style={{ display: "block" }}
            aria-label={name}
          >
            <defs>
              <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={c1} />
                <stop offset="100%" stopColor={c2} />
              </linearGradient>
            </defs>
            {/* Background fill */}
            <circle cx="20" cy="20" r="20" fill={`url(#${gradId})`} />
            {/* Subtle specular highlight at top */}
            <ellipse
              cx="20"
              cy="11"
              rx="11"
              ry="5.5"
              fill="rgba(255,255,255,0.13)"
            />
            {/* Initials */}
            <text
              x="20"
              y="26"
              textAnchor="middle"
              fill="rgba(255,255,255,0.96)"
              fontSize={initials.length > 2 ? 10 : 14}
              fontWeight="700"
              fontFamily="system-ui, -apple-system, 'Segoe UI', sans-serif"
              letterSpacing="0.5"
            >
              {initials}
            </text>
          </svg>
        )}
      </div>

      {/* Starred badge — neon green dot */}
      {starred && (
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            top: starOff,
            right: starOff,
            zIndex: 3,
            width: starPx,
            height: starPx,
            borderRadius: "50%",
            background: "#00FF87",
            color: "#000",
            fontSize: Math.round(starPx * 0.55),
            fontWeight: 900,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 0 10px rgba(0,255,135,0.9)",
          }}
        >
          ★
        </div>
      )}
    </div>
  );
}
