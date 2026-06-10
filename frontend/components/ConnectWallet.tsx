'use client';

import { useAuth } from '@/contexts/AuthContext';
import { LogOut } from 'lucide-react';

export function ConnectWallet() {
  const { isSignedIn, userAddress, signIn, signOut } = useAuth();

  if (isSignedIn && userAddress) {
    return (
      <div className="flex items-center gap-1.5">
        <span className="font-mono text-xs text-slate-500 bg-slate-100 border border-slate-200 px-2.5 py-1.5 rounded-lg">
          {userAddress.slice(0, 6)}…{userAddress.slice(-4)}
        </span>
        <button
          onClick={signOut}
          title="Disconnect wallet"
          className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={signIn}
      className="px-3.5 py-2 bg-blue-700 hover:bg-blue-800 text-white text-sm font-medium rounded-lg transition-colors"
    >
      Connect Wallet
    </button>
  );
}
