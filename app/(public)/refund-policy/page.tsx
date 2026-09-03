"use client";

import React from 'react';
import Link from 'next/link';
import { ShieldCheck, RefreshCw, AlertCircle, Mail, Phone, Clock, CreditCard } from 'lucide-react';

export default function RefundPolicyPage() {
  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-[8%] font-sans text-slate-800 selection:bg-[#d91b5c] selection:text-white">
      <div className="max-w-4xl mx-auto bg-white rounded-3xl p-6 sm:p-12 shadow-xl border border-slate-200">
        
        {/* HEADER */}
        <div className="text-center mb-10 pb-6 border-b border-slate-100">
          <span className="bg-rose-50 text-[#d91b5c] border border-rose-200 text-[11px] font-black uppercase px-3.5 py-1 rounded-full tracking-widest inline-flex items-center gap-1.5">
            <RefreshCw size={13} /> Transparent Billing
          </span>
          <h1 className="text-2xl sm:text-4xl font-serif font-black text-slate-900 mt-3">
            Refund & Cancellation Policy
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-semibold mt-2">
            Last updated: September 2026 • Official Billing Guidelines for Nikah Qubool Members
          </p>
        </div>

        {/* CONTENT SECTIONS */}
        <div className="space-y-8 text-xs sm:text-sm text-slate-700 leading-relaxed">
          
          <div className="bg-rose-50/50 rounded-2xl p-5 border border-rose-100 space-y-2">
            <h3 className="font-serif font-extrabold text-slate-900 text-base flex items-center gap-2 text-[#d91b5c]">
              <ShieldCheck size={18} /> Our Commitment to Fairness
            </h3>
            <p className="text-slate-600 font-medium">
              At <strong className="text-slate-900">Nikah Qubool</strong> (A Property of IT Creative Solution), we aim to provide a transparent and satisfying matchmaking experience. Please review our refund and cancellation terms below before purchasing any VIP or Premium Membership plan.
            </p>
          </div>

          {/* SECTION 1 */}
          <div className="space-y-3">
            <h3 className="font-serif font-bold text-base text-slate-900 border-l-4 border-[#d91b5c] pl-3">
              1. Digital Service Nature & Instant Activation
            </h3>
            <p>
              Nikah Qubool provides digital matchmaking services. Upon completing payment for a Premium or VIP Membership plan, all digital features—including verified profile contact access, direct messaging, priority placement, and profile views—are activated instantly on your account.
            </p>
          </div>

          {/* SECTION 2 */}
          <div className="space-y-3">
            <h3 className="font-serif font-bold text-base text-slate-900 border-l-4 border-[#d91b5c] pl-3">
              2. Refund Eligibility Criteria
            </h3>
            <p>
              Because digital services and contact information are unlocked immediately upon payment confirmation, membership purchases are generally non-refundable. However, refunds will be evaluated and granted under the following specific exceptional circumstances:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-slate-600 font-medium">
              <li>
                <strong className="text-slate-900">Duplicate Billing:</strong> If your account was charged twice for the same transaction due to a technical payment gateway failure.
              </li>
              <li>
                <strong className="text-slate-900">Service Disruption:</strong> If you paid for a VIP subscription but technical issues on our platform prevented service activation for more than 48 consecutive hours after payment.
              </li>
              <li>
                <strong className="text-slate-900">Unauthorized Transaction:</strong> Payment made fraudulently using your card/UPI without authorization, provided it is reported to us within 24 hours of transaction before contact unlocks are utilized.
              </li>
            </ul>
          </div>

          {/* SECTION 3 */}
          <div className="space-y-3">
            <h3 className="font-serif font-bold text-base text-slate-900 border-l-4 border-[#d91b5c] pl-3">
              3. Non-Refundable Scenarios
            </h3>
            <p>Refunds will <strong>NOT</strong> be issued in the following cases:</p>
            <ul className="list-disc pl-6 space-y-2 text-slate-600 font-medium">
              <li>Change of mind after accessing or viewing profile contact details.</li>
              <li>Account termination due to violation of our Terms of Service (e.g. abusive behavior, fake credentials).</li>
              <li>If your marriage/match is fixed outside or through Nikah Qubool during your active subscription period.</li>
            </ul>
          </div>

          {/* SECTION 4 */}
          <div className="space-y-3">
            <h3 className="font-serif font-bold text-base text-slate-900 border-l-4 border-[#d91b5c] pl-3">
              4. Refund Request Process & Processing Timeline
            </h3>
            <p>
              To request a refund, please send an official email to <strong className="text-[#d91b5c]">support@nikahqubool.in</strong> or <strong className="text-[#d91b5c]">support@nikahqubool.com</strong> with the following details:
            </p>
            <div className="bg-slate-100 p-4 rounded-xl space-y-1 font-mono text-xs text-slate-800">
              <p>• Registered Mobile Number & Email Address</p>
              <p>• Payment Reference / Transaction ID (Razorpay/Cashfree ID)</p>
              <p>• Proof of Duplicate Payment (Bank statement/Receipt)</p>
              <p>• Detailed reason for refund request</p>
            </div>
            <p className="mt-2">
              Approved refunds will be processed within <strong className="text-slate-900">5 to 7 working days</strong> and will be credited directly back to your original payment method (Bank Account / UPI / Credit Card).
            </p>
          </div>

          {/* SECTION 5 */}
          <div className="space-y-3">
            <h3 className="font-serif font-bold text-base text-slate-900 border-l-4 border-[#d91b5c] pl-3">
              5. Subscription Cancellation
            </h3>
            <p>
              You may cancel your recurring subscription at any time by accessing your Dashboard Account Settings or by emailing support. Cancellation stops future renewals; current active period benefits remain accessible until expiration.
            </p>
          </div>

          {/* CONTACT BOX */}
          <div className="pt-6 border-t border-slate-200 mt-8">
            <div className="bg-slate-900 text-white rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h4 className="font-bold text-sm text-amber-300">Need Payment Support?</h4>
                <p className="text-xs text-slate-300 mt-1">Our billing team is active Monday to Saturday (10 AM - 7 PM IST).</p>
              </div>
              <Link
                href="/contact-us"
                className="px-5 py-2.5 rounded-xl bg-[#d91b5c] hover:bg-rose-600 text-white font-bold text-xs uppercase tracking-wider shadow-md transition-all whitespace-nowrap"
              >
                Contact Billing Team
              </Link>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
