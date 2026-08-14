"use client";

import React, { useState, useEffect } from 'react';
import { 
  Check, Star, Crown, ShieldCheck, Zap, 
  Heart, CheckCircle2, Sparkles, Tag, ArrowRight, ArrowLeft,
  CheckCircle, AlertCircle, Trash2, Loader2
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
  const [promoInput, setPromoInput] = useState("");
  const [validatingPromo, setValidatingPromo] = useState(false);
  const [appliedPromo, setAppliedPromo] = useState<{ code: string; discountAmount: number } | null>(null);

  // 💎 MODAL & TOAST STATES
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [purchasedResult, setPurchasedResult] = useState<any>(null);
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
        const defaultPlan = rawPlans.find((p: any) => p.isBestValue || p.IsBestValue || p.isPopular || p.IsPopular) || rawPlans[rawPlans.length - 1];
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
      setPurchasedResult(res.data);
      setShowSuccessModal(true);
    } else {
      showToast(res?.message || "Purchase failed. Please try again.", "error");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center text-[#870c3f] font-black text-xs uppercase tracking-widest gap-3">
        <Loader2 className="animate-spin text-[#870c3f]" size={48} />
        <span>Loading VIP Royal Membership...</span>
      </div>
    );
  }

  const basePrice = selectedPlan ? (selectedPlan.discountPrice ?? selectedPlan.DiscountPrice ?? 0) : 0;
  const promoDiscountAmount = appliedPromo ? appliedPromo.discountAmount : 0;
  const finalPrice = Math.max(0, basePrice - promoDiscountAmount);
  const totalSavings = selectedPlan ? ((selectedPlan.originalPrice ?? selectedPlan.OriginalPrice ?? 0) - finalPrice) : 0;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-32 relative overflow-x-hidden selection:bg-[#870c3f] selection:text-white">
      
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

      {/* TOP INLINE HEADER WITH BACK ARROW */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-3 pb-2">
        <div className="flex items-center gap-3 border-b border-slate-200 pb-2">
          <button 
            type="button" 
            onClick={() => router.back()} 
            className="flex p-2 hover:bg-rose-50 text-[#870c3f] rounded-full transition-colors cursor-pointer"
            aria-label="Back"
            title="Go Back"
          >
            <ArrowLeft size={22} className="stroke-[2.5]" />
          </button>
          <h1 className="text-xl font-extrabold tracking-tight text-slate-900">
            VIP Membership Plans
          </h1>
        </div>
      </div>

      {/* ROYAL HERO BANNER */}
      <div className="bg-gradient-to-r from-[#870c3f] via-[#9e0f4a] to-[#870c3f] text-white py-12 md:py-20 px-6 text-center relative shadow-xl overflow-hidden border-b-2 border-rose-100">
        <div className="absolute top-0 left-1/4 w-80 h-80 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-amber-400/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl mx-auto space-y-4">
          <span className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-white/15 text-white font-black text-xs uppercase tracking-widest backdrop-blur-md border border-white/20 shadow-md">
            <Crown size={18} className="text-amber-300 fill-amber-300 animate-bounce" /> Royalty VIP Membership
          </span>

          <h1 className="text-3xl md:text-5xl font-serif font-extrabold tracking-tight leading-tight text-white">
            Unlock Instant Access To Verified Life Partners
          </h1>

          <p className="text-rose-100 text-sm md:text-base font-medium max-w-xl mx-auto leading-relaxed">
            Get direct mobile contacts, unlimited messaging, verified profile badges, and top-priority matchmaker ranking.
          </p>

          {activeSub && (
            <div className="mt-6 p-4 bg-white/15 backdrop-blur-md border border-white/25 rounded-2xl inline-flex items-center gap-3 text-white shadow-md">
              <Sparkles className="text-amber-300" size={22} />
              <div className="text-left text-xs font-bold">
                <span className="block uppercase text-amber-300 font-extrabold">Active Plan: {activeSub.planName || activeSub.PlanName}</span>
                <span className="text-rose-100 font-medium">
                  {activeSub.remainingContacts ?? activeSub.RemainingContacts} Contacts Remaining | Expiring on {new Date(activeSub.expiryDate || activeSub.ExpiryDate).toLocaleDateString()}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* LUXURY PLANS CARDS */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 -mt-12 relative z-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map((plan) => {
            const pId = plan.planId ?? plan.PlanId;
            const pName = plan.planName ?? plan.PlanName;
            const pBadge = plan.badgeText ?? plan.BadgeText;
            const pOrig = plan.originalPrice ?? plan.OriginalPrice;
            const pDisc = plan.discountPrice ?? plan.DiscountPrice;
            const pSave = plan.savePercentage ?? plan.SavePercentage;
            const pDuration = plan.durationLabel ?? plan.DurationLabel;
            const isSelected = (selectedPlan?.planId ?? selectedPlan?.PlanId) === pId;
            const isBestVal = plan.isBestValue || plan.IsBestValue;
            const isPop = plan.isPopular || plan.IsPopular;

            let parsedFeatures: string[] = [];
            try {
              parsedFeatures = typeof plan.features === 'string' ? JSON.parse(plan.features) : (plan.features || []);
            } catch (e) {
              parsedFeatures = ["Verified Contacts Access", "Unlimited Direct Chat", "VIP Priority Ranking"];
            }

            return (
              <motion.div
                key={pId}
                whileHover={{ y: -8 }}
                onClick={() => handleSelectPlan(plan)}
                className={`rounded-3xl p-6 flex flex-col justify-between cursor-pointer transition-all relative overflow-hidden bg-white shadow-2xl ${
                  isSelected 
                    ? 'border-4 border-[#870c3f] ring-4 ring-[#870c3f]/10 scale-[1.03]' 
                    : 'border-2 border-slate-200 hover:border-rose-300'
                }`}
              >
                {(isBestVal || isPop) && (
                  <div className="absolute top-4 right-4 px-3.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest text-white shadow-md bg-gradient-to-r from-[#870c3f] via-[#9e0f4a] to-[#870c3f] border border-rose-300/30">
                    {isBestVal ? 'TILL YOU MARRY' : 'MOST POPULAR'}
                  </div>
                )}

                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all ${
                      isSelected ? 'border-[#870c3f] bg-[#870c3f]' : 'border-slate-300'
                    }`}>
                      {isSelected && <Check size={16} className="text-white stroke-[3]" />}
                    </div>
                    <div>
                      <h3 className="font-serif font-extrabold text-lg uppercase text-slate-900 leading-tight">{pName}</h3>
                      {pBadge && <span className="text-[10px] font-extrabold text-[#870c3f] uppercase tracking-wider block">{pBadge}</span>}
                    </div>
                  </div>

                  <div className="mb-4">
                    <span className="inline-block px-4 py-1.5 bg-rose-50 text-[#870c3f] rounded-2xl text-xs font-black uppercase tracking-wider border border-rose-200">
                      {pDuration}
                    </span>
                  </div>

                  <div className="mb-6 border-b-2 border-slate-100 pb-5">
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">₹{pDisc}</span>
                      {pOrig > pDisc && (
                        <span className="text-sm font-bold text-slate-400 line-through">₹{pOrig}</span>
                      )}
                    </div>
                    {pSave > 0 && (
                      <span className="inline-block mt-1.5 text-[10px] font-black text-emerald-700 bg-emerald-50 px-3 py-0.5 rounded-full uppercase border border-emerald-200">
                        Save {pSave}% OFF
                      </span>
                    )}
                  </div>

                  <div className="space-y-3 mb-6">
                    {parsedFeatures.map((feat: string, idx: number) => (
                      <div key={idx} className="flex items-center gap-2.5 text-xs font-extrabold text-slate-800">
                        <CheckCircle2 size={16} className="text-[#870c3f] flex-shrink-0" />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className={`w-full py-4 rounded-2xl font-black uppercase text-xs tracking-wider text-center transition-all ${
                  isSelected 
                    ? 'bg-gradient-to-r from-[#870c3f] via-[#9e0f4a] to-[#870c3f] text-white shadow-md border border-rose-300/30' 
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}>
                  {isSelected ? 'SELECTED PLAN' : 'SELECT PLAN'}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* PROMO CODE SECTION WITH APPLY & REMOVE TOGGLE */}
        <div className="mt-12 max-w-xl mx-auto bg-white p-5 rounded-3xl border-2 border-rose-100 shadow-xl">
          {!appliedPromo ? (
            <div className="flex items-center gap-3">
              <Tag className="text-[#870c3f] ml-2" size={22} />
              <input 
                value={promoInput}
                onChange={(e) => setPromoInput(e.target.value)}
                placeholder="Enter Promo Code (e.g. PAKIZA20)" 
                className="flex-1 text-xs font-black uppercase tracking-wider outline-none text-slate-900 bg-transparent placeholder-slate-400"
              />
              <button 
                type="button"
                onClick={handleApplyPromo}
                disabled={validatingPromo || !promoInput.trim()}
                className="px-6 py-3.5 bg-gradient-to-r from-[#870c3f] via-[#9e0f4a] to-[#870c3f] hover:brightness-110 text-white text-xs font-black uppercase rounded-2xl transition-all cursor-pointer disabled:opacity-50 shadow-md border border-rose-300/30"
              >
                {validatingPromo ? "Checking..." : "Apply Code"}
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 border-2 border-emerald-200 flex items-center justify-center font-black text-base shadow-xs">
                  %
                </div>
                <div>
                  <span className="text-xs font-extrabold text-emerald-700 uppercase tracking-widest flex items-center gap-1">
                    <CheckCircle size={15} /> Code {appliedPromo.code} Applied
                  </span>
                  <span className="text-[11px] font-bold text-slate-500 block">
                    You saved an additional ₹{appliedPromo.discountAmount}!
                  </span>
                </div>
              </div>

              <button 
                type="button"
                onClick={handleRemovePromo}
                className="p-2.5 rounded-xl bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100 transition-colors flex items-center gap-1 text-[11px] font-bold uppercase cursor-pointer"
              >
                <Trash2 size={14} /> Remove
              </button>
            </div>
          )}
        </div>

        {/* TRUST BADGES */}
        <div className="mt-12 bg-white rounded-3xl p-8 border-2 border-rose-100 shadow-xl grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div className="p-3">
            <ShieldCheck className="mx-auto text-emerald-600 mb-2" size={34} />
            <h4 className="text-xs font-extrabold uppercase text-slate-900">100% Verified Profiles</h4>
          </div>
          <div className="p-3">
            <Crown className="mx-auto text-amber-500 mb-2" size={34} />
            <h4 className="text-xs font-extrabold uppercase text-slate-900">VIP Profile Rank</h4>
          </div>
          <div className="p-3">
            <Zap className="mx-auto text-[#870c3f] mb-2" size={34} />
            <h4 className="text-xs font-extrabold uppercase text-slate-900">Instant Contact View</h4>
          </div>
          <div className="p-3">
            <Sparkles className="mx-auto text-rose-500 mb-2" size={34} />
            <h4 className="text-xs font-extrabold uppercase text-slate-900">24/7 Matchmaker Support</h4>
          </div>
        </div>
      </div>

      {/* 📌 STICKY FIXED BOTTOM PAYMENT BAR */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t-2 border-rose-100 p-4 z-[999] shadow-2xl">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          
          <div className="text-center sm:text-left">
            <span className="text-xs font-black text-emerald-700 uppercase tracking-widest block">
              YOUR TOTAL SAVING IS ₹{totalSavings}
            </span>
            <span className="text-xs font-semibold text-slate-500">
              Selected: <strong className="text-slate-900 uppercase font-black">{selectedPlan?.planName ?? selectedPlan?.PlanName}</strong> ({selectedPlan?.durationLabel ?? selectedPlan?.DurationLabel})
            </span>
          </div>

          <button 
            type="button"
            onClick={handlePurchase}
            disabled={purchasing || !selectedPlan}
            className="w-full sm:w-auto px-10 py-4 bg-gradient-to-r from-[#870c3f] via-[#9e0f4a] to-[#870c3f] hover:brightness-110 text-white font-black text-sm uppercase tracking-wider rounded-2xl shadow-lg shadow-rose-900/20 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 border border-rose-300/30"
          >
            <span>{purchasing ? "PROCESSING..." : `₹ ${finalPrice} | PAY NOW`}</span>
            <ArrowRight size={18} className="text-amber-300" />
          </button>

        </div>
      </div>

      {/* 👑 VIP LUXURIOUS SUCCESS MODAL */}
      <AnimatePresence>
        {showSuccessModal && (
          <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSuccessModal(false)}
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            />

            <motion.div 
              initial={{ scale: 0.8, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative bg-white rounded-[36px] max-w-md w-full p-8 text-center shadow-2xl border-2 border-rose-100 z-10 overflow-hidden text-slate-800"
            >
              <div className="w-20 h-20 bg-gradient-to-tr from-[#870c3f] to-[#9e0f4a] rounded-full flex items-center justify-center mx-auto mb-5 shadow-lg shadow-rose-900/30">
                <Crown size={38} className="text-amber-300 fill-amber-300" />
              </div>

              <span className="text-[11px] font-black tracking-[0.2em] text-[#870c3f] bg-rose-50 border border-rose-200 px-4 py-1 rounded-full uppercase">
                VIP Upgrade Activated
              </span>

              <h2 className="text-2xl font-serif font-extrabold text-slate-900 uppercase mt-4 mb-2">
                Congratulations! 🎉
              </h2>

              <p className="text-xs font-semibold text-slate-500 leading-relaxed mb-6">
                Your profile has been upgraded to <span className="text-[#870c3f] uppercase font-black">{selectedPlan?.planName ?? selectedPlan?.PlanName}</span>. Enjoy direct access to soulmates!
              </p>

              {/* DETAILS SUMMARY BOX */}
              <div className="bg-slate-50 rounded-2xl p-4 border-2 border-slate-200 text-left space-y-2 mb-6">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-500 uppercase">Package:</span>
                  <span className="font-black text-[#870c3f] uppercase">{selectedPlan?.planName ?? selectedPlan?.PlanName}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-500 uppercase">Original Price:</span>
                  <span className="font-bold text-slate-400 line-through">₹{selectedPlan?.discountPrice ?? selectedPlan?.DiscountPrice}</span>
                </div>
                {appliedPromo && (
                  <div className="flex justify-between items-center text-xs text-emerald-700">
                    <span className="font-bold uppercase">Promo Discount ({appliedPromo.code}):</span>
                    <span className="font-black">-₹{appliedPromo.discountAmount}</span>
                  </div>
                )}
                <div className="flex justify-between items-center text-xs pt-2 border-t border-slate-200">
                  <span className="font-black text-slate-900 uppercase">Total Paid:</span>
                  <span className="font-black text-slate-900 text-sm">₹{finalPrice}</span>
                </div>
              </div>

              <button 
                type="button"
                onClick={() => {
                  setShowSuccessModal(false);
                  router.push('/dashboard');
                }}
                className="w-full py-4 bg-gradient-to-r from-[#870c3f] via-[#9e0f4a] to-[#870c3f] hover:brightness-110 text-white text-xs font-black uppercase tracking-widest rounded-2xl shadow-lg shadow-rose-900/20 transition-all cursor-pointer active:scale-95 border border-rose-300/30"
              >
                Go to Dashboard
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}