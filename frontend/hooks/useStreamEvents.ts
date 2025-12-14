import { useEffect } from 'react';
import { connectWebSocketClient } from '@stacks/blockchain-api-client';
import { NETWORK_URL } from '@/lib/stacks';

export function useStreamEvents(address: string | null, onUpdate: () => void) {
  useEffect(() => {
    if (!address) return;

    let client: any;
    let sub: any;

    const connect = async () => {
      // Convert https -> wss
      const wsUrl = NETWORK_URL.replace('https://', 'wss://').replace('http://', 'ws://');
      
      try {
        client = await connectWebSocketClient(wsUrl);
        
        // Subscribe to transactions involving the user's address
        sub = await client.subscribeAddressTransactions(address, (event: any) => {
          console.log('Transaction event received:', event);
          // Trigger update on any transaction status change (mempool, included, etc.)
          onUpdate();
        });
        
        console.log('Connected to Stacks WebSocket for real-time updates');
      } catch (error) {
        console.error('WebSocket connection failed:', error);
      }
    };

    connect();

    return () => {
      if (sub) {
        sub.unsubscribe().catch((err: any) => console.error('Error unsubscribing:', err));
      }
    };
  }, [address, onUpdate]);
}


