'use client';

import { useState, useEffect } from 'react';
import { ConnectWallet } from '@/components/ConnectWallet';
import { CreateStreamModal } from '@/components/CreateStreamModal';
import { StreamCard } from '@/components/StreamCard';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { Stream, StreamFilter } from '@/types/stream';
import { Plus, RefreshCw, Waves } from 'lucide-react';
import { fetchCallReadOnlyFunction, cvToJSON, uintCV } from '@stacks/transactions';
import { CONTRACT_ADDRESS, CONTRACT_NAME, NETWORK } from '@/lib/stacks';
import { useStreamEvents } from '@/hooks/useStreamEvents';

export default function Home() {
  const { isSignedIn, userAddress } = useAuth();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [streams, setStreams] = useState<Array<{ id: number; data: Stream }>>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<StreamFilter>('all');

  useEffect(() => {
    if (isSignedIn && userAddress) {
      loadStreams();
    }
  }, [isSignedIn, userAddress]);

  // Enable real-time updates
  useStreamEvents(userAddress, () => {
    // Pass false to not show full-page loading for background updates
    loadStreams(false);
  });

  const loadStreams = async (showLoadingSpinner = true) => {
    if (!userAddress) return;
    
    // Only show big loading spinner if specifically requested (initial load)
    if (showLoadingSpinner) {
      setLoading(true);
    }

    try {
      // Get total streams
      const totalResult = await fetchCallReadOnlyFunction({
        contractAddress: CONTRACT_ADDRESS,
        contractName: CONTRACT_NAME,
        functionName: 'get-total-streams',
        functionArgs: [],
        network: NETWORK,
        senderAddress: userAddress,
      });

      const totalJson = cvToJSON(totalResult);
      // console.log('Total streams result:', totalJson);
      
      // Handle response wrapper for total
      let totalValue = totalJson.value;
      if (totalJson.type?.startsWith('(response') && totalJson.value) {
        totalValue = totalJson.value;
      }
      
      // If it's a uint, it might be { type: 'uint128', value: '5' }
      if (totalValue && typeof totalValue === 'object' && 'value' in totalValue) {
        totalValue = totalValue.value;
      }
      
      const total = Number(totalValue);
      // console.log('Parsed total:', total);

      if (isNaN(total)) {
        console.error('Failed to parse total streams count', totalJson);
        return;
      }

      const loadedStreams: Array<{ id: number; data: Stream }> = [];

      // Load each stream
      for (let i = 1; i <= total; i++) {
        try {
          const streamResult = await fetchCallReadOnlyFunction({
            contractAddress: CONTRACT_ADDRESS,
            contractName: CONTRACT_NAME,
            functionName: 'get-stream',
            functionArgs: [uintCV(i)],
            network: NETWORK,
            senderAddress: userAddress,
          });

          // console.log(`Stream ${i} raw result:`, streamResult);
          
          const streamData = cvToJSON(streamResult);
          // console.log(`Stream ${i} parsed data:`, streamData);

          // Access the nested value structure correctly
          // The response structure is typically { value: { value: { ...stream fields... } } }
          // or sometimes { value: { ...stream fields... } } depending on how cvToJSON handles the optional
          
          // First check if we have a valid response
          if (!streamData || !streamData.value) {
            console.warn(`Stream ${i} has no value`);
            continue;
          }

          // Handle (ok (some ...)) or (some ...) or (ok ...) structure
          // The contract returns (ok (map-get? streams ...)) which is (ok (some tuple)) or (ok none)
          
          // If it's wrapped in OK, unwrap it
          let innerValue = streamData.value;
          if (streamData.type === '(response (optional (tuple ...)))' || streamData.type?.startsWith('(response')) {
             innerValue = streamData.value.value;
          }

          // If it's wrapped in SOME (optional), unwrap it
          if (innerValue && innerValue.type === '(optional (tuple ...))' || innerValue?.type?.startsWith('(optional')) {
             innerValue = innerValue.value;
          }

          // Now innerValue should be the tuple
          if (innerValue && innerValue.value) {
            const stream = innerValue.value;
            
            // Debug: Log the entire stream structure
            console.log(`Stream ${i} full structure:`, JSON.stringify(stream, null, 2));
            
            // Check if stream is actually an object
            if (!stream || typeof stream !== 'object') {
              console.warn(`Stream ${i} has invalid structure (not an object):`, stream);
              continue;
            }
            
            // Add validation to ensure all required fields exist
            const requiredFields = [
              'sender', 'recipient', 'token-amount', 'start-time', 'end-time',
              'withdrawn-amount', 'is-cancelled', 'is-paused', 'paused-at',
              'total-paused-duration', 'created-at-block'
            ];
            
            const missingFields = requiredFields.filter(field => !stream[field]);
            if (missingFields.length > 0) {
              console.warn(`Stream ${i} is missing fields:`, missingFields);
              console.log(`Stream ${i} available fields:`, Object.keys(stream));
              continue;
            }
            
            // Validate that fields have the expected .value property
            const invalidFields = requiredFields.filter(field => 
              stream[field] && typeof stream[field] === 'object' && !('value' in stream[field])
            );
            if (invalidFields.length > 0) {
              console.warn(`Stream ${i} has fields without .value:`, invalidFields);
              continue;
            }
            
            // Only show streams where user is sender or recipient
            if (
              stream.sender?.value === userAddress ||
              stream.recipient?.value === userAddress
            ) {
              try {
                loadedStreams.push({
                  id: i,
                  data: {
                    sender: stream.sender.value,
                    recipient: stream.recipient.value,
                    tokenAmount: Number(stream['token-amount'].value),
                    startTime: Number(stream['start-time'].value),
                    endTime: Number(stream['end-time'].value),
                    withdrawnAmount: Number(stream['withdrawn-amount'].value),
                    isCancelled: stream['is-cancelled'].value,
                    isPaused: stream['is-paused'].value,
                    pausedAt: Number(stream['paused-at'].value),
                    totalPausedDuration: Number(stream['total-paused-duration'].value),
                    createdAtBlock: Number(stream['created-at-block'].value),
                    tokenType: 'STX', // This contract only supports STX
                    tokenContract: null, // No token contract for STX
                  },
                });
              } catch (parseError) {
                console.error(`Error parsing stream ${i}:`, parseError);
                console.log('Stream data that caused error:', stream);
              }
            }
          }
        } catch (error) {
          console.error(`Error loading stream ${i}:`, error);
        }
      }

      setStreams(loadedStreams);
    } catch (error) {
      console.error('Error loading streams:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredStreams = streams.filter((stream) => {
    if (filter === 'all') return true;
    
    const now = Date.now() / 1000;
    const adjustedEndTime = stream.data.endTime + stream.data.totalPausedDuration;
    
    if (filter === 'cancelled') return stream.data.isCancelled;
    if (filter === 'paused') return stream.data.isPaused && !stream.data.isCancelled;
    if (filter === 'completed') return now >= adjustedEndTime && !stream.data.isCancelled;
    if (filter === 'active') return now >= stream.data.startTime && now < adjustedEndTime && !stream.data.isPaused && !stream.data.isCancelled;
    
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
                  onClick={loadStreams}
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
                    streamId={stream.id}
                    stream={stream.data}
                    onUpdate={loadStreams}
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
        onSuccess={loadStreams}
      />
    </div>
  );
}
