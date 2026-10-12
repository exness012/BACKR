import React, { FC, ReactNode, useMemo } from 'react';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-phantom';
import { SolflareWalletAdapter } from '@solana/wallet-adapter-solflare';
import { DEVNET_ENDPOINT, customSolanaFetch } from '../lib/solana';
import { WalletModalProvider } from '../context/WalletModalContext';
import { WalletModal } from './WalletModal';

interface Props {
  children: ReactNode;
}

export const WalletContextProvider: FC<Props> = ({ children }) => {
  const endpoint = DEVNET_ENDPOINT;

  const connectionConfig = useMemo(
    () => ({
      commitment: 'confirmed' as const,
      fetch: customSolanaFetch,
    }),
    []
  );

  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter(),
    ],
    []
  );

  return (
    <ConnectionProvider endpoint={endpoint} config={connectionConfig}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          {children}
          <WalletModal />
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
};
