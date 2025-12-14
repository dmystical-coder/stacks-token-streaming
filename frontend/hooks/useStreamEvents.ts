import { useEffect } from "react";
import { connectWebSocketClient } from "@stacks/blockchain-api-client";
import { NETWORK_URL } from "@/lib/stacks";

export function useStreamEvents(address: string | null, onUpdate: () => void) {
  useEffect(() => {
    if (!address) return;

    // Define simpler types for the websocket client interactions we use
    interface WebSocketClient {
      subscribeAddressTransactions: (
        address: string,
        callback: (event: unknown) => void
      ) => Promise<{ unsubscribe: () => Promise<void> }>;
    }

    let client: WebSocketClient;
    let sub: { unsubscribe: () => Promise<void> };
    let isSubscribed = true;

    const connect = async () => {
      // Convert https -> wss
      const wsUrl = NETWORK_URL.replace("https://", "wss://").replace(
        "http://",
        "ws://"
      );

      try {
        // Cast the result to our simplified interface or unknown first
        const rawClient = await connectWebSocketClient(wsUrl);
        client = rawClient as unknown as WebSocketClient;

        if (!isSubscribed) {
          // Component unmounted before connection completed
          return;
        }

        // Subscribe to transactions involving the user's address
        sub = await client.subscribeAddressTransactions(
          address,
          (event: unknown) => {
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
        console.warn("WebSocket error:", error);
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
