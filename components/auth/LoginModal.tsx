"use client";

import React from 'react';
import UnifiedAuthModal from './UnifiedAuthModal';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function LoginModal({ isOpen, onClose }: LoginModalProps) {
  return <UnifiedAuthModal isOpen={isOpen} onClose={onClose} />;
}
