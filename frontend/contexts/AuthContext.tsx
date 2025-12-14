'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { connect, isConnected, disconnect, getLocalStorage } from '@stacks/connect';
import { NETWORK_NAME, NETWORK } from '@/lib/stacks';

interface AuthContextType {
  isSignedIn: boolean;
  userAddress: string | null;
  bnsName: string | null;
  signIn: () => void;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Determine expected address prefix based on network
const IS_MAINNET = NETWORK === 'mainnet';
const EXPECTED_PREFIX = IS_MAINNET ? 'SP' : 'ST';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [userAddress, setUserAddress] = useState<string | null>(null);
  const [bnsName, setBnsName] = useState<string | null>(null);

  const fetchBnsName = async (address: string) => {
    try {
      // Use the appropriate BNS API endpoint based on network
      const bnsNetwork = IS_MAINNET ? 'mainnet' : 'testnet';
      const response = await fetch(`https://api.bnsv2.com/${bnsNetwork}/names/address/${address}/valid`);
      const data = await response.json();
      if (data.names && data.names.length > 0) {
        setBnsName(data.names[0].full_name);
      } else {
        setBnsName(null);
      }
    } catch (error) {
      console.error('Error fetching BNS name:', error);
      setBnsName(null);
    }
  };

  useEffect(() => {
    if (isConnected()) {
      const storageData = getLocalStorage();
      if (storageData && storageData.addresses && storageData.addresses.stx && storageData.addresses.stx.length > 0) {
        const address = storageData.addresses.stx[0].address;
        // Verify address matches the expected network prefix
        if (address.startsWith(EXPECTED_PREFIX)) {
          setIsSignedIn(true);
          setUserAddress(address);
          fetchBnsName(address);
        } else {
          // If address doesn't match expected network, sign out
          console.warn(`Address ${address} does not match expected network (${NETWORK}). Expected prefix: ${EXPECTED_PREFIX}`);
          disconnect();
          setIsSignedIn(false);
          setUserAddress(null);
          setBnsName(null);
        }
      }
    }
  }, []);

  const signIn = async () => {
    try {
      const response = await connect({ network: NETWORK_NAME });
      const stxAddressEntry = response.addresses.find(a => a.symbol === 'STX');
      
      if (stxAddressEntry) {
        setIsSignedIn(true);
        setUserAddress(stxAddressEntry.address);
        fetchBnsName(stxAddressEntry.address);
      }
    } catch (error) {
      console.error('Error during sign in:', error);
    }
  };

  const signOut = () => {
    disconnect();
    setIsSignedIn(false);
    setUserAddress(null);
    setBnsName(null);
  };

  return (
    <AuthContext.Provider value={{ isSignedIn, userAddress, bnsName, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
