"use client";

import React, { useState, useEffect } from 'react';
import { 
  Check, ArrowLeft, ChevronDown, ChevronUp, HelpCircle, 
  Tag, Loader2, X, FileText, Printer, History, Sparkles,
  Phone, MessageSquare, CheckCircle, AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { 
  fetchSubscriptionPlansApi, 
  purchaseSubscriptionApi, 
  fetchActiveSubscriptionApi, 
  validatePromoCodeApi, 
  fetchSubscriptionHistoryApi 
} from '@/lib/api';

// Verified Fallback Plans aligned with screenshot pricing structure
const DURATION_PLANS_CONFIG = {
  "3 Months": [
    {
      id: "basic_3m",
      backendPlanId: 1,
      name: "Basic",
      badge: null,
      monthlyRate: 633,
      originalPrice: 2600,
      discountPrice: 1900,
      summary: "0 Contact Numbers",
      contacts: 0,
      features: [
        "Send Unlimited Messages",
        "0 Contact Numbers (Chat Messaging Only)",
        "Premium badge on your profile",
        "Unlimited Photo Requests",
        "Standard search placement"
      ]
    },
    {
      id: "silver_3m",
      backendPlanId: 2,
      name: "Silver",
      badge: null,
      monthlyRate: 867,
      originalPrice: 3500,
      discountPrice: 2600,
      summary: "View 30 Contact Numbers",
      contacts: 30,
      features: [
        "Send Unlimited Messages",
        "View 30 Contact Numbers",
        "Standout with bold listing and higher search rankings",
        "Unlimited Photo Requests",
        "Premium badge on your profile"
      ]
    },
    {
      id: "gold_3m",
      backendPlanId: 3,
      name: "Gold",
      badge: "Best Seller",
      badgeColor: "bg-[#E21E5B] text-white",
      monthlyRate: 1367,
      originalPrice: 4800,
      discountPrice: 4100,
      summary: "View 50 Contact Numbers",
      contacts: 50,
      features: [
        "Send Unlimited Messages",
        "View 50 Contact Numbers",
        "Standout with bold listing and higher search rankings",
        "Unlimited Photo Requests",
        "Priority WhatsApp assistance",
        "VIP Crown badge on your profile"
      ]
    },
    {
      id: "assisted_3m",
      backendPlanId: 4,
      name: "Assisted",
      badge: "Premium",
      badgeColor: "bg-[#8D5B10] text-white",
      monthlyRate: 4633,
      originalPrice: 16400,
      discountPrice: 13900,
      summary: "Personal Relationship Manager assigned to you",
      contacts: 100,
      features: [
        "Send Unlimited Messages",
        "View 100 Contact Numbers",
        "Personal Relationship Manager assigned to you",
        "Handpicked verified profile shortlisting",
        "Introduction calls arranged directly with families",
        "Top #1 priority boost in search rankings"
      ]
    }
  ],
  "6 Months": [
    {
      id: "basic_6m",
      backendPlanId: 1,
      name: "Basic",
      badge: null,
      monthlyRate: 483,
      originalPrice: 3900,
      discountPrice: 2900,
      summary: "0 Contact Numbers",
      contacts: 0,
      features: [
        "Send Unlimited Messages",
        "0 Contact Numbers (Chat Messaging Only)",
        "Premium badge on your profile",
        "Unlimited Photo Requests",
        "Standard search placement"
      ]
    },
    {
      id: "silver_6m",
      backendPlanId: 2,
      name: "Silver",
      badge: null,
      monthlyRate: 650,
      originalPrice: 5200,
      discountPrice: 3900,
      summary: "View 60 Contact Numbers",
      contacts: 60,
      features: [
        "Send Unlimited Messages",
        "View 60 Contact Numbers",
        "Standout with bold listing and higher search rankings",
        "Unlimited Photo Requests",
        "Premium badge on your profile"
      ]
    },
    {
      id: "gold_6m",
      backendPlanId: 3,
      name: "Gold",
      badge: "Best Seller",
      badgeColor: "bg-[#E21E5B] text-white",
      monthlyRate: 983,
      originalPrice: 7200,
      discountPrice: 5900,
      summary: "View 100 Contact Numbers",
      contacts: 100,
      features: [
        "Send Unlimited Messages",
        "View 100 Contact Numbers",
        "Standout with bold listing and higher search rankings",
        "Unlimited Photo Requests",
        "Priority WhatsApp assistance",
        "VIP Crown badge on your profile"
      ]
    },
    {
      id: "assisted_6m",
      backendPlanId: 4,
      name: "Assisted",
      badge: "Premium",
      badgeColor: "bg-[#8D5B10] text-white",
      monthlyRate: 3650,
      originalPrice: 26000,
      discountPrice: 21900,
      summary: "Personal Relationship Manager assigned to you",
      contacts: 180,
      features: [
        "Send Unlimited Messages",
        "View 180 Contact Numbers",
        "Personal Relationship Manager assigned to you",
        "Handpicked verified profile shortlisting",
        "Introduction calls arranged directly with families",
        "Top #1 priority boost in search rankings"
      ]
    }
  ],
  "Unlimited": [
    {
      id: "gold_unlimited",
      backendPlanId: 3,
      name: "Gold Unlimited",
      badge: "Best Seller",
      badgeColor: "bg-[#E21E5B] text-white",
      monthlyRate: 833,
      originalPrice: 14999,
      discountPrice: 9999,
      summary: "View 250 Contact Numbers Till Marriage",
      contacts: 250,
      features: [
        "Send Unlimited Messages",
        "View 250 Contact Numbers",
        "Valid until marriage (No expiry)",
        "Unlimited Photo Requests",
        "Priority WhatsApp assistance",
        "VIP Crown badge on your profile"
      ]
    },
    {
      id: "assisted_unlimited",
      backendPlanId: 4,
      name: "Assisted Unlimited",
      badge: "Premium",
      badgeColor: "bg-[#8D5B10] text-white",
      monthlyRate: 2916,
      originalPrice: 49999,
      discountPrice: 34999,
      summary: "Dedicated Personal Relationship Manager Till Nikah",
      contacts: 500,
      features: [
        "Send Unlimited Messages",
        "View 500 Contact Numbers",
        "Valid until marriage (No expiry)",
        "Senior Personal Relationship Manager assigned",
        "Handpicked verified matches shortlisted weekly",
        "Direct family introduction meetings and coordination",
        "Top #1 guaranteed visibility on Nikah Qubool"
      ]
    }
  ]
};

type DurationKey = keyof typeof DURATION_PLANS_CONFIG;

export default function MembershipPage() {
  const router = useRouter();
  const [selectedDuration, setSelectedDuration] = useState<DurationKey>("3 Months");
  const [selectedPlanId, setSelectedPlanId] = useState<string>("gold_3m");
  const [expandedPlanIds, setExpandedPlanIds] = useState<Record<string, boolean>>({ "gold_3m": false });
  const [activeSub, setActiveSub] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [purchasing, setPurchasing] = useState(false);
  
  // 🏷️ PROMO CODE ACCORDION & STATES
  const [isPromoOpen, setIsPromoOpen] = useState(false);
  const [promoInput, setPromoInput] = useState("");
  const [validatingPromo, setValidatingPromo] = useState(false);
  const [appliedPromo, setAppliedPromo] = useState<{ code: string; discountAmount: number } | null>(null);

  // ❓ NEED HELP MODAL
  const [showHelpModal, setShowHelpModal] = useState(false);

  // 📜 SUBSCRIPTION HISTORY & INVOICE STATES
  const [historyList, setHistoryList] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [showHistorySection, setShowHistorySection] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<any | null>(null);
  const [userDetails, setUserDetails] = useState<any>({});

  // 💎 TOAST NOTIFICATION
  const [toast, setToast] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 3500);
  };

  const getCookie = (name: string): string | null => {
    if (typeof document === "undefined") return null;
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) {
      const val = parts.pop()?.split(';').shift();
      return val ?? null;
    }
    return null;
  };

  const getToken = (): string | null => getCookie("user_token");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("user_details") || localStorage.getItem("user_session");
      if (stored) {
        try { setUserDetails(JSON.parse(stored)); } catch (e) {}
      }
    }

    const loadActiveAndHistory = async () => {
      const token = getToken();
      if (token) {
        try {
          const subRes = await fetchActiveSubscriptionApi(token);
          if (subRes && subRes.success && subRes.data) {
            setActiveSub(subRes.data);
          }
        } catch (e) {}

        try {
          setLoadingHistory(true);
          const histRes = await fetchSubscriptionHistoryApi(token);
          setLoadingHistory(false);
          if (histRes && histRes.success && histRes.data && Array.isArray(histRes.data)) {
            setHistoryList(histRes.data);
          }
        } catch (e) {
          setLoadingHistory(false);
        }
      }
    };

    loadActiveAndHistory();
  }, []);

  // Current plans for the active duration tab
  const currentPlans = DURATION_PLANS_CONFIG[selectedDuration] || DURATION_PLANS_CONFIG["3 Months"];

  // Ensure selectedPlanId matches one in current duration
  const activePlan = currentPlans.find(p => p.id === selectedPlanId) || currentPlans[0];

  const handleDurationChange = (dur: DurationKey) => {
    setSelectedDuration(dur);
    const plansForDur = DURATION_PLANS_CONFIG[dur];
    // Default to gold if present, else first
    const preferred = plansForDur.find(p => p.name.includes("Gold")) || plansForDur[0];
    setSelectedPlanId(preferred.id);
    setAppliedPromo(null);
  };

  const handleSelectPlan = (planId: string) => {
    setSelectedPlanId(planId);
  };

  const toggleExpand = (planId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedPlanIds(prev => ({
      ...prev,
      [planId]: !prev[planId]
    }));
  };

  const handleApplyPromo = async () => {
    if (!promoInput.trim() || !activePlan) return;
    const token = getToken();
    if (!token) {
      showToast("Please login to apply promo code.", "error");
      return;
    }

    setValidatingPromo(true);
    const res = await validatePromoCodeApi(promoInput.trim(), activePlan.backendPlanId, token);
    setValidatingPromo(false);

    if (res && res.success) {
      setAppliedPromo({
        code: res.code || promoInput.trim().toUpperCase(),
        discountAmount: res.discountAmount || 0
      });
      showToast(res.message || "Promo code applied!", "success");
    } else {
      showToast(res?.message || "Invalid promo code.", "error");
    }
  };

  const handleRemovePromo = () => {
    setAppliedPromo(null);
    setPromoInput("");
    showToast("Promo code removed.", "success");
  };

  const handlePurchase = async () => {
    if (!activePlan) return;
    const token = getToken();
    if (!token) {
      showToast("Please login to upgrade membership.", "error");
      router.push('/');
      return;
    }

    setPurchasing(true);
    const promoCodeToPass = appliedPromo ? appliedPromo.code : null;
    const res = await purchaseSubscriptionApi(activePlan.backendPlanId, promoCodeToPass, token);
    setPurchasing(false);

    if (res && res.success) {
      showToast(res.message || "Membership upgraded successfully!", "success");
      if (typeof window !== "undefined") {
        const stored = localStorage.getItem("user_details");
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            parsed.isPaid = true;
            parsed.isCurrentUserPaid = true;
            localStorage.setItem("user_details", JSON.stringify(parsed));
          } catch (e) {}
        }
      }
      setTimeout(() => router.push('/dashboard'), 1500);
    } else {
      showToast(res?.message || "Purchase failed. Please try again.", "error");
    }
  };

  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return "N/A";
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
    } catch (e) {
      return String(dateStr);
    }
  };

  const basePrice = activePlan ? activePlan.discountPrice : 0;
  const originalPrice = activePlan ? activePlan.originalPrice : 0;
  const promoDiscountAmount = appliedPromo ? appliedPromo.discountAmount : 0;
  const finalPrice = Math.max(0, basePrice - promoDiscountAmount);
  const totalSavings = Math.max(0, originalPrice - finalPrice);

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-slate-900 font-sans pb-36 relative selection:bg-[#E21E5B] selection:text-white">
      
      {/* TOAST NOTIFICATION */}
      <AnimatePresence>
        {toast && (
          <motion.div 
            initial={{ opacity: 0, y: -40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className={`fixed top-6 left-1/2 -translate-x-1/2 z-[9999] px-6 py-3.5 rounded-2xl shadow-2xl border flex items-center gap-2.5 backdrop-blur-md text-xs font-black uppercase tracking-wider ${
              toast.type === 'success' 
                ? 'bg-emerald-950/90 text-emerald-100 border-emerald-500/50' 
                : 'bg-rose-950/90 text-rose-100 border-rose-500/50'
            }`}
          >
            {toast.type === 'success' ? <CheckCircle size={18} className="text-emerald-400" /> : <AlertCircle size={18} className="text-rose-400" />}
            <span>{toast.text}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-2xl mx-auto px-4 pt-4 pb-6 space-y-4">
        
        {/* HEADER: < Premium Plans ... Need Help? */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button 
              type="button" 
              onClick={() => router.back()} 
              className="p-1.5 -ml-1.5 hover:bg-slate-200 text-slate-800 rounded-full transition-colors cursor-pointer"
              aria-label="Back"
            >
              <ArrowLeft size={22} className="stroke-[2.5]" />
            </button>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Premium Plans</h1>
          </div>

          <button 
            type="button"
            onClick={() => setShowHelpModal(true)}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-[#E21E5B] bg-white border border-slate-200 hover:border-rose-200 px-3 py-1.5 rounded-full shadow-2xs transition-all cursor-pointer"
          >
            <span>Need Help?</span>
            <HelpCircle size={15} className="text-slate-500" />
          </button>
        </div>

        {/* ACTIVE SUBSCRIPTION BADGE (IF ANY) */}
        {activeSub && (
          <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 px-4 py-2.5 rounded-2xl text-emerald-800 text-xs font-bold shadow-2xs">
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-emerald-600 shrink-0" />
              <span>Active: {activeSub.planName || activeSub.PlanName}</span>
            </div>
            <span className="bg-emerald-600 text-white text-[10px] px-2 py-0.5 rounded-full font-black">
              {activeSub.remainingContacts ?? activeSub.RemainingContacts} Contacts Left
            </span>
          </div>
        )}

        {/* DURATION SELECTOR TABS: [ 3 Months ] [ 6 Months ] [ Unlimited ] */}
        <div className="flex items-center gap-2.5 pt-1">
          {(["3 Months", "6 Months", "Unlimited"] as DurationKey[]).map((dur) => {
            const isSelected = selectedDuration === dur;
            return (
              <button
                key={dur}
                type="button"
                onClick={() => handleDurationChange(dur)}
                className={`flex-1 py-2 rounded-full text-xs font-bold transition-all text-center cursor-pointer shadow-2xs ${
                  isSelected
                    ? "bg-[#1C2024] text-white border border-[#1C2024]"
                    : "bg-white text-slate-700 border border-slate-300 hover:border-slate-400"
                }`}
              >
                {dur}
              </button>
            );
          })}
        </div>

        {/* SAVINGS BANNER: 🥳 Great! You are saving ₹700 */}
        <div className="bg-[#EBFBF0] border border-[#B9E9C6] text-[#1B5E20] px-4 py-2.5 rounded-2xl flex items-center gap-2 text-xs font-bold shadow-2xs">
          <span className="text-base">🥳</span>
          <span>Great! You are saving ₹{totalSavings.toLocaleString('en-IN')}</span>
        </div>

        {/* PLAN CARDS LIST ACCORDION */}
        <div className="space-y-3 pt-1">
          {currentPlans.map((plan) => {
            const isSelected = plan.id === selectedPlanId;
            const isExpanded = !!expandedPlanIds[plan.id];

            return (
              <div
                key={plan.id}
                onClick={() => handleSelectPlan(plan.id)}
                className={`bg-white rounded-2xl transition-all cursor-pointer relative overflow-hidden shadow-2xs ${
                  isSelected 
                    ? "border-2 border-[#E21E5B] ring-2 ring-[#E21E5B]/10" 
                    : "border border-slate-200 hover:border-slate-300"
                }`}
              >
                {/* BADGE (Best Seller / Premium) */}
                {plan.badge && (
                  <div className="absolute top-0 right-0">
                    <span className={`text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-bl-xl inline-block shadow-2xs ${plan.badgeColor || 'bg-[#E21E5B] text-white'}`}>
                      {plan.badge}
                    </span>
                  </div>
                )}

                {/* CARD UPPER ROW: Radio + Plan Name + Monthly Rate + Price */}
                <div className="p-4 sm:p-5">
                  <div className="flex items-start justify-between gap-3">
                    
                    {/* LEFT: Radio + Title + Monthly */}
                    <div className="flex items-start gap-3">
                      <div className="pt-0.5">
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                          isSelected ? "border-[#E21E5B] bg-[#E21E5B]" : "border-slate-300 bg-white"
                        }`}>
                          {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                        </div>
                      </div>
                      
                      <div>
                        <h3 className="text-base font-bold text-slate-900 leading-tight">
                          {plan.name}
                        </h3>
                        <p className="text-xs text-slate-500 font-medium mt-0.5">
                          ₹{plan.monthlyRate.toLocaleString('en-IN')}/month
                        </p>
                      </div>
                    </div>

                    {/* RIGHT: Strikethrough + Discount Price */}
                    <div className="text-right shrink-0 pr-1">
                      {plan.originalPrice > plan.discountPrice && (
                        <div className="text-xs text-slate-400 font-medium line-through">
                          ₹{plan.originalPrice.toLocaleString('en-IN')}
                        </div>
                      )}
                      <div className="text-lg font-bold text-slate-900 leading-tight">
                        ₹{plan.discountPrice.toLocaleString('en-IN')}
                      </div>
                    </div>

                  </div>

                  {/* DIVIDER */}
                  <div className="border-t border-slate-100 my-3.5" />

                  {/* ACCORDION SUMMARY ROW (Click to toggle details) */}
                  <div 
                    onClick={(e) => toggleExpand(plan.id, e)}
                    className="flex items-center justify-between text-xs font-semibold text-slate-700 hover:text-slate-900 transition-colors py-0.5"
                  >
                    <div className="flex items-center gap-2">
                      <Check size={16} className="text-[#E21E5B] stroke-[3] shrink-0" />
                      <span>{plan.summary}</span>
                    </div>
                    
                    <button 
                      type="button" 
                      className="p-1 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                      aria-label="Toggle details"
                    >
                      {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </button>
                  </div>
                </div>

                {/* EXPANDABLE ACCORDION CONTENT */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden bg-[#FAF9F7] border-t border-slate-100"
                    >
                      <div className="p-4 sm:p-5 space-y-2.5">
                        {plan.features.map((feat, idx) => (
                          <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-800 font-medium">
                            <Check size={15} className="text-[#E21E5B] stroke-[3] shrink-0 mt-0.5" />
                            <span className="leading-relaxed">{feat}</span>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

              </div>
            );
          })}
        </div>

        {/* APPLY PROMO CODE ACCORDION */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
          <button
            type="button"
            onClick={() => setIsPromoOpen(!isPromoOpen)}
            className="w-full p-4 flex items-center justify-between text-xs font-bold text-slate-800 hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-rose-50 text-[#E21E5B] flex items-center justify-center font-black text-[11px]">
                %
              </span>
              <span>
                {appliedPromo ? `Promo Applied: ${appliedPromo.code} (-₹${appliedPromo.discountAmount})` : 'Apply Promo Code'}
              </span>
            </div>
            {isPromoOpen ? <ChevronUp size={18} className="text-slate-400" /> : <ChevronDown size={18} className="text-slate-400" />}
          </button>

          <AnimatePresence>
            {isPromoOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden border-t border-slate-100 p-4 bg-[#FAF9F7]"
              >
                {!appliedPromo ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={promoInput}
                      onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
                      placeholder="Enter promo code (e.g. NIKAH20)"
                      className="flex-1 bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold uppercase tracking-wider outline-none focus:border-[#E21E5B]"
                    />
                    <button
                      type="button"
                      onClick={handleApplyPromo}
                      disabled={validatingPromo || !promoInput.trim()}
                      className="px-5 py-2 bg-[#E21E5B] hover:bg-[#b01348] text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer disabled:opacity-50"
                    >
                      {validatingPromo ? "..." : "Apply"}
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-xl px-3.5 py-2 text-xs font-bold text-emerald-800">
                    <span>Code {appliedPromo.code} applied! Saved ₹{appliedPromo.discountAmount}</span>
                    <button
                      type="button"
                      onClick={handleRemovePromo}
                      className="text-rose-600 hover:underline cursor-pointer"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* PURCHASE HISTORY & INVOICES BUTTON / SECTION */}
        <div className="pt-2">
          <button
            type="button"
            onClick={() => setShowHistorySection(!showHistorySection)}
            className="w-full py-2.5 px-4 bg-white hover:bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-700 flex items-center justify-between transition-colors shadow-2xs cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <History size={16} className="text-slate-500" />
              <span>Purchase History & GST Invoices</span>
            </div>
            <span className="text-[11px] text-slate-500">
              {historyList.length > 0 ? `${historyList.length} Order${historyList.length > 1 ? 's' : ''}` : 'View'}
            </span>
          </button>

          <AnimatePresence>
            {showHistorySection && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden mt-3 space-y-3"
              >
                {loadingHistory ? (
                  <div className="p-4 bg-white rounded-2xl border border-slate-200 text-center text-xs text-slate-500">
                    Loading history...
                  </div>
                ) : historyList.length === 0 ? (
                  <div className="p-6 bg-white rounded-2xl border border-slate-200 text-center text-xs text-slate-400">
                    No past purchases found. Upgrade to any plan to view invoices.
                  </div>
                ) : (
                  historyList.map((item, idx) => {
                    const subId = item.subscriptionId ?? item.SubscriptionId ?? item.userSubId ?? item.UserSubId ?? idx + 1;
                    const pName = item.planName ?? item.PlanName ?? "Subscription Plan";
                    const pPrice = item.price ?? item.Price ?? item.finalPaidAmount ?? item.FinalPaidAmount ?? 0;
                    const start = formatDate(item.startDate ?? item.StartDate);
                    const end = formatDate(item.endDate ?? item.EndDate ?? item.expiryDate ?? item.ExpiryDate);
                    const txn = item.paymentId ?? item.PaymentId ?? item.transactionId ?? item.TransactionId ?? `TXN-${subId}`;
                    const isActive = Boolean(item.isCurrentlyActive ?? item.IsCurrentlyActive ?? (new Date(item.endDate || item.ExpiryDate) >= new Date()));

                    return (
                      <div 
                        key={subId} 
                        className="p-4 bg-white rounded-2xl border border-slate-200 flex items-center justify-between gap-3 shadow-2xs"
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-900 uppercase">{pName}</span>
                            <span className={`px-2 py-0.2 rounded-full text-[9px] font-black uppercase ${
                              isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                            }`}>
                              {isActive ? "Active" : "Expired"}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500">
                            Purchased: {start} • ₹{pPrice}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => setSelectedInvoice({ ...item, pName, pPrice, start, end, txn, isActive })}
                          className="px-3 py-1.5 bg-slate-900 hover:bg-[#E21E5B] text-white rounded-xl text-[11px] font-bold uppercase transition-all flex items-center gap-1 cursor-pointer"
                        >
                          <FileText size={12} />
                          <span>Invoice</span>
                        </button>
                      </div>
                    );
                  })
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </div>

      {/* STICKY BOTTOM CHECKOUT BUTTON: Get {Plan} {Duration} • ₹{Price} */}
      {activePlan && (
        <div className="fixed bottom-0 inset-x-0 z-50 bg-white/95 backdrop-blur-md border-t border-slate-200 px-4 py-3 shadow-[0_-4px_25px_rgba(0,0,0,0.06)]">
          <div className="max-w-2xl mx-auto">
            <button
              type="button"
              onClick={handlePurchase}
              disabled={purchasing}
              className="w-full py-3.5 px-6 bg-[#E21E5B] hover:bg-[#b01348] text-white font-bold text-sm rounded-full shadow-lg shadow-rose-900/15 active:scale-[0.99] transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              {purchasing ? (
                <>
                  <Loader2 size={18} className="animate-spin text-white" />
                  <span>Processing Upgrade...</span>
                </>
              ) : (
                <span>
                  Get {activePlan.name} {selectedDuration} • ₹{finalPrice.toLocaleString('en-IN')}
                </span>
              )}
            </button>
          </div>
        </div>
      )}

      {/* ❓ NEED HELP MODAL */}
      <AnimatePresence>
        {showHelpModal && (
          <div className="fixed inset-0 z-[10000] bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-5 border border-slate-200 relative"
            >
              <button 
                type="button"
                onClick={() => setShowHelpModal(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 cursor-pointer p-1"
              >
                <X size={20} />
              </button>

              <div className="text-center space-y-1 pt-2">
                <div className="w-12 h-12 rounded-full bg-rose-50 text-[#E21E5B] flex items-center justify-center mx-auto">
                  <HelpCircle size={26} />
                </div>
                <h3 className="text-base font-bold text-slate-900">Need Help Selecting a Plan?</h3>
                <p className="text-xs text-slate-500">
                  Our matchmaking counselors are available on WhatsApp and phone to guide you.
                </p>
              </div>

              <div className="space-y-2.5">
                <a
                  href="https://wa.me/919999999999?text=Assalam%20o%20Alaikum%2C%20I%20need%20help%20selecting%20a%20membership%20plan%20on%20Nikah%20Qubool."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3 px-4 bg-[#25D366] hover:bg-[#1EBE5D] text-white font-bold text-xs uppercase tracking-wider rounded-2xl flex items-center justify-center gap-2 shadow-sm transition-all"
                >
                  <MessageSquare size={16} />
                  <span>Chat on WhatsApp</span>
                </a>

                <a
                  href="tel:+919999999999"
                  className="w-full py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs uppercase tracking-wider rounded-2xl flex items-center justify-center gap-2 transition-all"
                >
                  <Phone size={16} />
                  <span>Call Support</span>
                </a>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 🧾 TAX INVOICE PRINTABLE MODAL */}
      <AnimatePresence>
        {selectedInvoice && (
          <div className="fixed inset-0 z-[10000] bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden relative my-auto"
            >
              {/* TOP ACTIONS (HIDDEN ON PRINT) */}
              <div className="print:hidden bg-slate-900 text-white px-6 py-3.5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText size={18} className="text-[#E21E5B]" />
                  <span className="text-xs font-black uppercase tracking-wider">Official Tax Invoice</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="px-3.5 py-1.5 bg-[#E21E5B] hover:bg-[#b01348] text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                  >
                    <Printer size={14} />
                    <span>Print / Save PDF</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedInvoice(null)}
                    className="p-1.5 rounded-full hover:bg-white/10 text-white/80 hover:text-white cursor-pointer"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              {/* INVOICE CONTENT */}
              <div className="p-6 sm:p-10 space-y-6 text-slate-800">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-2 border-slate-100 pb-6">
                  <div>
                    <h2 className="text-2xl font-serif font-black tracking-tight text-[#E21E5B]">NIKAH QUBOOL</h2>
                    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Operated by Nikah Qubool Matrimonial Services</p>
                    <p className="text-[11px] font-semibold text-slate-400 mt-1">GSTIN: 07AAACN1234F1Z9 | support@nikahqubool.in</p>
                  </div>
                  <div className="text-left sm:text-right">
                    <span className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-[10px] font-black uppercase tracking-wider inline-block mb-1">
                      PAID / SUCCESS
                    </span>
                    <div className="text-xs font-extrabold text-slate-900 font-mono">Invoice #{selectedInvoice.txn}</div>
                    <div className="text-xs font-semibold text-slate-500 mt-0.5">Date: {selectedInvoice.start}</div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-[#FAF8F5] p-4 rounded-2xl border border-rose-100 text-xs">
                  <div>
                    <span className="text-[10px] font-black uppercase text-slate-400 block tracking-wider">Billed To</span>
                    <strong className="text-slate-900 font-extrabold text-sm block mt-0.5">{userDetails.fullName || userDetails.FullName || 'Valued Member'}</strong>
                    <span className="text-slate-600 font-semibold block">{userDetails.mobileNumber || userDetails.MobileNumber || ''}</span>
                    <span className="text-slate-500 font-semibold block">{userDetails.email || userDetails.Email || ''}</span>
                  </div>
                  <div className="sm:text-right">
                    <span className="text-[10px] font-black uppercase text-slate-400 block tracking-wider">Plan Validity</span>
                    <span className="text-slate-800 font-bold block mt-0.5">Start: {selectedInvoice.start}</span>
                    <span className="text-slate-800 font-bold block">Expiry: {selectedInvoice.end}</span>
                    <span className="text-emerald-600 font-extrabold block">Status: {selectedInvoice.isActive ? 'Active' : 'Expired'}</span>
                  </div>
                </div>

                <div className="border border-slate-200 rounded-2xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px] font-black tracking-wider">
                      <tr>
                        <th className="py-3 px-4">Description</th>
                        <th className="py-3 px-4 text-center">Qty</th>
                        <th className="py-3 px-4 text-right">Amount (INR)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-bold">
                      <tr>
                        <td className="py-4 px-4">
                          <span className="text-slate-900 font-extrabold block">{selectedInvoice.pName} Package</span>
                          <span className="text-[11px] text-slate-500 font-normal block mt-0.5">
                            Verified Candidate Contacts & Unlimited Chat Messaging Access
                          </span>
                        </td>
                        <td className="py-4 px-4 text-center text-slate-600">1</td>
                        <td className="py-4 px-4 text-right text-slate-900 font-black">₹{selectedInvoice.pPrice}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-2">
                  <div className="text-xs text-slate-500 space-y-1">
                    <p className="font-semibold">Payment Mode: <strong className="text-slate-800">Online Payment Gateway</strong></p>
                    <p className="font-semibold">Txn Reference: <strong className="font-mono text-slate-800">{selectedInvoice.txn}</strong></p>
                  </div>
                  <div className="w-full sm:w-60 bg-rose-50/60 p-4 rounded-2xl border border-rose-200/80 space-y-1.5 text-xs text-right">
                    <div className="flex justify-between text-slate-600 font-semibold">
                      <span>Subtotal:</span>
                      <span>₹{(selectedInvoice.pPrice / 1.18).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-slate-600 font-semibold">
                      <span>GST (18% Incl.):</span>
                      <span>₹{(selectedInvoice.pPrice - selectedInvoice.pPrice / 1.18).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-slate-900 font-black text-sm pt-1 border-t border-rose-200">
                      <span>Total Paid:</span>
                      <span className="text-[#E21E5B]">₹{selectedInvoice.pPrice}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 text-center text-[10px] font-semibold text-slate-400">
                  This is a computer-generated tax invoice and requires no physical signature. Thank you for choosing Nikah Qubool.
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
