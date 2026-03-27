import React, { createContext, useContext, useState } from 'react';

interface UIContextType {
  isSidebarHidden: boolean;
  setSidebarHidden: (hidden: boolean) => void;
  hasSeenWelcome: boolean;
  markWelcomeAsSeen: () => void;
}

const UIContext = createContext<UIContextType | undefined>(undefined);

export const UIProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isSidebarHidden, setSidebarHidden] = useState(false);
  const [hasSeenWelcome, setHasSeenWelcome] = useState(false);

  const markWelcomeAsSeen = () => setHasSeenWelcome(true);

  return (
    <UIContext.Provider value={{ isSidebarHidden, setSidebarHidden, hasSeenWelcome, markWelcomeAsSeen }}>
      {children}
    </UIContext.Provider>
  );
};

export const useUI = () => {
  const context = useContext(UIContext);
  if (context === undefined) {
    throw new Error('useUI must be used within a UIProvider');
  }
  return context;
};
