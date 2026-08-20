"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Crown, CheckCircle2, AlertCircle, CreditCard, RefreshCw, Calendar, Eye, Loader2, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast, Toaster } from 'sonner';
import { fetchActiveSubscriptionApi, fetchSubscriptionHistoryApi } from '@/lib/api';

export default function PaymentInfoPage() {
  const router = useRouter();
  const [activePlan, setActivePlan] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const getCookie = (name: string) => {
    if (typeof document === "undefined") return null;
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    return parts.length === 2 ? parts.pop()?.split(';').shift() : null;
  };

  const getToken = useCallback(() => getCookie("user_token"), []);

  const loadData = useCallback(async () => {
    const token = getToken();
    if (!token) {
      router.push('/');
      return;
    }

    setLoading(true);
    const [activeRes, historyRes] = await Promise.all([
      fetchActiveSubscriptionApi(token),
      fetchSubscriptionHistoryApi(token)
    ]);

    if (activeRes.success && activeRes.data) {
      setActivePlan(activeRes.data);
    }

    if (historyRes.success && historyRes.data) {
      const list = Array.isArray(historyRes.data) ? historyRes.data : historyRes.data.history || [];
      setHistory(list);
    }

    setLoading(false);
  }, [getToken, router]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const isExpired = activePlan ? (activePlan.isExpired || activePlan.IsExpired || false) : true;
  const planName = activePlan?.planName || activePlan?.PlanName || 'No Active VIP Plan';
  const expiryDate = activePlan?.expiryDate || activePlan?.ExpiryDate || activePlan?.endDate || activePlan?.EndDate;
  const remainingViews = activePlan?.remainingContacts ?? activePlan?.RemainingContacts ?? activePlan?.contactViewsAllowed ?? 0;

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-28 pt-4 selection:bg-[#d91b5c] selection:text-white">
      <Toaster position="top-center" richColors duration={2000} />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-6">
        
        {/* HEADER BAR */}
        <div className="flex items-center justify-between py-2 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <button 
              type="button" 
              onClick={() => router.back()} 
              className="flex p-2 hover:bg-rose-50 text-[#d91b5c] rounded-full transition-colors cursor-pointer"
              aria-label="Back"
              title="Go Back"
            >
              <ArrowLeft size={22} className="stroke-[2.5]" />
            </button>
            <h1 className="text-xl font-extrabold tracking-tight text-slate-900">
              Payment & Subscription Info
            </h1>
          </div>

          <button 
            type="button"
            onClick={() => router.push('/dashboard/membership')}
            className="px-4 py-2 bg-gradient-to-r from-[#d91b5c] via-[#e11d48] to-[#d91b5c] text-white text-xs font-black uppercase rounded-full shadow-md flex items-center gap-1.5 cursor-pointer hover:brightness-110 shrink-0"
          >
            <Crown size={15} className="text-amber-300 fill-amber-300" />
            <span>Upgrade VIP</span>
          </button>
        </div>

        {loading ? (
          <div className="min-h-[250px] flex items-center justify-center text-[#d91b5c]">
            <Loader2 size={36} className="animate-spin" />
          </div>
        ) : (
          <>
            {/* 🌟 ACTIVE SUBSCRIPTION CARD */}
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-3xl p-6 border-2 border-rose-100 shadow-xl space-y-5 relative overflow-hidden"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-r from-[#d91b5c] to-[#e11d48] text-white flex items-center justify-center shadow-md">
                    <Crown size={24} className="text-amber-300 fill-amber-300" />
                  </div>
                  <div>
                    <h2 className="text-lg font-serif font-black uppercase text-slate-900 flex items-center gap-2">
                      {planName}
                      {!isExpired && activePlan && (
                        <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full font-sans font-extrabold flex items-center gap-1">
                          <CheckCircle2 size={12} className="fill-emerald-600 text-white" /> Active
                        </span>
                      )}
                      {isExpired && activePlan && (
                        <span className="text-[10px] bg-rose-100 text-rose-800 px-2.5 py-0.5 rounded-full font-sans font-extrabold flex items-center gap-1">
                          <AlertCircle size={12} /> Expired
                        </span>
                      )}
                    </h2>
                    <p className="text-xs font-semibold text-slate-500">Your current membership details</p>
                  </div>
                </div>

                <button 
                  type="button"
                  onClick={() => router.push('/dashboard/membership')}
                  className="px-5 py-2.5 rounded-2xl bg-[#d91b5c] hover:bg-[#6e0a33] text-white font-black text-xs uppercase tracking-wider shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <RefreshCw size={15} /> Renew / Change Plan
                </button>
              </div>

              {/* ACTIVE PLAN METRICS GRID */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pt-1">
                <div className="p-4 rounded-2xl bg-rose-50/60 border border-rose-100 flex items-center gap-3">
                  <Calendar className="text-[#d91b5c]" size={20} />
                  <div>
                    <span className="text-[10px] font-black uppercase text-slate-400 block">Expiry Date</span>
                    <span className="text-xs font-black text-slate-800">
                      {expiryDate ? new Date(expiryDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'No Active Expiry'}
                    </span>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/60 flex items-center gap-3">
                  <Eye className="text-amber-600" size={20} />
                  <div>
                    <span className="text-[10px] font-black uppercase text-slate-400 block">Remaining Contact Views</span>
                    <span className="text-xs font-black text-slate-800">
                      {remainingViews} Profile Views
                    </span>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-100 flex items-center gap-3 sm:col-span-2 md:col-span-1">
                  <Sparkles className="text-emerald-600" size={20} />
                  <div>
                    <span className="text-[10px] font-black uppercase text-slate-400 block">Direct Messaging</span>
                    <span className="text-xs font-black text-emerald-800">
                      {!isExpired ? "Unlimited Active Chat" : "Upgrade to Chat"}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* 📄 SUBSCRIPTION BILLING HISTORY TABLE */}
            <div className="bg-white rounded-3xl p-6 border-2 border-rose-100 shadow-xl space-y-4">
              <h3 className="text-base font-serif font-black uppercase text-slate-900">
                Subscription Payment History
              </h3>

              {history.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                  <CreditCard className="mx-auto text-slate-400" size={32} />
                  <p className="text-xs font-extrabold text-slate-600">No payment transactions found.</p>
                  <p className="text-[11px] text-slate-400">Your past VIP membership purchases will appear here.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b-2 border-slate-100 text-[10px] uppercase font-black text-slate-400 tracking-wider">
                        <th className="py-3 px-3">Date</th>
                        <th className="py-3 px-3">Plan Name</th>
                        <th className="py-3 px-3">Amount</th>
                        <th className="py-3 px-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-extrabold text-slate-800">
                      {history.map((item: any, idx: number) => {
                        const date = item.paymentDate || item.PaymentDate || item.createdDate || item.CreatedDate;
                        const plan = item.planName || item.PlanName || 'VIP Membership';
                        const amount = item.amountPaid || item.AmountPaid || item.amount || item.Amount || 0;
                        const status = String(item.paymentStatus || item.PaymentStatus || item.status || 'COMPLETED').toUpperCase();

                        return (
                          <tr key={idx} className="hover:bg-rose-50/40 transition-colors">
                            <td className="py-3.5 px-3">
                              {date ? new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A'}
                            </td>
                            <td className="py-3.5 px-3 text-[#d91b5c]">{plan}</td>
                            <td className="py-3.5 px-3">₹{amount}</td>
                            <td className="py-3.5 px-3">
                              {status === 'COMPLETED' || status === 'SUCCESS' || status === 'PAID' ? (
                                <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black">
                                  SUCCESS
                                </span>
                              ) : (
                                <span className="px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[10px] font-black">
                                  {status}
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}

      </div>
    </div>
  );
}

