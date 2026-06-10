'use client';

import { Stream } from '@/types/stream';
import { Button } from './ui/button';
import { useStreamContract } from '@/hooks/useStreamContract';
import { useAuth } from '@/contexts/AuthContext';
import {
  ArrowUpRight,
  ArrowDownLeft,
  Play,
  Pause,
  XCircle,
  Download,
  Loader2,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
import {
  type StreamStatusKey,
  computeState,
  formatRatePerDay,
  formatStxCompact,
  formatTimeRemaining,
  getStatus,
  ratePerDayMicro,
  splitStx,
} from '@/lib/stream';

interface StreamCardProps {
  streamId: number;
  stream: Stream;
  onUpdate: () => void;
}

const STATUS_BADGE: Record<StreamStatusKey, string> = {
  active: 'bg-primary/10 text-primary border-primary/25',
  paused: 'bg-warning/10 text-warning border-warning/30',
  completed: 'bg-success/10 text-success border-success/30',
  cancelled: 'bg-destructive/10 text-destructive border-destructive/30',
  scheduled: 'bg-muted text-muted-foreground border-border',
};

const PROGRESS_FILL: Record<StreamStatusKey, string> = {
  active: 'bg-primary',
  paused: 'bg-warning',
  completed: 'bg-success',
  cancelled: 'bg-destructive',
  scheduled: 'bg-muted-foreground/40',
};

type ActionKey = 'withdraw' | 'pause' | 'resume' | 'cancel';

export function StreamCard({ streamId, stream, onUpdate }: StreamCardProps) {
  const { userAddress } = useAuth();
  const { withdrawFromStream, cancelStream, pauseStream, resumeStream } =
    useStreamContract();
  const [pending, setPending] = useState<ActionKey | null>(null);
  const [confirming, setConfirming] = useState<'withdraw' | 'cancel' | null>(null);
  // Snapshot of the (live-ticking) claimable balance, frozen when the user
  // opens the withdraw preview so the figures don't move while they decide.
  const [claimSnapshotMicro, setClaimSnapshotMicro] = useState(0);
  const [now, setNow] = useState(() => Date.now());
  const reducedMotion = usePrefersReducedMotion();
  const busy = pending !== null;

  // Live tick. While the stream is actively flowing we update ~12×/sec so the
  // available figure visibly counts up (rAF pauses when the tab is hidden);
  // otherwise a 1s cadence is enough to catch state transitions and "time left".
  // Reduced-motion users get the calmer 1s cadence even on live streams.
  useEffect(() => {
    let raf = 0;
    let last = 0;
    const tick = (t: number) => {
      const isLive = getStatus(stream, Date.now() / 1000) === 'active';
      const interval = isLive && !reducedMotion ? 80 : 1000;
      if (t - last >= interval) {
        setNow(Date.now());
        last = t;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [stream, reducedMotion]);

  const isSender = userAddress === stream.sender;
  const isRecipient = userAddress === stream.recipient;
  const counterparty = isSender ? stream.recipient : stream.sender;

  const { status, fraction, vestedMicro, availableMicro, timeRemaining } =
    computeState(stream, now / 1000);

  const progress = fraction * 100;
  const ratePerDay = formatRatePerDay(ratePerDayMicro(stream));
  const totalStx = formatStxCompact(stream.tokenAmount);

  // Hero figure: what the recipient can claim vs. what the sender has streamed.
  const heroMicro = isRecipient ? availableMicro : vestedMicro;
  const heroLabel = isRecipient
    ? status === 'completed'
      ? 'Claimable'
      : 'Available'
    : 'Streamed';
  const hero = splitStx(heroMicro);

  const canWithdraw =
    isRecipient && !stream.isCancelled && !stream.isPaused && availableMicro > 0;
  const canControl = isSender && !stream.isCancelled && status !== 'completed';

  const handleAction = async (key: ActionKey, action: () => Promise<void>) => {
    setPending(key);
    try {
      await action();
      setTimeout(onUpdate, 2000);
    } catch {
      // Feedback is surfaced via the toast in useStreamContract.
    } finally {
      setPending(null);
      setConfirming(null);
    }
  };

  const startWithdraw = () => {
    setClaimSnapshotMicro(availableMicro); // capture the live balance now
    setConfirming('withdraw');
  };

  const claimRemainingMicro = Math.max(
    0,
    stream.tokenAmount - stream.withdrawnAmount - claimSnapshotMicro
  );

  return (
    <div className="rounded-xl border border-border bg-card px-4 py-4 transition-colors hover:border-foreground/20 sm:px-5">
      {/* Row 1: id · direction + counterparty · status */}
      <div className="mb-3 flex items-center gap-2.5">
        <span className="tabular shrink-0 font-mono text-xs text-muted-foreground">
          #{streamId}
        </span>
        <div className="flex min-w-0 flex-1 items-center gap-1.5">
          {isSender ? (
            <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          ) : (
            <ArrowDownLeft className="h-3.5 w-3.5 shrink-0 text-primary" />
          )}
          <span className="truncate font-mono text-xs text-muted-foreground">
            {isSender ? 'to ' : 'from '}
            {counterparty.slice(0, 8)}…{counterparty.slice(-5)}
          </span>
        </div>
        <span
          className={`inline-flex shrink-0 items-center rounded-full border px-2 py-0.5 text-[10px] font-medium ${STATUS_BADGE[status]}`}
          style={{ letterSpacing: '0.06em', textTransform: 'uppercase' }}
        >
          {status}
        </span>
      </div>

      {/* Row 2: live hero figure */}
      <div className="mb-1 flex items-baseline gap-2">
        <span className="text-[11px] uppercase tracking-[0.08em] text-muted-foreground">
          {heroLabel}
        </span>
        {status === 'active' && (
          <span className="inline-flex items-center gap-1 text-[10px] font-medium uppercase tracking-[0.08em] text-primary">
            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-live-pulse" />
            streaming
          </span>
        )}
      </div>
      <div className="mb-3 flex items-baseline gap-1.5">
        <span className="tabular font-mono text-2xl font-semibold leading-none tracking-tight text-foreground sm:text-3xl">
          {hero.int}
          <span className="text-muted-foreground">.{hero.frac}</span>
        </span>
        <span className="text-sm text-muted-foreground">STX</span>
      </div>

      {/* Row 3: secondary metrics */}
      <div className="mb-3 flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-xs text-muted-foreground">
        <span className="tabular">{ratePerDay} STX/day</span>
        <span className="text-border">·</span>
        <span className="tabular">{totalStx} STX total</span>
        {stream.withdrawnAmount > 0 && (
          <>
            <span className="text-border">·</span>
            <span className="tabular">{formatStxCompact(stream.withdrawnAmount)} withdrawn</span>
          </>
        )}
      </div>

      {/* Row 4: progress + time */}
      <div className="mb-3.5">
        <div className="mb-1.5 flex items-center justify-between">
          <span className="tabular font-mono text-xs text-muted-foreground">
            {progress.toFixed(1)}%
          </span>
          <span className="text-xs text-muted-foreground">
            {status === 'active' || status === 'scheduled'
              ? formatTimeRemaining(timeRemaining)
              : status === 'completed'
                ? 'Completed'
                : status === 'paused'
                  ? 'Paused'
                  : 'Cancelled'}
          </span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className={`relative h-full overflow-hidden rounded-full transition-[width] duration-700 ${PROGRESS_FILL[status]}`}
            style={{ width: `${Math.min(progress, 100)}%` }}
          >
            {status === 'active' && (
              <span className="absolute inset-y-0 left-0 w-1/4 -translate-x-full animate-[flow-sheen_1.6s_linear_infinite] bg-gradient-to-r from-transparent via-white/55 to-transparent" />
            )}
          </div>
        </div>
      </div>

      {/* Row 5: actions — with confirm/preview steps for withdraw and cancel */}
      {confirming === 'withdraw' ? (
        <div className="rounded-lg border border-border bg-muted/40 p-3">
          <div className="flex items-baseline justify-between text-sm">
            <span className="text-muted-foreground">Claiming now</span>
            <span className="tabular font-mono font-medium text-foreground">
              {formatStxCompact(claimSnapshotMicro)} STX
            </span>
          </div>
          <div className="mt-1 flex items-baseline justify-between text-sm">
            <span className="text-muted-foreground">Left to claim</span>
            <span className="tabular font-mono text-muted-foreground">
              {formatStxCompact(claimRemainingMicro)} STX
            </span>
          </div>
          <div className="mt-3 flex gap-1.5">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setConfirming(null)}
              disabled={busy}
              className="h-7 px-3 text-xs"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={() => handleAction('withdraw', () => withdrawFromStream(streamId))}
              disabled={busy}
              className="h-7 flex-1 gap-1.5 px-3 text-xs"
            >
              {pending === 'withdraw' ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Download className="h-3 w-3" />
              )}
              {pending === 'withdraw' ? 'Withdrawing…' : 'Confirm withdraw'}
            </Button>
          </div>
        </div>
      ) : confirming === 'cancel' ? (
        <div className="flex flex-col gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 sm:flex-row sm:items-center">
          <p className="text-xs leading-relaxed text-muted-foreground">
            Cancel this stream? Vested STX goes to the recipient and the rest is
            refunded to you. This can&apos;t be undone.
          </p>
          <div className="flex gap-1.5 sm:ml-auto sm:shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setConfirming(null)}
              disabled={busy}
              className="h-7 px-3 text-xs"
            >
              Keep
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => handleAction('cancel', () => cancelStream(streamId))}
              disabled={busy}
              className="h-7 gap-1.5 px-3 text-xs"
            >
              {pending === 'cancel' && <Loader2 className="h-3 w-3 animate-spin" />}
              {pending === 'cancel' ? 'Cancelling…' : 'Cancel stream'}
            </Button>
          </div>
        </div>
      ) : canWithdraw || canControl ? (
        <div className="flex items-center gap-1.5">
          {canWithdraw && (
            <Button
              onClick={startWithdraw}
              disabled={busy}
              size="sm"
              className="h-7 gap-1.5 px-3 text-xs"
            >
              <Download className="h-3 w-3" />
              Withdraw
            </Button>
          )}

          {canControl && (
            <div className="ml-auto flex gap-1.5">
              {stream.isPaused ? (
                <Button
                  onClick={() => handleAction('resume', () => resumeStream(streamId))}
                  disabled={busy}
                  size="sm"
                  variant="outline"
                  className="h-7 gap-1.5 px-3 text-xs"
                >
                  {pending === 'resume' ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Play className="h-3 w-3" />
                  )}
                  Resume
                </Button>
              ) : (
                <Button
                  onClick={() => handleAction('pause', () => pauseStream(streamId))}
                  disabled={busy}
                  size="sm"
                  variant="outline"
                  className="h-7 gap-1.5 px-3 text-xs"
                >
                  {pending === 'pause' ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Pause className="h-3 w-3" />
                  )}
                  Pause
                </Button>
              )}
              <button
                onClick={() => setConfirming('cancel')}
                disabled={busy}
                title="Cancel stream"
                aria-label="Cancel stream"
                className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive disabled:opacity-40"
              >
                <XCircle className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
