'use client';

import { useState } from 'react';
import { ConnectWallet } from '@/components/ConnectWallet';
import { CreateStreamModal } from '@/components/CreateStreamModal';
import { StreamCard } from '@/components/StreamCard';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { StreamFilter } from '@/types/stream';
import { Plus, RefreshCw, Waves } from 'lucide-react';
import { useStreamsFromDB } from '@/hooks/useStreamsFromDB';

export default function Home() {
  const { isSignedIn, userAddress } = useAuth();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filter, setFilter] = useState<StreamFilter>('all');
  
  const { streams, loading, refresh } = useStreamsFromDB(userAddress);

  const filteredStreams = streams.filter((stream) => {
    if (filter === 'all') return true;
    
    const now = Date.now() / 1000;
    const adjustedEndTime = stream.endTime + stream.totalPausedDuration;
    
    if (filter === 'cancelled') return stream.isCancelled;
    if (filter === 'paused') return stream.isPaused && !stream.isCancelled;
    if (filter === 'completed') return now >= adjustedEndTime && !stream.isCancelled;
    if (filter === 'active') return now >= stream.startTime && now < adjustedEndTime && !stream.isPaused && !stream.isCancelled;
    
    return true;
  });

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      {/* Header */}
      <header className="border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <Waves className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold">Token Streaming</h1>
                <p className="text-sm text-zinc-500">Stream tokens over time</p>
              </div>
            </div>
            <ConnectWallet />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!isSignedIn ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Waves className="w-16 h-16 text-zinc-400 mb-4" />
            <h2 className="text-2xl font-semibold mb-2">Welcome to Token Streaming</h2>
            <p className="text-zinc-500 mb-6 text-center max-w-md">
              Stream STX and SIP-010 tokens over time with vesting, pause/resume, and more.
            </p>
            <ConnectWallet />
          </div>
        ) : (
          <>
            {/* Actions Bar */}
            <div className="flex justify-between items-center mb-6">
              <div className="flex gap-2">
                <Button
                  variant={filter === 'all' ? 'default' : 'outline'}
                  onClick={() => setFilter('all')}
                  size="sm"
                >
                  All
                </Button>
                <Button
                  variant={filter === 'active' ? 'default' : 'outline'}
                  onClick={() => setFilter('active')}
                  size="sm"
                >
                  Active
                </Button>
                <Button
                  variant={filter === 'paused' ? 'default' : 'outline'}
                  onClick={() => setFilter('paused')}
                  size="sm"
                >
                  Paused
                </Button>
                <Button
                  variant={filter === 'completed' ? 'default' : 'outline'}
                  onClick={() => setFilter('completed')}
                  size="sm"
                >
                  Completed
                </Button>
                <Button
                  variant={filter === 'cancelled' ? 'default' : 'outline'}
                  onClick={() => setFilter('cancelled')}
                  size="sm"
                >
                  Cancelled
                </Button>
              </div>
              
              <div className="flex gap-2">
                <Button
                  onClick={refresh}
                  variant="outline"
                  size="sm"
                  disabled={loading}
                  className="gap-2"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
                <Button
                  onClick={() => setShowCreateModal(true)}
                  className="gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Create Stream
                </Button>
              </div>
            </div>

            {/* Streams Grid */}
            {loading ? (
              <div className="flex justify-center items-center py-20">
                <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
              </div>
            ) : filteredStreams.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <Waves className="w-16 h-16 text-zinc-300 dark:text-zinc-700 mb-4" />
                <h3 className="text-xl font-semibold mb-2">No streams found</h3>
                <p className="text-zinc-500 mb-6">
                  {filter === 'all' 
                    ? 'Create your first stream to get started' 
                    : `No ${filter} streams`}
                </p>
                {filter === 'all' && (
                  <Button onClick={() => setShowCreateModal(true)} className="gap-2">
                    <Plus className="w-4 h-4" />
                    Create Stream
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
          </>
        )}
      </main>

      {/* Create Stream Modal */}
      <CreateStreamModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={refresh}
      />
    </div>
  );
}
