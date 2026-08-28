"use client";

import React, { useState, useEffect } from 'react';
import { 
  Check, Star, Crown, ShieldCheck, Zap, 
  Heart, CheckCircle2, Sparkles, Tag, ArrowRight, ArrowLeft,
  CheckCircle, AlertCircle, Trash2, Loader2, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { 
  fetchSubscriptionPlansApi, 
  purchaseSubscriptionApi, 
  fetchActiveSubscriptionApi,
  validatePromoCodeApi 
} from '@/lib/api';

export default function MembershipPage() {
  const router = useRouter();
  const [plans, setPlans] = useState<any[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [activeSub, setActiveSub] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  
  // 🏷️ PROMO CODE STATES
  const [showPromoModal, setShowPromoModal] = useState(false);
  const [promoInput, setPromoInput] = useState("");
  const [validatingPromo, setValidatingPromo] = useState(false);
  const [appliedPromo, setAppliedPromo] = useState<{ code: string; discountAmount: number } | null>(null);

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
    const loadPlansAndActive = async () => {
      setLoading(true);
      const plansRes = await fetchSubscriptionPlansApi();
      if (plansRes && plansRes.success && plansRes.data) {
        const rawPlans = plansRes.data;
        setPlans(rawPlans);
        // Default select GOLD or SILVER
        const defaultPlan = rawPlans.find((p: any) => (p.planName || p.PlanName) === 'GOLD' || (p.planName || p.PlanName) === 'SILVER') || rawPlans[1] || rawPlans[0];
        setSelectedPlan(defaultPlan);
      }

      const token = getToken();
      if (token) {
        const subRes = await fetchActiveSubscriptionApi(token);
        if (subRes && subRes.success && subRes.data) {
          setActiveSub(subRes.data);
        }
      }
      setLoading(false);
    };

    loadPlansAndActive();
  }, []);

  const handleSelectPlan = (plan: any) => {
    setSelectedPlan(plan);
    setAppliedPromo(null);
  };

  const handleApplyPromo = async () => {
    if (!promoInput.trim() || !selectedPlan) return;
    const token = getToken();
    if (!token) {
      showToast("Please login to apply promo code.", "error");
      return;
    }

    setValidatingPromo(true);
    const planId = selectedPlan.planId ?? selectedPlan.PlanId;
    const res = await validatePromoCodeApi(promoInput.trim(), planId, token);
    setValidatingPromo(false);

    if (res && res.success) {
      setAppliedPromo({
        code: res.code || promoInput.trim().toUpperCase(),
        discountAmount: res.discountAmount || 0
      });
      setShowPromoModal(false);
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
    if (!selectedPlan) return;
    const token = getToken();
    if (!token) {
      showToast("Please login to upgrade membership.", "error");
      router.push('/');
      return;
    }

    setPurchasing(true);
    const planId = selectedPlan.planId ?? selectedPlan.PlanId;
    const promoCodeToPass = appliedPromo ? appliedPromo.code : null;

    const res = await purchaseSubscriptionApi(planId, promoCodeToPass, token);
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

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center text-[#d91b5c] font-black text-xs uppercase tracking-widest gap-3">
        <Loader2 className="animate-spin text-[#d91b5c]" size={48} />
        <span>Loading Plans...</span>
      </div>
    );
  }

  const basePrice = selectedPlan ? (selectedPlan.discountPrice ?? selectedPlan.DiscountPrice ?? 0) : 0;
  const originalPrice = selectedPlan ? (selectedPlan.originalPrice ?? selectedPlan.OriginalPrice ?? 0) : 0;
  const promoDiscountAmount = appliedPromo ? appliedPromo.discountAmount : 0;
  const finalPrice = Math.max(0, basePrice - promoDiscountAmount);
  const totalSavings = Math.max(0, originalPrice - finalPrice);

  return (
    <div className="min-h-screen bg-[#fcfcfd] text-slate-900 font-sans pb-32 relative selection:bg-[#d91b5c] selection:text-white">
      
      {/* TOAST NOTIFICATION */}
      <AnimatePresence>
        {toast && (
          <motion.div 
            initial={{ opacity: 0, y: -40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className={`fixed top-6 left-1/2 -translate-x-1/2 z-[9999] px-6 py-4 rounded-2xl shadow-2xl border-2 flex items-center gap-3 backdrop-blur-md text-xs font-black uppercase tracking-wider ${
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

      {/* TOP HEADER WITH BACK ARROW */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-4">
        <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
          <div className="flex items-center gap-3">
            <button 
              type="button" 
              onClick={() => router.back()} 
              className="flex p-2 hover:bg-rose-50 text-[#d91b5c] rounded-full transition-colors cursor-pointer"
              aria-label="Back"
            >
              <ArrowLeft size={22} className="stroke-[2.5]" />
            </button>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-sans font-extrabold text-slate-900 tracking-tight">Membership Plans</h1>
            </div>
          </div>

          {activeSub && (
            <div className="hidden sm:flex items-center gap-2 bg-emerald-50 border border-emerald-200 px-4 py-1.5 rounded-full text-emerald-800 text-xs font-bold">
              <Sparkles size={16} className="text-emerald-600" />
              <span>Active Plan: {activeSub.planName || activeSub.PlanName} ({activeSub.remainingContacts ?? activeSub.RemainingContacts} Contacts Left)</span>
            </div>
          )}
        </div>
      </div>

      {/* 💖 SOBER ELEGANT PLANS GRID (NIKAH FOREVER STYLE) */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
          {plans.map((plan) => {
            const pId = plan.planId ?? plan.PlanId;
            const pName = plan.planName ?? plan.PlanName;
            const pBadge = plan.badgeText ?? plan.BadgeText;
            const pOrig = plan.originalPrice ?? plan.OriginalPrice;
            const pDisc = plan.discountPrice ?? plan.DiscountPrice;
            const pSave = plan.savePercentage ?? plan.SavePercentage;
            const pDuration = plan.durationLabel ?? plan.DurationLabel;
            const isSelected = (selectedPlan?.planId ?? selectedPlan?.PlanId) === pId;

            let parsedFeatures: string[] = [];
            try {
              parsedFeatures = typeof plan.features === 'string' ? JSON.parse(plan.features) : (plan.features || []);
            } catch (e) {
              parsedFeatures = ["✔ Verified Contacts", "✔ Unlimited Messages", "✔ Premium Tag"];
            }

            return (
              <div
                key={pId}
                onClick={() => handleSelectPlan(plan)}
                className={`bg-white rounded-3xl p-6 flex flex-col justify-between cursor-pointer transition-all relative shadow-lg ${
                  isSelected 
                    ? 'border-3 border-[#d91b5c] ring-4 ring-[#d91b5c]/10 shadow-rose-900/15' 
                    : 'border-2 border-slate-200 hover:border-rose-300'
                }`}
              >
                <div>
                  {/* TOP RED/PINK PILL BADGE */}
                  <div className="text-center mb-5">
                    <span className="bg-[#d91b5c] text-white px-4 py-1.5 rounded-full text-xs font-extrabold uppercase tracking-wider inline-block shadow-sm">
                      {pName} {pBadge ? `(${pBadge})` : ''}
                    </span>
                  </div>

                  {/* FEATURES CHECKLIST (EXACT TICK & CROSS LIST WITH FULL INCLUSIONS) */}
                  <div className="space-y-3 mb-6 text-xs font-bold text-slate-800 px-1 border-b border-slate-100 pb-5">
                    {parsedFeatures.map((feat: string, idx: number) => {
                      const isCross = feat.startsWith('✖');
                      return (
                        <div key={idx} className={`flex items-start gap-2.5 leading-snug ${isCross ? 'text-slate-400 line-through font-normal' : 'text-slate-900 font-extrabold'}`}>
                          <span className={isCross ? 'text-slate-400 font-normal shrink-0' : 'text-[#d91b5c] font-black shrink-0'}>
                            {isCross ? '✖' : '✔'}
                          </span>
                          <span className="text-[12px]">{feat.replace(/^[✔✖]\s*/, '')}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* DURATION & PRICE SELECTION BOX AT BOTTOM OF CARD */}
                <div className={`p-4 rounded-2xl border-2 text-center transition-all ${
                  isSelected 
                    ? 'bg-rose-50/90 border-[#d91b5c]' 
                    : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                }`}>
                  <div className="text-sm font-black text-slate-900 uppercase">{pDuration}</div>
                  {pSave > 0 && (
                    <span className="text-[10px] font-black text-rose-600 bg-rose-100 px-2.5 py-0.5 rounded-full inline-block my-1 uppercase">
                      Save {pSave}%
                    </span>
                  )}
                  <div className="flex items-baseline justify-center gap-2 mt-1">
                    {pOrig > pDisc && (
                      <span className="text-xs font-bold text-slate-400 line-through">₹{pOrig}</span>
                    )}
                    <span className="text-2xl font-black text-[#d91b5c]">₹{pDisc}</span>
                  </div>
                  <div className="mt-2 flex items-center justify-center">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      isSelected ? 'border-[#d91b5c] bg-[#d91b5c]' : 'border-slate-400 bg-white'
                    }`}>
                      {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 🔴 BOTTOM FIXED CHECKOUT BAR (MATCHING SCREENSHOT) */}
      {selectedPlan && (
        <div className="fixed bottom-0 inset-x-0 z-50 bg-white border-t-2 border-rose-100 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] py-3.5 px-4 md:px-8">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            
            {/* LEFT: PROMO CODE & SAVINGS */}
            <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-start">
              <button
                type="button"
                onClick={() => setShowPromoModal(true)}
                className="flex items-center gap-1.5 text-xs font-extrabold text-slate-700 hover:text-[#d91b5c] transition-colors cursor-pointer"
              >
                <Tag size={16} className="text-[#d91b5c]" />
                <span>{appliedPromo ? `Promo (${appliedPromo.code})` : 'Apply Promo Code'}</span>
              </button>

              <div className="text-xs font-extrabold text-slate-900 border-l border-slate-200 pl-4">
                <span>Your total saving is </span>
                <span className="text-emerald-600 font-black">₹{totalSavings}</span>
              </div>
            </div>

            {/* RIGHT: PROMINENT PAY NOW BUTTON */}
            <div className="w-full sm:w-auto flex items-center gap-3">
              <button
                type="button"
                onClick={handlePurchase}
                disabled={purchasing}
                className="w-full sm:w-auto px-10 py-3.5 bg-[#d91b5c] hover:bg-[#b01348] text-white font-black text-sm uppercase tracking-wider rounded-xl shadow-lg shadow-rose-900/20 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                {purchasing ? (
                  <Loader2 size={20} className="animate-spin text-white" />
                ) : (
                  <>
                    <span>₹{finalPrice} | PAY NOW</span>
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* PROMO CODE MODAL */}
      {showPromoModal && (
        <div className="fixed inset-0 z-[10000] bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 relative border-2 border-rose-100">
            <button 
              onClick={() => setShowPromoModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 cursor-pointer"
            >
              <X size={20} />
            </button>
            <h3 className="font-serif font-extrabold text-lg uppercase text-slate-900">Apply Promo Code</h3>
            
            {!appliedPromo ? (
              <div className="space-y-3">
                <input
                  value={promoInput}
                  onChange={(e) => setPromoInput(e.target.value)}
                  placeholder="Enter promo code (e.g. PAKIZA50)"
                  className="w-full p-3 text-xs font-bold uppercase tracking-wider border-2 border-slate-200 rounded-xl outline-none focus:border-[#d91b5c]"
                />
                <button
                  type="button"
                  onClick={handleApplyPromo}
                  disabled={validatingPromo || !promoInput.trim()}
                  className="w-full py-3 bg-[#d91b5c] text-white font-black text-xs uppercase rounded-xl hover:bg-[#b01348] cursor-pointer disabled:opacity-50"
                >
                  {validatingPromo ? "Validating..." : "Apply Promo Code"}
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="p-3 bg-emerald-50 text-emerald-800 rounded-xl border border-emerald-200 text-xs font-bold flex justify-between items-center">
                  <span>Code {appliedPromo.code} (Saved ₹{appliedPromo.discountAmount})</span>
                  <button type="button" onClick={handleRemovePromo} className="text-rose-600 font-bold hover:underline cursor-pointer">Remove</button>
                </div>
                <button
                  type="button"
                  onClick={() => setShowPromoModal(false)}
                  className="w-full py-3 bg-slate-900 text-white font-black text-xs uppercase rounded-xl cursor-pointer"
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
