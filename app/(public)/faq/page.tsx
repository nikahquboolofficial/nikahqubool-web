"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { HelpCircle, ChevronRight, Phone, MessageSquare, ArrowRight } from 'lucide-react';

const faqCategories = [
  {
    category: "Registration & Account",
    items: [
      {
        q: "Is registration on Nikah Qubool completely free?",
        a: "Yes, creating your profile on Nikah Qubool is 100% free. You can register using your 10-digit mobile number, verify via OTP, set your partner preferences, and browse compatible verified proposals at no cost."
      },
      {
        q: "Can parents or family members create a profile on behalf of their children?",
        a: "Yes. During registration, you can choose whether the profile is created for 'Self', 'Son', 'Daughter', 'Brother', 'Sister', or 'Friend/Relative'. Many of our active profiles are managed with complete dignity by parents and guardians."
      },
      {
        q: "What details do I need to complete my profile?",
        a: "To ensure quality matches, we ask for your marital status, date of birth, mother tongue, height, education, occupation, city of residence, sect/maslak, family background, and partner expectations."
      }
    ]
  },
  {
    category: "Safety, Privacy & Photo Controls",
    items: [
      {
        q: "Can I keep my photos private on Nikah Qubool?",
        a: "Yes, absolutely. Modesty and privacy are paramount. You can set your photo visibility to 'Visible to all', 'Blurred preview', or 'Visible only on request'. No user can see your private photos unless you accept their request."
      },
      {
        q: "Is my mobile number visible to everyone?",
        a: "No. Your mobile number is strictly protected and never displayed publicly. Only mutually accepted and verified connections with active membership can request to view contact details."
      },
      {
        q: "How does Nikah Qubool prevent fake profiles?",
        a: "We implement mandatory 6-digit SMS OTP verification on every registration. Additionally, our dedicated safety team manually screens profile contents, photographs, and bio details to reject spam, commercial, or casual dating entries."
      }
    ]
  },
  {
    category: "Matchmaking & Messaging",
    items: [
      {
        q: "How do I connect with someone I like?",
        a: "When you find a compatible profile, you can click 'Send Interest'. If they accept your interest, a mutual connection is established, enabling direct, secure messaging in our chat window."
      },
      {
        q: "Can Free members message and reply?",
        a: "Yes! Free members can reply to incoming messages and ongoing conversations uninterrupted. Upgrading to a VIP membership unlocks direct cold messaging and instant contact viewing."
      },
      {
        q: "What should I do if I encounter an inappropriate user?",
        a: "You can instantly block the user and click 'Report Profile' in the chat or profile view. Our safety moderation team reviews reported accounts within a few hours and issues permanent bans for policy violations."
      }
    ]
  }
];

export default function FaqPage() {
  const [openItems, setOpenItems] = useState<{ [key: string]: boolean }>({
    "0-0": true,
    "1-0": true
  });

  const toggleItem = (key: string) => {
    setOpenItems(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="min-h-screen bg-white py-12 sm:py-16 px-4 sm:px-6 lg:px-[8%] font-sans text-slate-800">
      <div className="max-w-4xl mx-auto space-y-12">
        
        {/* HEADER */}
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <span className="bg-rose-50 text-[#d91b5c] border border-rose-200 text-[11px] font-black uppercase px-3.5 py-1 rounded-full tracking-widest inline-flex items-center gap-1.5">
            <HelpCircle size={13} /> Help Center
          </span>
          <h1 className="text-3xl sm:text-5xl font-serif font-black text-slate-900 tracking-tight">
            Frequently Asked Questions
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium leading-relaxed">
            Find answers to commonly asked questions about registration, photo privacy, verification, and matchmaking.
          </p>
        </div>

        {/* FAQ CATEGORIES */}
        <div className="space-y-8 text-left">
          {faqCategories.map((group, groupIdx) => (
            <div key={groupIdx} className="space-y-3">
              <h2 className="text-base sm:text-lg font-serif font-bold text-slate-900 border-b border-rose-100 pb-2">
                {group.category}
              </h2>

              <div className="space-y-2.5">
                {group.items.map((item, itemIdx) => {
                  const key = `${groupIdx}-${itemIdx}`;
                  const isOpen = !!openItems[key];

                  return (
                    <div
                      key={itemIdx}
                      className="rounded-2xl border border-slate-200 bg-[#faf7f5] overflow-hidden shadow-xs transition-all"
                    >
                      <button
                        type="button"
                        onClick={() => toggleItem(key)}
                        className="w-full p-4 sm:p-5 text-left flex items-center justify-between text-xs sm:text-sm font-bold text-slate-900 hover:text-[#d91b5c] transition-colors cursor-pointer"
                      >
                        <span>{item.q}</span>
                        <ChevronRight
                          size={16}
                          className={`text-slate-400 transition-transform duration-200 shrink-0 ml-2 ${
                            isOpen ? 'rotate-90 text-[#d91b5c]' : ''
                          }`}
                        />
                      </button>
                      {isOpen && (
                        <div className="px-4 pb-4 sm:px-5 sm:pb-5 pt-0 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-rose-100/60 bg-white">
                          <p className="pt-3">{item.a}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* STILL HAVE QUESTIONS CARD */}
        <div className="p-8 rounded-3xl bg-[#faf7f5] border border-rose-100 text-center space-y-3">
          <h3 className="text-lg font-serif font-bold text-slate-900">
            Still Have Questions?
          </h3>
          <p className="text-xs text-slate-600 max-w-md mx-auto">
            Our matrimonial coordinators are available Mon – Sat (10 AM to 7 PM IST) to guide you.
          </p>
          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/contact-us"
              className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-full bg-[#d91b5c] hover:bg-[#c21450] text-white text-xs font-bold uppercase tracking-wider shadow-xs transition-all cursor-pointer"
            >
              <span>Contact Support</span>
              <ArrowRight size={13} />
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
