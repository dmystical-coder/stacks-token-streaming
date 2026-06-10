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
} from 'lucide-react';
import { useState, useEffect } from 'react';

interface StreamCardProps {
  streamId: number;
  stream: Stream;
  onUpdate: () => void;
}

type StreamStatusKey = 'scheduled' | 'active' | 'paused' | 'completed' | 'cancelled';

const STATUS_BADGE: Record<StreamStatusKey, string> = {
  active: 'bg-blue-50 text-blue-700 border-blue-200',
  paused: 'bg-amber-50 text-amber-700 border-amber-200',
  completed: 'bg-green-50 text-green-700 border-green-200',
  cancelled: 'bg-red-50 text-red-500 border-red-200',
  scheduled: 'bg-slate-100 text-slate-500 border-slate-200',
};

const PROGRESS_COLOR: Record<StreamStatusKey, string> = {
  active: 'bg-blue-500',
  paused: 'bg-amber-400',
  completed: 'bg-green-500',
  cancelled: 'bg-red-400',
  scheduled: 'bg-slate-300',
};

function formatStx(microStx: number): string {
  const stx = microStx / 1_000_000;
  if (stx >= 10_000) return stx.toLocaleString('en', { maximumFractionDigits: 0 });
  if (stx >= 100) return stx.toFixed(2);
  if (stx >= 1) return stx.toFixed(3);
  return stx.toFixed(6);
}

function formatRatePerDay(tokenAmount: number, durationSeconds: number): string {
  if (durationSeconds <= 0) return '—';
  const stxPerDay = (tokenAmount / durationSeconds / 1_000_000) * 86400;
  if (stxPerDay >= 1000) return stxPerDay.toLocaleString('en', { maximumFractionDigits: 0 });
  if (stxPerDay >= 10) return stxPerDay.toFixed(2);
  if (stxPerDay >= 1) return stxPerDay.toFixed(3);
  if (stxPerDay >= 0.01) return stxPerDay.toFixed(4);
  return stxPerDay.toFixed(6);
}

function formatTimeRemaining(seconds: number): string {
  if (seconds <= 0) return 'ended';
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  if (days > 0) return `${days}d ${hours}h left`;
  if (hours > 0) return `${hours}h ${mins}m left`;
  return `${mins}m left`;
}

export function StreamCard({ streamId, stream, onUpdate }: StreamCardProps) {
  const { userAddress } = useAuth();
  const { withdrawFromStream, cancelStream, pauseStream, resumeStream } =
    useStreamContract();
  const [loading, setLoading] = useState(false);
  const [availableBalance, setAvailableBalance] = useState(0);
  const [progress, setProgress] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(0);

  const isSender = userAddress === stream.sender;
  const isRecipient = userAddress === stream.recipient;
  const counterparty = isSender ? stream.recipient : stream.sender;
  const duration = stream.endTime - stream.startTime;
  const ratePerDay = formatRatePerDay(stream.tokenAmount, duration);
  const totalStx = formatStx(stream.tokenAmount);

  useEffect(() => {
    computeState();
    const interval = setInterval(computeState, 10_000);
    return () => clearInterval(interval);
  }, [stream]);

  const computeState = () => {
    const now = Date.now() / 1000;
    const adjustedEndTime = stream.endTime + stream.totalPausedDuration;
    setTimeRemaining(Math.max(0, adjustedEndTime - now));

    if (stream.isCancelled || stream.isPaused) {
      setAvailableBalance(0);
      return;
    }

    if (now < stream.startTime) {
      setAvailableBalance(0);
      setProgress(0);
      return;
    }

    const adjustedElapsed = Math.max(
      0,
      now - stream.startTime - stream.totalPausedDuration
    );
    const totalDuration = stream.endTime - stream.startTime;

    if (now >= adjustedEndTime) {
      setAvailableBalance(stream.tokenAmount - stream.withdrawnAmount);
      setProgress(100);
    } else {
      const vested = (stream.tokenAmount * adjustedElapsed) / totalDuration;
      setAvailableBalance(Math.floor(Math.max(0, vested - stream.withdrawnAmount)));
      setProgress((adjustedElapsed / totalDuration) * 100);
    }
  };

  const getStatus = (): StreamStatusKey => {
    if (stream.isCancelled) return 'cancelled';
    if (stream.isPaused) return 'paused';
    const now = Date.now() / 1000;
    const adjustedEndTime = stream.endTime + stream.totalPausedDuration;
    if (now >= adjustedEndTime) return 'completed';
    if (now >= stream.startTime) return 'active';
    return 'scheduled';
  };

  const handleAction = async (action: () => Promise<void>) => {
    setLoading(true);
    try {
      await action();
      setTimeout(onUpdate, 2000);
    } catch (err) {
      console.error('Action failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const status = getStatus();

  return (
    <div className="bg-white border border-slate-200 rounded-xl px-5 py-4 hover:border-slate-300 hover:shadow-sm transition-all">
      {/* Row 1: stream ID + direction/address + status badge */}
      <div className="flex items-center gap-3 mb-3">
        <span
          className="font-mono text-xs text-slate-400 shrink-0"
          style={{ fontVariantNumeric: 'tabular-nums' }}
        >
          #{streamId}
        </span>

        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          {isSender ? (
            <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          ) : (
            <ArrowDownLeft className="w-3.5 h-3.5 text-blue-500 shrink-0" />
          )}
          <span className="font-mono text-xs text-slate-500 truncate">
            {counterparty.slice(0, 10)}…{counterparty.slice(-6)}
          </span>
        </div>

        <span
          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border capitalize shrink-0 ${STATUS_BADGE[status]}`}
          style={{ letterSpacing: '0.06em', textTransform: 'uppercase' }}
        >
          {status}
        </span>
      </div>

      {/* Row 2: rate (primary metric) + total */}
      <div className="flex items-baseline gap-2 mb-3">
        <span
          className="font-mono text-2xl font-semibold text-slate-900 leading-none"
          style={{ fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.01em' }}
        >
          {ratePerDay}
        </span>
        <span className="text-sm text-slate-400 leading-none">STX/day</span>
        <span className="text-slate-200 mx-0.5">·</span>
        <span
          className="font-mono text-sm text-slate-500"
          style={{ fontVariantNumeric: 'tabular-nums' }}
        >
          {totalStx} STX total
        </span>
      </div>

      {/* Row 3: progress bar + time/pct */}
      <div className="mb-3.5">
        <div className="flex justify-between items-center mb-1.5">
          <span
            className="font-mono text-xs text-slate-400"
            style={{ fontVariantNumeric: 'tabular-nums' }}
          >
            {progress.toFixed(1)}%
          </span>
          <span className="text-xs text-slate-400">
            {status === 'active' || status === 'scheduled'
              ? formatTimeRemaining(timeRemaining)
              : status === 'completed'
              ? 'Completed'
              : status === 'paused'
              ? 'Paused'
              : 'Cancelled'}
          </span>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-1.5">
          <div
            className={`h-1.5 rounded-full transition-all duration-700 ${PROGRESS_COLOR[status]}`}
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
      </div>

      {/* Row 4: available badge + actions */}
      <div className="flex items-center gap-2 flex-wrap">
        {availableBalance > 0 && isRecipient && (
          <span
            className="text-xs text-green-700 font-mono font-medium bg-green-50 px-2 py-1 rounded-md border border-green-200"
            style={{ fontVariantNumeric: 'tabular-nums' }}
          >
            {formatStx(availableBalance)} STX available
          </span>
        )}

        <div className="flex gap-1.5 ml-auto">
          {isRecipient &&
            !stream.isCancelled &&
            !stream.isPaused &&
            availableBalance > 0 && (
              <Button
                onClick={() => handleAction(() => withdrawFromStream(streamId))}
                disabled={loading}
                size="sm"
                className="h-7 px-3 text-xs bg-blue-700 hover:bg-blue-800 text-white gap-1.5"
              >
                <Download className="w-3 h-3" />
                Withdraw
              </Button>
            )}

          {isSender && !stream.isCancelled && status !== 'completed' && (
            <>
              {stream.isPaused ? (
                <Button
                  onClick={() => handleAction(() => resumeStream(streamId))}
                  disabled={loading}
                  size="sm"
                  variant="outline"
                  className="h-7 px-3 text-xs gap-1.5 border-slate-200 text-slate-600"
                >
                  <Play className="w-3 h-3" />
                  Resume
                </Button>
              ) : (
                <Button
                  onClick={() => handleAction(() => pauseStream(streamId))}
                  disabled={loading}
                  size="sm"
                  variant="outline"
                  className="h-7 px-3 text-xs gap-1.5 border-slate-200 text-slate-600"
                >
                  <Pause className="w-3 h-3" />
                  Pause
                </Button>
              )}
              <button
                onClick={() => handleAction(() => cancelStream(streamId))}
                disabled={loading}
                title="Cancel stream"
                className="h-7 w-7 flex items-center justify-center rounded-md text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-40"
              >
                <XCircle className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
