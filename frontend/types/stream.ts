export interface Stream {
  sender: string;
  recipient: string;
  tokenAmount: number;
  startTime: number;
  endTime: number;
  withdrawnAmount: number;
  isCancelled: boolean;
  isPaused: boolean;
  pausedAt: number;
  totalPausedDuration: number;
  createdAtBlock: number;
  tokenType: string;
  tokenContract: string | null;
}

export interface StreamStatus {
  status: 'scheduled' | 'active' | 'paused' | 'completed' | 'cancelled';
  availableBalance: number;
  vestedPercentage: number;
  remainingTime: number;
}

export type StreamFilter = 'all' | 'active' | 'paused' | 'completed' | 'cancelled';
