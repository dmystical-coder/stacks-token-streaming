import { useState, useEffect, useCallback } from 'react';
import { Stream } from '@/types/stream';
import { fetchCallReadOnlyFunction, standardPrincipalCV, uintCV, cvToValue } from '@stacks/transactions';
import { NETWORK_INSTANCE } from '@/lib/network';
import { CONTRACT_ADDRESS, CONTRACT_NAME } from '@/lib/stacks';

export function useStreamsFromChain(userAddress: string | null) {
  const [streams, setStreams] = useState<Stream[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStreamDetails = async (streamId: number): Promise<Stream | null> => {
    try {
      const result = await fetchCallReadOnlyFunction({
        contractAddress: CONTRACT_ADDRESS,
        contractName: CONTRACT_NAME,
        functionName: 'get-stream',
        functionArgs: [uintCV(streamId)],
        network: NETWORK_INSTANCE,
        senderAddress: userAddress || CONTRACT_ADDRESS,
      });

      const value = cvToValue(result);
      if (!value || !value.value) return null;

      const data = value.value.value;
      return {
        id: streamId,
        sender: data.sender.value,
        recipient: data.recipient.value,
        tokenAmount: Number(data['token-amount'].value),
        startTime: Number(data['start-time'].value),
        endTime: Number(data['end-time'].value),
        withdrawnAmount: Number(data['withdrawn-amount'].value),
        isCancelled: data['is-cancelled'].value,
        isPaused: data['is-paused'].value,
        pausedAt: Number(data['paused-at'].value),
        totalPausedDuration: Number(data['total-paused-duration'].value),
        createdAtBlock: Number(data['created-at-block'].value),
        tokenType: 'STX',
        tokenContract: null,
      };
    } catch (e) {
      console.error(`Error fetching stream ${streamId}:`, e);
      return null;
    }
  };

  const fetchStreams = useCallback(async () => {
    if (!userAddress) {
      setStreams([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const [senderResult, recipientResult] = await Promise.all([
        fetchCallReadOnlyFunction({
          contractAddress: CONTRACT_ADDRESS,
          contractName: CONTRACT_NAME,
          functionName: 'get-streams-by-sender',
          functionArgs: [standardPrincipalCV(userAddress)],
          network: NETWORK_INSTANCE,
          senderAddress: userAddress,
        }),
        fetchCallReadOnlyFunction({
          contractAddress: CONTRACT_ADDRESS,
          contractName: CONTRACT_NAME,
          functionName: 'get-streams-by-recipient',
          functionArgs: [standardPrincipalCV(userAddress)],
          network: NETWORK_INSTANCE,
          senderAddress: userAddress,
        })
      ]);

      const senderData = cvToValue(senderResult);
      const recipientData = cvToValue(recipientResult);

      const senderIds = senderData?.value?.value?.['stream-ids']?.value?.map((id: { value: string }) => Number(id.value)) || [];
      const recipientIds = recipientData?.value?.value?.['stream-ids']?.value?.map((id: { value: string }) => Number(id.value)) || [];

      const allIds = Array.from(new Set([...senderIds, ...recipientIds]));

      if (allIds.length === 0) {
        setStreams([]);
        return;
      }

      const streamPromises = allIds.map(id => fetchStreamDetails(id));
      const fetched = (await Promise.all(streamPromises)).filter((s): s is Stream => s !== null);
      setStreams(fetched.sort((a, b) => (b.id || 0) - (a.id || 0)));
    } catch (err) {
      console.error('Error fetching streams from chain:', err);
      if (err instanceof Error) setError(err.message);
      setStreams([]);
    } finally {
      setLoading(false);
    }
  }, [userAddress]);

  useEffect(() => {
    fetchStreams().catch(err => {
      console.error('Unhandled error in fetchStreams:', err);
    });
  }, [fetchStreams]);

  return { streams, loading, error, refresh: fetchStreams };
}
