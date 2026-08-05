"use client";
import React, { useState } from 'react';
import { 
  Lock, ShieldAlert, UserX, ArrowLeft, 
  Eye, EyeOff, Save, Trash2, AlertTriangle, CheckCircle
} from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';

export default function AccountSettingsPage() {
  const [showPass, setShowPass] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeactivating, setIsDeactivating] = useState(false);

  // Password Update Logic
  const handlePasswordUpdate = () => {
    setIsUpdating(true);
    setTimeout(() => {
      setIsUpdating(false);
      alert("Password updated successfully!");
    }, 1500);
  };

  const SettingInput = ({ label, placeholder, type = "text" }: any) => (
    <div className="space-y-2">
      <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">{label}</label>
      <div className="relative">
        <input 
          type={type === 'password' && showPass ? 'text' : type}
          placeholder={placeholder}
          className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 text-sm font-bold text-slate-700 focus:bg-white focus:border-[#D2136E] focus:ring-4 focus:ring-pink-50 outline-none transition-all"
        />
        {type === 'password' && (
          <button 
            onClick={() => setShowPass(!showPass)}
            className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#D2136E]"
          >
            {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FDF2F5] pb-20">
      <div className="max-w-4xl mx-auto px-4 py-10">
        
        {/* Header */}
        <div className="flex items-center gap-4 mb-10">
          <Link href="/dashboard" className="p-3 bg-white rounded-2xl border border-pink-50 text-slate-400 hover:text-[#D2136E] transition-all shadow-sm">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-slate-800 italic uppercase tracking-tighter">Account Settings</h1>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-tight">Manage your security and account status</p>
          </div>
        </div>

        <div className="space-y-8">
          
          {/* --- CHANGE PASSWORD SECTION --- */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-[35px] p-8 md:p-10 border border-pink-50 shadow-xl shadow-pink-100/20"
          >
            <div className="flex items-center gap-4 mb-8 border-b border-gray-50 pb-6">
              <div className="p-3 bg-pink-50 rounded-2xl text-[#D2136E]">
                <Lock size={22} />
              </div>
              <h2 className="text-xl font-black text-slate-800 uppercase italic tracking-tighter">Change Password</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <SettingInput label="Current Password" type="password" placeholder="••••••••" />
              </div>
              <SettingInput label="New Password" type="password" placeholder="••••••••" />
              <SettingInput label="Confirm New Password" type="password" placeholder="••••••••" />
            </div>

            <div className="mt-8 flex justify-end">
              <button 
                onClick={handlePasswordUpdate}
                disabled={isUpdating}
                className="flex items-center gap-2 bg-[#D2136E] text-white px-10 py-4 rounded-2xl font-black text-sm uppercase italic shadow-lg shadow-pink-200 hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
              >
                {isUpdating ? <div className="w-5 h-5 border-2 border-white border-t-transparent animate-spin rounded-full" /> : <Save size={18} />}
                Update Password
              </button>
            </div>
          </motion.div>

          {/* --- DANGER ZONE / DEACTIVATE --- */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-[35px] p-8 md:p-10 border border-red-50 shadow-xl shadow-red-100/10"
          >
            <div className="flex items-center gap-4 mb-8 border-b border-gray-50 pb-6">
              <div className="p-3 bg-red-50 rounded-2xl text-red-500">
                <ShieldAlert size={22} />
              </div>
              <h2 className="text-xl font-black text-slate-800 uppercase italic tracking-tighter">Danger Zone</h2>
            </div>

            <div className="space-y-6">
              <div className="bg-red-50/50 rounded-3xl p-6 border border-red-100">
                <div className="flex gap-4">
                  <div className="shrink-0 mt-1">
                    <AlertTriangle className="text-red-500" size={24} />
                  </div>
                  <div>
                    <h3 className="font-black text-slate-800 text-sm uppercase italic tracking-tight mb-1">Deactivate Account</h3>
                    <p className="text-xs font-bold text-slate-500 leading-relaxed">
                      Deactivating your account will temporarily hide your profile from all members. You can re-activate it anytime by logging back in.
                    </p>
                  </div>
                </div>
                <div className="mt-6 flex justify-end">
                  <button 
                    onClick={() => setIsDeactivating(true)}
                    className="flex items-center gap-2 bg-white text-red-500 border-2 border-red-100 px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-red-50 transition-all"
                  >
                    <UserX size={16} /> Deactivate Now
                  </button>
                </div>
              </div>

              <div className="bg-slate-50 rounded-3xl p-6 border border-slate-100">
                <div className="flex gap-4">
                  <div className="shrink-0 mt-1 text-slate-400">
                    <Trash2 size={24} />
                  </div>
                  <div>
                    <h3 className="font-black text-slate-800 text-sm uppercase italic tracking-tight mb-1">Delete Account Permanently</h3>
                    <p className="text-xs font-bold text-slate-500 leading-relaxed">
                      This action is irreversible. All your data, photos, and chat history will be wiped from our servers.
                    </p>
                  </div>
                </div>
                <div className="mt-6 flex justify-end">
                  <button className="text-slate-400 font-black text-[10px] uppercase tracking-widest hover:text-red-600 transition-colors">
                    Delete My Account
                  </button>
                </div>
              </div>
            </div>
          </motion.div>

        </div>
      </div>

      {/* --- DEACTIVATION CONFIRMATION MODAL --- */}
      {isDeactivating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-[40px] p-8 md:p-12 max-w-md w-full shadow-2xl text-center space-y-6"
          >
            <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto text-red-500">
              <UserX size={40} />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-black text-slate-800 uppercase italic italic tracking-tighter">Are you sure?</h2>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-tight px-4">
                Your profile will be hidden until you login again.
              </p>
            </div>
            <div className="flex flex-col gap-3">
              <button 
                onClick={() => setIsDeactivating(false)}
                className="w-full bg-slate-800 text-white py-5 rounded-2xl font-black text-xs uppercase italic tracking-widest hover:bg-slate-900 transition-all"
              >
                Yes, Deactivate
              </button>
              <button 
                onClick={() => setIsDeactivating(false)}
                className="w-full bg-white text-slate-400 py-5 rounded-2xl font-black text-xs uppercase italic tracking-widest hover:text-slate-600 transition-all"
              >
                No, Keep my profile
              </button>
            </div>
          </motion.div>
        </div>
      )}

    </div>
  );
}