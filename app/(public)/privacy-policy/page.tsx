"use client";

import React from 'react';
import Link from 'next/link';
import { ShieldCheck, Lock, Eye, FileText, Server, UserCheck } from 'lucide-react';

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-[8%] font-sans text-slate-800 selection:bg-[#d91b5c] selection:text-white">
      <div className="max-w-4xl mx-auto bg-white rounded-3xl p-6 sm:p-12 shadow-xl border border-slate-200">
        
        {/* HEADER */}
        <div className="text-center mb-10 pb-6 border-b border-slate-100">
          <span className="bg-rose-50 text-[#d91b5c] border border-rose-200 text-[11px] font-black uppercase px-3.5 py-1 rounded-full tracking-widest inline-flex items-center gap-1.5">
            <Lock size={13} /> Strict Data Privacy
          </span>
          <h1 className="text-2xl sm:text-4xl font-serif font-black text-slate-900 mt-3">
            Privacy Policy
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-semibold mt-2">
            Effective Date: September 2026 • Official Data Protection Policy for Nikah Qubool
          </p>
        </div>

        {/* CONTENT */}
        <div className="space-y-8 text-xs sm:text-sm text-slate-700 leading-relaxed">
          
          <div className="bg-rose-50/50 rounded-2xl p-5 border border-rose-100 space-y-2">
            <h3 className="font-serif font-extrabold text-slate-900 text-base flex items-center gap-2 text-[#d91b5c]">
              <ShieldCheck size={18} /> Our Commitment to Your Privacy
            </h3>
            <p className="text-slate-600 font-medium">
              At <strong className="text-slate-900">Nikah Qubool</strong> (Owned & Operated by IT Creative Solution), we respect your fundamental right to privacy. This Privacy Policy details how we collect, store, safeguard, and process your personal information across our website and mobile platforms.
            </p>
          </div>

          <div className="space-y-3">
            <h3 className="font-serif font-bold text-base text-slate-900 border-l-4 border-[#d91b5c] pl-3">
              1. Information We Collect
            </h3>
            <p>To deliver accurate matchmaking services, we collect information you voluntarily provide during registration and profile updates:</p>
            <ul className="list-disc pl-6 space-y-1.5 text-slate-600 font-medium">
              <li><strong>Personal Identity:</strong> Full name, gender, date of birth, marital status, religion, sect, and mother tongue.</li>
              <li><strong>Contact Information:</strong> Registered mobile number, email address, and residential city/state.</li>
              <li><strong>Educational & Professional Details:</strong> Qualification degree, occupation, organization, and annual income range.</li>
              <li><strong>Family Background & Preferences:</strong> Family values, partner expectations, photos uploaded voluntarily.</li>
              <li><strong>Verification Records:</strong> Government ID proofs or selfie verification images submitted for authenticity validation.</li>
            </ul>
          </div>

          <div className="space-y-3">
            <h3 className="font-serif font-bold text-base text-slate-900 border-l-4 border-[#d91b5c] pl-3">
              2. How We Use Your Information
            </h3>
            <p>Your personal data is strictly utilized for core service fulfillment:</p>
            <ul className="list-disc pl-6 space-y-1.5 text-slate-600 font-medium">
              <li>Displaying your profile to compatible members based on your specified criteria.</li>
              <li>Sending SMS/OTP authentications, match alerts, and direct interaction notifications.</li>
              <li>Verifying account authenticity to prevent spam, fraud, and fake accounts.</li>
              <li>Facilitating secure customer support and billing management.</li>
            </ul>
            <p className="font-bold text-slate-900 mt-2">
              🔒 We NEVER sell, rent, or trade your personal contact details or email addresses to third-party marketing companies.
            </p>
          </div>

          <div className="space-y-3">
            <h3 className="font-serif font-bold text-base text-slate-900 border-l-4 border-[#d91b5c] pl-3">
              3. Privacy Controls & Photo Protection
            </h3>
            <p>
              We empower you with full control over your visibility:
            </p>
            <ul className="list-disc pl-6 space-y-1.5 text-slate-600 font-medium">
              <li><strong>Photo Privacy:</strong> You can set your photos to "Visible to All", "Visible to Accepted Matches Only", or password-protected.</li>
              <li><strong>Phone Number Masking:</strong> Your phone number is hidden from free members and only disclosed to paid VIP members upon mutual interest acceptance or direct unlock.</li>
            </ul>
          </div>

          <div className="space-y-3">
            <h3 className="font-serif font-bold text-base text-slate-900 border-l-4 border-[#d91b5c] pl-3">
              4. Cookies & Analytical Data
            </h3>
            <p>
              We use essential session cookies to keep you securely logged in, remember your search preferences, and analyze platform performance. You can disable non-essential cookies via your browser settings.
            </p>
          </div>

          <div className="space-y-3">
            <h3 className="font-serif font-bold text-base text-slate-900 border-l-4 border-[#d91b5c] pl-3">
              5. Data Security & Storage
            </h3>
            <p>
              We employ enterprise-grade 256-bit SSL encryption, firewalls, and secure cloud infrastructure to prevent unauthorized access, alteration, or data breaches. All financial transactions are processed via PCI-DSS certified payment gateways (Razorpay/Cashfree).
            </p>
          </div>

          <div className="space-y-3">
            <h3 className="font-serif font-bold text-base text-slate-900 border-l-4 border-[#d91b5c] pl-3">
              6. Account Deletion & Rights
            </h3>
            <p>
              You have the absolute right to modify your information or permanently delete your Nikah Qubool account at any time via <strong className="text-slate-900">Dashboard Settings &gt; Delete Account</strong> or by sending a written deletion request to support. Upon account deletion, your profile and media are purged from active servers.
            </p>
          </div>

          {/* CONTACT BOX */}
          <div className="pt-6 border-t border-slate-200 mt-8">
            <div className="bg-slate-900 text-white rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h4 className="font-bold text-sm text-amber-300">Privacy Concerns or Data Requests?</h4>
                <p className="text-xs text-slate-300 mt-1">Contact our Data Protection Officer at support@nikahqubool.in</p>
              </div>
              <Link
                href="/contact-us"
                className="px-5 py-2.5 rounded-xl bg-[#d91b5c] hover:bg-rose-600 text-white font-bold text-xs uppercase tracking-wider shadow-md transition-all whitespace-nowrap"
              >
                Contact Data Desk
              </Link>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
