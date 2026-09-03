import React from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import LoginModalWrapper from '@/components/layout/LoginModalWrapper';
import { AuthModalProvider } from '@/context/AuthModalContext';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Find Verified Muslim Rishte & Proposals | Nikah Qubool Matrimony',
  description: 'Browse thousands of 100% verified Sunni, Shia, Syed & Professional Muslim Matrimony proposals across India. Register free today to find your ideal Halal life partner.',
  keywords: [
    "Muslim Matrimony Proposals",
    "Verified Muslim Rishte",
    "Sunni Matrimony Profiles",
    "Shia Matrimony Proposals",
    "Syed Muslim Rishte",
    "Muslim Doctor Matrimony",
    "Muslim Engineer Proposals",
    "Halal Matchmaking India",
    "Free Muslim Matrimonial Registration"
  ],
  icons: {
    icon: [
      { url: "/nikah-qubool-favicon.png", type: "image/png" },
      { url: "/favicon.ico", type: "image/x-icon" },
    ],
    shortcut: "/nikah-qubool-favicon.png",
    apple: "/nikah-qubool-favicon.png",
  },
  openGraph: {
    title: 'Nikah Qubool Matrimony | Find Verified Muslim Rishte & Proposals',
    description: 'Browse thousands of 100% verified Sunni, Shia, Syed & Professional Muslim Matrimony proposals across India. Register free today.',
    siteName: 'Nikah Qubool Matrimony',
    images: [
      {
        url: '/nikah-qubool-logo.png',
        width: 1200,
        height: 630,
        alt: 'Nikah Qubool Halal Matrimony Logo',
      },
    ],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Nikah Qubool Matrimony | Verified Muslim Rishte',
    description: 'Find your perfect Halal life partner on Nikah Qubool. 100% verified proposals.',
    images: ['/nikah-qubool-logo.png'],
  },
};

export default function PublicGroupLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthModalProvider>
      <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 selection:bg-[#d91b5c] selection:text-white font-sans antialiased">
        <Navbar />
        <main className="flex-grow pt-20 sm:pt-24 w-full">
          {children}
        </main>
        <Footer />
        <LoginModalWrapper />
      </div>
    </AuthModalProvider>
  );
}
