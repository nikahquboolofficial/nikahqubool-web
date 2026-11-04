"use client";

import { useAuthModal } from '@/context/AuthModalContext';
import UnifiedAuthModal from '@/components/auth/UnifiedAuthModal';

export default function LoginModalWrapper() {
  const { showLoginModal, closeLoginModal, showRegisterModal, closeRegisterModal } = useAuthModal();
  const isAuthOpen = showLoginModal || showRegisterModal;

  const handleClose = () => {
    closeLoginModal();
    closeRegisterModal();
  };

  return (
    <UnifiedAuthModal isOpen={isAuthOpen} onClose={handleClose} />
  );
}
