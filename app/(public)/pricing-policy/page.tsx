"use client";

import React from 'react';
import Link from 'next/link';
import { CreditCard, CheckCircle2, Zap, ShieldCheck } from 'lucide-react';

export default function PricingPolicyPage() {
  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-[8%] font-sans text-slate-800 selection:bg-[#d91b5c] selection:text-white">
      <div className="max-w-4xl mx-auto bg-white rounded-3xl p-6 sm:p-12 shadow-xl border border-slate-200">
        
        {/* HEADER */}
        <div className="text-center mb-10 pb-6 border-b border-slate-100">
          <span className="bg-rose-50 text-[#d91b5c] border border-rose-200 text-[11px] font-black uppercase px-3.5 py-1 rounded-full tracking-widest inline-flex items-center gap-1.5">
            <Zap size={13} /> Digital Service Delivery
          </span>
          <h1 className="text-2xl sm:text-4xl font-serif font-black text-slate-900 mt-3">
            Pricing & Service Delivery Policy
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-semibold mt-2">
            Instant Subscription Fulfillment Policy for Nikah Qubool Members
          </p>
        </div>

        {/* CONTENT */}
        <div className="space-y-8 text-xs sm:text-sm text-slate-700 leading-relaxed">
          
          <div className="space-y-3">
            <h3 className="font-serif font-bold text-base text-slate-900 border-l-4 border-[#d91b5c] pl-3">
              1. Pricing Overview
            </h3>
            <p>
              Nikah Qubool offers free basic registration to browse verified matrimonial profiles. To connect directly, view verified contact numbers, and initiate unlimited direct messaging, members can purchase paid VIP/Premium Subscription plans listed on our <Link href="/dashboard/membership" className="text-[#d91b5c] font-bold underline">Membership Page</Link>. All prices are listed in Indian Rupees (INR) inclusive of applicable taxes.
            </p>
          </div>

          <div className="space-y-3">
            <h3 className="font-serif font-bold text-base text-slate-900 border-l-4 border-[#d91b5c] pl-3">
              2. Digital Service Delivery Timeline
            </h3>
            <p>
              Nikah Qubool is an online digital matrimonial service platform. <strong className="text-slate-900">No physical goods or physical shipping are involved.</strong>
            </p>
            <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl space-y-1.5 text-emerald-900">
              <p className="font-bold flex items-center gap-1.5">
                <CheckCircle2 size={16} className="text-emerald-600" /> Instant Digital Delivery (0 to 15 Minutes)
              </p>
              <p className="text-xs text-emerald-800">
                Upon successful payment authorization via our secure Payment Gateway (Razorpay/Cashfree), your upgraded VIP features and contact credits are automatically unlocked on your account dashboard immediately.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="font-serif font-bold text-base text-slate-900 border-l-4 border-[#d91b5c] pl-3">
              3. Payment Confirmation & Invoicing
            </h3>
            <p>
              An automated digital transaction receipt and email confirmation will be sent to your registered email address and mobile number via SMS/Email immediately after successful checkout.
            </p>
          </div>

          <div className="space-y-3">
            <h3 className="font-serif font-bold text-base text-slate-900 border-l-4 border-[#d91b5c] pl-3">
              4. Payment Security
            </h3>
            <p>
              All online transactions are processed through 128-bit SSL encrypted PCI-DSS compliant payment gateways. Nikah Qubool does not store your confidential debit/credit card numbers or UPI PINs on our servers.
            </p>
          </div>

          {/* CONTACT BOX */}
          <div className="pt-6 border-t border-slate-200 mt-8">
            <div className="bg-slate-900 text-white rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h4 className="font-bold text-sm text-amber-300">Questions about billing?</h4>
                <p className="text-xs text-slate-300 mt-1">Our support desk is active to assist you with any billing queries.</p>
              </div>
              <Link
                href="/contact-us"
                className="px-5 py-2.5 rounded-xl bg-[#d91b5c] hover:bg-rose-600 text-white font-bold text-xs uppercase tracking-wider shadow-md transition-all whitespace-nowrap"
              >
                Contact Support
              </Link>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
