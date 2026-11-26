"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ChevronLeft, Search, UserCheck, Crown, HeartHandshake, 
  MessageCircle, ShieldCheck, Wrench, ChevronRight, HelpCircle, 
  Phone, Mail, X, CheckCircle2, Lock, Eye, 
  Sparkles, BookOpen, Users, Smartphone, Compass, ArrowRight,
  Shield, Check, MessageSquare
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Toaster, toast } from 'sonner';

interface HelpTopic {
  id: string;
  title: string;
  solution: string;
  actionText?: string;
  actionUrl?: string;
}

interface SupportCategory {
  id: string;
  title: string;
  tagline: string;
  icon: any;
  topics: HelpTopic[];
}

const SUPPORT_CATEGORIES: SupportCategory[] = [
  {
    id: 'bio-verification',
    title: 'Profile & ID Badge',
    tagline: 'Deen details, selfie & verified badge',
    icon: UserCheck,
    topics: [
      {
        id: 'edit-bio-details',
        title: 'Updating personal, deen & career information',
        solution: 'You can update your personal background, religious lifestyle (namaz, roza, hijab/beard), education, and profession anytime from the "Edit my profile" page.',
        actionText: 'Edit My Profile',
        actionUrl: '/dashboard/edit-profile'
      },
      {
        id: 'badge-verification',
        title: 'How to get the Verified Blue Badge?',
        solution: 'Our blue verified checkmark is granted once your selfie and government ID (Aadhaar, Passport, or PAN) pass our authenticity check. Verified profiles receive up to 3x more proposal interests.',
        actionText: 'Verify Your Identity',
        actionUrl: '/verify-selfie'
      },
      {
        id: 'correct-name-dob',
        title: 'Fixing typographical error in name or age',
        solution: 'To protect candidate trust and prevent fake profiles, legal name and date of birth are locked once verified. If you made an honest mistake during registration, our verification desk can update it for you with ID proof.',
        actionText: 'Submit Correction Request',
        actionUrl: 'whatsapp'
      },
      {
        id: 'gallery-upload-rules',
        title: 'Photo guidelines & why a photo gets flagged',
        solution: 'Nikah Qubool follows halal and dignified standards. Photos must clearly show the candidate face, well-lit and in modest attire. Group photos, celebrity pictures, side silhouettes, or sunglasses are declined by our moderation team.',
        actionText: 'Manage Photos',
        actionUrl: '/dashboard/gallery'
      },
      {
        id: 'change-login-mobile',
        title: 'Transfer account to a new mobile number',
        solution: 'If your registered SIM was changed or lost, our security team can migrate your matrimonial profile to your new number after verifying your account details.',
        actionText: 'WhatsApp Helpdesk',
        actionUrl: 'whatsapp'
      }
    ]
  },
  {
    id: 'vip-plans',
    title: 'VIP Plans & Invoices',
    tagline: 'Memberships, contact credits & GST bills',
    icon: Crown,
    topics: [
      {
        id: 'plan-benefits-comparison',
        title: 'What privileges do VIP plans unlock?',
        solution: 'VIP memberships allow you to view direct verified phone numbers, start unlimited halal chat with prospects, get priority placement on search feeds, and download official tax receipts.',
        actionText: 'Compare VIP Plans',
        actionUrl: '/dashboard/membership'
      },
      {
        id: 'contact-credits-usage',
        title: 'How do direct contact credits work?',
        solution: 'Each plan provides a quota of contact views. When you reveal a candidate phone number, 1 credit is used. That candidate contact remains unlocked in your history permanently with zero extra charges.',
        actionText: 'View My Contacts',
        actionUrl: '/dashboard/payment-info'
      },
      {
        id: 'payment-activation-delay',
        title: 'Payment deducted but VIP plan still inactive?',
        solution: 'UPI and banking gateways occasionally take 2-5 minutes to post confirmation. If your plan has not updated after 10 minutes, share your UPI reference / bank screenshot with our team for instant manual activation.',
        actionText: 'Share Payment Screenshot',
        actionUrl: 'whatsapp'
      },
      {
        id: 'gst-tax-invoice-receipt',
        title: 'How to download official GST invoice receipt?',
        solution: 'Go to Payment Info from your profile menu. Every successful subscription purchase includes a computer-generated GST tax invoice with full tax breakup (CGST + SGST) ready to download or print.',
        actionText: 'Download Invoice',
        actionUrl: '/dashboard/payment-info'
      }
    ]
  },
  {
    id: 'rishta-matching',
    title: 'Rishta Search & Filters',
    tagline: 'Partner preferences & smart discovery',
    icon: HeartHandshake,
    topics: [
      {
        id: 'customize-partner-preference',
        title: 'Setting partner age, height, sect & location filters',
        solution: 'Go to Partner Preference from My Profile. You can adjust preferred age span, height range, maslak/sect, education level, profession, and state/city using our interactive bottom-sheet filters.',
        actionText: 'Open Partner Preference',
        actionUrl: '/dashboard/settings?tab=preferences'
      },
      {
        id: 'widening-search-results',
        title: 'Not finding enough candidates in my local area?',
        solution: 'Consider expanding your location preference to "Any State" or selecting nearby metro cities. Many families are open to relocations for the right compatible proposal.',
        actionText: 'Adjust Location Preferences',
        actionUrl: '/dashboard/settings?tab=preferences'
      },
      {
        id: 'saving-shortlisted-proposals',
        title: 'How does Shortlist work & where to view saved profiles?',
        solution: 'Click the Bookmark icon on any candidate card to add them to your private shortlist. You can revisit and compare all saved prospects under Activity > My Shortlist.',
        actionText: 'View My Shortlist',
        actionUrl: '/dashboard/activity?cat=shortlist&tab=shortlisted-by-me'
      },
      {
        id: 'online-matches-feed',
        title: 'Connecting with candidates active right now',
        solution: 'Tap the "Online" pill on the home dashboard to browse verified members active in real-time. Members online right now typically respond to proposal interests within minutes.',
        actionText: 'Browse Online Matches',
        actionUrl: '/dashboard?tab=online'
      }
    ]
  },
  {
    id: 'chat-contact',
    title: 'Proposals & Family Chat',
    tagline: 'Messaging, calling & proposal status',
    icon: MessageCircle,
    topics: [
      {
        id: 'unlocking-realtime-chat',
        title: 'When can I start a chat conversation?',
        solution: 'Chat is unlocked immediately once there is mutual interest (either you accept their proposal or they accept yours). VIP members can also initiate direct polite introductions with prospects.',
        actionText: 'Go to Messages',
        actionUrl: '/dashboard/messages'
      },
      {
        id: 'revealing-guardian-contacts',
        title: 'Viewing candidate and guardian phone numbers',
        solution: 'Open the candidate profile details and tap "View Contact". If you hold an active VIP plan, their verified phone number and family contact info will be displayed instantly.',
        actionText: 'Explore VIP Upgrades',
        actionUrl: '/dashboard/membership'
      },
      {
        id: 'accepting-declining-proposals',
        title: 'How to accept or decline incoming interests?',
        solution: 'Open Activity > Incoming Requests. Tap the green checkmark to accept and begin conversations, or tap decline to gracefully pass without sending offensive alerts.',
        actionText: 'View Incoming Proposals',
        actionUrl: '/dashboard/activity?cat=interests&tab=requests'
      },
      {
        id: 'requesting-hidden-photos',
        title: 'Accessing photos if a profile has set private visibility',
        solution: 'If a candidate has enabled "Only Approved" photo privacy, click "Request Photo Access". Once they review and approve, their complete photo album will be unlocked for you.',
        actionText: 'Photo Requests Tab',
        actionUrl: '/dashboard/activity?cat=gallery&tab=gallery-requests-received'
      }
    ]
  },
  {
    id: 'trust-privacy',
    title: 'Privacy Shield & Trust',
    tagline: 'Photo visibility, blocking & safety',
    icon: ShieldCheck,
    topics: [
      {
        id: 'photo-privacy-options',
        title: 'Controlling who can see your photos',
        solution: 'Nikah Qubool offers 3 privacy tiers: "All Members" (maximum visibility), "VIP Only" (serious paid rishtas only), or "Only Approved" (photos remain blurred until you accept a candidate photo request).',
        actionText: 'Configure Photo Privacy',
        actionUrl: '/dashboard/settings?tab=privacy'
      },
      {
        id: 'blocking-reporting-users',
        title: 'Blocking or reporting disrespectful profiles',
        solution: 'On any profile card or chat header, tap the three-dot menu and select "Block User" or "Report User". Blocked members are instantly prevented from seeing your profile or sending messages.',
        actionText: 'Review Blocked Members',
        actionUrl: '/dashboard/settings?tab=privacy'
      },
      {
        id: 'pause-profile-visibility',
        title: 'Taking a temporary break without deleting your data',
        solution: 'If your rishta is finalized or you want to pause matchmaking temporarily, you can pause your profile from Account Settings. Your profile will be hidden from all feeds and can be resumed anytime.',
        actionText: 'Account Visibility Settings',
        actionUrl: '/dashboard/settings?tab=manage'
      },
      {
        id: 'halal-marriage-rules',
        title: 'Zero tolerance for non-serious or casual dating accounts',
        solution: 'Nikah Qubool is built purely for sacred nikah intentions. Inappropriate language, requests for social media handles, or casual dating behavior lead to immediate permanent ban without refund.',
        actionText: 'Read Safety Policy',
        actionUrl: '/safety-tips'
      },
      {
        id: 'delete-close-account',
        title: 'How to delete your matrimonial account after Nikah',
        solution: 'Mubarak! Once your marriage is finalized, go to Settings > Account Status and select "Delete Account". All your contact history, media, and bio data will be securely purged.',
        actionText: 'Manage Account Status',
        actionUrl: '/dashboard/settings?tab=manage'
      }
    ]
  },
  {
    id: 'troubleshooting',
    title: 'Login & Technical Help',
    tagline: 'OTP, loading & sync solutions',
    icon: Wrench,
    topics: [
      {
        id: 'otp-sms-delivery',
        title: 'Not receiving OTP code on mobile number',
        solution: 'Check that your network has active cellular coverage and that promotional/transactional SMS are not blocked by DND service. If SMS delays persist, you can request an instant WhatsApp OTP.',
        actionText: 'WhatsApp Support',
        actionUrl: 'whatsapp'
      },
      {
        id: 'slow-or-stuck-feed',
        title: 'Feeds taking long to refresh or load',
        solution: 'Check your internet connection or reload the application. Clearing your browser data/cache often resolves lingering network latency.',
        actionText: 'Refresh Application',
        actionUrl: 'reload'
      },
      {
        id: 'chat-websocket-reconnect',
        title: 'Real-time messages not displaying immediately',
        solution: 'Our live chat operates over secure WebSockets. If your mobile switched networks (e.g. Wi-Fi to 5G), simply navigate back to the inbox and re-open the chat room to refresh the live connection.',
        actionText: 'Open Messages Inbox',
        actionUrl: '/dashboard/messages'
      }
    ]
  }
];

const NIKAH_GUIDEBOOK = [
  {
    id: 'halal-etiquette',
    title: 'Halal Rishta Etiquette',
    tagline: 'Islamic principles of matrimonial communication & family involvement',
    icon: HeartHandshake,
    url: '/terms-conditions'
  },
  {
    id: 'ideal-matrimony-bio',
    title: 'Crafting an Ideal Bio',
    tagline: 'How to articulate your values, deen, and partner aspirations respectfully',
    icon: Sparkles,
    url: '/dashboard/edit-profile'
  },
  {
    id: 'family-safety-protocols',
    title: 'Safe Match Protocols',
    tagline: 'Practical verification steps, meeting with wali, and avoiding red flags',
    icon: Shield,
    url: '/safety-tips'
  },
  {
    id: 'sabr-and-istikhara',
    title: 'Sabr & Istikhara in Marriage',
    tagline: 'Approaching matrimonial decisions with clarity, prayer, and patience',
    icon: Compass,
    url: '/faq'
  }
];

export default function HelpAndSupportPage() {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState<SupportCategory | null>(null);
  const [expandedTopicId, setExpandedTopicId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isHelpdeskOpen, setIsHelpdeskOpen] = useState(false);

  const handleBack = () => {
    if (selectedCategory) {
      setSelectedCategory(null);
      setExpandedTopicId(null);
      return;
    }
    if (typeof window !== "undefined") {
      const last = sessionStorage.getItem('last_browse_page');
      if (last && last !== '/dashboard/support') {
        router.push(last);
        return;
      }
      if (window.history.length > 1) {
        router.back();
        return;
      }
    }
    router.push('/dashboard/my-profile');
  };

  const handleActionClick = (url?: string) => {
    if (!url) return;
    if (url === 'whatsapp') {
      window.open('https://wa.me/918055990011?text=Assalamu%20Alaikum%20Nikah%20Qubool%20Support%20Team%2C%20I%20need%20assistance%20with%20my%20matrimonial%20account.', '_blank');
      return;
    }
    if (url === 'reload') {
      window.location.reload();
      return;
    }
    router.push(url);
  };

  // Instant Search filter across all topics
  const searchResults = searchQuery.trim()
    ? SUPPORT_CATEGORIES.flatMap((cat) =>
        cat.topics.filter(
          (t) =>
            t.title.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
            t.solution.toLowerCase().includes(searchQuery.toLowerCase().trim())
        ).map((t) => ({ ...t, categoryTitle: cat.title }))
      )
    : [];

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900 pb-28 pt-0 selection:bg-[#E21E5B] selection:text-white">
      <Toaster position="top-center" richColors duration={2000} />

      {/* 🏷️ FIXED APP-STYLE HEADER BAR */}
      <div className="fixed top-0 lg:top-20 inset-x-0 z-40 bg-white py-3 px-4 sm:px-6 border-b border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
        <div className="max-w-xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <button 
              type="button" 
              onClick={handleBack} 
              className="w-9 h-9 rounded-full bg-white border border-slate-200/80 flex items-center justify-center text-slate-700 hover:bg-slate-50 active:scale-95 transition-all shadow-xs shrink-0 cursor-pointer"
              aria-label="Back"
              title="Go Back"
            >
              <ChevronLeft size={20} className="stroke-[2.5]" />
            </button>
            <h1 className="text-base sm:text-lg font-bold tracking-tight text-slate-900 truncate">
              {selectedCategory ? selectedCategory.title : 'Help & Support'}
            </h1>
          </div>

          {/* Support Helpdesk Pill Button */}
          <button
            type="button"
            onClick={() => setIsHelpdeskOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-rose-50 hover:bg-rose-100 text-[#E21E5B] text-xs font-bold transition active:scale-95 cursor-pointer shrink-0"
          >
            <span>Talk to us</span>
            <HelpCircle size={15} className="text-[#E21E5B]" />
          </button>
        </div>
      </div>

      <div className="max-w-xl mx-auto px-4 sm:px-6 pt-16 lg:pt-28 space-y-6">

        {/* 🔍 SEARCH BAR */}
        {!selectedCategory && (
          <div className="relative">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search help topics (e.g. photo privacy, verification, VIP)"
              className="w-full pl-11 pr-10 py-3 bg-slate-50/90 hover:bg-slate-50 focus:bg-white border border-slate-200/90 rounded-2xl text-xs sm:text-sm font-medium text-slate-800 placeholder:text-slate-400 outline-none focus:border-[#E21E5B] focus:ring-1 focus:ring-[#E21E5B] transition shadow-2xs"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X size={15} />
              </button>
            )}
          </div>
        )}

        {/* 🔎 SEARCH RESULTS VIEW */}
        {searchQuery.trim() ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Matching Articles ({searchResults.length})
              </span>
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="text-xs font-bold text-[#E21E5B] hover:underline cursor-pointer"
              >
                Clear Search
              </button>
            </div>

            {searchResults.length === 0 ? (
              <div className="text-center py-10 space-y-2 bg-slate-50 rounded-3xl p-6 border border-slate-100">
                <p className="text-sm font-bold text-slate-700">No matching help topics found</p>
                <p className="text-xs text-slate-400">Try keywords like "photo", "verification", "chat", or "invoice"</p>
                <button
                  type="button"
                  onClick={() => setIsHelpdeskOpen(true)}
                  className="mt-3 px-5 py-2.5 bg-[#E21E5B] text-white text-xs font-bold rounded-full cursor-pointer shadow-sm"
                >
                  Ask Support Directly
                </button>
              </div>
            ) : (
              <div className="bg-white rounded-3xl border border-slate-200/90 divide-y divide-slate-100 overflow-hidden shadow-xs">
                {searchResults.map((item) => {
                  const isExpanded = expandedTopicId === item.id;
                  return (
                    <div key={item.id} className="p-4 transition-colors">
                      <div
                        onClick={() => setExpandedTopicId(isExpanded ? null : item.id)}
                        className="flex items-center justify-between gap-3 cursor-pointer"
                      >
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-[#E21E5B] block mb-0.5">
                            {(item as any).categoryTitle}
                          </span>
                          <h4 className="text-xs sm:text-sm font-semibold text-slate-800">
                            {item.title}
                          </h4>
                        </div>
                        <ChevronRight
                          size={18}
                          className={`text-slate-400 shrink-0 transition-transform ${isExpanded ? 'rotate-90 text-[#E21E5B]' : ''}`}
                        />
                      </div>

                      {isExpanded && (
                        <div className="pt-3 pb-1 text-xs text-slate-600 leading-relaxed space-y-3">
                          <p>{item.solution}</p>
                          {item.actionText && (
                            <button
                              type="button"
                              onClick={() => handleActionClick(item.actionUrl)}
                              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#E21E5B] hover:underline cursor-pointer"
                            >
                              <span>{item.actionText}</span>
                              <ArrowRight size={13} />
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : selectedCategory ? (
          /* 📋 CATEGORY SUB-TOPICS VIEW */
          <div className="space-y-4">
            <div className="space-y-2.5">
              {selectedCategory.topics.map((topic) => {
                const isExpanded = expandedTopicId === topic.id;
                return (
                  <div
                    key={topic.id}
                    className="bg-white rounded-2xl border border-slate-200/90 p-4 transition-all shadow-2xs hover:border-slate-300"
                  >
                    <div
                      onClick={() => setExpandedTopicId(isExpanded ? null : topic.id)}
                      className="flex items-center justify-between gap-3 cursor-pointer"
                    >
                      <span className="text-xs sm:text-sm font-semibold text-slate-800">
                        {topic.title}
                      </span>
                      <ChevronRight
                        size={18}
                        className={`text-slate-400 shrink-0 transition-transform ${isExpanded ? 'rotate-90 text-[#E21E5B]' : ''}`}
                      />
                    </div>

                    {isExpanded && (
                      <div className="pt-3 pb-1 border-t border-slate-100 mt-3 text-xs text-slate-600 leading-relaxed space-y-3">
                        <p>{topic.solution}</p>
                        {topic.actionText && (
                          <button
                            type="button"
                            onClick={() => handleActionClick(topic.actionUrl)}
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-rose-50 text-[#E21E5B] text-xs font-bold hover:bg-rose-100 transition cursor-pointer"
                          >
                            <span>{topic.actionText}</span>
                            <ArrowRight size={13} />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Support Helpdesk card at bottom */}
            <div className="p-4 sm:p-5 bg-gradient-to-r from-rose-50/60 to-white rounded-3xl border border-rose-100 flex items-center justify-between gap-3">
              <div>
                <h5 className="text-xs sm:text-sm font-bold text-slate-900">Still need guidance?</h5>
                <p className="text-[11px] text-slate-500 font-medium">Our relationship advisors are available on WhatsApp.</p>
              </div>
              <button
                type="button"
                onClick={() => setIsHelpdeskOpen(true)}
                className="px-4 py-2 rounded-full bg-gradient-to-r from-[#E21E5B] to-[#C2185B] text-white text-xs font-bold shadow-xs hover:opacity-95 active:scale-95 transition shrink-0 cursor-pointer"
              >
                Connect Now
              </button>
            </div>
          </div>
        ) : (
          /* 📱 MAIN HELP HUB SCREEN */
          <>
            {/* 1. NIKAH QUBOOL 6 HELP CATEGORIES (3x2 Grid) */}
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <h2 className="text-sm sm:text-base font-bold text-slate-900">
                  How can we help you today?
                </h2>
                <span className="text-[11px] font-semibold text-slate-400">6 Categories</span>
              </div>

              <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
                {SUPPORT_CATEGORIES.map((cat) => {
                  const Icon = cat.icon;
                  return (
                    <div
                      key={cat.id}
                      onClick={() => {
                        setSelectedCategory(cat);
                        setExpandedTopicId(null);
                      }}
                      className="bg-white rounded-2xl border border-slate-200/90 p-3 sm:p-4 flex flex-col items-center text-center justify-center gap-2 sm:gap-2.5 cursor-pointer hover:border-[#E21E5B]/40 hover:shadow-xs active:scale-98 transition group aspect-square"
                    >
                      <div className="w-10 h-10 rounded-full flex items-center justify-center text-slate-700 group-hover:text-[#E21E5B] group-hover:scale-105 transition-all">
                        <Icon size={24} strokeWidth={1.8} />
                      </div>
                      <div>
                        <span className="text-[11px] sm:text-xs font-bold text-slate-800 group-hover:text-[#E21E5B] transition-colors leading-tight line-clamp-2">
                          {cat.title}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 2. NIKAH GUIDEBOOK SECTION */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between px-1">
                <h2 className="text-sm sm:text-base font-bold text-slate-900">
                  Nikah Guidebook
                </h2>
                <span className="text-[11px] font-semibold text-slate-400">Halal Principles</span>
              </div>

              <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
                {NIKAH_GUIDEBOOK.map((guide) => {
                  const Icon = guide.icon;
                  return (
                    <div
                      key={guide.id}
                      onClick={() => router.push(guide.url)}
                      className="bg-white rounded-2xl border border-slate-200/90 p-4 flex flex-col justify-between gap-3 cursor-pointer hover:border-slate-300 hover:shadow-2xs active:scale-98 transition group text-left"
                    >
                      <div className="w-8 h-8 rounded-xl bg-slate-100 group-hover:bg-rose-50 text-slate-700 group-hover:text-[#E21E5B] flex items-center justify-center transition-colors">
                        <Icon size={18} strokeWidth={2} />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 group-hover:text-[#E21E5B] transition-colors line-clamp-1">
                          {guide.title}
                        </h4>
                        <p className="text-[10px] text-slate-400 font-medium leading-relaxed mt-0.5 line-clamp-2">
                          {guide.tagline}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}

      </div>

      {/* 📞 TALK TO US / HELPDESK BOTTOM SHEET */}
      <AnimatePresence>
        {isHelpdeskOpen && (
          <div className="fixed inset-0 z-[10000] flex flex-col justify-end bg-black/60 backdrop-blur-xs">
            <div className="absolute inset-0 -z-10" onClick={() => setIsHelpdeskOpen(false)} />

            {/* Floating Close Button */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="flex justify-center mb-3 pointer-events-auto"
            >
              <button
                type="button"
                onClick={() => setIsHelpdeskOpen(false)}
                className="w-11 h-11 bg-white rounded-full flex items-center justify-center text-slate-800 shadow-2xl hover:scale-105 active:scale-95 transition cursor-pointer"
                aria-label="Close"
              >
                <X size={20} strokeWidth={2.5} />
              </button>
            </motion.div>

            {/* Slide-Up Sheet */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="bg-white rounded-t-[32px] w-full max-w-lg mx-auto p-5 sm:p-6 shadow-2xl space-y-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-left space-y-1">
                <h3 className="text-lg font-bold text-slate-900">Nikah Qubool Helpdesk</h3>
                <p className="text-xs text-slate-500 font-medium">
                  Reach our dedicated relationship managers for immediate support.
                </p>
              </div>

              {/* Contact Channels */}
              <div className="space-y-2.5 pt-1">
                {/* 1. WhatsApp Support */}
                <a
                  href="https://wa.me/918055990011?text=Assalamu%20Alaikum%20Nikah%20Qubool%20Support%20Team%2C%20I%20need%20assistance%20with%20my%20matrimonial%20account."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-3.5 bg-emerald-50/70 hover:bg-emerald-50 border border-emerald-200/90 rounded-2xl transition cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-xs">
                      <MessageCircle size={20} className="fill-white stroke-none" />
                    </div>
                    <div className="text-left">
                      <span className="text-xs font-bold text-slate-900 block">Instant WhatsApp Advisory</span>
                      <span className="text-[11px] text-emerald-700 font-semibold block">+91 805 599 0011</span>
                    </div>
                  </div>
                  <ChevronRight size={18} className="text-emerald-600 group-hover:translate-x-1 transition-transform" />
                </a>

                {/* 2. Direct Helpline Call */}
                <a
                  href="tel:+918055990011"
                  className="flex items-center justify-between p-3.5 bg-slate-50 hover:bg-slate-100 border border-slate-200/90 rounded-2xl transition cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#E21E5B] text-white flex items-center justify-center shadow-xs">
                      <Phone size={18} />
                    </div>
                    <div className="text-left">
                      <span className="text-xs font-bold text-slate-900 block">Toll-Free Helpline Call</span>
                      <span className="text-[11px] text-slate-500 font-medium block">Mon - Sat, 10:00 AM - 7:00 PM IST</span>
                    </div>
                  </div>
                  <ChevronRight size={18} className="text-slate-400 group-hover:translate-x-1 transition-transform" />
                </a>

                {/* 3. Official Email */}
                <a
                  href="mailto:support@nikahqubool.in?subject=Nikah%20Qubool%20Candidate%20Query"
                  className="flex items-center justify-between p-3.5 bg-slate-50 hover:bg-slate-100 border border-slate-200/90 rounded-2xl transition cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-800 text-white flex items-center justify-center shadow-xs">
                      <Mail size={18} />
                    </div>
                    <div className="text-left">
                      <span className="text-xs font-bold text-slate-900 block">Official Support Email</span>
                      <span className="text-[11px] text-slate-500 font-medium block">support@nikahqubool.in</span>
                    </div>
                  </div>
                  <ChevronRight size={18} className="text-slate-400 group-hover:translate-x-1 transition-transform" />
                </a>
              </div>

              {/* Close Button */}
              <button
                type="button"
                onClick={() => setIsHelpdeskOpen(false)}
                className="w-full mt-2 py-3 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs uppercase tracking-wider cursor-pointer transition"
              >
                Close
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
