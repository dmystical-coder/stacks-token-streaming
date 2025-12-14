'use client';

import { useWalletData } from '@/hooks/useWalletData';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, RefreshCw, ArrowUpRight, ArrowDownLeft, ExternalLink, Copy, Check } from 'lucide-react';
import { microStxToStx, CONTRACT_ADDRESS, CONTRACT_NAME } from '@/lib/stacks';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

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

export function WalletView() {
  const { userAddress } = useAuth();
  const { balance, transactions, loading, refresh } = useWalletData(userAddress);
  const [copied, setCopied] = useState(false);

  const copyAddress = () => {
    if (userAddress) {
      navigator.clipboard.writeText(userAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const truncateAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const getTxLabel = (tx: Transaction) => {
    if (tx.tx_type === 'contract_call' && tx.contract_call) {
      return tx.contract_call.function_name;
    }
    if (tx.tx_type === 'token_transfer') {
      return tx.sender_address === userAddress ? 'Sent STX' : 'Received STX';
    }
    return tx.tx_type;
  };

  const isContractInteraction = (tx: Transaction) => {
    return tx.contract_call?.contract_id === `${CONTRACT_ADDRESS}.${CONTRACT_NAME}`;
  };

  if (!userAddress) return null;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Wallet Overview</h2>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={refresh} 
          disabled={loading}
          className="gap-2"
        >
          <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
          Refresh
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Balance Card */}
        <Card className="md:col-span-2 lg:col-span-1">
          <CardHeader>
            <CardTitle>Total Balance</CardTitle>
            <CardDescription>Available STX in your wallet</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4">
              <div>
                <span className="text-4xl font-bold">
                  {balance ? microStxToStx(Number(balance.balance)) : '0.00'}
                </span>
                <span className="text-zinc-500 ml-2">STX</span>
              </div>
              
              <div className="flex items-center gap-2 p-2 bg-zinc-100 dark:bg-zinc-900 rounded-lg w-fit">
                <span className="text-sm font-mono text-zinc-600 dark:text-zinc-400">
                  {truncateAddress(userAddress)}
                </span>
                <button 
                  onClick={copyAddress}
                  className="p-1 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded transition-colors"
                >
                  {copied ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3 text-zinc-500" />}
                </button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Card */}
        <Card className="md:col-span-2 lg:col-span-1">
          <CardHeader>
            <CardTitle>Activity Stats</CardTitle>
            <CardDescription>Lifetime wallet activity</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-green-50 dark:bg-green-900/10 border border-green-100 dark:border-green-900/30">
                <div className="flex items-center gap-2 mb-2 text-green-700 dark:text-green-400">
                  <ArrowDownLeft className="w-4 h-4" />
                  <span className="text-sm font-medium">Received</span>
                </div>
                <div className="font-bold text-lg">
                   {balance ? microStxToStx(Number(balance.total_received)) : '0'} STX
                </div>
              </div>
              
              <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30">
                <div className="flex items-center gap-2 mb-2 text-red-700 dark:text-red-400">
                  <ArrowUpRight className="w-4 h-4" />
                  <span className="text-sm font-medium">Sent</span>
                </div>
                <div className="font-bold text-lg">
                  {balance ? microStxToStx(Number(balance.total_sent)) : '0'} STX
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transaction History */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Your recent transactions</CardDescription>
        </CardHeader>
        <CardContent>
          {loading && !transactions.length ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-zinc-400" />
            </div>
          ) : transactions.length > 0 ? (
            <div className="space-y-4">
              {transactions.map((tx) => {
                const isContract = isContractInteraction(tx);
                return (
                  <div 
                    key={tx.tx_id}
                    className={cn(
                      "flex items-center justify-between p-4 rounded-lg border transition-all",
                      isContract 
                        ? "bg-blue-50/50 border-blue-100 dark:bg-blue-900/10 dark:border-blue-900/30" 
                        : "bg-white border-zinc-100 dark:bg-zinc-900/50 dark:border-zinc-800"
                    )}
                  >
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "p-2 rounded-full",
                        tx.tx_status === 'success' ? "bg-green-100 text-green-600 dark:bg-green-900/30" : "bg-red-100 text-red-600 dark:bg-red-900/30"
                      )}>
                        {tx.tx_type === 'token_transfer' && tx.sender_address === userAddress ? (
                          <ArrowUpRight className="w-4 h-4" />
                        ) : (
                          <RefreshCw className="w-4 h-4" />
                        )}
                      </div>
                      <div>
                        <div className="font-medium flex items-center gap-2">
                          {getTxLabel(tx)}
                          {isContract && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                              Contract
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-zinc-500">
                           {tx.burn_block_time_iso ? format(new Date(tx.burn_block_time_iso), 'PPp') : 'Pending'}
                        </div>
                      </div>
                    </div>
                    
                    <a 
                      href={`https://explorer.hiro.so/txid/${tx.tx_id}?chain=mainnet`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-zinc-500">
              No recent transactions found
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
