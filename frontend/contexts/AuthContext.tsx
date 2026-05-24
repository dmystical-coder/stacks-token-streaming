'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AppConfig, UserSession, AuthOptions, authenticate } from '@stacks/connect';
import { getNetworkAddress } from '@/lib/network';

interface AuthContextType {
  userSession: UserSession;
  isSignedIn: boolean;
  userAddress: string | null;
  signIn: () => void;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const appConfig = new AppConfig(['store_write', 'publish_data']);
const userSession = new UserSession({ appConfig });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [userAddress, setUserAddress] = useState<string | null>(null);

  useEffect(() => {
    if (userSession.isUserSignedIn()) {
      setIsSignedIn(true);
      const address = getNetworkAddress(userSession);
      setUserAddress(address || null);
    }
  }, []);

  const signIn = async () => {
    try {
      const authOptions: AuthOptions = {
        appDetails: {
          name: 'Token Streaming',
          icon: typeof window !== 'undefined' ? window.location.origin + '/logo.png' : '',
        },
        redirectTo: '/',
        onFinish: () => {
          setIsSignedIn(true);
          const address = getNetworkAddress(userSession);
          setUserAddress(address || null);
        },
        onCancel: () => {
          console.log('User cancelled wallet connection');
        },
        userSession,
      };

      await authenticate(authOptions);
    } catch (error) {
      console.error('Error during sign in:', error);
    }
  };

  const signOut = () => {
    userSession.signUserOut();
    setIsSignedIn(false);
    setUserAddress(null);
  };

  return (
    <AuthContext.Provider value={{ userSession, isSignedIn, userAddress, signIn, signOut }}>
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
