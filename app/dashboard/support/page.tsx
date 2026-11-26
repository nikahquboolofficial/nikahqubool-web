"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ChevronLeft, Search, User, Receipt, UserCheck, MessageSquare, 
  ShieldCheck, AlertTriangle, ChevronRight, HelpCircle, Phone, 
  Mail, MessageCircle, X, CheckCircle2, FileText, Lock, 
  Heart, Sparkles, BookOpen, Users, Smartphone, Sprout, ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Toaster, toast } from 'sonner';

interface IssueItem {
  id: string;
  question: string;
  answer: string;
  actionText?: string;
  actionUrl?: string;
}

interface IssueCategory {
  id: string;
  title: string;
  icon: any;
  issues: IssueItem[];
}

const ISSUE_CATEGORIES: IssueCategory[] = [
  {
    id: 'account-profile',
    title: 'Account & Profile',
    icon: User,
    issues: [
      {
        id: 'change-profile-details',
        question: 'Change my profile details',
        answer: 'You can update your personal, education, career, religious, and family details anytime from the "Edit my profile" section.',
        actionText: 'Go to Edit Profile',
        actionUrl: '/dashboard/edit-profile'
      },
      {
        id: 'request-name-change',
        question: 'Request name change',
        answer: 'To ensure authenticity and trust, legal names are matched with government verification. If you need to fix a typo or update your name, please contact our support team with valid ID proof.',
        actionText: 'Talk to Support',
        actionUrl: 'whatsapp'
      },
      {
        id: 'request-dob-correction',
        question: 'Request date of birth correction',
        answer: 'Date of birth affects age matching and cannot be changed repeatedly. You can request a one-time correction by submitting a photo of any government ID (Aadhaar, Passport, PAN).',
        actionText: 'Contact Support Team',
        actionUrl: 'whatsapp'
      },
      {
        id: 'request-marital-status-change',
        question: 'Request marital status change',
        answer: 'Marital status (Never Married, Divorced, Widowed, Awaiting Divorce) is a critical match criterion. To update this, please submit your request to our verification team.',
        actionText: 'Submit Verification Request',
        actionUrl: 'whatsapp'
      },
      {
        id: 'profile-changes-not-saving',
        question: 'Profile changes not saving',
        answer: 'Make sure all mandatory fields (Height, Sect, City, Education) are filled before clicking Save. If you are experiencing connection issues, check your internet or refresh the browser.',
        actionText: 'Retry Edit Profile',
        actionUrl: '/dashboard/edit-profile'
      },
      {
        id: 'upload-change-delete-photo',
        question: 'Upload, change or delete profile photo',
        answer: 'Go to My Profile > Manage Photos (or click your avatar). You can add up to 5 high-resolution photos, set your primary display picture, or delete old photos.',
        actionText: 'Manage Photo Gallery',
        actionUrl: '/dashboard/gallery'
      },
      {
        id: 'my-photo-looks-blurry',
        question: 'My photo looks blurry',
        answer: 'Ensure your original image is at least 800x800 pixels. Avoid screenshotting photos from social media. Upload original camera portraits with good lighting.',
        actionText: 'Upload New Photo',
        actionUrl: '/dashboard/gallery'
      },
      {
        id: 'photo-rejected-not-approved',
        question: 'Photo rejected or not approved',
        answer: 'Photos containing group pictures, side angles without face visibility, celebrity/cartoon images, or low resolution are rejected by our moderation system to keep the platform halal and safe.',
        actionText: 'Review Guidelines',
        actionUrl: '/dashboard/gallery'
      },
      {
        id: 'document-verification-rejected',
        question: 'Document verification rejected',
        answer: 'Rejections occur if the document photo is dark, blurry, cut off at edges, or details do not match your profile name/DOB. Re-upload a clear, well-lit picture.',
        actionText: 'Re-verify Profile',
        actionUrl: '/verify-selfie'
      },
      {
        id: 'change-phone-number',
        question: 'Change phone number or email',
        answer: 'Your registered phone number is used for OTP login and account safety. If your SIM was lost or changed, our team can transfer your profile after verifying your identity.',
        actionText: 'Contact Support Helpdesk',
        actionUrl: 'whatsapp'
      }
    ]
  },
  {
    id: 'billing-plans',
    title: 'Billing & Plans',
    icon: Receipt,
    issues: [
      {
        id: 'how-to-upgrade',
        question: 'How to upgrade to VIP membership?',
        answer: 'Visit the "Explore Plans" section, choose your preferred package (Silver, Gold, or Platinum), and pay securely via UPI, Google Pay, PhonePe, Cards, or NetBanking.',
        actionText: 'View VIP Plans',
        actionUrl: '/dashboard/membership'
      },
      {
        id: 'payment-done-plan-inactive',
        question: 'Payment completed but plan not activated',
        answer: 'In rare cases of bank network delays, activation takes 2-5 minutes. If your plan is not active after 10 minutes, send your transaction screenshot to our WhatsApp helpline.',
        actionText: 'WhatsApp Helpdesk',
        actionUrl: 'whatsapp'
      },
      {
        id: 'contact-views-credits',
        question: 'How do contact view credits work?',
        answer: 'Each VIP plan includes a fixed quota of direct verified contact numbers and WhatsApp unlocks. Once unlocked, the contact remains saved in your "Payment Info & Contacts" history permanently.',
        actionText: 'Check Contact History',
        actionUrl: '/dashboard/payment-info'
      },
      {
        id: 'gst-invoice-download',
        question: 'Can I get an official GST invoice?',
        answer: 'Yes! All VIP plan purchases include an official computer-generated GST tax invoice. You can download and print it anytime from your Payment Info page.',
        actionText: 'Download Invoice',
        actionUrl: '/dashboard/payment-info'
      },
      {
        id: 'refund-policy',
        question: 'What is the refund & cancellation policy?',
        answer: 'Subscriptions are digital access services and are non-refundable once contact details or messaging have been utilized. Please read our complete policy for full terms.',
        actionText: 'Read Refund Policy',
        actionUrl: '/refund-policy'
      }
    ]
  },
  {
    id: 'matches-search',
    title: 'Matches & Search',
    icon: UserCheck,
    issues: [
      {
        id: 'best-matches-algorithm',
        question: 'How does Best Matches work?',
        answer: 'Our smart matchmaking engine matches you based on your Sect/Maslak, Age criteria, Height, Location (State & City), Education, and religious lifestyle habits.',
        actionText: 'Update Partner Preference',
        actionUrl: '/dashboard/settings?tab=preferences'
      },
      {
        id: 'no-matches-city',
        question: 'Why am I not seeing matches in my city?',
        answer: 'Try widening your state filter or setting "Any State" in Partner Preferences to see compatible proposals from nearby districts and metropolitan hubs.',
        actionText: 'Expand Preferences',
        actionUrl: '/dashboard/settings?tab=preferences'
      },
      {
        id: 'how-shortlisting-works',
        question: 'How does Shortlisting work?',
        answer: 'Click the Bookmark icon on any profile card to save it to your private shortlist. You can review all your saved profiles anytime under Activity > My Shortlist.',
        actionText: 'View My Shortlist',
        actionUrl: '/dashboard/activity?cat=shortlist&tab=shortlisted-by-me'
      },
      {
        id: 'online-members-tab',
        question: 'How to find members who are online now?',
        answer: 'On your Home Dashboard, click the "Online" pill tab at the top. This shows profiles currently active in real-time, giving you faster responses.',
        actionText: 'Go to Online Matches',
        actionUrl: '/dashboard?tab=online'
      }
    ]
  },
  {
    id: 'message-contact',
    title: 'Message & Contact',
    icon: MessageSquare,
    issues: [
      {
        id: 'how-to-start-chat',
        question: 'How to start a chat with a match?',
        answer: 'Once you or the candidate accepts an interest request, a mutual connection is formed and real-time chat is unlocked. VIP members can also initiate direct conversations.',
        actionText: 'Open Messages',
        actionUrl: '/dashboard/messages'
      },
      {
        id: 'unlock-contact-number',
        question: 'When can I view phone numbers and contact details?',
        answer: 'Open the candidate profile and click "View Contact / Call". If you have an active VIP subscription, their verified phone number and family contact will be revealed instantly.',
        actionText: 'Upgrade to View Contacts',
        actionUrl: '/dashboard/membership'
      },
      {
        id: 'accept-decline-interest',
        question: 'How to accept or decline an incoming interest?',
        answer: 'Go to Activity > Received Requests. Click the green Checkmark button to accept, or the red X button to decline respectfully without alerting the candidate.',
        actionText: 'Review Requests',
        actionUrl: '/dashboard/activity?cat=interests&tab=requests'
      },
      {
        id: 'photo-request-access',
        question: 'How to view photos if they are hidden?',
        answer: 'If a member has set photo privacy to "Only Approved", click "Request Photo Access" on their profile. Once they approve, their full gallery unlocks for you.',
        actionText: 'Check Photo Requests',
        actionUrl: '/dashboard/activity?cat=gallery&tab=gallery-requests-received'
      }
    ]
  },
  {
    id: 'safety-privacy',
    title: 'Safety & Privacy',
    icon: ShieldCheck,
    issues: [
      {
        id: 'hide-blur-photos',
        question: 'How to hide or blur my photos?',
        answer: 'Go to My Profile > Profile Privacy. You can set photo visibility to "All Members", "VIP Members Only", or "Only Approved Candidates" (blurred until you accept request).',
        actionText: 'Set Photo Privacy',
        actionUrl: '/dashboard/settings?tab=privacy'
      },
      {
        id: 'who-can-see-phone',
        question: 'Who can see my phone number and email?',
        answer: 'Your phone number is strictly private and is never shown to non-verified or free users. Only paid VIP members with active verification can view contact details.',
        actionText: 'Privacy Settings',
        actionUrl: '/dashboard/settings?tab=privacy'
      },
      {
        id: 'block-report-member',
        question: 'How to block or report suspicious users?',
        answer: 'On any candidate profile or chat window, click the three-dot menu and select "Block User" or "Report User". Blocked members cannot contact or view you.',
        actionText: 'Manage Blocked Users',
        actionUrl: '/dashboard/settings?tab=privacy'
      },
      {
        id: 'halal-matrimonial-conduct',
        question: 'Islamic matrimonial guidelines & halal conduct',
        answer: 'Nikah Qubool is dedicated exclusively to serious halal matrimonial intentions. Dating, casual flirting, and inappropriate language are strictly prohibited and result in permanent account termination.',
        actionText: 'Read Safety Tips',
        actionUrl: '/safety-tips'
      }
    ]
  },
  {
    id: 'app-issues',
    title: 'App Not Working',
    icon: AlertTriangle,
    issues: [
      {
        id: 'slow-loading',
        question: 'App or web page is loading slowly',
        answer: 'Clear your browser cache, check if data-saver mode is interfering with image loading, or try refreshing the page. We use high-speed cloud CDN for all media.',
        actionText: 'Reload Page',
        actionUrl: 'reload'
      },
      {
        id: 'otp-not-receiving',
        question: 'Not receiving OTP on mobile',
        answer: 'Ensure your phone has active cellular reception and DND (Do Not Disturb) is not blocking transactional SMS. You can also request an OTP via WhatsApp if available.',
        actionText: 'Support Helpdesk',
        actionUrl: 'whatsapp'
      },
      {
        id: 'chat-not-updating',
        question: 'Real-time chat messages not updating',
        answer: 'Chat connects via our live SignalR socket server. If your device temporarily lost connection, tap back and re-enter the chat room to reconnect.',
        actionText: 'Go to Messages',
        actionUrl: '/dashboard/messages'
      }
    ]
  }
];

const MEMBERS_GUIDES = [
  {
    id: 'building-profile',
    title: 'Building Your Profile',
    desc: 'How to write a compelling about me & attract compatible rishtas',
    icon: User,
    url: '/dashboard/edit-profile'
  },
  {
    id: 'community-standards',
    title: 'Community Standards',
    desc: 'Our principles of halal matchmaking and mutual respect',
    icon: Users,
    url: '/terms-conditions'
  },
  {
    id: 'staying-safe',
    title: 'Staying Safe',
    desc: 'Essential verification tips for candidates and families',
    icon: Smartphone,
    url: '/safety-tips'
  },
  {
    id: 'mental-wellbeing',
    title: 'Mental Wellbeing',
    desc: 'Navigating matrimonial journey with sabr, clarity and barakah',
    icon: Sprout,
    url: '/faq'
  }
];

export default function HelpAndSupportPage() {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState<IssueCategory | null>(null);
  const [expandedIssueId, setExpandedIssueId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isTalkToUsOpen, setIsTalkToUsOpen] = useState(false);

  const handleBack = () => {
    if (selectedCategory) {
      setSelectedCategory(null);
      setExpandedIssueId(null);
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
      window.open('https://wa.me/918055990011?text=Assalamu%20Alaikum%20Nikah%20Qubool%20Support%2C%20I%20need%20assistance%20with%20my%20matrimony%20account.', '_blank');
      return;
    }
    if (url === 'reload') {
      window.location.reload();
      return;
    }
    router.push(url);
  };

  // Filter issues across all categories if user types in search
  const filteredIssues = searchQuery.trim()
    ? ISSUE_CATEGORIES.flatMap((cat) =>
        cat.issues.filter(
          (issue) =>
            issue.question.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
            issue.answer.toLowerCase().includes(searchQuery.toLowerCase().trim())
        ).map((i) => ({ ...i, categoryName: cat.title }))
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

          {/* Talk to us (?) action button (Matching Screenshots 3 & 4) */}
          <button
            type="button"
            onClick={() => setIsTalkToUsOpen(true)}
            className="flex items-center gap-1.5 text-xs font-bold text-[#E21E5B] hover:text-[#C2185B] cursor-pointer active:scale-95 transition shrink-0"
          >
            <span>Talk to us</span>
            <HelpCircle size={16} className="text-[#E21E5B]" />
          </button>
        </div>
      </div>

      <div className="max-w-xl mx-auto px-4 sm:px-6 pt-16 lg:pt-28 space-y-6">

        {/* 🔍 SEARCH BAR (Screenshots 3 & 4) */}
        {!selectedCategory && (
          <div className="relative">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search (e.g photo, login)"
              className="w-full pl-11 pr-4 py-3 bg-slate-50/80 hover:bg-slate-50 focus:bg-white border border-slate-200/90 rounded-2xl text-xs sm:text-sm font-medium text-slate-800 placeholder:text-slate-400 outline-none focus:border-[#E21E5B] focus:ring-1 focus:ring-[#E21E5B] transition shadow-2xs"
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
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 px-1">
              Search Results ({filteredIssues.length})
            </h3>
            {filteredIssues.length === 0 ? (
              <div className="text-center py-10 space-y-2 bg-slate-50 rounded-3xl p-6 border border-slate-100">
                <p className="text-sm font-bold text-slate-700">No matching help articles found</p>
                <p className="text-xs text-slate-400">Try searching for keywords like "photo", "phone", "chat", or "payment"</p>
                <button
                  type="button"
                  onClick={() => setIsTalkToUsOpen(true)}
                  className="mt-3 px-4 py-2 bg-[#E21E5B] text-white text-xs font-bold rounded-full cursor-pointer shadow-sm"
                >
                  Ask Support Directly
                </button>
              </div>
            ) : (
              <div className="bg-white rounded-3xl border border-slate-200/90 divide-y divide-slate-100 overflow-hidden shadow-xs">
                {filteredIssues.map((issue) => {
                  const isExpanded = expandedIssueId === issue.id;
                  return (
                    <div key={issue.id} className="p-4 transition-colors">
                      <div
                        onClick={() => setExpandedIssueId(isExpanded ? null : issue.id)}
                        className="flex items-center justify-between gap-3 cursor-pointer"
                      >
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-[#E21E5B] block mb-0.5">
                            {(issue as any).categoryName}
                          </span>
                          <h4 className="text-xs sm:text-sm font-semibold text-slate-800">
                            {issue.question}
                          </h4>
                        </div>
                        <ChevronRight
                          size={18}
                          className={`text-slate-400 shrink-0 transition-transform ${isExpanded ? 'rotate-90 text-[#E21E5B]' : ''}`}
                        />
                      </div>

                      {isExpanded && (
                        <div className="pt-3 pb-1 text-xs text-slate-600 leading-relaxed space-y-3">
                          <p>{issue.answer}</p>
                          {issue.actionText && (
                            <button
                              type="button"
                              onClick={() => handleActionClick(issue.actionUrl)}
                              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#E21E5B] hover:underline cursor-pointer"
                            >
                              <span>{issue.actionText}</span>
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
          /* 📋 CATEGORY SUB-LIST (Screenshot 1: e.g. "Account & Profile") */
          <div className="space-y-4">
            <div className="space-y-2">
              {selectedCategory.issues.map((issue) => {
                const isExpanded = expandedIssueId === issue.id;
                return (
                  <div
                    key={issue.id}
                    className="bg-white rounded-2xl border border-slate-200/90 p-4 transition-all shadow-2xs hover:border-slate-300"
                  >
                    <div
                      onClick={() => setExpandedIssueId(isExpanded ? null : issue.id)}
                      className="flex items-center justify-between gap-3 cursor-pointer"
                    >
                      <span className="text-xs sm:text-sm font-semibold text-slate-800">
                        {issue.question}
                      </span>
                      <ChevronRight
                        size={18}
                        className={`text-slate-400 shrink-0 transition-transform ${isExpanded ? 'rotate-90 text-[#E21E5B]' : ''}`}
                      />
                    </div>

                    {isExpanded && (
                      <div className="pt-3 pb-1 border-t border-slate-100 mt-3 text-xs text-slate-600 leading-relaxed space-y-3">
                        <p>{issue.answer}</p>
                        {issue.actionText && (
                          <button
                            type="button"
                            onClick={() => handleActionClick(issue.actionUrl)}
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-rose-50 text-[#E21E5B] text-xs font-bold hover:bg-rose-100 transition cursor-pointer"
                          >
                            <span>{issue.actionText}</span>
                            <ArrowRight size={13} />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Need more help banner at bottom of category */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center justify-between gap-3">
              <div>
                <h5 className="text-xs font-bold text-slate-900">Still have a question?</h5>
                <p className="text-[11px] text-slate-500 font-medium">Our relationship advisors are ready to assist you.</p>
              </div>
              <button
                type="button"
                onClick={() => setIsTalkToUsOpen(true)}
                className="px-4 py-2 bg-gradient-to-r from-[#E21E5B] to-[#C2185B] text-white text-xs font-bold rounded-full shadow-xs cursor-pointer hover:opacity-95 shrink-0"
              >
                Contact Us
              </button>
            </div>
          </div>
        ) : (
          /* 📱 MAIN HUB SCREEN (Screenshots 3 & 4) */
          <>
            {/* 1. SELECT YOUR ISSUE CATEGORY (3x2 GRID) */}
            <div className="space-y-3">
              <h2 className="text-sm sm:text-base font-bold text-slate-900 px-1">
                Select your issue category
              </h2>

              <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
                {ISSUE_CATEGORIES.map((cat) => {
                  const Icon = cat.icon;
                  return (
                    <div
                      key={cat.id}
                      onClick={() => {
                        setSelectedCategory(cat);
                        setExpandedIssueId(null);
                      }}
                      className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 flex flex-col items-center text-center justify-center gap-3 cursor-pointer hover:border-[#E21E5B]/40 hover:shadow-xs active:scale-98 transition group aspect-square"
                    >
                      <div className="w-10 h-10 rounded-full flex items-center justify-center text-slate-700 group-hover:text-[#E21E5B] group-hover:scale-105 transition-all">
                        <Icon size={26} strokeWidth={1.75} />
                      </div>
                      <span className="text-[11px] sm:text-xs font-semibold text-slate-800 group-hover:text-[#E21E5B] transition-colors leading-tight line-clamp-2">
                        {cat.title}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 2. MEMBERS GUIDE SECTION (Screenshots 3 & 4) */}
            <div className="space-y-3 pt-2">
              <h2 className="text-sm sm:text-base font-bold text-slate-900 px-1">
                Members Guide
              </h2>

              <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
                {MEMBERS_GUIDES.slice(0, 3).map((guide) => {
                  const Icon = guide.icon;
                  return (
                    <div
                      key={guide.id}
                      onClick={() => router.push(guide.url)}
                      className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 flex flex-col items-center text-center justify-center gap-3 cursor-pointer hover:border-[#E21E5B]/40 hover:shadow-xs active:scale-98 transition group aspect-square"
                    >
                      <div className="w-10 h-10 rounded-full flex items-center justify-center text-slate-700 group-hover:text-[#E21E5B] group-hover:scale-105 transition-all">
                        <Icon size={26} strokeWidth={1.75} />
                      </div>
                      <span className="text-[11px] sm:text-xs font-semibold text-slate-800 group-hover:text-[#E21E5B] transition-colors leading-tight line-clamp-2">
                        {guide.title}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}

      </div>

      {/* 📞 TALK TO US BOTTOM SHEET (Direct VIP Contact) */}
      <AnimatePresence>
        {isTalkToUsOpen && (
          <div className="fixed inset-0 z-[10000] flex flex-col justify-end bg-black/60 backdrop-blur-xs">
            <div className="absolute inset-0 -z-10" onClick={() => setIsTalkToUsOpen(false)} />

            {/* Floating Close Button */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="flex justify-center mb-3 pointer-events-auto"
            >
              <button
                type="button"
                onClick={() => setIsTalkToUsOpen(false)}
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
                <h3 className="text-lg font-bold text-slate-900">Talk to Support Team</h3>
                <p className="text-xs text-slate-500 font-medium">
                  We are here to assist candidates and families in finding the right life partner.
                </p>
              </div>

              {/* Contact Options */}
              <div className="space-y-2.5 pt-1">
                {/* 1. WhatsApp Support */}
                <a
                  href="https://wa.me/918055990011?text=Assalamu%20Alaikum%20Nikah%20Qubool%20Support%2C%20I%20need%20assistance%20with%20my%20matrimony%20account."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-3.5 bg-emerald-50/70 hover:bg-emerald-50 border border-emerald-200/90 rounded-2xl transition cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-xs">
                      <MessageCircle size={20} className="fill-white stroke-none" />
                    </div>
                    <div className="text-left">
                      <span className="text-xs font-bold text-slate-900 block">Instant WhatsApp Chat</span>
                      <span className="text-[11px] text-emerald-700 font-semibold block">+91 805 599 0011</span>
                    </div>
                  </div>
                  <ChevronRight size={18} className="text-emerald-600 group-hover:translate-x-1 transition-transform" />
                </a>

                {/* 2. Direct Phone Call */}
                <a
                  href="tel:+918055990011"
                  className="flex items-center justify-between p-3.5 bg-slate-50 hover:bg-slate-100 border border-slate-200/90 rounded-2xl transition cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#E21E5B] text-white flex items-center justify-center shadow-xs">
                      <Phone size={18} />
                    </div>
                    <div className="text-left">
                      <span className="text-xs font-bold text-slate-900 block">Direct Helpline Call</span>
                      <span className="text-[11px] text-slate-500 font-medium block">Mon - Sat, 10:00 AM - 7:00 PM</span>
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
                      <span className="text-xs font-bold text-slate-900 block">Email Support</span>
                      <span className="text-[11px] text-slate-500 font-medium block">support@nikahqubool.in</span>
                    </div>
                  </div>
                  <ChevronRight size={18} className="text-slate-400 group-hover:translate-x-1 transition-transform" />
                </a>
              </div>

              {/* Close Button */}
              <button
                type="button"
                onClick={() => setIsTalkToUsOpen(false)}
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
