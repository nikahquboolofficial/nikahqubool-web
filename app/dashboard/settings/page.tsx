"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { 
  Lock, ShieldAlert, UserX, ArrowLeft, 
  Eye, EyeOff, Save, Trash2, AlertTriangle, CheckCircle2, Shield, Heart, Ban, Loader2, Crown
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast, Toaster } from 'sonner';
import { unblockUserApiCall } from '@/lib/api';

export default function AccountSettingsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = searchParams.get('tab') || 'security';

  const [activeTab, setActiveTab] = useState(initialTab);
  const [showPass, setShowPass] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeactivating, setIsDeactivating] = useState(false);
  const [deactivateReason, setDeactivateReason] = useState('Found Match on Pakiza Rishte');
  const [blockedUsers, setBlockedUsers] = useState<any[]>([]);
  const [unblockingId, setUnblockingId] = useState<number | null>(null);

  const getCookie = (name: string): string | null => {
    if (typeof document === "undefined") return null;
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    return parts.length === 2 ? parts.pop()?.split(';').shift() ?? null : null;
  };

  const getToken = useCallback((): string | null => getCookie("user_token"), []);

  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam) setActiveTab(tabParam);
  }, [searchParams]);

  const handlePasswordUpdate = () => {
    setIsUpdating(true);
    setTimeout(() => {
      setIsUpdating(false);
      toast.success("Password updated successfully!");
    }, 1200);
  };

  const handleDeactivateAccount = () => {
    toast.success("Account deactivated successfully. Wishing you a blessed life!");
    setIsDeactivating(false);
    setTimeout(() => {
      document.cookie = "user_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      localStorage.clear();
      sessionStorage.clear();
      router.push('/');
    }, 1500);
  };

  const handleUnblock = async (targetUserId: number) => {
    const token = getToken();
    setUnblockingId(targetUserId);
    const res = await unblockUserApiCall(targetUserId, token);
    setUnblockingId(null);

    if (res.success) {
      toast.success(res.message || "User unblocked");
      setBlockedUsers((prev) => prev.filter((u) => u.userId !== targetUserId));
    } else {
      toast.error(res.message || "Failed to unblock user");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-28 pt-4 selection:bg-[#870c3f] selection:text-white">
      <Toaster position="top-center" richColors duration={2000} />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        
        {/* HEADER */}
        <div className="bg-white rounded-3xl p-5 border-2 border-rose-100 shadow-xl flex items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <button 
              type="button"
              onClick={() => router.push('/dashboard')} 
              className="p-2.5 rounded-2xl bg-rose-50 hover:bg-rose-100 text-[#870c3f] border-2 border-rose-200 transition-all cursor-pointer shadow-xs"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-lg sm:text-xl font-serif font-extrabold uppercase text-slate-900 tracking-tight">
                Account & Privacy Settings
              </h1>
              <p className="text-xs font-semibold text-slate-500">
                Manage your security, blocked members, and profile status
              </p>
            </div>
          </div>
        </div>

        {/* TAB NAVIGATION BAR */}
        <div className="bg-white rounded-3xl p-2 border-2 border-rose-100 shadow-md grid grid-cols-3 gap-2 text-center text-xs font-black uppercase">
          <button
            type="button"
            onClick={() => setActiveTab('security')}
            className={`py-3 px-4 rounded-2xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'security'
                ? 'bg-gradient-to-r from-[#870c3f] via-[#9e0f4a] to-[#870c3f] text-white shadow-md'
                : 'bg-rose-50/50 hover:bg-rose-100/60 text-slate-700'
            }`}
          >
            <Lock size={16} /> Security
          </button>
          
          <button
            type="button"
            onClick={() => setActiveTab('blocked')}
            className={`py-3 px-4 rounded-2xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'blocked'
                ? 'bg-gradient-to-r from-[#870c3f] via-[#9e0f4a] to-[#870c3f] text-white shadow-md'
                : 'bg-rose-50/50 hover:bg-rose-100/60 text-slate-700'
            }`}
          >
            <Ban size={16} /> Blocked List
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('deactivate')}
            className={`py-3 px-4 rounded-2xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'deactivate'
                ? 'bg-gradient-to-r from-[#870c3f] via-[#9e0f4a] to-[#870c3f] text-white shadow-md'
                : 'bg-rose-50/50 hover:bg-rose-100/60 text-slate-700'
            }`}
          >
            <UserX size={16} /> Deactivate
          </button>
        </div>

        {/* 1. SECURITY & PASSWORD SECTION */}
        {activeTab === 'security' && (
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl p-6 md:p-8 border-2 border-rose-100 shadow-xl space-y-6"
          >
            <div className="flex items-center gap-3 border-b-2 border-slate-100 pb-4">
              <div className="p-2.5 bg-rose-50 rounded-2xl text-[#870c3f] border border-rose-200">
                <Lock size={22} />
              </div>
              <div>
                <h2 className="text-base font-serif font-extrabold uppercase text-slate-900">Change Password</h2>
                <p className="text-xs font-semibold text-slate-500">Update your account login password</p>
              </div>
            </div>

            <div className="space-y-4 max-w-md">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Current Password</label>
                <div className="relative">
                  <input 
                    type={showPass ? "text" : "password"} 
                    placeholder="••••••••" 
                    className="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl px-4 py-3 text-xs font-bold text-slate-900 focus:border-[#870c3f] outline-none" 
                  />
                  <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">New Password</label>
                <input 
                  type="password" 
                  placeholder="••••••••" 
                  className="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl px-4 py-3 text-xs font-bold text-slate-900 focus:border-[#870c3f] outline-none" 
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Confirm New Password</label>
                <input 
                  type="password" 
                  placeholder="••••••••" 
                  className="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl px-4 py-3 text-xs font-bold text-slate-900 focus:border-[#870c3f] outline-none" 
                />
              </div>

              <div className="pt-2">
                <button 
                  type="button" 
                  onClick={handlePasswordUpdate} 
                  disabled={isUpdating} 
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#870c3f] via-[#9e0f4a] to-[#870c3f] text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-rose-900/20 cursor-pointer border border-rose-300/30 flex items-center justify-center gap-2"
                >
                  {isUpdating ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  <span>Update Password</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* 2. BLOCKED USERS SECTION */}
        {activeTab === 'blocked' && (
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl p-6 md:p-8 border-2 border-rose-100 shadow-xl space-y-6"
          >
            <div className="flex items-center gap-3 border-b-2 border-slate-100 pb-4">
              <div className="p-2.5 bg-rose-50 rounded-2xl text-[#870c3f] border border-rose-200">
                <Ban size={22} />
              </div>
              <div>
                <h2 className="text-base font-serif font-extrabold uppercase text-slate-900">Blocked Members</h2>
                <p className="text-xs font-semibold text-slate-500">Manage members you have blocked</p>
              </div>
            </div>

            {blockedUsers.length === 0 ? (
              <div className="text-center py-12 space-y-3">
                <div className="w-14 h-14 rounded-full bg-rose-50 text-[#870c3f] flex items-center justify-center mx-auto border-2 border-rose-200">
                  <Shield size={28} />
                </div>
                <h3 className="text-sm font-serif font-extrabold uppercase text-slate-900">No Blocked Members</h3>
                <p className="text-xs font-semibold text-slate-500 max-w-xs mx-auto">
                  You have not blocked any members yet.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {blockedUsers.map((user) => (
                  <div key={user.userId} className="p-4 bg-slate-50 rounded-2xl border-2 border-slate-200 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <img src={user.photoUrl || '/placeholder.png'} alt={user.fullName} className="w-11 h-11 rounded-full object-cover border-2 border-rose-200" onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.png'; }} />
                      <div>
                        <h4 className="text-xs font-black text-slate-900 uppercase">{user.fullName || 'Member'}</h4>
                        <span className="text-[10px] text-slate-500 font-semibold">ID: PR-{user.userId}</span>
                      </div>
                    </div>
                    <button 
                      type="button" 
                      onClick={() => handleUnblock(user.userId)} 
                      disabled={unblockingId === user.userId} 
                      className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-black uppercase cursor-pointer"
                    >
                      {unblockingId === user.userId ? <Loader2 size={14} className="animate-spin" /> : "Unblock"}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* 3. DEACTIVATE ACCOUNT SECTION (RISHTA FIXED / MARRIED) */}
        {activeTab === 'deactivate' && (
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl p-6 md:p-8 border-2 border-rose-100 shadow-xl space-y-6"
          >
            <div className="flex items-center gap-3 border-b-2 border-slate-100 pb-4">
              <div className="p-2.5 bg-rose-50 rounded-2xl text-[#870c3f] border border-rose-200">
                <UserX size={22} />
              </div>
              <div>
                <h2 className="text-base font-serif font-extrabold uppercase text-slate-900">Deactivate Profile</h2>
                <p className="text-xs font-semibold text-slate-500">Temporarily or permanently hide your matrimony profile</p>
              </div>
            </div>

            <div className="bg-rose-50/60 rounded-3xl p-6 border-2 border-rose-200 space-y-4">
              <div className="flex items-start gap-3">
                <Heart className="text-[#870c3f] flex-shrink-0 mt-0.5" size={24} />
                <div>
                  <h3 className="font-serif font-extrabold text-sm uppercase text-slate-900">Rishta Fixed / Deactivating Account?</h3>
                  <p className="text-xs font-semibold text-slate-600 mt-1 leading-relaxed">
                    If your rishta has been fixed or you are married, congratulations! Deactivating your profile will hide it from all searches and members immediately.
                  </p>
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Reason for Deactivation</label>
                <select 
                  value={deactivateReason}
                  onChange={(e) => setDeactivateReason(e.target.value)}
                  className="w-full bg-white border-2 border-rose-200 rounded-2xl px-4 py-3 text-xs font-bold text-slate-900 outline-none"
                >
                  <option value="Found Match on Pakiza Rishte">💍 Found Match on Pakiza Rishte (Alhamdulillah)</option>
                  <option value="Match Fixed Elsewhere">💍 Match Fixed Elsewhere</option>
                  <option value="Taking a Break">⏸ Taking a Break</option>
                  <option value="Other Reason">Other Reason</option>
                </select>
              </div>

              <div className="pt-2">
                <button 
                  type="button" 
                  onClick={() => setIsDeactivating(true)}
                  className="px-6 py-3 rounded-2xl bg-[#870c3f] hover:bg-[#9e0f4a] text-white font-black text-xs uppercase tracking-wider shadow-md cursor-pointer border border-rose-300/30"
                >
                  Deactivate My Profile Now
                </button>
              </div>
            </div>
          </motion.div>
        )}

      </div>

      {/* DEACTIVATION MODAL */}
      <AnimatePresence>
        {isDeactivating && (
          <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white rounded-3xl max-w-sm w-full p-7 text-center shadow-2xl border-2 border-rose-100 text-slate-800 space-y-5">
              <div className="w-16 h-16 bg-rose-50 text-[#870c3f] rounded-full flex items-center justify-center mx-auto border-2 border-rose-200 shadow-xs">
                <Heart size={32} className="fill-[#870c3f]" />
              </div>
              <div>
                <h3 className="text-lg font-serif font-extrabold uppercase text-slate-900">Deactivate Profile?</h3>
                <p className="text-slate-500 text-xs font-semibold mt-1 leading-relaxed">
                  Your profile will be hidden from all members immediately. You can reactivate anytime by logging back in.
                </p>
              </div>
              <div className="flex flex-col gap-2.5 pt-1">
                <button type="button" onClick={handleDeactivateAccount} className="w-full bg-gradient-to-r from-[#870c3f] via-[#9e0f4a] to-[#870c3f] hover:brightness-110 text-white py-3.5 rounded-2xl font-black text-xs uppercase tracking-wider shadow-lg shadow-rose-900/20 cursor-pointer border border-rose-300/30">Yes, Deactivate Profile</button>
                <button type="button" onClick={() => setIsDeactivating(false)} className="w-full bg-slate-100 text-slate-600 hover:bg-slate-200 py-3 rounded-2xl font-bold text-xs uppercase cursor-pointer">Cancel</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}