'use client';

import { Stream } from '@/types/stream';
import { microStxToStx, formatDuration } from '@/lib/stacks';
import { Button } from './ui/button';
import { useStreamContract } from '@/hooks/useStreamContract';
import { useAuth } from '@/contexts/AuthContext';
import { Play, Pause, XCircle, Download, Clock, Coins, User } from 'lucide-react';
import { useState, useEffect } from 'react';

interface StreamCardProps {
  streamId: number;
  stream: Stream;
  onUpdate: () => void;
}

export function StreamCard({ streamId, stream, onUpdate }: StreamCardProps) {
  const { userAddress } = useAuth();
  const { withdrawFromStream, cancelStream, pauseStream, resumeStream } = useStreamContract();
  const [loading, setLoading] = useState(false);
  const [availableBalance, setAvailableBalance] = useState(0);
  const [progress, setProgress] = useState(0);

  const isSender = userAddress === stream.sender;
  const isRecipient = userAddress === stream.recipient;

  useEffect(() => {
    calculateAvailableBalance();
    const interval = setInterval(calculateAvailableBalance, 10000); // Update every 10 seconds
    return () => clearInterval(interval);
  }, [stream]);

  const calculateAvailableBalance = () => {
    const now = Date.now() / 1000;
    
    if (stream.isCancelled || stream.isPaused) {
      setAvailableBalance(0);
      return;
    }

    if (now < stream.startTime) {
      setAvailableBalance(0);
      setProgress(0);
      return;
    }

    const adjustedElapsed = Math.max(0, now - stream.startTime - stream.totalPausedDuration);
    const totalDuration = stream.endTime - stream.startTime;
    const adjustedEndTime = stream.endTime + stream.totalPausedDuration;

    if (now >= adjustedEndTime) {
      const remaining = stream.tokenAmount - stream.withdrawnAmount;
      setAvailableBalance(remaining);
      setProgress(100);
    } else {
      const vestedAmount = (stream.tokenAmount * adjustedElapsed) / totalDuration;
      const available = Math.max(0, vestedAmount - stream.withdrawnAmount);
      setAvailableBalance(Math.floor(available));
      setProgress((adjustedElapsed / totalDuration) * 100);
    }
  };

  const getStatus = () => {
    if (stream.isCancelled) return { label: 'Cancelled', color: 'text-red-600' };
    if (stream.isPaused) return { label: 'Paused', color: 'text-yellow-600' };
    
    const now = Date.now() / 1000;
    const adjustedEndTime = stream.endTime + stream.totalPausedDuration;
    
    if (now >= adjustedEndTime) return { label: 'Completed', color: 'text-green-600' };
    if (now >= stream.startTime) return { label: 'Active', color: 'text-blue-600' };
    return { label: 'Scheduled', color: 'text-zinc-500' };
  };

  const handleAction = async (action: () => Promise<void>) => {
    setLoading(true);
    try {
      await action();
      setTimeout(onUpdate, 2000); // Refresh after 2 seconds
    } catch (error) {
      console.error('Action failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const status = getStatus();

  return (
    <div className="border border-zinc-200 dark:border-zinc-800 rounded-lg p-6 hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-lg font-semibold">Stream #{streamId}</h3>
            <span className={`text-sm font-medium ${status.color}`}>
              {status.label}
            </span>
          </div>
          <p className="text-sm text-zinc-500">
            {stream.tokenType === 'STX' ? 'STX Stream' : 'SIP-010 Token Stream'}
          </p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold">
            {microStxToStx(stream.tokenAmount)} STX
          </div>
          <div className="text-sm text-zinc-500">
            {microStxToStx(stream.withdrawnAmount)} withdrawn
          </div>
        </div>
      </div>

      <div className="space-y-3 mb-4">
        <div className="flex items-center gap-2 text-sm">
          <User className="w-4 h-4 text-zinc-500" />
          <span className="text-zinc-500">From:</span>
          <span className="font-mono">{stream.sender.slice(0, 8)}...{stream.sender.slice(-6)}</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <User className="w-4 h-4 text-zinc-500" />
          <span className="text-zinc-500">To:</span>
          <span className="font-mono">{stream.recipient.slice(0, 8)}...{stream.recipient.slice(-6)}</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Clock className="w-4 h-4 text-zinc-500" />
          <span className="text-zinc-500">Duration:</span>
          <span>{formatDuration(stream.endTime - stream.startTime)}</span>
        </div>
        {availableBalance > 0 && (
          <div className="flex items-center gap-2 text-sm">
            <Coins className="w-4 h-4 text-green-600" />
            <span className="text-zinc-500">Available:</span>
            <span className="font-semibold text-green-600">
              {microStxToStx(availableBalance)} STX
            </span>
          </div>
        )}
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex justify-between text-xs text-zinc-500 mb-1">
          <span>Progress</span>
          <span>{progress.toFixed(1)}%</span>
        </div>
        <div className="w-full bg-zinc-200 dark:bg-zinc-800 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-500"
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 flex-wrap">
        {isRecipient && !stream.isCancelled && !stream.isPaused && availableBalance > 0 && (
          <Button
            onClick={() => handleAction(() => withdrawFromStream(streamId))}
            disabled={loading}
            size="sm"
            className="gap-2"
          >
            <Download className="w-4 h-4" />
            Withdraw
          </Button>
        )}

        {isSender && !stream.isCancelled && (
          <>
            {stream.isPaused ? (
              <Button
                onClick={() => handleAction(() => resumeStream(streamId))}
                disabled={loading}
                size="sm"
                variant="outline"
                className="gap-2"
              >
                <Play className="w-4 h-4" />
                Resume
              </Button>
            ) : status.label !== 'Completed' && (
              <Button
                onClick={() => handleAction(() => pauseStream(streamId))}
                disabled={loading}
                size="sm"
                variant="outline"
                className="gap-2"
              >
                <Pause className="w-4 h-4" />
                Pause
              </Button>
            )}
            
            <Button
              onClick={() => handleAction(() => cancelStream(streamId))}
              disabled={loading}
              size="sm"
              variant="destructive"
              className="gap-2"
            >
              <XCircle className="w-4 h-4" />
              Cancel
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
