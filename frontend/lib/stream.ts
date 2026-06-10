import { Stream } from '@/types/stream';

export type StreamStatusKey =
  | 'scheduled'
  | 'active'
  | 'paused'
  | 'completed'
  | 'cancelled';

export interface StreamState {
  status: StreamStatusKey;
  fraction: number; // 0..1 vested
  vestedMicro: number;
  availableMicro: number;
  timeRemaining: number; // seconds
}

export function getStatus(stream: Stream, nowSec: number): StreamStatusKey {
  if (stream.isCancelled) return 'cancelled';
  if (stream.isPaused) return 'paused';
  const adjustedEnd = stream.endTime + stream.totalPausedDuration;
  if (nowSec >= adjustedEnd) return 'completed';
  if (nowSec >= stream.startTime) return 'active';
  return 'scheduled';
}

export function computeState(stream: Stream, nowSec: number): StreamState {
  const status = getStatus(stream, nowSec);
  const adjustedEnd = stream.endTime + stream.totalPausedDuration;
  const totalDuration = stream.endTime - stream.startTime;
  const timeRemaining = Math.max(0, adjustedEnd - nowSec);

  // Freeze the clock at the pause moment so a paused stream reads its true
  // vested-so-far rather than continuing to advance.
  const ref = status === 'paused' && stream.pausedAt > 0 ? stream.pausedAt : nowSec;

  let fraction: number;
  if (totalDuration <= 0) {
    fraction = status === 'completed' ? 1 : 0;
  } else if (status === 'scheduled') {
    fraction = 0;
  } else if (status === 'completed') {
    fraction = 1;
  } else {
    const elapsed = Math.min(
      totalDuration,
      Math.max(0, ref - stream.startTime - stream.totalPausedDuration)
    );
    fraction = elapsed / totalDuration;
  }

  const vestedMicro = fraction * stream.tokenAmount;

  let availableMicro: number;
  if (status === 'completed') {
    availableMicro = stream.tokenAmount - stream.withdrawnAmount;
  } else if (status === 'active' || status === 'paused') {
    availableMicro = Math.max(0, vestedMicro - stream.withdrawnAmount);
  } else {
    availableMicro = 0;
  }

  return { status, fraction, vestedMicro, availableMicro, timeRemaining };
}

/** microSTX streamed per day for this stream's configured rate. */
export function ratePerDayMicro(stream: Stream): number {
  const duration = stream.endTime - stream.startTime;
  return duration > 0 ? (stream.tokenAmount / duration) * 86400 : 0;
}

/** Splits a microSTX amount into grouped integer + 6-digit fraction parts. */
export function splitStx(microStx: number): { int: string; frac: string } {
  const [i, f] = (microStx / 1_000_000).toFixed(6).split('.');
  return { int: Number(i).toLocaleString('en'), frac: f };
}

export function formatStxCompact(microStx: number): string {
  const stx = microStx / 1_000_000;
  if (stx >= 10_000) return stx.toLocaleString('en', { maximumFractionDigits: 0 });
  if (stx >= 100) return stx.toFixed(2);
  if (stx >= 1) return stx.toFixed(3);
  return stx.toFixed(6);
}

export function formatRatePerDay(microPerDay: number): string {
  const stxPerDay = microPerDay / 1_000_000;
  if (stxPerDay <= 0) return '—';
  if (stxPerDay >= 1000) return stxPerDay.toLocaleString('en', { maximumFractionDigits: 0 });
  if (stxPerDay >= 10) return stxPerDay.toFixed(2);
  if (stxPerDay >= 1) return stxPerDay.toFixed(3);
  if (stxPerDay >= 0.01) return stxPerDay.toFixed(4);
  return stxPerDay.toFixed(6);
}

export function formatTimeRemaining(seconds: number): string {
  if (seconds <= 0) return 'ended';
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  if (days > 0) return `${days}d ${hours}h left`;
  if (hours > 0) return `${hours}h ${mins}m left`;
  return `${mins}m left`;
}
