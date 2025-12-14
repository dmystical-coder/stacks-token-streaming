import { useEffect } from "react";
import { connectWebSocketClient } from "@stacks/blockchain-api-client";
import { NETWORK_URL } from "@/lib/stacks";

export function useStreamEvents(address: string | null, onUpdate: () => void) {
  useEffect(() => {
    if (!address) return;

    let client: any;
    let sub: any;
    let isSubscribed = true;

    const connect = async () => {
      // Convert https -> wss
      const wsUrl = NETWORK_URL.replace("https://", "wss://").replace(
        "http://",
        "ws://"
      );

      try {
        client = await connectWebSocketClient(wsUrl);

        if (!isSubscribed) {
          // Component unmounted before connection completed
          return;
        }

        // Subscribe to transactions involving the user's address
        sub = await client.subscribeAddressTransactions(
          address,
          (event: any) => {
            console.log("Transaction event received:", event);
            // Trigger update on any transaction status change (mempool, included, etc.)
            onUpdate();
          }
        );

        console.log("✓ Connected to Stacks WebSocket for real-time updates");
      } catch (error) {
        // WebSocket connection is optional - app works fine without it
        // Users can manually refresh to see updates
        console.warn(
          "WebSocket unavailable - real-time updates disabled. Use refresh button for updates."
        );
        // Don't log the full error as it clutters the console
      }
    };

    connect();

    return () => {
      isSubscribed = false;
      if (sub) {
        sub.unsubscribe().catch(() => {
          // Silently fail - cleanup errors don't matter
        });
      }
    };
  }, [address, onUpdate]);
}
