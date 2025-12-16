import { useState, useEffect } from 'react';
import { Stream } from '@/types/stream';

export function useStreamsFromDB(userAddress: string | null) {
  const [streams, setStreams] = useState<Stream[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStreams() {
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
        
        // Map Prisma DB model to Stream interface if necessary
        // Assuming the DB model fields largely match the frontend Stream type
        // We might need to handle slight field mismatches here
        setStreams(data);
      } catch (err) {
        console.error(err);
        setError('Failed to load streams from database');
      } finally {
        setLoading(false);
      }
    }

    fetchStreams();
  }, [userAddress]);

  return { streams, loading, error, refresh: () => setStreams([]) }; // Simplified refresh for now
}

