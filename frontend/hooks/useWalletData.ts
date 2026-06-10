'use client';

import { useState, useEffect, useCallback } from 'react';
import { NETWORK_URL } from '@/lib/stacks';
import { onRevalidate } from '@/lib/revalidate';

// Background refresh cadence for balance + activity.
const POLL_MS = 15_000;

interface StxBalance {
  balance: string;
  total_sent: string;
  total_received: string;
  locked: string;
}

interface Transaction {
  tx_id: string;
  tx_status: string;
  tx_type: string;
  sender_address: string;
  burn_block_time_iso: string;
  contract_call?: {
    contract_id: string;
    function_name: string;
  };
}

export function useWalletData(address: string | null) {
  const [balance, setBalance] = useState<StxBalance | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchData = useCallback(
    async (opts?: { silent?: boolean }) => {
      if (!address) return;
      const silent = opts?.silent ?? false;

      if (!silent) setLoading(true);
      try {
        const balanceRes = await fetch(`${NETWORK_URL}/extended/v1/address/${address}/balances`);
        const balanceData = await balanceRes.json();
        setBalance(balanceData.stx);

        const txRes = await fetch(`${NETWORK_URL}/extended/v1/address/${address}/transactions?limit=50`);
        const txData = await txRes.json();
        setTransactions(txData.results);
      } catch (error) {
        // Background polls keep the last good data rather than blanking it.
        console.error('Error fetching wallet data:', error);
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [address]
  );

  useEffect(() => {
    if (!address) {
      setBalance(null);
      setTransactions([]);
      return;
    }

    let intervalId: ReturnType<typeof setInterval> | undefined;
    const stop = () => {
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = undefined;
      }
    };
    const start = () => {
      stop();
      intervalId = setInterval(() => {
        fetchData({ silent: true }).catch(() => {});
      }, POLL_MS);
    };

    fetchData().catch(() => {});
    start();

    const onVisibility = () => {
      if (document.hidden) {
        stop();
      } else {
        fetchData({ silent: true }).catch(() => {});
        start();
      }
    };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      stop();
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [address, fetchData]);

  // Refetch the instant a tx for this address confirms on-chain.
  useEffect(
    () => onRevalidate(() => { fetchData({ silent: true }).catch(() => {}); }),
    [fetchData]
  );

  return {
    balance,
    transactions,
    loading,
    refresh: fetchData,
  };
}
