'use client';

import { Stream } from '@/types/stream';
import { microStxToStx, formatDuration } from '@/lib/stacks';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { useStreamContract } from '@/hooks/useStreamContract';
import { useAuth } from '@/contexts/AuthContext';
import { Play, Pause, Ban, Download, Clock, Coins, User, Loader2, ArrowRight } from 'lucide-react';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface StreamCardProps {
  streamId: number;
  stream: Stream;
  onUpdate: () => void;
}

export function StreamCard({ streamId, stream, onUpdate }: StreamCardProps) {
  const { userAddress } = useAuth();
  const { withdrawFromStream, cancelStream, pauseStream, resumeStream } = useStreamContract();
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [availableBalance, setAvailableBalance] = useState(0);
  const [progress, setProgress] = useState(0);

  const isSender = userAddress === stream.sender;
  const isRecipient = userAddress === stream.recipient;

  useEffect(() => {
    calculateAvailableBalance();
    const interval = setInterval(calculateAvailableBalance, 5000); // Update every 5 seconds for smoother feel
    return () => clearInterval(interval);
  }, [stream]);

  const calculateAvailableBalance = () => {
    const now = Date.now() / 1000;
    
    if (stream.isCancelled) {
      setAvailableBalance(0);
      return;
    }

    const totalDuration = stream.endTime - stream.startTime;
    let adjustedElapsed = 0;

    if (stream.isPaused) {
      // If paused, time is frozen at pausedAt
      adjustedElapsed = Math.max(0, stream.pausedAt - stream.startTime - stream.totalPausedDuration);
      setAvailableBalance(0);
    } else {
      if (now < stream.startTime) {
        setAvailableBalance(0);
        setProgress(0);
        return;
      }
      adjustedElapsed = Math.max(0, now - stream.startTime - stream.totalPausedDuration);
    }

    // Calculate progress
    const currentProgress = (adjustedElapsed / totalDuration) * 100;
    setProgress(Math.min(currentProgress, 100));

    // Calculate balance if active
    if (!stream.isPaused) {
      const adjustedEndTime = stream.endTime + stream.totalPausedDuration;
      if (now >= adjustedEndTime) {
        const remaining = stream.tokenAmount - stream.withdrawnAmount;
        setAvailableBalance(Math.max(0, remaining));
      } else {
        const vestedAmount = (stream.tokenAmount * adjustedElapsed) / totalDuration;
        const available = Math.max(0, vestedAmount - stream.withdrawnAmount);
        setAvailableBalance(Math.floor(available));
      }
    }
  };

  const getStatus = () => {
    if (stream.isCancelled) return { label: 'Cancelled', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800' };
    if (stream.isPaused) return { label: 'Paused', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800' };
    
    const now = Date.now() / 1000;
    const adjustedEndTime = stream.endTime + stream.totalPausedDuration;
    
    if (now >= adjustedEndTime) return { label: 'Completed', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800' };
    if (now >= stream.startTime) return { label: 'Active', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800' };
    return { label: 'Scheduled', color: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700' };
  };

  const handleAction = async (actionName: string, action: () => Promise<void>) => {
    setLoadingAction(actionName);
    try {
      await action();
      // Optimistic update or wait for event
      setTimeout(onUpdate, 1000); 
    } catch (error) {
      console.error('Action failed:', error);
    } finally {
      setLoadingAction(null);
    }
  };

  const status = getStatus();
  const totalStx = microStxToStx(stream.tokenAmount);
  const withdrawnStx = microStxToStx(stream.withdrawnAmount);
  const availableStx = microStxToStx(availableBalance);

  return (
    <div className="group relative overflow-hidden rounded-xl border border-zinc-200 bg-white p-6 shadow-sm transition-all hover:shadow-md dark:border-zinc-800 dark:bg-zinc-950">
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="font-mono text-sm text-zinc-500">#{streamId}</span>
            <span className={cn("px-2.5 py-0.5 rounded-full text-xs font-medium border", status.color)}>
              {status.label}
            </span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-bold tracking-tight">{totalStx}</span>
            <span className="text-sm font-medium text-zinc-500">STX</span>
          </div>
        </div>
        
        <div className="text-right">
          <div className="text-sm text-zinc-500 mb-1">Withdrawn</div>
          <div className="font-medium text-zinc-900 dark:text-zinc-100">
            {withdrawnStx} <span className="text-xs text-zinc-500">STX</span>
          </div>
        </div>
      </div>

      <div className="space-y-4 mb-6">
        {/* Progress Section */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-zinc-500">
            <span>Vesting Progress</span>
            <span>{Math.min(progress, 100).toFixed(1)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-2 gap-4 py-4 border-t border-b border-zinc-100 dark:border-zinc-900">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-zinc-500">
              <User className="w-3.5 h-3.5" />
              <span>From</span>
            </div>
            <div className="font-mono text-xs truncate" title={stream.sender}>
              {stream.sender.slice(0, 6)}...{stream.sender.slice(-4)}
            </div>
          </div>
          <div className="space-y-1 text-right">
            <div className="flex items-center justify-end gap-1.5 text-xs text-zinc-500">
              <span>To</span>
              <ArrowRight className="w-3 h-3" />
            </div>
            <div className="font-mono text-xs truncate" title={stream.recipient}>
              {stream.recipient.slice(0, 6)}...{stream.recipient.slice(-4)}
            </div>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-zinc-500">
              <Clock className="w-3.5 h-3.5" />
              <span>Duration</span>
            </div>
            <div className="text-sm font-medium">
              {formatDuration(stream.endTime - stream.startTime)}
            </div>
          </div>
          {availableBalance > 0 && (
            <div className="space-y-1 text-right">
              <div className="flex items-center justify-end gap-1.5 text-xs text-zinc-500">
                <Coins className="w-3.5 h-3.5 text-green-600" />
                <span className="text-green-600 font-medium">Available</span>
              </div>
              <div className="text-sm font-bold text-green-600">
                {availableStx} STX
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <TooltipProvider>
          {isRecipient && !stream.isCancelled && !stream.isPaused && availableBalance > 0 && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={() => handleAction('withdraw', () => withdrawFromStream(streamId))}
                  disabled={!!loadingAction}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                >
                  {loadingAction === 'withdraw' ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Download className="w-4 h-4 mr-2" />
                  )}
                  Withdraw
                </Button>
              </TooltipTrigger>
              <TooltipContent>Withdraw available tokens</TooltipContent>
            </Tooltip>
          )}

          {isSender && !stream.isCancelled && (
            <>
              {stream.isPaused ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      onClick={() => handleAction('resume', () => resumeStream(streamId))}
                      disabled={!!loadingAction}
                      variant="outline"
                      className="flex-1"
                    >
                      {loadingAction === 'resume' ? (
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      ) : (
                        <Play className="w-4 h-4 mr-2" />
                      )}
                      Resume
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Resume streaming</TooltipContent>
                </Tooltip>
              ) : status.label !== 'Completed' && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      onClick={() => handleAction('pause', () => pauseStream(streamId))}
                      disabled={!!loadingAction}
                      variant="outline"
                      className="flex-1"
                    >
                      {loadingAction === 'pause' ? (
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      ) : (
                        <Pause className="w-4 h-4 mr-2" />
                      )}
                      Pause
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Pause streaming temporarily</TooltipContent>
                </Tooltip>
              )}

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={() => handleAction('cancel', () => cancelStream(streamId))}
                    disabled={!!loadingAction}
                    variant="ghost"
                    size="icon"
                    className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                  >
                    {loadingAction === 'cancel' ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Ban className="w-4 h-4" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Cancel stream and refund remaining</TooltipContent>
              </Tooltip>
            </>
          )}
        </TooltipProvider>
      </div>
    </div>
  );
}
