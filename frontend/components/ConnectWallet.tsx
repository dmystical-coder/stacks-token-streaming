'use client';

import { Button } from './ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { Wallet, LogOut } from 'lucide-react';

export function ConnectWallet() {
  const { isSignedIn, userAddress, bnsName, signIn, signOut } = useAuth();

  if (isSignedIn && userAddress) {
    return (
      <div className="flex items-center gap-2">
        <div className="px-3 py-2 bg-zinc-100 dark:bg-zinc-800 rounded-lg text-sm font-medium">
          {bnsName || `${userAddress.slice(0, 6)}...${userAddress.slice(-4)}`}
        </div>
        <Button
          onClick={signOut}
          variant="outline"
          size="sm"
          className="gap-2"
        >
          <LogOut className="w-4 h-4" />
          Disconnect
        </Button>
      </div>
    );
  }

  return (
    <Button
      onClick={signIn}
      className="gap-2"
    >
      <Wallet className="w-4 h-4" />
      Connect Wallet
    </Button>
  );
}
