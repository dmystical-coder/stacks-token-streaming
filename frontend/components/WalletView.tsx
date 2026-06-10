'use client';

import { useWalletData } from '@/hooks/useWalletData';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import {
  RefreshCw,
  ArrowUpRight,
  ArrowDownLeft,
  ExternalLink,
  Copy,
  Check,
} from 'lucide-react';
import { microStxToStx, CONTRACT_ADDRESS, CONTRACT_NAME } from '@/lib/stacks';
import { getTransactionUrl, getAddressUrl } from '@/lib/network';
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

function humanize(fn: string) {
  return fn.replace(/-/g, ' ').replace(/^\w/, (c) => c.toUpperCase());
}

export function WalletView() {
  const { userAddress } = useAuth();
  const { balance, transactions, loading, refresh } = useWalletData(userAddress);
  const [copied, setCopied] = useState(false);

  const copyAddress = () => {
    if (!userAddress) return;
    navigator.clipboard.writeText(userAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getTxLabel = (tx: Transaction) => {
    if (tx.tx_type === 'contract_call' && tx.contract_call) {
      return humanize(tx.contract_call.function_name);
    }
    if (tx.tx_type === 'token_transfer') {
      return tx.sender_address === userAddress ? 'Sent STX' : 'Received STX';
    }
    return humanize(tx.tx_type);
  };

  const isContractInteraction = (tx: Transaction) =>
    tx.contract_call?.contract_id === `${CONTRACT_ADDRESS}.${CONTRACT_NAME}`;

  if (!userAddress) return null;

  const locked = balance ? Number(balance.locked) : 0;

  return (
    <div className="space-y-6">
      {/* Balance hero — no card, just a section */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="text-[11px] uppercase tracking-[0.08em] text-muted-foreground">
            Total balance
          </div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="tabular font-mono text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              {balance ? microStxToStx(Number(balance.balance)) : '0.000000'}
            </span>
            <span className="text-base text-muted-foreground">STX</span>
          </div>
          <div className="mt-2 flex items-center gap-1.5">
            <span className="tabular truncate font-mono text-xs text-muted-foreground">
              {userAddress}
            </span>
            <button
              onClick={copyAddress}
              aria-label="Copy address"
              className="shrink-0 rounded p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              {copied ? (
                <Check className="h-3.5 w-3.5 text-success" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
            </button>
            <a
              href={getAddressUrl(userAddress)}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="View address on explorer"
              className="shrink-0 rounded p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={refresh}
          disabled={loading}
          className="h-8 gap-1.5 self-start text-xs sm:self-auto"
        >
          <RefreshCw className={cn('h-3 w-3', loading && 'animate-spin')} />
          Refresh
        </Button>
      </div>

      {/* Lifetime stats — hairline grid, consistent with the streams overview */}
      <div
        className={cn(
          'grid gap-px overflow-hidden rounded-xl border border-border bg-border',
          locked > 0 ? 'grid-cols-3' : 'grid-cols-2'
        )}
      >
        <div className="bg-card p-4">
          <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-[0.08em] text-muted-foreground">
            <ArrowDownLeft className="h-3.5 w-3.5 text-success" />
            Received
          </div>
          <div className="tabular mt-1 font-mono text-lg font-medium text-foreground">
            {balance ? microStxToStx(Number(balance.total_received)) : '0'}
          </div>
        </div>
        <div className="bg-card p-4">
          <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-[0.08em] text-muted-foreground">
            <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground" />
            Sent
          </div>
          <div className="tabular mt-1 font-mono text-lg font-medium text-foreground">
            {balance ? microStxToStx(Number(balance.total_sent)) : '0'}
          </div>
        </div>
        {locked > 0 && (
          <div className="bg-card p-4">
            <div className="text-[11px] uppercase tracking-[0.08em] text-muted-foreground">
              Locked
            </div>
            <div className="tabular mt-1 font-mono text-lg font-medium text-foreground">
              {microStxToStx(locked)}
            </div>
          </div>
        )}
      </div>

      {/* Activity */}
      <div>
        <h3 className="mb-3 text-sm font-medium text-foreground">Recent activity</h3>
        {loading && transactions.length === 0 ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="flex animate-pulse items-center gap-3 rounded-xl border border-border bg-card px-4 py-3"
              >
                <div className="h-8 w-8 shrink-0 rounded-full bg-muted" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 w-32 rounded bg-muted" />
                  <div className="h-2.5 w-20 rounded bg-muted" />
                </div>
              </div>
            ))}
          </div>
        ) : transactions.length > 0 ? (
          <div className="space-y-2">
            {transactions.map((tx) => {
              const outgoing = tx.sender_address === userAddress;
              const isContract = isContractInteraction(tx);
              const success = tx.tx_status === 'success';
              const pending = tx.tx_status === 'pending';
              return (
                <div
                  key={tx.tx_id}
                  className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 transition-colors hover:border-foreground/20"
                >
                  <div
                    className={cn(
                      'flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
                      outgoing
                        ? 'bg-muted text-muted-foreground'
                        : 'bg-success/10 text-success'
                    )}
                  >
                    {outgoing ? (
                      <ArrowUpRight className="h-4 w-4" />
                    ) : (
                      <ArrowDownLeft className="h-4 w-4" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-sm font-medium text-foreground">
                        {getTxLabel(tx)}
                      </span>
                      {isContract && (
                        <span className="shrink-0 rounded-full border border-primary/25 bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                          Contract
                        </span>
                      )}
                    </div>
                    <div className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                      <span
                        className={cn(
                          'inline-block h-1.5 w-1.5 rounded-full',
                          success ? 'bg-success' : pending ? 'bg-warning' : 'bg-destructive'
                        )}
                      />
                      {tx.burn_block_time_iso
                        ? format(new Date(tx.burn_block_time_iso), 'PP p')
                        : 'Pending'}
                    </div>
                  </div>

                  <a
                    href={getTransactionUrl(tx.tx_id)}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="View transaction on explorer"
                    className="shrink-0 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-12 text-center">
            <p className="text-sm text-muted-foreground">No transactions yet</p>
          </div>
        )}
      </div>
    </div>
  );
}
