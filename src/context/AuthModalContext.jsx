import React, { createContext, useContext, useState, useCallback } from 'react';

const AuthModalContext = createContext();

export const useAuthModal = () => useContext(AuthModalContext);

export const AuthModalProvider = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [view, setView] = useState('login'); // 'login', 'signup', 'forgot-password', 'reset-password', 'verify-otp', 'tos', 'privacy'
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    // any other state we want to preserve when switching views
  });
  
  // Custom metadata for specific views (e.g. email for OTP verification)
  const [meta, setMeta] = useState({});

  const openModal = useCallback((initialView = 'login', initialMeta = {}) => {
    setView(initialView);
    setMeta(initialMeta);
    setIsOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setIsOpen(false);
    // Optionally clear form data on close, or keep it for a better user experience
  }, []);

  const changeView = useCallback((newView, newMeta = {}) => {
    setView(newView);
    setMeta(prev => ({ ...prev, ...newMeta }));
  }, []);

  const updateFormData = useCallback((data) => {
    setFormData(prev => ({ ...prev, ...data }));
  }, []);

  return (
    <AuthModalContext.Provider
      value={{
        isOpen,
        view,
        formData,
        meta,
        openModal,
        closeModal,
        changeView,
        updateFormData,
      }}
    >
      {children}
    </AuthModalContext.Provider>
  );
};
