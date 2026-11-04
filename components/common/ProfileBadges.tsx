"use client";

import React from 'react';
import { Crown } from 'lucide-react';

/**
 * Helper to reliably determine whether a profile is identity/document verified
 */
export function checkIsVerified(p: any): boolean {
  if (!p) return false;
  const val = (v: any) => v === true || v === 1 || v === "1" || v === "true";
  return Boolean(
    val(p.isVerified) || val(p.IsVerified) ||
    val(p.isIdentityVerified) || val(p.IsIdentityVerified) ||
    val(p.isDocumentVerified) || val(p.IsDocumentVerified) ||
    val(p.isSelfieVerified) || val(p.IsSelfieVerified) ||
    val(p.isMobileVerified) || val(p.IsMobileVerified)
  );
}

/**
 * Helper to reliably determine whether a profile is a paid VIP/Premium member
 */
export function checkIsPremium(p: any): boolean {
  if (!p) return false;
  const val = (v: any) => v === true || v === 1 || v === "1" || v === "true";
  
  if (
    val(p.isPremium) || val(p.IsPremium) ||
    val(p.isPaid) || val(p.IsPaid) ||
    val(p.isVip) || val(p.IsVip) ||
    val(p.isSubscribed) || val(p.IsSubscribed) ||
    val(p.isTargetPremium) || val(p.IsTargetPremium)
  ) {
    return true;
  }

  const mId = Number(p.membershipTypeId || p.MembershipTypeId || 0);
  if (mId > 1) return true;

  const mType = String(p.membershipType || p.MembershipType || p.planName || p.PlanName || '').toLowerCase();
  if (
    mType.includes('vip') || 
    mType.includes('premium') || 
    mType.includes('gold') || 
    mType.includes('diamond') || 
    mType.includes('platinum') || 
    mType.includes('paid')
  ) {
    return true;
  }

  return false;
}

/**
 * 🛡️ Official Scalloped Seal Verified Badge (Sharp, High-Definition)
 */
export function VerifiedBadge({ size = 18, className = "" }: { size?: number; className?: string }) {
  return (
    <span 
      title="100% Verified Profile" 
      className={`inline-flex items-center justify-center shrink-0 align-middle select-none cursor-help ${className}`}
    >
      <svg 
        style={{ width: size, height: size }} 
        viewBox="0 0 24 24" 
        className="shrink-0 drop-shadow-[0_1px_3px_rgba(0,0,0,0.35)] transition-transform hover:scale-110"
      >
        <path 
          d="M10.605 2.222a1.75 1.75 0 0 1 2.79 0l1.19 1.488a1.75 1.75 0 0 0 1.542.639l1.895-.236a1.75 1.75 0 0 1 1.973 1.973l-.236 1.895a1.75 1.75 0 0 0 .639 1.542l1.488 1.19a1.75 1.75 0 0 1 0 2.79l-1.488 1.19a1.75 1.75 0 0 0-.639 1.542l.236 1.895a1.75 1.75 0 0 1-1.973 1.973l-1.895-.236a1.75 1.75 0 0 0-1.542.639l-1.19 1.488a1.75 1.75 0 0 1-2.79 0l-1.19-1.488a1.75 1.75 0 0 0-1.542-.639l-1.895.236a1.75 1.75 0 0 1-1.973-1.973l.236-1.895a1.75 1.75 0 0 0-.639-1.542l-1.488-1.19a1.75 1.75 0 0 1 0-2.79l1.488-1.19a1.75 1.75 0 0 0 .639-1.542l-.236-1.895a1.75 1.75 0 0 1 1.973-1.973l1.895.236a1.75 1.75 0 0 0 1.542-.639l1.19-1.488z" 
          fill="#0284c7" 
        />
        <path 
          d="M8.5 12.3l2.4 2.4 4.8-4.8" 
          fill="none" 
          stroke="#ffffff" 
          strokeWidth="2.5" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
        />
      </svg>
    </span>
  );
}

/**
 * 👑 Official Gold Crown Taj Badge for VIP / Premium Members
 */
export function PremiumCrownBadge({ size = 18, className = "" }: { size?: number; className?: string }) {
  return (
    <span 
      title="VIP Premium Member" 
      className={`inline-flex items-center justify-center shrink-0 align-middle select-none cursor-help ${className}`}
    >
      <Crown 
        style={{ width: size, height: size }} 
        className="fill-amber-400 text-amber-500 drop-shadow-[0_2px_4px_rgba(0,0,0,0.35)] shrink-0 transition-transform hover:scale-110" 
      />
    </span>
  );
}

/**
 * Combined Status Icons Component:
 * Displays [VerifiedBadge] and/or [PremiumCrownBadge] side-by-side cleanly.
 * If neither is true, renders nothing.
 */
export function ProfileStatusIcons({
  profile,
  isVerified: explicitVerified,
  isPremium: explicitPremium,
  size = 18,
  className = ""
}: {
  profile?: any;
  isVerified?: boolean;
  isPremium?: boolean;
  size?: number;
  className?: string;
}) {
  const verified = explicitVerified !== undefined ? explicitVerified : checkIsVerified(profile);
  const premium = explicitPremium !== undefined ? explicitPremium : checkIsPremium(profile);

  if (!verified && !premium) return null;

  return (
    <span className={`inline-flex items-center gap-1.5 shrink-0 align-middle ${className}`}>
      {verified && <VerifiedBadge size={size} />}
      {premium && <PremiumCrownBadge size={size} />}
    </span>
  );
}
