import { createContext, useContext, useState } from 'react';
import ConfirmModal from '../components/ConfirmModal';

const ModalContext = createContext();

export const ModalProvider = ({ children }) => {
  const [modalState, setModalState] = useState({
    isOpen: false,
    options: {}
  });

  const showModal = (options) => {
    setModalState({
      isOpen: true,
      options: options
    });
  };

  const closeModal = () => {
    setModalState((prev) => ({ ...prev, isOpen: false }));
  };

  return (
    <ModalContext.Provider value={{ showModal, closeModal }}>
      {children}
      <ConfirmModal 
        isOpen={modalState.isOpen} 
        onClose={closeModal} 
        options={modalState.options} 
      />
    </ModalContext.Provider>
  );
};

export const useModal = () => useContext(ModalContext);