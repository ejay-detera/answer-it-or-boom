import Image from "next/image";
import type { PlayerStatus, SessionStatus } from "@/types/game";

type BadgeStatus = PlayerStatus | SessionStatus;

const STATUS_META: Record<
  BadgeStatus,
  { label: string; toneClass: string; shape: "dot" | "bolt" | "burst" | "check" }
> = {
  waiting: {
    label: "In lobby",
    toneClass: "text-info-blue",
    shape: "dot",
  },
  countdown: {
    label: "Starting soon",
    toneClass: "text-accent-yellow",
    shape: "bolt",
  },
  running: {
    label: "Live",
    toneClass: "text-success-green",
    shape: "bolt",
  },
  finished: {
    label: "Finished",
    toneClass: "text-text-muted",
    shape: "check",
  },
  playing: {
    label: "Playing",
    toneClass: "text-accent-orange",
    shape: "bolt",
  },
  exploded: {
    label: "BOOM!",
    toneClass: "text-danger-red",
    shape: "burst",
  },
  completed: {
    label: "Beat the bomb!",
    toneClass: "text-success-green",
    shape: "check",
  },
};

function StatusGlyph({ shape }: { shape: "dot" | "bolt" | "burst" | "check" }) {
  if (shape === "dot") {
    return (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <circle cx="8" cy="8" r="5" stroke="currentColor" strokeWidth="2.2" />
        <circle cx="8" cy="8" r="2" fill="currentColor" />
      </svg>
    );
  }
  if (shape === "bolt") {
    return (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <path
          d="M9 1.5L3.5 9H8L7 14.5L12.5 7H8L9 1.5Z"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  if (shape === "burst") {
    return (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <path
          d="M8 1.5L9.6 5.2L13.6 4.2L11.2 7.5L14.5 10L10.4 10.6L11 14.5L8 11.9L5 14.5L5.6 10.6L1.5 10L4.8 7.5L2.4 4.2L6.4 5.2L8 1.5Z"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M3 8.5L6.5 12L13 4.5"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function StatusBadge({
  status,
  labelOverride,
}: {
  status: BadgeStatus;
  labelOverride?: string;
}) {
  const meta = STATUS_META[status];
  return (
    <span className={`inline-flex items-center gap-1.5 text-sm font-semibold ${meta.toneClass}`}>
      <StatusGlyph shape={meta.shape} />
      <span>{labelOverride ?? meta.label}</span>
    </span>
  );
}

export function BombMark({ size = 48 }: { size?: number }) {
  return (
    <Image
      src="/images/logo-icon.svg"
      alt=""
      width={size}
      height={size}
      unoptimized
      aria-hidden="true"
      className="shrink-0"
    />
  );
}
