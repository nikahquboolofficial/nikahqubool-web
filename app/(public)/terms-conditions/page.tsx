"use client";

import React from 'react';
import Link from 'next/link';
import { FileText, ShieldCheck, UserCheck, AlertTriangle, Scale, Lock } from 'lucide-react';

export default function TermsConditionsPage() {
  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-[8%] font-sans text-slate-800 selection:bg-[#d91b5c] selection:text-white">
      <div className="max-w-4xl mx-auto bg-white rounded-3xl p-6 sm:p-12 shadow-xl border border-slate-200">
        
        {/* HEADER */}
        <div className="text-center mb-10 pb-6 border-b border-slate-100">
          <span className="bg-rose-50 text-[#d91b5c] border border-rose-200 text-[11px] font-black uppercase px-3.5 py-1 rounded-full tracking-widest inline-flex items-center gap-1.5">
            <FileText size={13} /> Official User Agreement
          </span>
          <h1 className="text-2xl sm:text-4xl font-serif font-black text-slate-900 mt-3">
            Terms & Conditions
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-semibold mt-2">
            Last updated: September 2026 • Legally Binding Service Agreement for Nikah Qubool
          </p>
        </div>

        {/* CONTENT */}
        <div className="space-y-8 text-xs sm:text-sm text-slate-700 leading-relaxed">
          
          <div className="bg-rose-50/50 rounded-2xl p-5 border border-rose-100 space-y-2">
            <h3 className="font-serif font-extrabold text-slate-900 text-base flex items-center gap-2 text-[#d91b5c]">
              <Scale size={18} /> Welcome to Nikah Qubool
            </h3>
            <p className="text-slate-600 font-medium">
              By accessing, browsing, or creating an account on <strong className="text-slate-900">Nikah Qubool</strong> (Owned & Operated by IT Creative Solution), you agree to comply with and be bound by the following Terms and Conditions. Please read them carefully before using our matchmaking services.
            </p>
          </div>

          <div className="space-y-3">
            <h3 className="font-serif font-bold text-base text-slate-900 border-l-4 border-[#d91b5c] pl-3">
              1. Eligibility Criteria
            </h3>
            <p>To register as a member or use Nikah Qubool, you must satisfy the following legal requirements:</p>
            <ul className="list-disc pl-6 space-y-1.5 text-slate-600 font-medium">
              <li>You must be of legal marriageable age as per Indian law (18 years or above for females, 21 years or above for males).</li>
              <li>You must be legally competent and eligible to enter into a valid marriage agreement under applicable personal and civil laws.</li>
              <li>Profiles registered by parents, guardians, or siblings must be managed by authorized family members with explicit consent.</li>
            </ul>
          </div>

          <div className="space-y-3">
            <h3 className="font-serif font-bold text-base text-slate-900 border-l-4 border-[#d91b5c] pl-3">
              2. Account Registration & Authenticity
            </h3>
            <p>
              You agree to provide accurate, current, and complete information during registration. Providing false, misleading, or impersonated information constitutes a breach of terms and results in immediate account suspension without refund.
            </p>
          </div>

          <div className="space-y-3">
            <h3 className="font-serif font-bold text-base text-slate-900 border-l-4 border-[#d91b5c] pl-3">
              3. Member Code of Conduct
            </h3>
            <p>Nikah Qubool is a dignified platform dedicated to serious matrimonial matchmaking. You agree NOT to:</p>
            <ul className="list-disc pl-6 space-y-1.5 text-slate-600 font-medium">
              <li>Use the platform for casual dating, commercial solicitation, financial requests, or illegal activities.</li>
              <li>Send abusive, obscene, harassing, or disrespectful messages to other members.</li>
              <li>Upload copyrighted, inappropriate, or unauthorized profile photographs.</li>
              <li>Attempt to scrape, harvest, or extract member contact details systematically.</li>
            </ul>
          </div>

          <div className="space-y-3">
            <h3 className="font-serif font-bold text-base text-slate-900 border-l-4 border-[#d91b5c] pl-3">
              4. Membership & Billing Terms
            </h3>
            <p>
              Free registration allows profile creation and match browsing. Contact view unlocks and direct messaging require paid VIP/Premium subscriptions. All purchases are governed by our <Link href="/refund-policy" className="text-[#d91b5c] font-bold underline">Refund & Cancellation Policy</Link> and <Link href="/pricing-policy" className="text-[#d91b5c] font-bold underline">Pricing Policy</Link>.
            </p>
          </div>

          <div className="space-y-3">
            <h3 className="font-serif font-bold text-base text-slate-900 border-l-4 border-[#d91b5c] pl-3">
              5. Disclaimer of Match Guarantee & Verification
            </h3>
            <p>
              While Nikah Qubool employs strict OTP and selfie verification procedures, members are strongly advised to perform independent background checks and family verifications before proceeding with marriage negotiations. Nikah Qubool is a intermediary facilitator and does not guarantee a fixed marriage match.
            </p>
          </div>

          <div className="space-y-3">
            <h3 className="font-serif font-bold text-base text-slate-900 border-l-4 border-[#d91b5c] pl-3">
              6. Limitation of Liability & Jurisdiction
            </h3>
            <p>
              IT Creative Solution / Nikah Qubool shall not be liable for any indirect, consequential, or accidental damages arising from platform usage. Any legal disputes arising out of these terms shall be subject to the exclusive jurisdiction of courts in Bareilly, Uttar Pradesh, India.
            </p>
          </div>

          {/* CONTACT BOX */}
          <div className="pt-6 border-t border-slate-200 mt-8">
            <div className="bg-slate-900 text-white rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h4 className="font-bold text-sm text-amber-300">Questions about Terms?</h4>
                <p className="text-xs text-slate-300 mt-1">Contact our legal support team for assistance.</p>
              </div>
              <Link
                href="/contact-us"
                className="px-5 py-2.5 rounded-xl bg-[#d91b5c] hover:bg-rose-600 text-white font-bold text-xs uppercase tracking-wider shadow-md transition-all whitespace-nowrap"
              >
                Contact Legal Team
              </Link>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
