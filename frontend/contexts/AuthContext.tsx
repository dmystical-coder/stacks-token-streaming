'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { connect, isConnected, disconnect, getLocalStorage } from '@stacks/connect';
import { NETWORK_NAME } from '@/lib/stacks';

interface AuthContextType {
  isSignedIn: boolean;
  userAddress: string | null;
  bnsName: string | null;
  signIn: () => void;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [userAddress, setUserAddress] = useState<string | null>(null);
  const [bnsName, setBnsName] = useState<string | null>(null);

  const fetchBnsName = async (address: string) => {
    try {
      const response = await fetch(`https://api.bnsv2.com/testnet/names/address/${address}/valid`);
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
        // Verify address matches testnet (starts with ST)
        if (address.startsWith('ST')) {
          setIsSignedIn(true);
          setUserAddress(address);
          fetchBnsName(address);
        } else {
          // If address is not testnet, sign out
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
