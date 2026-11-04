"use client";

import React from 'react';
import UnifiedAuthModal from './UnifiedAuthModal';

interface RegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function RegisterModal({ isOpen, onClose }: RegisterModalProps) {
  return <UnifiedAuthModal isOpen={isOpen} onClose={onClose} />;
}
