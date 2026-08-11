"use client";

import { useAuthModal } from '@/context/AuthModalContext';
import LoginModal from '@/components/auth/LoginModal';
import RegisterModal from '@/components/auth/RegisterModal';

export default function LoginModalWrapper() {
  const { showLoginModal, closeLoginModal, showRegisterModal, closeRegisterModal } = useAuthModal();

  return (
    <>
      <LoginModal isOpen={showLoginModal} onClose={closeLoginModal} />
      <RegisterModal isOpen={showRegisterModal} onClose={closeRegisterModal} />
    </>
  );
}