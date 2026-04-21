import { useState } from "react";
import PlayerAvatar from "./PlayerAvatar";

interface PitchPlayer {
  uid: string;
  name: string;
  position: string;
  value: number;
  totalPoints?: number;
  club?: string;
  starred?: boolean;
  pictureID?: number;
  downloaded?: boolean;
}

interface PitchViewProps {
  players: PitchPlayer[];
  formation?: string;
  onPlayerClick?: (p: PitchPlayer) => void;
  readOnly?: boolean;
}

const FORMATION_ROWS: Record<string, number[]> = {
  "4-3-3": [1, 4, 3, 3],
  "4-4-2": [1, 4, 4, 2],
  "3-5-2": [1, 3, 5, 2],
  "5-3-2": [1, 5, 3, 2],
  "4-2-3-1": [1, 4, 2, 3, 1],
  "3-4-3": [1, 3, 4, 3],
};


const POS_COLORS: Record<string, { bg: string; border: string }> = {
  goalkeeper: { bg: "rgba(251,191,36,0.2)", border: "#FBBF24" },
  defender: { bg: "rgba(59,130,246,0.2)", border: "#3B82F6" },
  midfielder: { bg: "rgba(168,85,247,0.2)", border: "#A855F7" },
  forward: { bg: "rgba(239,68,68,0.2)", border: "#EF4444" },
  unknown: { bg: "rgba(156,163,175,0.2)", border: "#9CA3AF" },
};

function PlayerSlot({
  player,
  empty,
  onClick,
  readOnly,
}: {
  player?: PitchPlayer;
  empty?: boolean;
  onClick?: () => void;
  readOnly?: boolean;
}) {
  const [hovered, setHovered] = useState(false);

  if (empty || !player) {
    return (
      <div
        onClick={readOnly ? undefined : onClick}
        className="flex flex-col items-center gap-1 cursor-pointer"
        style={{ opacity: 0.4 }}
      >
        <div
          className="w-11 h-11 rounded-full flex items-center justify-center text-xl"
          style={{
            border: "2px dashed rgba(255,255,255,0.2)",
            background: "rgba(255,255,255,0.03)",
          }}
        >
          +
        </div>
        <span
          className="text-xs font-bold px-1.5 py-0.5 rounded"
          style={{
            background: "rgba(0,0,0,0.6)",
            color: "rgba(255,255,255,0.5)",
            fontSize: "0.55rem",
          }}
        >
          EMPTY
        </span>
      </div>
    );
  }

  const posStyle = POS_COLORS[player.position] ?? POS_COLORS.unknown;

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="pitch-player"
      style={{ cursor: readOnly ? "default" : "pointer" }}
    >
      <div
        style={{
          transform: hovered ? "scale(1.18)" : "scale(1)",
          transition: "transform 0.25s cubic-bezier(0.34,1.56,0.64,1)",
          filter: hovered
            ? `drop-shadow(0 0 10px ${posStyle.border}90)`
            : "none",
        }}
      >
        <PlayerAvatar
          name={player.name}
          uid={player.uid}
          pictureID={player.pictureID}
          downloaded={player.downloaded}
          position={player.position}
          size="lg"
          starred={player.starred}
        />
      </div>
      <div className="pitch-player-name">{player.name.split(" ").pop()}</div>
      {player.totalPoints !== undefined && (
        <div className="pitch-player-pts">{player.totalPoints}pts</div>
      )}
    </div>
  );
}

export default function PitchView({
  players,
  formation = "4-3-3",
  onPlayerClick,
  readOnly = false,
}: PitchViewProps) {
  const rows = FORMATION_ROWS[formation] ?? FORMATION_ROWS["4-3-3"];

  // Distribute players by position rows (GK → DEF → MID → FWD)
  const byPos: PitchPlayer[][] = rows.map(() => []);
  const gks = players.filter((p) => p.position === "goalkeeper");
  const defs = players.filter((p) => p.position === "defender");
  const mids = players.filter((p) => p.position === "midfielder");
  const fwds = players.filter((p) => p.position === "forward");
  const others = players.filter(
    (p) =>
      !["goalkeeper", "defender", "midfielder", "forward"].includes(p.position),
  );

  // Fill rows in order
  const posGroups = [gks, defs, mids, fwds];
  let posIdx = 0;
  rows.forEach((count, rowIdx) => {
    const group = posGroups[posIdx] ?? others;
    byPos[rowIdx] = group.slice(0, count);
    posIdx++;
  });

  return (
    <div
      className="pitch-bg w-full select-none"
      style={{
        aspectRatio: "9 / 14",
        maxWidth: "420px",
        margin: "0 auto",
        padding: "1.5rem 1rem",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        position: "relative",
      }}
    >
      {/* Centre circle */}
      <div
        className="absolute left-1/2 top-1/2 rounded-full pointer-events-none"
        style={{
          width: "80px",
          height: "80px",
          transform: "translate(-50%, -50%)",
          border: "2px solid rgba(255,255,255,0.12)",
        }}
      />
      {/* Centre line */}
      <div
        className="absolute left-0 right-0 pointer-events-none"
        style={{
          top: "50%",
          height: "1px",
          background: "rgba(255,255,255,0.12)",
        }}
      />

      {/* Rows */}
      {rows.map((count, rowIdx) => (
        <div
          key={rowIdx}
          className="flex items-center justify-around w-full"
          style={{ zIndex: 1, position: "relative" }}
        >
          {[...Array(count)].map((_, slotIdx) => {
            const p = byPos[rowIdx]?.[slotIdx];
            return (
              <PlayerSlot
                key={slotIdx}
                player={p}
                empty={!p}
                onClick={
                  p && onPlayerClick ? () => onPlayerClick(p) : undefined
                }
                readOnly={readOnly}
              />
            );
          })}
        </div>
      ))}

      {/* Formation badge */}
      <div
        className="absolute bottom-3 right-3 text-xs font-black px-2 py-1 rounded-lg"
        style={{
          background: "rgba(0,0,0,0.7)",
          color: "rgba(255,255,255,0.5)",
        }}
      >
        {formation}
      </div>
    </div>
  );
}
