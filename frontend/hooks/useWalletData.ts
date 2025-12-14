import { useState, useEffect, useCallback } from 'react';
import { NETWORK_URL } from '@/lib/stacks';

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

  const fetchData = useCallback(async () => {
    if (!address) return;

    setLoading(true);
    try {
      // Fetch Balance
      const balanceRes = await fetch(`${NETWORK_URL}/extended/v1/address/${address}/balances`);
      const balanceData = await balanceRes.json();
      setBalance(balanceData.stx);

      // Fetch Transactions
      const txRes = await fetch(`${NETWORK_URL}/extended/v1/address/${address}/transactions?limit=50`);
      const txData = await txRes.json();
      setTransactions(txData.results);
    } catch (error) {
      console.error('Error fetching wallet data:', error);
    } finally {
      setLoading(false);
    }
  }, [address]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    balance,
    transactions,
    loading,
    refresh: fetchData
  };
}

