import { useState, useEffect, useCallback } from 'react';
import { Stream } from '@/types/stream';

export function useStreamsFromDB(userAddress: string | null) {
  const [streams, setStreams] = useState<Stream[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStreams = useCallback(async () => {
    if (!userAddress) {
      setStreams([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(`/api/streams?address=${userAddress}`);
      if (!res.ok) throw new Error('Failed to fetch streams');
      
      const data = await res.json();
      
      // Transform DB data to frontend Stream type
      // Note: DB uses float for amounts, contract uses integers (microSTX)
      // We should ensure types align. DB `tokenAmount` is Float.
      const mappedStreams: Stream[] = data.map((s: any) => ({
        ...s,
        // Ensure strictly typed fields if needed
      }));

      setStreams(mappedStreams);
    } catch (err) {
      console.error(err);
      setError('Failed to load streams from database');
    } finally {
      setLoading(false);
    }
  }, [userAddress]);

  useEffect(() => {
    fetchStreams();
  }, [fetchStreams]);

  return { streams, loading, error, refresh: fetchStreams };
}
