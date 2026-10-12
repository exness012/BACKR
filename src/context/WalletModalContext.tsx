import React, { createContext, useContext, useState, ReactNode } from 'react';

interface WalletModalContextType {
  isModalOpen: boolean;
  openWalletModal: () => void;
  closeWalletModal: () => void;
  toastMessage: string | null;
  showToast: (msg: string) => void;
}

const WalletModalContext = createContext<WalletModalContextType | undefined>(undefined);

export const WalletModalProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const openWalletModal = () => setIsModalOpen(true);
  const closeWalletModal = () => setIsModalOpen(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((current) => (current === msg ? null : current));
    }, 4000);
  };

  return (
    <WalletModalContext.Provider
      value={{
        isModalOpen,
        openWalletModal,
        closeWalletModal,
        toastMessage,
        showToast,
      }}
    >
      {children}
    </WalletModalContext.Provider>
  );
};

export function useWalletModal(): WalletModalContextType {
  const context = useContext(WalletModalContext);
  if (!context) {
    throw new Error('useWalletModal must be used within a WalletModalProvider');
  }
  return context;
}
