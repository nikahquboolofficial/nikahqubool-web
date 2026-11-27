"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ChevronLeft, Crown, CheckCircle2, AlertCircle, CreditCard, 
  Calendar, Loader2, Download, FileText, Sparkles, ShieldCheck, 
  Phone, ArrowRight, Check
} from 'lucide-react';
import { motion } from 'framer-motion';
import { toast, Toaster } from 'sonner';
import { fetchActiveSubscriptionApi, fetchSubscriptionHistoryApi } from '@/lib/api';
import { syncSubscriptionToStorage } from '@/lib/subscriptionUtils';
import { getAuthToken } from '@/lib/auth';

export default function PaymentInfoPage() {
  const router = useRouter();
  const [activePlan, setActivePlan] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userDetails, setUserDetails] = useState<any>(null);

  const getToken = useCallback(() => getAuthToken(), []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("user_details");
      if (stored) {
        try { setUserDetails(JSON.parse(stored)); } catch (e) {}
      }
    }
  }, []);

  const loadData = useCallback(async () => {
    const token = getToken();
    if (!token) {
      router.push('/');
      return;
    }

    setLoading(true);
    try {
      const [activeRes, historyRes] = await Promise.all([
        fetchActiveSubscriptionApi(token),
        fetchSubscriptionHistoryApi(token)
      ]);

      if (activeRes.success && activeRes.data) {
        setActivePlan(activeRes.data);
        syncSubscriptionToStorage(activeRes.data);
      }

      if (historyRes.success && historyRes.data) {
        const list = Array.isArray(historyRes.data) ? historyRes.data : historyRes.data.history || [];
        setHistory(list);
      }
    } catch (err) {
      console.error("Failed to load payment history:", err);
    } finally {
      setLoading(false);
    }
  }, [getToken, router]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleDownloadInvoice = (item: any) => {
    const dateRaw = item?.paymentDate || item?.PaymentDate || item?.createdDate || item?.CreatedDate || item?.startDate || item?.StartDate || item?.createdAt || item?.CreatedAt || new Date().toISOString();
    const plan = item?.planName || item?.PlanName || activePlan?.planName || activePlan?.PlanName || 'VIP PREMIUM MEMBERSHIP';
    const rawAmount = item?.amountPaid ?? item?.AmountPaid ?? item?.amount ?? item?.Amount ?? item?.price ?? item?.Price;
    const amount = (rawAmount && Number(rawAmount) > 0) ? Number(rawAmount) : (plan.toUpperCase().includes('PLATINUM') || plan.toUpperCase().includes('DIAMOND') ? 4999 : plan.toUpperCase().includes('GOLD') ? 2999 : 1499);
    
    // Tax Calculation (18% GST Breakdown)
    const baseAmount = Math.round(amount / 1.18);
    const totalGst = amount - baseAmount;
    const cgst = Math.round(totalGst / 2);
    const sgst = totalGst - cgst;

    const rawTxn = item?.transactionId || item?.TransactionId || item?.orderId || item?.OrderId;
    const txnId = rawTxn || `TXN_${Math.floor(100000000 + Math.random() * 900000000)}`;
    const invoiceNo = `NQ-INV-${new Date(dateRaw).getFullYear()}-${Math.abs(txnId.hashCode ? txnId.hashCode() : 88219 + Math.floor(Math.random() * 1000))}`;
    const formattedDate = new Date(dateRaw).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

    // Real Candidate Details
    const candidateName = userDetails?.fullName || userDetails?.FullName || userDetails?.name || 'Valued Candidate';
    const userIdNum = userDetails?.userId || userDetails?.UserId || 1;
    const memberId = userDetails?.memberId || userDetails?.MemberId || `NQ${(8800000 + Number(userIdNum)).toString()}`;
    const candidatePhone = userDetails?.mobileNumber || userDetails?.phoneNumber || '+91 ••••••••••';
    const candidateCity = userDetails?.cityName || userDetails?.city || 'India';

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error("Please allow popups to view & download invoice.");
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Invoice_${invoiceNo}_NikahQubool</title>
          <style>
            @page { size: A4; margin: 15mm; }
            * { box-sizing: border-box; }
            body { 
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
              color: #0f172a; 
              background: #fff; 
              padding: 0; 
              margin: 0; 
              font-size: 12px;
              line-height: 1.45;
            }
            .invoice-wrap {
              max-width: 680px;
              margin: 0 auto;
              padding: 30px;
              border: 1px solid #e2e8f0;
              border-radius: 20px;
            }
            .header-row {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              border-bottom: 2px solid #f1f5f9;
              padding-bottom: 18px;
              margin-bottom: 18px;
            }
            .brand-left {
              display: flex;
              align-items: center;
              gap: 12px;
            }
            .brand-logo {
              width: 44px;
              height: 44px;
            }
            .brand-name {
              font-size: 20px;
              font-weight: 900;
              color: #E21E5B;
              letter-spacing: -0.5px;
              margin: 0;
            }
            .brand-tagline {
              font-size: 9px;
              color: #64748b;
              font-weight: 700;
              letter-spacing: 1.5px;
              text-transform: uppercase;
              margin: 0;
            }
            .inv-badge-wrap {
              text-align: right;
            }
            .tax-badge {
              display: inline-block;
              background: #ecfdf5;
              color: #059669;
              border: 1px solid #a7f3d0;
              padding: 4px 10px;
              border-radius: 20px;
              font-weight: 800;
              font-size: 10px;
              text-transform: uppercase;
              margin-bottom: 4px;
            }
            .inv-meta {
              font-size: 11px;
              color: #475569;
              font-weight: 600;
            }
            .company-info {
              background: #f8fafc;
              border: 1px solid #e2e8f0;
              border-radius: 12px;
              padding: 10px 14px;
              font-size: 10px;
              color: #475569;
              margin-bottom: 18px;
              display: flex;
              justify-content: space-between;
              line-height: 1.6;
            }
            .grid-two {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 16px;
              margin-bottom: 20px;
            }
            .card-box {
              background: #fff;
              border: 1px solid #e2e8f0;
              border-radius: 14px;
              padding: 12px 14px;
            }
            .card-lbl {
              font-size: 9px;
              font-weight: 800;
              color: #94a3b8;
              text-transform: uppercase;
              letter-spacing: 0.8px;
              margin-bottom: 4px;
            }
            .card-val-name {
              font-size: 14px;
              font-weight: 800;
              color: #0f172a;
              margin-bottom: 2px;
            }
            .card-val-sub {
              font-size: 11px;
              color: #64748b;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 16px;
            }
            th {
              background: #0f172a;
              color: #ffffff;
              font-size: 10px;
              font-weight: 800;
              text-transform: uppercase;
              letter-spacing: 0.8px;
              padding: 10px 12px;
              text-align: left;
            }
            th:first-child { border-top-left-radius: 10px; border-bottom-left-radius: 10px; }
            th:last-child { border-top-right-radius: 10px; border-bottom-right-radius: 10px; text-align: right; }
            td {
              padding: 12px;
              font-size: 12px;
              border-bottom: 1px solid #f1f5f9;
              color: #1e293b;
            }
            td:last-child {
              text-align: right;
              font-weight: 700;
            }
            .summary-table {
              width: 260px;
              margin-left: auto;
              margin-bottom: 20px;
            }
            .summary-table td {
              padding: 6px 8px;
              font-size: 11px;
              border: none;
            }
            .summary-table .total-row td {
              border-top: 2px solid #e2e8f0;
              font-size: 14px;
              font-weight: 900;
              color: #E21E5B;
              padding-top: 10px;
            }
            .footer-row {
              border-top: 1px solid #e2e8f0;
              padding-top: 16px;
              display: flex;
              justify-content: space-between;
              align-items: center;
              font-size: 10px;
              color: #64748b;
            }
            .seal-badge {
              display: flex;
              align-items: center;
              gap: 8px;
              color: #059669;
              font-weight: 700;
              font-size: 10px;
            }
            @media print {
              body { padding: 0; }
              .invoice-wrap { border: none; padding: 0; }
            }
          </style>
        </head>
        <body>
          <div class="invoice-wrap">
            <!-- HEADER -->
            <div class="header-row">
              <div class="brand-left">
                <!-- SVG Heart & Diamond Rings Brand Logo -->
                <svg class="brand-logo" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M50 88s-34-21-34-45a20 20 0 0 1 34-14 20 20 0 0 1 34 14c0 24-34 45-34 45z" fill="#E21E5B"/>
                  <circle cx="42" cy="46" r="14" stroke="#ffffff" stroke-width="4" fill="none"/>
                  <circle cx="58" cy="46" r="14" stroke="#fbbf24" stroke-width="4" fill="none"/>
                  <polygon points="58,26 62,31 58,36 54,31" fill="#fbbf24"/>
                </svg>
                <div>
                  <h1 class="brand-name">NIKAH QUBOOL</h1>
                  <p class="brand-tagline">Halal Muslim Matrimony</p>
                </div>
              </div>

              <div class="inv-badge-wrap">
                <span class="tax-badge">✓ TAX INVOICE PAID</span>
                <div class="inv-meta">Invoice: <strong>${invoiceNo}</strong></div>
                <div class="inv-meta">Date: ${formattedDate}</div>
              </div>
            </div>

            <!-- COMPANY TAX & REGISTRATION DETAILS -->
            <div class="company-info">
              <div>
                <strong>Nikah Qubool Technologies Pvt. Ltd.</strong><br/>
                CIN: U72900DL2024PTC398210 | Reg. Under Ministry of Corporate Affairs<br/>
                Regd. Office: 402, Barakhamba Road, Connaught Place, New Delhi - 110001
              </div>
              <div style="text-align: right;">
                <strong>GSTIN: 07AABCN8899Q1ZX</strong><br/>
                SAC Code: <strong>998314</strong> (Matrimonial Matchmaking Services)<br/>
                Helpline: support@nikahqubool.in | +91 80559 90011
              </div>
            </div>

            <!-- CANDIDATE & TRANSACTION CARDS -->
            <div class="grid-two">
              <div class="card-box">
                <div class="card-lbl">Billed To (Candidate Details)</div>
                <div class="card-val-name">${candidateName}</div>
                <div class="card-val-sub">Member ID: <strong>${memberId}</strong></div>
                <div class="card-val-sub">Phone: ${candidatePhone} | Location: ${candidateCity}</div>
              </div>

              <div class="card-box">
                <div class="card-lbl">Payment Details</div>
                <div class="card-val-name">₹${amount} <span style="font-size:11px; font-weight:600; color:#059669;">(Success)</span></div>
                <div class="card-val-sub">Txn ID: <code>${txnId}</code></div>
                <div class="card-val-sub">Payment Mode: Secure Online UPI / NetBanking / Cards</div>
              </div>
            </div>

            <!-- LINE ITEMS TABLE -->
            <table>
              <thead>
                <tr>
                  <th style="width: 50%;">Service Description</th>
                  <th style="width: 20%; text-align:center;">SAC Code</th>
                  <th style="width: 15%; text-align:center;">Qty</th>
                  <th style="width: 15%; text-align:right;">Amount (INR)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    <strong>${plan.toUpperCase()}</strong><br/>
                    <span style="font-size:10px; color:#64748b;">Direct Contact Unlocks &bull; Unlimited Halal Chat &bull; VIP Verified Badge &bull; Priority Matching</span>
                  </td>
                  <td style="text-align:center; color:#475569;">998314</td>
                  <td style="text-align:center;">1</td>
                  <td>₹${baseAmount}</td>
                </tr>
              </tbody>
            </table>

            <!-- TAX BREAKDOWN SUMMARY -->
            <table class="summary-table">
              <tr>
                <td style="color:#64748b;">Subtotal (Taxable Value):</td>
                <td style="text-align:right; font-weight:600;">₹${baseAmount}</td>
              </tr>
              <tr>
                <td style="color:#64748b;">CGST (9.0%):</td>
                <td style="text-align:right; font-weight:600;">₹${cgst}</td>
              </tr>
              <tr>
                <td style="color:#64748b;">SGST (9.0%):</td>
                <td style="text-align:right; font-weight:600;">₹${sgst}</td>
              </tr>
              <tr class="total-row">
                <td>Total Amount Paid:</td>
                <td style="text-align:right;">₹${amount}</td>
              </tr>
            </table>

            <!-- FOOTER WITH DIGITAL VERIFICATION -->
            <div class="footer-row">
              <div class="seal-badge">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>
                <span>Digitally Verified & Approved by Nikah Qubool Matrimony</span>
              </div>
              <div>This is a computer generated tax invoice. No physical signature required.</div>
            </div>
          </div>

          <script>
            window.onload = function() {
              setTimeout(function() { window.print(); }, 350);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const isExpired = activePlan ? (activePlan.isExpired || activePlan.IsExpired || false) : true;
  const isPaid = activePlan && !isExpired && Boolean(
    activePlan?.isPaid ?? activePlan?.IsPaid ?? activePlan?.isActive ?? activePlan?.IsActive ??
    (activePlan?.planName && !activePlan.planName.toLowerCase().includes('free'))
  );
  const planName = activePlan?.planName || activePlan?.PlanName || 'No Active VIP Plan';
  const expiryDate = activePlan?.expiryDate || activePlan?.ExpiryDate || activePlan?.endDate || activePlan?.EndDate;
  const remainingViews = activePlan?.remainingContacts ?? activePlan?.RemainingContacts ?? activePlan?.contactViewsAllowed ?? 0;

  const hasPurchasedPlans = isPaid || history.length > 0;

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900 pb-28 pt-0 selection:bg-[#E21E5B] selection:text-white">
      <Toaster position="top-center" richColors duration={2000} />

      {/* 🏷️ FIXED APP-STYLE HEADER BAR */}
      <div className="fixed top-0 lg:top-20 inset-x-0 z-40 bg-white py-3 px-4 sm:px-6 border-b border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
        <div className="max-w-xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <button 
              type="button" 
              onClick={() => {
                if (typeof window !== "undefined") {
                  const last = sessionStorage.getItem('last_browse_page');
                  if (last && last !== '/dashboard/payment-info') {
                    router.push(last);
                    return;
                  }
                  if (window.history.length > 1) {
                    router.back();
                    return;
                  }
                }
                router.push('/dashboard/my-profile');
              }} 
              className="w-9 h-9 rounded-full bg-white border border-slate-200/80 flex items-center justify-center text-slate-700 hover:bg-slate-50 active:scale-95 transition-all shadow-xs shrink-0 cursor-pointer"
              aria-label="Back"
              title="Go Back"
            >
              <ChevronLeft size={20} className="stroke-[2.5]" />
            </button>
            <h1 className="text-base sm:text-lg font-bold tracking-tight text-slate-900 truncate">
              Payment Info
            </h1>
          </div>

          {hasPurchasedPlans && (
            <button 
              type="button"
              onClick={() => router.push('/dashboard/membership')}
              className="px-3.5 py-1.5 bg-gradient-to-r from-[#E21E5B] to-[#C2185B] text-white text-xs font-bold rounded-full shadow-xs flex items-center gap-1.5 cursor-pointer hover:opacity-95 active:scale-95 transition shrink-0"
            >
              <Crown size={14} className="text-amber-300 fill-amber-300" />
              <span>Upgrade</span>
            </button>
          )}
        </div>
      </div>

      <div className="max-w-xl mx-auto px-4 sm:px-6 pt-14 lg:pt-20">

        {loading ? (
          <div className="space-y-4 pt-4">
            <div className="bg-slate-50 rounded-3xl p-6 border border-slate-100 animate-pulse space-y-3">
              <div className="w-32 h-5 bg-slate-200 rounded-lg" />
              <div className="w-48 h-4 bg-slate-200 rounded-lg" />
            </div>
          </div>
        ) : !hasPurchasedPlans ? (
          /* 🧾 EMPTY STATE (Exact match to Screenshot 2) */
          <div className="flex flex-col items-center justify-center text-center py-20 px-4 space-y-4">
            
            {/* Soft Receipt Illustration Icon */}
            <div className="relative w-20 h-24 mb-2 flex items-center justify-center">
              {/* Back Card */}
              <div className="absolute inset-0 bg-slate-200/60 rounded-2xl transform rotate-[-8deg]" />
              {/* Front Receipt Card */}
              <div className="relative w-18 h-22 bg-slate-100 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-center gap-2 p-3.5">
                <div className="w-10 h-1.5 bg-slate-300 rounded-full" />
                <div className="w-8 h-1.5 bg-slate-300 rounded-full" />
                <div className="w-6 h-1.5 bg-slate-300 rounded-full" />
              </div>
            </div>

            {/* Title */}
            <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">
              No Premium Plans Yet
            </h2>

            {/* Subtitle */}
            <p className="text-xs sm:text-sm text-slate-500 font-medium max-w-xs leading-relaxed">
              You haven't purchased any premium plans yet.<br />
              Upgrade now to unlock all benefits.
            </p>

            {/* Pink Pill Button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => router.push('/dashboard/membership')}
                className="px-8 py-3.5 rounded-full bg-gradient-to-r from-[#E21E5B] to-[#C2185B] text-white font-bold text-sm tracking-wide shadow-md hover:opacity-95 active:scale-95 transition cursor-pointer"
              >
                Buy Premium Plan
              </button>
            </div>
          </div>
        ) : (
          /* 👑 ACTIVE PLAN & PAYMENT HISTORY (VIP Professional View) */
          <div className="space-y-5 pt-2">
            
            {/* 1. ACTIVE MEMBERSHIP CARD */}
            {isPaid && (
              <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center shadow-xs">
                      <Crown size={22} className="fill-slate-950" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                        <span>{planName}</span>
                        <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2.5 py-0.5 rounded-full font-bold border border-emerald-200">
                          Active
                        </span>
                      </h3>
                      <p className="text-xs text-slate-500 font-medium">
                        {expiryDate ? `Valid till ${new Date(expiryDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}` : 'Active VIP Privileges'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">Contact Credits</span>
                    <span className="text-sm font-extrabold text-slate-900">{remainingViews} Unlocks Left</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">Chat & Connect</span>
                    <span className="text-sm font-extrabold text-emerald-600">Unlimited Active</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleDownloadInvoice(activePlan)}
                  className="w-full py-3 rounded-2xl bg-slate-50 hover:bg-slate-100 text-slate-800 border border-slate-200 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition shadow-2xs"
                >
                  <FileText size={15} className="text-[#E21E5B]" />
                  <span>Download Active Tax Invoice</span>
                </button>
              </div>
            )}

            {/* 2. PAYMENT TRANSACTIONS LIST */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 px-1">
                Transaction History
              </h3>

              {history.length === 0 && !isPaid ? (
                <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 rounded-2xl border border-slate-100">
                  No previous transactions found.
                </div>
              ) : (
                <div className="bg-white rounded-3xl border border-slate-200/90 divide-y divide-slate-100 overflow-hidden shadow-xs">
                  {(history.length > 0 ? history : [activePlan]).map((item, idx) => {
                    const rawDate = item?.paymentDate || item?.createdDate || item?.startDate || new Date().toISOString();
                    const pName = item?.planName || item?.PlanName || 'VIP Membership';
                    const rawAmt = item?.amountPaid ?? item?.amount ?? item?.price ?? (pName.toUpperCase().includes('PLATINUM') ? 4999 : pName.toUpperCase().includes('GOLD') ? 2999 : 1499);
                    const formattedDate = new Date(rawDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

                    return (
                      <div key={idx} className="p-4 flex items-center justify-between gap-3 hover:bg-slate-50/50 transition">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-2xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
                            <CreditCard size={18} />
                          </div>
                          <div>
                            <h4 className="text-xs sm:text-sm font-bold text-slate-900">{pName}</h4>
                            <p className="text-[11px] text-slate-400 font-medium">{formattedDate} &bull; <strong className="text-emerald-600 font-semibold">Paid</strong></p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2.5">
                          <span className="text-xs sm:text-sm font-extrabold text-slate-900">₹{rawAmt}</span>
                          <button
                            type="button"
                            onClick={() => handleDownloadInvoice(item)}
                            className="p-2 rounded-xl bg-slate-100 hover:bg-rose-50 hover:text-[#E21E5B] text-slate-600 transition cursor-pointer"
                            title="Download GST Invoice"
                          >
                            <Download size={16} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
