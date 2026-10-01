"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { Overview } from "@/lib/types";
import { useResource } from "@/lib/useResource";
import { useLive } from "@/lib/live";
import { useSystemStatus } from "@/lib/useSystemStatus";
import { Waves } from "@/components/home/Waves";
import { DashboardPreview } from "@/components/home/DashboardPreview";
import { pillPrimary, pillSecondary } from "@/components/ui/PageHeader";

export default function HomePage() {
  const overview = useResource<Overview>("/api/overview");
  const { data } = overview;
  const { status } = useLive();
  const { services } = useSystemStatus();
  const allUp = services.every((s) => s.state === "up");
  const anyDown = services.some((s) => s.state === "down");

  return (
    <>
      {/* ─── Hero ─── */}
      <section className="relative left-1/2 -mt-6 w-screen -translate-x-1/2 overflow-hidden lg:-mt-8">
        <Waves />
        <div className="relative mx-auto grid min-h-[calc(100dvh-4rem)] max-w-7xl items-center gap-14 px-6 py-16 lg:grid-cols-[1.05fr_1fr] lg:gap-10 lg:px-10">
          <div className="rise flex flex-col items-center text-center lg:items-start lg:text-left">
            <p className="eyebrow mb-7 justify-center lg:justify-start">
              <span aria-hidden className="h-px w-10 bg-accent/50" />
              <span>LeadOps Studio</span>
              <span aria-hidden className="h-px w-10 bg-accent/50" />
            </p>

            <h1 className="font-display text-[44px] font-semibold leading-[1.02] text-ink sm:text-[58px] xl:text-[66px]">
              Every consultant,
              <br />
              one living <em className="font-medium italic text-accent">pipeline.</em>
            </h1>

            <p className="mt-7 max-w-xl text-[16.5px] leading-relaxed text-muted">
              Upload a roster, watch it land in MongoDB, and follow each consultant from the first email to the
              hand-off — as it happens.
            </p>

            <div className="mt-9 flex flex-wrap items-center justify-center gap-3 lg:justify-start">
              <Link href="/overview" className={pillPrimary}>
                Open the overview <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/upload" className={pillSecondary}>
                Upload a CSV
              </Link>
            </div>

            <ul className="mt-9 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[13px] text-muted lg:justify-start">
              <HeroFact>{data ? `${data.total.toLocaleString()} consultants in MongoDB` : "Reading MongoDB…"}</HeroFact>
              <HeroFact>{data ? `${data.reached.emailed ?? 0} emailed so far` : "Counting outreach…"}</HeroFact>
              <HeroFact tone={anyDown ? "danger" : allUp ? "success" : "accent"}>
                {anyDown ? "A service needs attention" : status === "live" ? "Live updates on" : "Refreshing every 15 seconds"}
              </HeroFact>
            </ul>
          </div>

          {/* The product itself, live, one beat after the headline. */}
          <div className="rise flex justify-center [animation-delay:120ms] lg:justify-end">
            <DashboardPreview data={data} />
          </div>
        </div>
      </section>

    </>
  );
}

function HeroFact({ children, tone = "accent" }: { children: React.ReactNode; tone?: "accent" | "success" | "danger" }) {
  const dot = tone === "danger" ? "bg-danger" : tone === "success" ? "bg-success" : "bg-accent";
  return (
    <li className="flex items-center gap-2">
      <span className={`h-1.5 w-1.5 rounded-full ${dot}`} aria-hidden />
      {children}
    </li>
  );
}
