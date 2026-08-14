"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function PaymentInfoRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/dashboard/payment-info');
  }, [router]);
  return null;
}
