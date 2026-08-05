"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { 
  CheckCircle2, Star, Lock, Send, Clock, UserCheck, Loader2, Check, X, MessageCircle, Crown, Image as ImageIcon, MapPin, Briefcase, Bookmark
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast, Toaster } from 'sonner';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "https://crm.altawafumrah.com/api/Dashboard";

export default function UltimateCleanDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('best-matches');
  const [profiles, setProfiles] = useState<any[]>([]);
  
  // Auth & Session States
  const [currentUser, setCurrentUser] = useState<{ userId: number | null; token: string | null }>({
    userId: null,
    token: null,
  });

  // Pagination State
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [fetchingMore, setFetchingMore] = useState(false);

  const [tabCounts, setTabCounts] = useState<any>({ 
    matchesCount: 0, 
    requestsCount: 0, 
    acceptedCount: 0, 
    photosCount: 0, 
    visitorsCount: 0,
    shortlistCount: 0
  });

  const [actionState, setActionState] = useState<{ userId: number; type: string } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);

  // 🔒 Helper to read cookie values by name
  const getCookie = (name: string) => {
    if (typeof window === "undefined") return null;
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()?.split(';').shift();
    return null;
  };

  // 🔒 Token Payload Decoder to extract UserId safely from JWT Token inside Cookie
  const getUserIdFromToken = (token: string): number | null => {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const userIdStr = payload["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"] || payload.sub || payload.nameid;
      return userIdStr ? parseInt(userIdStr, 10) : null;
    } catch {
      return null;
    }
  };

  // 🔒 Session Utility: Get Token and UserId dynamically from Cookies
  const getAuthDetails = useCallback(() => {
    if (typeof window === "undefined") return { token: null, userId: null };

    const token = getCookie("user_token");
    if (!token) return { token: null, userId: null };

    const userId = getUserIdFromToken(token);

    return {
      token: token || null,
      userId: userId || null
    };
  }, []);

  // Sync Auth Details on Component Mount
  useEffect(() => {
    const { token, userId } = getAuthDetails();
    if (!token || !userId) {
      toast.error("Session expired. Please login again.");
      router.push('/');
      return;
    }
    setCurrentUser({ token, userId });
  }, [getAuthDetails, router]);

  // Intersection Observer Ref for Infinite Scroll
  const observerRef = useRef<IntersectionObserver | null>(null);
  const lastElementRef = useCallback((node: HTMLDivElement | null) => {
    if (loading || fetchingMore) return;
    if (observerRef.current) observerRef.current.disconnect();

    observerRef.current = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasMore) {
        setPage((prevPage) => prevPage + 1);
      }
    });

    if (node) observerRef.current.observe(node);
  }, [loading, fetchingMore, hasMore]);

  // 🔒 Authorized Safe Fetch Helper
  const safeFetchJson = useCallback(async (url: string, options: RequestInit = {}) => {
    const { token } = getAuthDetails();

    if (!token) {
      router.push('/');
      throw new Error("Unauthorized: Token missing");
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...(options.headers as Record<string, string> || {})
    };

    const res = await fetch(url, { ...options, headers });

    if (res.status === 401) {
      toast.error("Session expired. Login again.");
      router.push('/');
      throw new Error("401 Unauthorized");
    }

    if (!res.ok) {
      let errDetails = "";
      try {
        const errorJson = await res.clone().json();
        errDetails = errorJson.message || errorJson.title || JSON.stringify(errorJson);
      } catch {
        try {
          errDetails = await res.clone().text();
        } catch {
          errDetails = res.statusText;
        }
      }
      throw new Error(`Server Status ${res.status}: ${errDetails || res.statusText}`);
    }

    const contentType = res.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      return await res.json();
    }
    
    const textData = await res.text();
    return textData ? JSON.parse(textData) : {};
  }, [getAuthDetails, router]);

  // Fetch Dashboard Data
  const fetchDashboardData = useCallback(async (pageNumber: number, isTabSwitch: boolean = false) => {
    const { token, userId } = getAuthDetails();
    if (!token || !userId) return;

    if (isTabSwitch) {
      setLoading(true);
      setProfiles([]);
    } else {
      setFetchingMore(true);
    }

    setErrorMessage(null);

    try {
      const url = `${API_BASE}/get-dashboard?currentUserId=${userId}&activeTab=${activeTab}&pageNumber=${pageNumber}&pageSize=12`;
      const result = await safeFetchJson(url);
      const resData = result?.data || result;

      if (resData) {
        const rawProfiles = resData.profiles || resData.Profiles || [];
        
        const normalizedProfiles = rawProfiles.map((p: any) => ({
          userId: p.userId ?? p.UserId,
          fullName: p.fullName ?? p.FullName ?? 'User',
          age: p.age ?? p.Age ?? 25,
          currentStateId: p.currentStateId ?? p.CurrentStateId ?? '',
          currentCityId: p.currentCityId ?? p.CurrentCityId ?? '',
          stateName: p.stateName ?? p.StateName ?? p.state ?? p.State ?? '',
          sect: p.sect ?? p.Sect ?? '',
          profession: p.profession ?? p.Profession ?? p.occupation ?? p.Occupation ?? '',
          isVerified: p.isVerified ?? p.IsVerified ?? false,
          photoUrl: p.photoUrl ?? p.PhotoUrl ?? '',
          photoPrivacy: p.photoPrivacy ?? p.PhotoPrivacy ?? 'All Members',
          interestStatus: p.interestStatus ?? p.InterestStatus ?? 'None',
          isShortlisted: p.isShortlisted ?? p.IsShortlisted ?? false,
          hasRequestedPhoto: p.hasRequestedPhoto ?? p.HasRequestedPhoto ?? false,
          isPhotoHidden: p.isPhotoHidden ?? p.IsPhotoHidden ?? false,
          isCanChat: p.isCanChat ?? p.IsCanChat ?? false,
          photoRequestStatus: p.photoRequestStatus ?? p.PhotoRequestStatus ?? (p.hasRequestedPhoto || p.HasRequestedPhoto ? 'SentPending' : 'None')
        }));
        
        setProfiles((prev) => {
          if (isTabSwitch) return normalizedProfiles;
          const existingIds = new Set(prev.map(item => item.userId));
          const uniqueNewProfiles = normalizedProfiles.filter((item: { userId: any; }) => !existingIds.has(item.userId));
          return [...prev, ...uniqueNewProfiles];
        });
        
        setHasMore(normalizedProfiles.length === 12);

        const counts = resData.tabCounts || resData.TabCounts || {};
        setTabCounts({
          matchesCount: counts.matchesCount ?? counts.MatchesCount ?? 0,
          requestsCount: counts.requestsCount ?? counts.RequestsCount ?? 0,
          acceptedCount: counts.acceptedCount ?? counts.AcceptedCount ?? 0,
          photosCount: counts.photosCount ?? counts.PhotosCount ?? 0,
          visitorsCount: counts.visitorsCount ?? counts.VisitorsCount ?? 0,
          shortlistCount: counts.shortlistCount ?? counts.ShortlistCount ?? counts.shortlistedCount ?? counts.ShortlistedCount ?? 0,
        });
      } else {
        if (isTabSwitch) setProfiles([]);
        setHasMore(false);
      }
    } catch (err: any) {
      console.error("Dashboard Fetch Error:", err.message);
      if (!err.message.includes("401")) {
        setErrorMessage(err.message);
        toast.error("Dashboard data load hone mein dikkat aayi");
      }
    } finally {
      setLoading(false);
      setFetchingMore(false);
    }
  }, [activeTab, safeFetchJson, getAuthDetails]);

  useEffect(() => {
    if (currentUser.token) {
      setPage(1);
      fetchDashboardData(1, true);
    }
  }, [activeTab, fetchDashboardData, currentUser.token]);

  useEffect(() => {
    if (page > 1 && currentUser.token) {
      fetchDashboardData(page, false);
    }
  }, [page, fetchDashboardData, currentUser.token]);

  // 🔒 Clean Redirection using sessionStorage (No query strings)
  const handleInitiateChat = (profile: any) => {
    if (profile.isCanChat) {
      const chatTargetData = {
        userId: profile.userId,
        fullName: profile.fullName,
        photoUrl: profile.photoUrl || ''
      };
      
      sessionStorage.setItem('active_chat_target', JSON.stringify(chatTargetData));
      router.push('/dashboard/messages');
    } else {
      setShowSubscriptionModal(true);
    }
  };

  const handleInteractionApi = async (receiverUserId: number, interactionType: string, actionStatus: string = 'PENDING') => {
    const { userId } = getAuthDetails();
    if (!userId) return;

    const actionKey = `${interactionType}_${actionStatus}`;
    setActionState({ userId: receiverUserId, type: actionKey });

    const previousProfiles = [...profiles];

    setProfiles(prevProfiles => 
      prevProfiles.map(p => {
        if (p.userId !== receiverUserId) return p;
        const updated = { ...p };
        if (interactionType === 'PHOTO_REQUEST') {
          updated.hasRequestedPhoto = true;
          updated.photoRequestStatus = 'SentPending';
        } else if (interactionType === 'INTEREST') {
          if (actionStatus === 'PENDING') updated.interestStatus = 'SentPending';
          else if (actionStatus === 'ACCEPTED') updated.interestStatus = 'Accepted';
          else if (actionStatus === 'DECLINED') updated.interestStatus = 'Declined';
        } else if (interactionType === 'SHORTLIST') {
          updated.isShortlisted = actionStatus === 'ACTIVE';
        }
        return updated;
      })
    );

    try {
      const res = await safeFetchJson(`${API_BASE}/handle-interaction`, {
        method: 'POST',
        body: JSON.stringify({
          senderUserId: userId,
          receiverUserId,
          interactionType,
          actionStatus
        })
      });

      if (res.success || res.Success) {
        if (interactionType === 'SHORTLIST') {
          setTabCounts((c: any) => ({
            ...c,
            shortlistCount: actionStatus === 'ACTIVE' ? c.shortlistCount + 1 : Math.max(0, c.shortlistCount - 1)
          }));
        }
      } else {
        toast.error(res.message || res.Message || "Action process nahi ho saka.");
        setProfiles(previousProfiles);
      }
    } catch (err: any) {
      console.error("Interaction error:", err.message);
      if (!err.message.includes("401")) {
        toast.error(`Network Error: ${err.message}`);
      }
      setProfiles(previousProfiles);
    } finally {
      setActionState(null);
    }
  };

  const handleProfileClick = async (targetUserId: number) => {
    const { userId } = getAuthDetails();
    if (!userId) return;

    try {
      safeFetchJson(`${API_BASE}/handle-interaction`, {
        method: 'POST',
        body: JSON.stringify({
          senderUserId: userId,
          receiverUserId: targetUserId,
          interactionType: 'VISIT',
          actionStatus: 'COMPLETED'
        })
      }).catch(err => console.error("Visit tracking error:", err));

      router.push(`/profile/${targetUserId}`);
    } catch (err) {
      console.error("Navigation error:", err);
    }
  };

  const tabs = [
    { id: 'best-matches', label: 'Matches', count: tabCounts.matchesCount ?? 0 },
    { id: 'interest-received', label: 'Requests', count: tabCounts.requestsCount ?? 0 },
    { id: 'accepted', label: 'Accepted', count: tabCounts.acceptedCount ?? 0 },
    { id: 'shortlisted', label: 'Shortlist', count: tabCounts.shortlistCount ?? 0 },
    { id: 'visitors', label: 'Visitors', count: tabCounts.visitorsCount ?? 0 },
    { id: 'photo-requests', label: 'Photos', count: tabCounts.photosCount ?? 0 },
  ];

  const renderInteractionButtons = (profile: any) => {
    const isBusy = (actionKey: string) => 
      actionState?.userId === profile.userId && actionState?.type === actionKey;

    const isAnyBusyForUser = actionState?.userId === profile.userId;

    if (activeTab === 'accepted') {
      return (
        <>
          <button 
            onClick={() => handleInitiateChat(profile)}
            className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white py-2.5 rounded-xl flex items-center justify-center transition-all shadow-md active:scale-95 text-xs font-bold"
            title="Start Chat"
          >
            <MessageCircle size={18} className="stroke-[2.5]" />
            <span className="ml-1.5">Chat</span>
          </button>

          <button 
            disabled={isAnyBusyForUser}
            onClick={() => handleInteractionApi(profile.userId, 'SHORTLIST', profile.isShortlisted ? 'REMOVED' : 'ACTIVE')}
            className={`p-2.5 rounded-xl border transition-all active:scale-95 ${
              profile.isShortlisted 
                ? 'bg-slate-900 text-amber-400 border-slate-900 shadow-md ring-2 ring-amber-400/20' 
                : 'bg-pink-50 text-[#D2136E] border-pink-100 hover:bg-pink-100'
            }`}
          >
            {isBusy(profile.isShortlisted ? 'SHORTLIST_REMOVED' : 'SHORTLIST_ACTIVE') ? (
              <Loader2 className="animate-spin" size={16} />
            ) : (
              <Star size={16} className={profile.isShortlisted ? 'fill-amber-400' : ''} />
            )}
          </button>
        </>
      );
    }

    if (activeTab === 'interest-received' || activeTab === 'photo-requests') {
      const type = activeTab === 'interest-received' ? 'INTEREST' : 'PHOTO_REQUEST';
      return (
        <div className="flex items-center gap-2 w-full">
          <button 
            disabled={isAnyBusyForUser}
            onClick={() => handleInteractionApi(profile.userId, type, 'ACCEPTED')}
            className="flex-1 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white py-2.5 rounded-xl flex items-center justify-center gap-1 transition-all shadow-md active:scale-95 text-xs font-bold disabled:opacity-50"
          >
            {isBusy(`${type}_ACCEPTED`) ? <Loader2 className="animate-spin" size={16} /> : <Check size={16} strokeWidth={3} />}
            <span>Accept</span>
          </button>
          
          <button 
            disabled={isAnyBusyForUser}
            onClick={() => handleInteractionApi(profile.userId, type, 'DECLINED')}
            className="flex-1 bg-red-50 text-red-600 border border-red-200 hover:bg-red-600 hover:text-white py-2.5 rounded-xl flex items-center justify-center gap-1 transition-all shadow-sm active:scale-95 text-xs font-bold disabled:opacity-50"
          >
            {isBusy(`${type}_DECLINED`) ? <Loader2 className="animate-spin" size={16} /> : <X size={16} strokeWidth={3} />}
            <span>Decline</span>
          </button>
        </div>
      );
    }

    return (
      <>
        {profile.interestStatus === 'SentPending' ? (
          <button disabled className="flex-1 bg-pink-50 text-[#D2136E] border border-pink-200 py-2.5 rounded-xl flex items-center justify-center gap-1 font-black text-[10px] uppercase tracking-wider opacity-90 cursor-not-allowed">
            <Clock size={12} /> Request Sent
          </button>
        ) : profile.interestStatus === 'Accepted' ? (
          <button 
            onClick={() => handleInitiateChat(profile)}
            className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white py-2.5 rounded-xl flex items-center justify-center transition-all shadow-md active:scale-95 text-xs font-bold"
          >
            <MessageCircle size={18} className="stroke-[2.5]" />
            <span className="ml-1.5">Chat</span>
          </button>
        ) : (
          <button 
            disabled={isAnyBusyForUser}
            onClick={() => handleInteractionApi(profile.userId, 'INTEREST', 'PENDING')}
            className="flex-1 bg-[#D2136E] hover:bg-pink-700 text-white py-2.5 rounded-xl flex items-center justify-center gap-1.5 font-black text-[10px] uppercase tracking-wider transition-all shadow-md active:scale-95 disabled:opacity-50"
          >
            {isBusy('INTEREST_PENDING') ? <Loader2 className="animate-spin" size={14} /> : <Send size={12} />} Send Interest
          </button>
        )}

        <button 
          disabled={isAnyBusyForUser}
          onClick={() => handleInteractionApi(profile.userId, 'SHORTLIST', profile.isShortlisted ? 'REMOVED' : 'ACTIVE')}
          className={`p-2.5 rounded-xl border transition-all active:scale-95 ${
            profile.isShortlisted 
              ? 'bg-slate-900 text-amber-400 border-slate-900 shadow-md ring-2 ring-amber-400/20' 
              : 'bg-pink-50 text-[#D2136E] border-pink-100 hover:bg-pink-100'
          }`}
        >
          {isBusy(profile.isShortlisted ? 'SHORTLIST_REMOVED' : 'SHORTLIST_ACTIVE') ? (
            <Loader2 className="animate-spin" size={16} />
          ) : (
            <Star size={16} className={profile.isShortlisted ? 'fill-amber-400' : ''} />
          )}
        </button>
      </>
    );
  };

  return (
    <div className="min-h-screen bg-[#FDF2F5] pb-24 font-sans text-slate-900 overflow-x-hidden">
      <Toaster position="top-center" richColors />

      {/* TABS HEADER */}
      <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 pt-6">
        <div className="flex items-center gap-2.5 overflow-x-auto no-scrollbar py-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-5 py-3 rounded-2xl whitespace-nowrap font-black text-[10px] sm:text-[11px] uppercase tracking-[0.1em] transition-all border-2 flex-shrink-0 ${
                activeTab === tab.id 
                ? 'bg-[#D2136E] text-white border-[#D2136E] shadow-xl shadow-pink-200' 
                : 'bg-white text-slate-500 border-white hover:border-pink-100 shadow-sm'
              }`}
            >
              {tab.label} <span className="opacity-70 ml-1">({tab.count ?? 0})</span>
            </button>
          ))}
        </div>
      </div>

      {/* DASHBOARD GRID */}
      <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 mt-6">
        {errorMessage && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 font-medium text-xs text-center">
            <strong>Backend Alert:</strong> {errorMessage}
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-[#D2136E]">
            <Loader2 className="animate-spin mb-2" size={36} />
            <span className="font-bold text-xs uppercase tracking-widest">Loading Profiles...</span>
          </div>
        ) : profiles.length === 0 ? (
          <div className="bg-white rounded-[24px] p-12 text-center shadow-sm">
            <UserCheck className="mx-auto text-slate-300 mb-3" size={42} />
            <h3 className="text-slate-600 font-bold uppercase text-xs tracking-wider">No Profiles Found</h3>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
              <AnimatePresence mode="popLayout">
                {profiles.map((profile, idx) => {
                  const isPhotoPending = 
                    profile.hasRequestedPhoto === true ||
                    profile.hasRequestedPhoto === 'true' ||
                    profile.photoRequestStatus === 'SentPending' || 
                    profile.photoRequestStatus === 'PENDING' || 
                    profile.photoRequestStatus === 'Pending';

                  const isLastElement = idx === profiles.length - 1;

                  return (
                    <motion.div 
                      key={`${profile.userId}-${idx}`}
                      ref={isLastElement ? lastElementRef : null}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className="group bg-white rounded-[20px] sm:rounded-[24px] overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-pink-100/60 flex flex-col"
                    >
                      {/* Image Container */}
                      <div className="aspect-[4/4.5] relative overflow-hidden bg-slate-100 cursor-pointer">
                        <img 
                          onClick={() => handleProfileClick(profile.userId)}
                          src={profile.photoUrl || '/placeholder.png'} 
                          alt={profile.fullName || 'Profile'}
                          className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 ${
                            profile.isPhotoHidden ? 'blur-md scale-105' : ''
                          }`}
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/placeholder.png';
                          }}
                        />

                        {profile.isPhotoHidden && (
                          <div className="absolute inset-0 bg-black/40 backdrop-blur-md flex flex-col items-center justify-center p-4 text-center z-10">
                            <Lock size={24} className="text-white mb-2" />
                            <span className="text-white font-black text-[10px] uppercase tracking-wider mb-2.5">Photo Protected</span>
                            
                            <button 
                              disabled={isPhotoPending || actionState?.userId === profile.userId}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleInteractionApi(profile.userId, 'PHOTO_REQUEST', 'PENDING');
                              }}
                              className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all shadow-md flex items-center gap-1.5 ${
                                isPhotoPending
                                  ? 'bg-slate-900/90 text-amber-400 border border-amber-400/30 cursor-not-allowed opacity-90'
                                  : 'bg-white text-[#D2136E] hover:bg-[#D2136E] hover:text-white active:scale-95'
                              }`}
                            >
                              {actionState?.userId === profile.userId && actionState?.type === 'PHOTO_REQUEST_PENDING' ? (
                                <Loader2 className="animate-spin" size={12} />
                              ) : isPhotoPending ? (
                                <>
                                  <Clock size={10} /> Request Pending
                                </>
                              ) : (
                                <>
                                  <ImageIcon size={10} /> Request Photo
                                </>
                              )}
                            </button>
                          </div>
                        )}

                        {/* Gradient Name Overlay */}
                        <div 
                          onClick={() => handleProfileClick(profile.userId)}
                          className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/80 via-black/30 to-transparent z-20"
                        >
                           <div className="flex items-center gap-1.5">
                              <h3 className="text-white text-base font-black uppercase italic leading-tight truncate hover:underline">
                                {profile.fullName}, {profile.age}
                              </h3>
                              {profile.isVerified && <CheckCircle2 size={14} className="text-green-400 flex-shrink-0" />}
                           </div>
                        </div>
                      </div>

                      {/* Dynamic Details Section */}
                      <div className="px-4 pt-3 pb-1 flex flex-col gap-1.5 bg-white">
                        <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-medium text-slate-600">
                          {profile.stateName && (
                            <span className="inline-flex items-center gap-1 bg-pink-50 text-[#D2136E] px-2 py-0.5 rounded-md font-semibold text-[10px]">
                              <MapPin size={10} /> {profile.stateName}
                            </span>
                          )}
                          {profile.sect && (
                            <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-semibold text-[10px]">
                              <Bookmark size={10} /> {profile.sect}
                            </span>
                          )}
                        </div>
                        {profile.profession && (
                          <div className="flex items-center gap-1 text-[11px] text-slate-500 font-medium truncate">
                            <Briefcase size={11} className="text-slate-400 flex-shrink-0" />
                            <span className="truncate">{profile.profession}</span>
                          </div>
                        )}
                      </div>

                      {/* Action Buttons Section */}
                      <div className="p-3.5 bg-white mt-auto">
                        <div className="flex items-center gap-2">
                          {renderInteractionButtons(profile)}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>

            {fetchingMore && (
              <div className="flex justify-center py-8 text-[#D2136E]">
                <Loader2 className="animate-spin" size={28} />
              </div>
            )}
          </>
        )}
      </div>

      {/* SUBSCRIPTION MODAL */}
      <AnimatePresence>
        {showSubscriptionModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl max-w-sm w-full p-6 text-center relative shadow-2xl border border-pink-100"
            >
              <button 
                onClick={() => setShowSubscriptionModal(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1"
              >
                <X size={18} />
              </button>

              <div className="w-14 h-14 bg-pink-100 text-[#D2136E] rounded-2xl flex items-center justify-center mx-auto mb-3">
                <Crown size={28} />
              </div>

              <h3 className="text-lg font-black uppercase tracking-tight text-slate-900 mb-1.5">
                Upgrade to Premium
              </h3>
              
              <p className="text-slate-500 text-xs font-medium leading-relaxed mb-5">
                Direct messaging is exclusive to Premium members. Upgrade your account today to start chatting instantly!
              </p>

              <div className="flex flex-col gap-2.5">
                <button 
                  onClick={() => router.push('/membership')}
                  className="w-full bg-[#D2136E] hover:bg-pink-700 text-white py-3 rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-pink-200 transition-all active:scale-95"
                >
                  View Membership Plans
                </button>
                <button 
                  onClick={() => setShowSubscriptionModal(false)}
                  className="w-full bg-slate-100 hover:bg-slate-200 text-slate-600 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all"
                >
                  Maybe Later
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}