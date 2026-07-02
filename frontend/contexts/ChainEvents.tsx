'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
} from 'react';
import { StacksApiSocketClient } from '@stacks/blockchain-api-client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/toast';
import { triggerRevalidate } from '@/lib/revalidate';
import { getTransactionUrl } from '@/lib/network';
import { NETWORK_URL } from '@/lib/stacks';

interface ChainEventsValue {
  /** Register a just-submitted tx so we can confirm it when it lands. */
  watchTx: (txId: string, label: string) => void;
}

const ChainEventsContext = createContext<ChainEventsValue>({ watchTx: () => {} });

export const useChainEvents = () => useContext(ChainEventsContext);

const norm = (id: string) => (id.startsWith('0x') ? id : `0x${id}`);

export function ChainEventsProvider({ children }: { children: React.ReactNode }) {
  const { userAddress } = useAuth();
  const { toast } = useToast();
  // txId -> human label, for the "confirmed" toast on the actions we initiated.
  const watched = useRef<Map<string, string>>(new Map());

  const watchTx = useCallback((txId: string, label: string) => {
    watched.current.set(norm(txId), label);
  }, []);

  useEffect(() => {
    if (!userAddress) return;

    let client: StacksApiSocketClient | undefined;
    let sub: { unsubscribe: () => void } | undefined;

    try {
      // Socket.io subscription to the Hiro API. Pushes whenever a transaction
      // involving this address updates — including the moment the contract's
      // events are emitted on confirmation.
      client = StacksApiSocketClient.connect({ url: NETWORK_URL });
      sub = client.subscribeAddressTransactions(userAddress, (_address, update) => {
        // The payload wraps the transaction in `.tx`.
        const tx = (update as { tx?: { tx_id?: string; tx_status?: string } })?.tx;
        const status = tx?.tx_status;
        if (!status || status === 'pending') return; // wait for a terminal state

        // Any confirmed tx for this address means our chain reads may be stale.
        triggerRevalidate();

        const txId = tx?.tx_id ? norm(tx.tx_id) : undefined;
        if (txId && watched.current.has(txId)) {
          const label = watched.current.get(txId)!;
          watched.current.delete(txId);
          if (status === 'success') {
            toast({
              variant: 'success',
              title: `${label} confirmed`,
              description: 'Your balances are up to date.',
              action: { label: 'View on explorer', href: getTransactionUrl(txId) },
              duration: 7000,
            });
          } else {
            toast({
              variant: 'error',
              title: `${label} failed on-chain`,
              description: 'The transaction did not go through.',
            });
          }
        }
      });
    } catch (e) {
      // No socket (network/proxy) — the 15s poll in the data hooks still keeps
      // things fresh, just less instantly.
      console.warn('Realtime chain events unavailable; falling back to polling.', e);
    }

    return () => {
      try {
        sub?.unsubscribe();
      } catch {
        /* ignore */
      }
      try {
        client?.socket?.close();
      } catch {
        /* ignore */
      }
    };
  }, [userAddress, toast]);

  return (
    <ChainEventsContext.Provider value={{ watchTx }}>
      {children}
    </ChainEventsContext.Provider>
  );
}
