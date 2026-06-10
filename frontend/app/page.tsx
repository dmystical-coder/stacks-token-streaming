"use client";

import { useMemo, useState } from "react";
import { ConnectWallet } from "@/components/ConnectWallet";
import { ThemeToggle } from "@/components/ThemeToggle";
import { CreateStreamModal } from "@/components/CreateStreamModal";
import { StreamCard } from "@/components/StreamCard";
import { WalletView } from "@/components/WalletView";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { StreamFilter } from "@/types/stream";
import { Plus, RefreshCw, Waves, Wallet } from "lucide-react";
import { useStreamsFromChain } from "@/hooks/useStreamsFromChain";
import { IS_TESTNET } from "@/lib/network";
import {
  computeState,
  formatRatePerDay,
  formatStxCompact,
  getStatus,
  ratePerDayMicro,
} from "@/lib/stream";

function OverviewStat({
  label,
  value,
  unit,
  sub,
  accent,
  className,
}: {
  label: string;
  value: string;
  unit: string;
  sub?: string;
  accent?: boolean;
  className?: string;
}) {
  return (
    <div className={`bg-card p-4 ${className ?? ""}`}>
      <div className="text-[11px] uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
      <div className="mt-1 flex items-baseline gap-1">
        <span
          className={`tabular font-mono text-xl font-semibold tracking-tight ${
            accent ? "text-primary" : "text-foreground"
          }`}
        >
          {value}
        </span>
        <span className="text-xs text-muted-foreground">{unit}</span>
      </div>
      {sub && <div className="mt-0.5 text-[11px] text-muted-foreground">{sub}</div>}
    </div>
  );
}

function StreamRowSkeleton() {
  return (
    <div className="animate-pulse rounded-xl border border-border bg-card px-4 py-4 sm:px-5">
      <div className="mb-3 flex items-center gap-2.5">
        <div className="h-3 w-8 rounded bg-muted" />
        <div className="h-3 w-40 rounded bg-muted" />
        <div className="ml-auto h-4 w-16 rounded-full bg-muted" />
      </div>
      <div className="mb-3 h-7 w-44 rounded bg-muted" />
      <div className="mb-3 h-3 w-56 rounded bg-muted" />
      <div className="h-1.5 w-full rounded-full bg-muted" />
    </div>
  );
}

type View = "streams" | "wallet";

const VIEWS: { value: View; label: string; icon: typeof Waves }[] = [
  { value: "streams", label: "Streams", icon: Waves },
  { value: "wallet", label: "Wallet", icon: Wallet },
];

const FILTERS: { value: StreamFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "paused", label: "Paused" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

export default function Home() {
  const { isSignedIn, userAddress } = useAuth();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [view, setView] = useState<View>("streams");
  const [filter, setFilter] = useState<StreamFilter>("all");

  const { streams, loading, refresh } = useStreamsFromChain(userAddress);

  const filteredStreams = streams.filter((stream) => {
    if (filter === "all") return true;
    const now = Date.now() / 1000;
    const adjustedEndTime = stream.endTime + stream.totalPausedDuration;
    if (filter === "cancelled") return stream.isCancelled;
    if (filter === "paused") return stream.isPaused && !stream.isCancelled;
    if (filter === "completed")
      return now >= adjustedEndTime && !stream.isCancelled;
    if (filter === "active")
      return (
        now >= stream.startTime &&
        now < adjustedEndTime &&
        !stream.isPaused &&
        !stream.isCancelled
      );
    return true;
  });

  const overview = useMemo(() => {
    let inRate = 0;
    let outRate = 0;
    let claimable = 0;
    let activeIn = 0;
    let activeOut = 0;
    const nowSec = Date.now() / 1000;
    for (const s of streams) {
      const st = computeState(s, nowSec);
      const isSender = userAddress === s.sender;
      const isRecipient = userAddress === s.recipient;
      if (st.status === "active") {
        if (isRecipient) {
          inRate += ratePerDayMicro(s);
          activeIn += 1;
        }
        if (isSender) {
          outRate += ratePerDayMicro(s);
          activeOut += 1;
        }
      }
      if (isRecipient) claimable += st.availableMicro;
    }
    return { inRate, outRate, claimable, activeIn, activeOut };
  }, [streams, userAddress]);

  const counts = useMemo(() => {
    const c: Record<StreamFilter, number> = {
      all: streams.length,
      active: 0,
      paused: 0,
      completed: 0,
      cancelled: 0,
    };
    const nowSec = Date.now() / 1000;
    for (const s of streams) {
      const st = getStatus(s, nowSec);
      if (st === "active") c.active += 1;
      else if (st === "paused") c.paused += 1;
      else if (st === "completed") c.completed += 1;
      else if (st === "cancelled") c.cancelled += 1;
    }
    return c;
  }, [streams]);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b border-border bg-card/80 backdrop-blur supports-[backdrop-filter]:bg-card/70">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="flex h-14 items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary">
                <Waves className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="font-semibold tracking-tight text-foreground">
                StreamSTX
              </span>
              {IS_TESTNET && (
                <span
                  className="rounded-full border border-warning/30 bg-warning/10 px-1.5 py-0.5 text-[10px] font-medium text-warning"
                  style={{ letterSpacing: "0.06em", textTransform: "uppercase" }}
                >
                  Testnet
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <ConnectWallet />
            </div>
          </div>

          {isSignedIn && (
            <nav className="-mb-px flex gap-1" aria-label="Primary">
              {VIEWS.map(({ value, label, icon: Icon }) => {
                const active = view === value;
                return (
                  <button
                    key={value}
                    onClick={() => setView(value)}
                    aria-current={active ? "page" : undefined}
                    className={`-mb-px inline-flex items-center gap-1.5 border-b-2 px-1 pb-2.5 pt-1 text-sm font-medium transition-colors ${
                      active
                        ? "border-foreground text-foreground"
                        : "border-transparent text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {label}
                  </button>
                );
              })}
            </nav>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        {!isSignedIn ? (
          <div className="flex flex-col items-center justify-center py-20 sm:py-24">
            <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary">
              <Waves className="h-7 w-7 text-primary-foreground" />
            </div>
            <h2 className="mb-2 text-balance text-center text-2xl font-semibold text-foreground">
              Token streaming on Stacks
            </h2>
            <p className="mb-8 max-w-sm text-balance text-center leading-relaxed text-muted-foreground">
              Send STX continuously over time — for vesting, payroll,
              subscriptions, and more.
            </p>
            <ConnectWallet />
          </div>
        ) : view === "wallet" ? (
          <WalletView />
        ) : (
          <div className="space-y-4">
            {streams.length > 0 && (
              <div className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-3">
                <OverviewStat
                  label="Streaming in"
                  value={formatRatePerDay(overview.inRate)}
                  unit="STX/day"
                  sub={`${overview.activeIn} active`}
                />
                <OverviewStat
                  label="Streaming out"
                  value={formatRatePerDay(overview.outRate)}
                  unit="STX/day"
                  sub={`${overview.activeOut} active`}
                />
                <OverviewStat
                  className="col-span-2 sm:col-span-1"
                  label="Claimable now"
                  value={formatStxCompact(overview.claimable)}
                  unit="STX"
                  accent={overview.claimable > 0}
                />
              </div>
            )}

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              {/* The single pill control in the app: stream filters. */}
              <div className="-mx-4 overflow-x-auto px-4 no-scrollbar sm:mx-0 sm:px-0">
                <div className="inline-flex gap-0.5 rounded-lg border border-border bg-muted p-1">
                  {FILTERS.map(({ value, label }) => (
                    <button
                      key={value}
                      onClick={() => setFilter(value)}
                      className={`inline-flex items-center whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                        filter === value
                          ? "bg-foreground text-background"
                          : "text-muted-foreground hover:bg-accent hover:text-foreground"
                      }`}
                    >
                      {label}
                      {counts[value] > 0 && (
                        <span
                          className={`tabular ml-1.5 text-[11px] ${
                            filter === value ? "text-background/60" : "text-muted-foreground/60"
                          }`}
                        >
                          {counts[value]}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex shrink-0 gap-2">
                <Button
                  onClick={refresh}
                  variant="outline"
                  size="sm"
                  disabled={loading}
                  className="h-8 gap-1.5 text-xs"
                >
                  <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} />
                  <span className="hidden sm:inline">Refresh</span>
                </Button>
                <Button
                  onClick={() => setShowCreateModal(true)}
                  size="sm"
                  className="h-8 flex-1 gap-1.5 text-xs sm:flex-none"
                >
                  <Plus className="h-3 w-3" />
                  New Stream
                </Button>
              </div>
            </div>

            {loading && streams.length === 0 ? (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <StreamRowSkeleton key={i} />
                ))}
              </div>
            ) : filteredStreams.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-muted">
                  <Waves className="h-5 w-5 text-muted-foreground" />
                </div>
                <p className="mb-1 text-sm font-medium text-foreground">
                  {filter === "all" ? "No streams yet" : `No ${filter} streams`}
                </p>
                <p className="mb-6 text-sm text-muted-foreground">
                  {filter === "all"
                    ? "Create your first token stream to get started."
                    : "Switch to All to see all streams."}
                </p>
                {filter === "all" && (
                  <Button onClick={() => setShowCreateModal(true)} size="sm" className="gap-1.5">
                    <Plus className="h-3.5 w-3.5" />
                    Create Stream
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                {filteredStreams.map((stream) => (
                  <StreamCard
                    key={stream.id}
                    streamId={stream.id!}
                    stream={stream}
                    onUpdate={refresh}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      <CreateStreamModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={refresh}
      />
    </div>
  );
}
