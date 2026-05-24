'use client';

import { CONTRACT_ADDRESS, CONTRACT_NAME, NETWORK } from '@/lib/stacks';
import { IS_MAINNET, IS_TESTNET } from '@/lib/network';
import { useAuth } from '@/contexts/AuthContext';

export function DebugInfo() {
  const { userAddress, isSignedIn } = useAuth();

  return (
    <div className="fixed bottom-4 right-4 bg-zinc-900 text-white p-4 rounded-lg shadow-lg text-xs font-mono max-w-md z-50">
      <div className="font-bold mb-2 text-sm">🔍 Debug Info</div>
      <div className="space-y-1">
        <div>
          <span className="text-zinc-400">Network:</span>{' '}
          <span className={IS_MAINNET ? 'text-green-400' : 'text-yellow-400'}>
            {IS_MAINNET ? 'Mainnet' : 'Testnet'}
          </span>
        </div>
        <div>
          <span className="text-zinc-400">Contract:</span>{' '}
          <span className="text-blue-400">{CONTRACT_ADDRESS}.{CONTRACT_NAME}</span>
        </div>
        <div>
          <span className="text-zinc-400">Connected:</span>{' '}
          <span className={isSignedIn ? 'text-green-400' : 'text-red-400'}>
            {isSignedIn ? 'Yes' : 'No'}
          </span>
        </div>
        {userAddress && (
          <div className="break-all">
            <span className="text-zinc-400">Address:</span>{' '}
            <span className="text-purple-400">{userAddress}</span>
          </div>
        )}
        <div className="pt-2 border-t border-zinc-700 text-zinc-500">
          Check browser console for detailed logs
        </div>
      </div>
    </div>
  );
}



