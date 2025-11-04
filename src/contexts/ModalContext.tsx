import React, { createContext, useContext, useState, ReactNode } from 'react';

interface ModalContextType {
  showLeadModal: boolean;
  showB2bLeadModal: boolean;
  selectedProgramType: 'core' | 'short';
  setShowLeadModal: (show: boolean) => void;
  setShowB2bLeadModal: (show: boolean) => void;
  setSelectedProgramType: (type: 'core' | 'short') => void;
  openLeadModal: (type: 'core' | 'short') => void;
  openB2bLeadModal: () => void;
  closeAllModals: () => void;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export const useModal = () => {
  const context = useContext(ModalContext);
  if (context === undefined) {
    throw new Error('useModal must be used within a ModalProvider');
  }
  return context;
};

interface ModalProviderProps {
  children: ReactNode;
}

export const ModalProvider: React.FC<ModalProviderProps> = ({ children }) => {
  const [showLeadModal, setShowLeadModal] = useState(false);
  const [showB2bLeadModal, setShowB2bLeadModal] = useState(false);
  const [selectedProgramType, setSelectedProgramType] = useState<'core' | 'short'>('core');

  const openLeadModal = (type: 'core' | 'short') => {
    setSelectedProgramType(type);
    setShowLeadModal(true);
  };

  const openB2bLeadModal = () => {
    setShowB2bLeadModal(true);
  };

  const closeAllModals = () => {
    setShowLeadModal(false);
    setShowB2bLeadModal(false);
  };

  const value: ModalContextType = {
    showLeadModal,
    showB2bLeadModal,
    selectedProgramType,
    setShowLeadModal,
    setShowB2bLeadModal,
    setSelectedProgramType,
    openLeadModal,
    openB2bLeadModal,
    closeAllModals,
  };

  return (
    <ModalContext.Provider value={value}>
      {children}
    </ModalContext.Provider>
  );
}; 