"use client";

import type { ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { BombMark } from "@/components/status-badge";

export type StickerTone = "orange" | "yellow" | "green" | "red" | "blue";

const STICKER_TONE_CLASS: Record<StickerTone, string> = {
  orange: "bg-accent-orange text-bg-primary",
  yellow: "bg-accent-yellow text-bg-primary",
  green: "bg-success-green text-bg-primary",
  red: "bg-danger-red text-bg-primary",
  blue: "bg-info-blue text-bg-primary",
};

const TILT_CLASS = {
  left: "-rotate-2",
  right: "rotate-2",
  none: "",
} as const;

/** Decorative dark-carnival backdrop with vertical columns and swaying vector stars. */
export function ComicBackdrop() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 overflow-hidden z-0"
    >
      {/* Slowly drifting carnival backdrop stripes (seamless 2x loop) */}
      <div className="animate-stripes-drift flex w-[200%] h-full opacity-30">
        {Array.from({ length: 24 }).map((_, idx) => (
          <div
            key={idx}
            className={
              idx % 2 === 0
                ? "flex-1 h-full bg-surface border-x border-border-ash/35"
                : "flex-1 h-full bg-transparent"
            }
          />
        ))}
      </div>

      {/* Hanging comic star ornaments */}
      <svg
        className="animate-star-sway absolute -top-1 left-[7%] w-9 h-24 text-border-ash"
        viewBox="0 0 36 96"
        fill="none"
      >
        <line x1="18" y1="0" x2="18" y2="62" stroke="currentColor" strokeWidth="2" />
        <polygon
          points="18,54 22,64 32,66 24,73 26,83 18,78 10,83 12,73 4,66 14,64"
          fill="#2A2F40"
          stroke="#FFC933"
          strokeWidth="2"
        />
      </svg>

      <svg
        className="animate-star-sway absolute -top-1 right-[9%] w-9 h-28 text-border-ash hidden sm:block"
        style={{ animationDelay: "1.1s" }}
        viewBox="0 0 36 112"
        fill="none"
      >
        <line x1="18" y1="0" x2="18" y2="76" stroke="currentColor" strokeWidth="2" />
        <polygon
          points="18,68 22,78 32,80 24,87 26,97 18,92 10,97 12,87 4,80 14,78"
          fill="#2A2F40"
          stroke="#FF7A1A"
          strokeWidth="2"
        />
      </svg>

      <svg
        className="animate-star-sway absolute -top-1 left-[78%] w-7 h-20 text-border-ash hidden md:block"
        style={{ animationDelay: "2.1s" }}
        viewBox="0 0 28 80"
        fill="none"
      >
        <line x1="14" y1="0" x2="14" y2="52" stroke="currentColor" strokeWidth="2" />
        <polygon
          points="14,46 17,53 24,55 19,60 20,67 14,64 8,67 9,60 4,55 11,53"
          fill="#2A2F40"
          stroke="#4DB8FF"
          strokeWidth="1.8"
        />
      </svg>
    </div>
  );
}

/** Contrasting left showcase column (`#14161F`) separating media/briefing from right controls. */
export function ComicLeftPanel({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl bg-bg-primary border-2 border-border-ash p-4 sm:p-5 space-y-4 ${className}`}
    >
      {children}
    </div>
  );
}

/** High-contrast paper-cutout stage frame inspired by indie-comic showcase cards. */
export function ComicCutoutFrame({
  children,
  className = "",
  innerClassName = "",
}: {
  children: ReactNode;
  className?: string;
  innerClassName?: string;
}) {
  return (
    <div
      className={`rounded-2xl bg-text-primary p-1.5 sm:p-2 comic-ribbon-shadow ${className}`}
    >
      <div
        className={`rounded-xl bg-bg-primary border-2 border-bg-primary overflow-hidden ${innerClassName}`}
      >
        {children}
      </div>
    </div>
  );
}

/** Angled high-contrast comic sticker tag (`tabular-nums`, dark text on bright fill). */
export function ComicSticker({
  children,
  tone = "orange",
  tilt = "left",
  className = "",
}: {
  children: ReactNode;
  tone?: StickerTone;
  tilt?: keyof typeof TILT_CLASS;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 font-display font-bold text-xs sm:text-sm tabular-nums border-2 border-bg-primary comic-ribbon-shadow ${STICKER_TONE_CLASS[tone]} ${TILT_CLASS[tilt]} ${className}`}
    >
      {children}
    </span>
  );
}

export interface ComicStageFrameProps {
  bannerTitle: string;
  bannerTone?: "default" | "orange" | "red" | "green";
  rightSlot?: ReactNode;
  maxWidthClass?: string;
  children: ReactNode;
}

const BANNER_ACCENT: Record<
  NonNullable<ComicStageFrameProps["bannerTone"]>,
  string
> = {
  default: "border-text-primary text-text-primary",
  orange: "border-accent-orange text-accent-orange",
  red: "border-danger-red text-danger-red",
  green: "border-success-green text-success-green",
};

/** Shared outer comic panel framing each of the 8 application routes. */
export function ComicStageFrame({
  bannerTitle,
  bannerTone = "default",
  rightSlot,
  maxWidthClass = "max-w-4xl",
  children,
}: ComicStageFrameProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <main className="relative flex-1 flex items-center justify-center px-4 py-8 sm:py-10">
      <ComicBackdrop />
      <motion.section
        initial={prefersReducedMotion ? false : { y: 8, scale: 0.99 }}
        animate={{ y: 0, scale: 1 }}
        transition={{
          duration: prefersReducedMotion ? 0.01 : 0.24,
          ease: [0.16, 1, 0.3, 1],
        }}
        className={`relative z-10 w-full ${maxWidthClass} rounded-3xl bg-surface border-2 border-border-ash p-5 sm:p-8 comic-panel-shadow`}
      >
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <motion.h1
              initial={prefersReducedMotion ? false : { rotate: -4, scale: 0.96 }}
              animate={prefersReducedMotion ? false : { rotate: -2, scale: 1 }}
              transition={{
                duration: prefersReducedMotion ? 0.01 : 0.28,
                ease: [0.16, 1, 0.3, 1],
              }}
              className={`-rotate-2 inline-flex items-center gap-2.5 rounded-2xl bg-bg-primary border-2 px-4 sm:px-5 py-2 font-display font-bold text-2xl sm:text-3xl uppercase tracking-tight comic-ribbon-shadow ${BANNER_ACCENT[bannerTone]}`}
            >
              <BombMark size={30} />
              <span>{bannerTitle}</span>
            </motion.h1>
          </div>

          {rightSlot ? (
            <div className="flex flex-wrap items-center gap-2.5">{rightSlot}</div>
          ) : null}
        </header>

        {children}

        <div className="mt-6 pt-4 border-t border-border-ash flex items-center justify-between gap-3">
          <span className="text-xs font-semibold text-text-muted">
            Cadet Onboarding Race
          </span>
          <div className="inline-flex items-center gap-2 opacity-90">
            <BombMark size={22} />
            <span className="font-display font-bold text-xs uppercase tracking-wider text-text-muted">
              Answer It! or BOOM!
            </span>
          </div>
        </div>
      </motion.section>
    </main>
  );
}

export type SceneVariant = "join" | "lobby" | "play" | "boom" | "victory" | "admin";

/** Crisp geometric SVG bomb scenes matching `public/images/logo-icon.svg`. */
export function BombSceneArt({ variant }: { variant: SceneVariant }) {
  if (variant === "boom") {
    return (
      <svg
        viewBox="0 0 240 170"
        className="w-full h-auto max-h-44"
        role="img"
        aria-label="Comic bomb explosion burst"
      >
        <rect width="240" height="170" fill="#14161F" />
        <polygon
          points="120,10 142,46 184,22 172,62 218,64 184,92 214,128 168,124 172,162 132,138 112,166 96,132 52,154 66,114 22,114 56,84 26,48 72,56 68,18 104,44"
          fill="#FF3B4E"
          stroke="#F5F7FA"
          strokeWidth="4"
          strokeLinejoin="round"
        />
        <polygon
          points="120,34 136,62 166,46 156,74 188,80 160,98 176,124 144,116 132,142 114,118 82,130 92,102 62,92 90,76 78,48 108,60"
          fill="#FFC933"
        />
        <text
          x="120"
          y="96"
          textAnchor="middle"
          fill="#14161F"
          fontFamily="var(--font-fredoka), sans-serif"
          fontWeight="700"
          fontSize="30"
        >
          BOOM!
        </text>
      </svg>
    );
  }

  if (variant === "victory") {
    return (
      <svg
        viewBox="0 0 240 170"
        className="w-full h-auto max-h-44"
        role="img"
        aria-label="Defused bomb victory emblem"
      >
        <rect width="240" height="170" fill="#14161F" />
        {/* Snipped fuse & check shield */}
        <circle cx="120" cy="92" r="54" fill="#1F2330" stroke="#2EE59D" strokeWidth="5" />
        <path
          d="M92 94 L112 114 L152 72"
          fill="none"
          stroke="#2EE59D"
          strokeWidth="9"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <polygon
          points="56,36 60,46 70,48 60,52 56,62 52,52 42,48 52,46"
          fill="#FFC933"
        />
        <polygon
          points="186,28 190,38 200,40 190,44 186,54 182,44 172,40 182,38"
          fill="#4DB8FF"
        />
      </svg>
    );
  }

  if (variant === "admin") {
    return (
      <svg
        viewBox="0 0 240 170"
        className="w-full h-auto max-h-44"
        role="img"
        aria-label="Facilitator control console emblem"
      >
        <rect width="240" height="170" fill="#14161F" />
        <rect
          x="42"
          y="34"
          width="156"
          height="104"
          rx="16"
          fill="#1F2330"
          stroke="#F5F7FA"
          strokeWidth="4"
        />
        <rect x="60" y="52" width="120" height="36" rx="8" fill="#2A2F40" />
        <circle cx="80" cy="70" r="8" fill="#2EE59D" />
        <rect x="98" y="65" width="66" height="10" rx="5" fill="#9AA3B5" />
        <rect x="60" y="100" width="52" height="22" rx="8" fill="#FF7A1A" />
        <rect x="122" y="100" width="58" height="22" rx="8" fill="#4DB8FF" />
      </svg>
    );
  }

  const isCritical = variant === "play";
  const ringColor = variant === "lobby" ? "#4DB8FF" : "#FF7A1A";

  return (
    <svg
      viewBox="0 0 240 170"
      className="w-full h-auto max-h-44"
      role="img"
      aria-label="Cartoon bomb mascot with lit fuse"
    >
      <rect width="240" height="170" fill="#14161F" />
      {/* Background blast rays */}
      <circle cx="120" cy="96" r="68" fill="#1F2330" />
      <g className={isCritical ? "bomb-urgency-body" : "animate-bomb-breathe"}>
        {/* Fuse */}
        <path
          d="M120 48 C120 30 142 30 150 18"
          fill="none"
          stroke="#9AA3B5"
          strokeWidth="5"
          strokeLinecap="round"
        />
        {/* Spark */}
        <g className={isCritical ? "animate-spark-flicker bomb-urgency-spark" : "animate-spark-flicker"}>
          <polygon
            points="154,4 158,14 170,18 158,22 154,32 150,22 138,18 150,14"
            fill="#FFC933"
          />
          <circle cx="154" cy="18" r="5" fill="#FF7A1A" />
        </g>
        {/* Cap */}
        <rect x="102" y="44" width="36" height="18" rx="6" fill="#363C50" />
        {/* Bomb body */}
        <circle
          cx="120"
          cy="104"
          r="50"
          fill="#2A2F40"
          stroke={ringColor}
          strokeWidth="5"
        />
        {/* Shine arc */}
        <path
          d="M84 88 A38 38 0 0 1 106 68"
          fill="none"
          stroke="#F5F7FA"
          strokeOpacity="0.35"
          strokeWidth="5"
          strokeLinecap="round"
        />
        {/* Eyes */}
        <circle cx="104" cy="100" r="10" fill="#F5F7FA" />
        <circle cx="136" cy="100" r="10" fill="#F5F7FA" />
        <circle cx="107" cy="97" r="5" fill="#14161F" />
        <circle cx="139" cy="97" r="5" fill="#14161F" />
        {/* Nervous mouth */}
        <path
          d="M100 126 q6 -8 13 0 t13 0 t13 0"
          fill="none"
          stroke="#F5F7FA"
          strokeWidth="4.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Sweat drop */}
        <path d="M162 80 q7 11 0 16 q-7 -5 0 -16z" fill="#4DB8FF" />
      </g>
    </svg>
  );
}
