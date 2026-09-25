"use client";

import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useSpring,
} from "motion/react";
import { useEffect, useRef, useState } from "react";
import { BadgeCheck, MailCheck, Radio, Users } from "lucide-react";
import type { Overview } from "@/lib/types";
import { PROGRESS_STAGES, STAGE_META } from "@/lib/stages";
import { percent } from "@/lib/format";
import { AnimatedNumber } from "@/components/ui/Number";
import { Avatar } from "@/components/ui/Avatar";

/** Resting pose: turned slightly toward the headline. */
const BASE_ROTATE_X = 6;
const BASE_ROTATE_Y = -12;
/** How far the pointer can tilt it, in degrees. Kept small: decoration, not a toy. */
const MAX_TILT = 5;
/** Spring for the pointer tilt: soft, no visible bounce. */
const TILT_SPRING = { stiffness: 120, damping: 20, mass: 0.6 };

/**
 * A miniature of the real Overview, floating beside the home headline, filled
 * with live data. The pointer tilts it through a spring (decorative mouse
 * tracking belongs on a landing surface, never on functional data views).
 * The tilt only runs for a fine pointer that can hover, and not at all for
 * reduced motion. The transform is written as one string, which keeps it on
 * the compositor instead of per-axis shorthands.
 */
export function DashboardPreview({ data }: { data: Overview | null }) {
  const reduceMotion = useReducedMotion();
  const [canTilt, setCanTilt] = useState(false);
  const frame = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setCanTilt(window.matchMedia("(hover: hover) and (pointer: fine)").matches);
  }, []);
  const tilt = canTilt && !reduceMotion;

  const pointerX = useMotionValue(0); // -1 … 1 across the hero
  const pointerY = useMotionValue(0);
  const rotateX = useSpring(pointerY, TILT_SPRING);
  const rotateY = useSpring(pointerX, TILT_SPRING);
  const transform = useMotionTemplate`perspective(1400px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;

  useEffect(() => {
    if (!tilt) return;
    // Track the whole hero, not just the card, so it responds before you reach it.
    const hero = frame.current?.closest("section");
    if (!hero) return;
    const onMove = (event: PointerEvent) => {
      const rect = hero.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      const y = ((event.clientY - rect.top) / rect.height) * 2 - 1;
      pointerX.set(BASE_ROTATE_Y + x * MAX_TILT);
      pointerY.set(BASE_ROTATE_X - y * MAX_TILT);
    };
    const onLeave = () => {
      pointerX.set(BASE_ROTATE_Y);
      pointerY.set(BASE_ROTATE_X);
    };
    onLeave();
    hero.addEventListener("pointermove", onMove);
    hero.addEventListener("pointerleave", onLeave);
    return () => {
      hero.removeEventListener("pointermove", onMove);
      hero.removeEventListener("pointerleave", onLeave);
    };
  }, [tilt, pointerX, pointerY]);

  const total = data?.total ?? 0;
  const staticPose = `perspective(1400px) rotateX(${BASE_ROTATE_X}deg) rotateY(${BASE_ROTATE_Y}deg)`;

  return (
    <div ref={frame} className="relative w-full max-w-[560px]" aria-hidden>
      <motion.div
        style={{
          transform: tilt ? transform : reduceMotion ? "none" : staticPose,
        }}
        className="relative will-change-transform"
      >
        {/* The window */}
        <div className="overflow-hidden rounded-[22px] bg-surface shadow-[0_0_0_1px_rgb(21_32_26_/_0.08),0_40px_80px_-30px_rgb(25_50_35_/_0.45)]">
          <div className="flex items-center gap-1.5 border-b border-line bg-surface-2 px-4 py-2.5">
            <span className="h-2.5 w-2.5 rounded-full bg-surface-3" />
            <span className="h-2.5 w-2.5 rounded-full bg-surface-3" />
            <span className="h-2.5 w-2.5 rounded-full bg-surface-3" />
            <span className="ml-3 rounded-full bg-surface px-3 py-0.5 text-[10.5px] text-faint">
              localhost:3100/overview
            </span>
          </div>

          <div className="space-y-4 p-5">
            <p className="font-display text-[20px] font-semibold leading-none text-ink">
              Pipeline{" "}
              <em className="font-medium italic text-accent">overview.</em>
            </p>

            <div className="grid grid-cols-3 gap-2.5">
              <MiniKpi
                featured
                icon={Users}
                label="Consultants"
                value={total}
              />
              <MiniKpi
                icon={MailCheck}
                label="Emailed"
                value={data?.reached.emailed ?? 0}
              />
              <MiniKpi
                icon={BadgeCheck}
                label="Qualified"
                value={data?.reached.qualified ?? 0}
              />
            </div>

            <div className="rounded-2xl p-4 shadow-card">
              <p className="mb-3 text-[9.5px] font-semibold uppercase tracking-[0.16em] text-accent">
                Pipeline funnel
              </p>
              <ul className="space-y-2">
                {PROGRESS_STAGES.slice(0, 5).map((stage) => {
                  const count = data?.reached[stage] ?? 0;
                  return (
                    <li
                      key={stage}
                      className="grid grid-cols-[64px_1fr_28px] items-center gap-2 text-[10.5px]"
                    >
                      <span className="truncate text-muted">
                        {STAGE_META[stage].label}
                      </span>
                      <span className="h-1.5 overflow-hidden rounded-full bg-surface-3">
                        <span
                          className="block h-full origin-left rounded-full transition-transform duration-[250ms] ease-out"
                          style={{
                            background: STAGE_META[stage].color,
                            transform: `scaleX(${total ? Math.max(count / total, count ? 0.03 : 0) : 0})`,
                          }}
                        />
                      </span>
                      <span className="text-right tabular-nums text-ink">
                        {count}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        </div>

        {/* A second, smaller card floating in front, for depth. */}
        <div className="absolute -bottom-8 -left-10 hidden w-56 rounded-2xl bg-surface p-3.5 shadow-[0_0_0_1px_rgb(21_32_26_/_0.08),0_24px_50px_-20px_rgb(25_50_35_/_0.45)] sm:block">
          <p className="mb-2.5 flex items-center gap-1.5 text-[9.5px] font-semibold uppercase tracking-[0.16em] text-accent">
            <Radio className="h-3 w-3" /> Newest
          </p>
          <ul className="space-y-2">
            {(data?.recent ?? []).slice(0, 3).map((person) => (
              <li key={person.id} className="flex items-center gap-2">
                <Avatar name={person.name} size={22} />
                <span className="min-w-0 flex-1 truncate text-[11px] font-medium text-ink">
                  {person.name}
                </span>
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ background: STAGE_META[person.stage].color }}
                />
              </li>
            ))}
          </ul>
        </div>

        {/* A small live chip floating over the top-right corner. */}
        <div className="absolute -right-4 -top-4 hidden items-center gap-2 rounded-full bg-ink px-3.5 py-1.5 text-[11px] font-medium text-on-ink shadow-glow sm:flex">
          <span className="live-dot relative h-1.5 w-1.5 rounded-full bg-accent-2 text-accent-2" />
          {data
            ? `${percent(data.decisionMakers, total)} decision makers`
            : "Live"}
        </div>
      </motion.div>
    </div>
  );
}

function MiniKpi({
  icon: Icon,
  label,
  value,
  featured,
}: {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  label: string;
  value: number;
  featured?: boolean;
}) {
  return (
    <div
      className={
        featured
          ? "rounded-2xl bg-ink p-3 text-on-ink"
          : "rounded-2xl p-3 text-ink shadow-card"
      }
    >
      <div className="flex items-center justify-between">
        <span
          className={`text-[8.5px] font-semibold uppercase tracking-[0.14em] ${featured ? "text-on-ink-muted" : "text-muted"}`}
        >
          {label}
        </span>
        <Icon
          className={`h-3 w-3 ${featured ? "text-accent-2" : "text-faint"}`}
          strokeWidth={1.75}
        />
      </div>
      <p className="font-display mt-2 text-[26px] font-semibold leading-none">
        <AnimatedNumber value={value} />
      </p>
    </div>
  );
}
