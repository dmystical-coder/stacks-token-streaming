'use client';

import { useAuth } from '@/contexts/AuthContext';
import { LogOut, Wallet } from 'lucide-react';

export function ConnectWallet() {
  const { isSignedIn, userAddress, signIn, signOut } = useAuth();

  if (isSignedIn && userAddress) {
    return (
      <div className="flex items-center gap-1.5">
        <span className="tabular rounded-md border border-border bg-muted px-2.5 py-1.5 font-mono text-xs text-muted-foreground">
          {userAddress.slice(0, 5)}…{userAddress.slice(-4)}
        </span>
        <button
          onClick={signOut}
          title="Disconnect wallet"
          aria-label="Disconnect wallet"
          className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={signIn}
      className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 sm:px-3.5"
    >
      <Wallet className="h-4 w-4" />
      <span className="hidden sm:inline">Connect Wallet</span>
      <span className="sm:hidden">Connect</span>
    </button>
  );
}
