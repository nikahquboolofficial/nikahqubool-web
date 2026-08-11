import React from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import LoginModalWrapper from '@/components/layout/LoginModalWrapper';
import { AuthModalProvider } from '@/context/AuthModalContext';

export const metadata = {
  title: 'Pakiza Rishte - Bareilly\'s Most Trusted Halal Matchmaking',
  description: 'Find your perfect halal life partner on Pakiza Rishte.',
};

export default function PublicGroupLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthModalProvider>
      <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 selection:bg-[#870c3f] selection:text-white font-sans antialiased">
        <Navbar />
        <main className="flex-grow pt-22 sm:pt-24 w-full">
          {children}
        </main>
        <Footer />
        <LoginModalWrapper />
      </div>
    </AuthModalProvider>
  );
}