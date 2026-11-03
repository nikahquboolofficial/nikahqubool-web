export interface SubscriptionStatus {
  isPaid: boolean;
  planName: string;
  isExpired: boolean;
  expiryDate: string | null;
  remainingContacts: number;
  canChat: boolean;
  canViewContact: boolean;
}

/**
 * 👑 Synchronize Active Subscription cleanly across localStorage and trigger reactive UI updates
 */
export const syncSubscriptionToStorage = (rawActive: any) => {
  if (typeof window === "undefined" || !rawActive) return;
  try {
    // 🛡️ Safely unwrap if nested under .data
    const active = (rawActive && typeof rawActive === 'object' && 'data' in rawActive && rawActive.data) 
      ? rawActive.data 
      : rawActive;

    // If active is completely empty or has no plan info, do not overwrite existing valid snapshot
    if (!active || typeof active !== 'object' || Object.keys(active).length === 0) {
      return;
    }

    const rawExpiry = active.expiryDate || active.ExpiryDate || active.endDate || active.EndDate || 
                      active.planExpiryDate || active.PlanExpiryDate || active.ExpiresAt || active.expiresAt || null;
    let isExpired = Boolean(active.isExpired ?? active.IsExpired ?? false);
    if (rawExpiry) {
      const expDate = new Date(rawExpiry);
      if (!isNaN(expDate.getTime())) {
        isExpired = expDate.getTime() < Date.now();
      }
    }

    const rawName = String(
      active.planName || active.PlanName || 
      active.membershipType || active.MembershipType || 
      active.name || active.Plan || ''
    ).trim();

    const isPaidFlag = Boolean(active.isPaid ?? active.IsPaid ?? active.isCurrentUserPaid ?? active.IsCurrentUserPaid);
    const hasPaidPlanName = rawName.length > 0 && 
      !rawName.toLowerCase().includes('free') && 
      (
        rawName.toLowerCase().includes('gold') || 
        rawName.toLowerCase().includes('silver') || 
        rawName.toLowerCase().includes('diamond') || 
        rawName.toLowerCase().includes('vip') || 
        rawName.toLowerCase().includes('premium') ||
        rawName.toLowerCase().includes('membership')
      );

    const isCurrentlyPaid = !isExpired && (hasPaidPlanName || (isPaidFlag && rawName.length > 0 && !rawName.toLowerCase().includes('free')));
    const finalPlanName = isCurrentlyPaid ? (rawName || 'VIP Member') : 'Free Member';

    // 🔢 Calculate remaining contacts views
    let remainingViews = 0;
    if (active.remainingContacts != null) {
      remainingViews = Number(active.remainingContacts);
    } else if (active.RemainingContacts != null) {
      remainingViews = Number(active.RemainingContacts);
    } else if (active.remainingContactsAllowed != null) {
      remainingViews = Number(active.remainingContactsAllowed);
    } else if (active.RemainingContactsAllowed != null) {
      remainingViews = Number(active.RemainingContactsAllowed);
    } else if (active.totalContactsAllowed != null && active.contactsUsed != null) {
      remainingViews = Math.max(0, Number(active.totalContactsAllowed) - Number(active.contactsUsed));
    } else if (active.TotalContactsAllowed != null && active.ContactsUsed != null) {
      remainingViews = Math.max(0, Number(active.TotalContactsAllowed) - Number(active.ContactsUsed));
    } else if (active.contactViewsAllowed != null) {
      remainingViews = Number(active.contactViewsAllowed);
    } else if (isCurrentlyPaid) {
      remainingViews = 50; // default for active paid plans
    }

    // 1. Save active subscription snapshot
    const snapshot = {
      ...active,
      isPaid: isCurrentlyPaid,
      isExpired,
      planName: finalPlanName,
      expiryDate: rawExpiry,
      remainingContacts: isCurrentlyPaid ? Math.max(0, remainingViews) : 0
    };
    localStorage.setItem("active_subscription", JSON.stringify(snapshot));

    // 2. Sync into user_details & user_session
    const syncUserObj = (key: string) => {
      const stored = localStorage.getItem(key);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          parsed.isPaid = isCurrentlyPaid;
          parsed.isCurrentUserPaid = isCurrentlyPaid;
          parsed.planName = finalPlanName;
          parsed.membershipType = finalPlanName;
          if (rawExpiry) parsed.planExpiryDate = rawExpiry;
          parsed.remainingContacts = isCurrentlyPaid ? Math.max(0, remainingViews) : 0;
          localStorage.setItem(key, JSON.stringify(parsed));
        } catch (e) {}
      }
    };
    syncUserObj("user_details");
    syncUserObj("user_session");

    // 3. Dispatch global reactive events
    window.dispatchEvent(new Event("subscription_updated"));
    window.dispatchEvent(new Event("user_details_updated"));
  } catch (e) {
    console.error("Error syncing subscription to storage:", e);
  }
};

export const getClientSubscriptionStatus = (): SubscriptionStatus => {
  if (typeof window === "undefined") {
    return {
      isPaid: false,
      planName: '',
      isExpired: true,
      expiryDate: null,
      remainingContacts: 0,
      canChat: false,
      canViewContact: false
    };
  }

  try {
    // 1. Check dedicated active_subscription snapshot first (highest accuracy)
    const activeRaw = localStorage.getItem("active_subscription");
    if (activeRaw) {
      try {
        const active = JSON.parse(activeRaw);
        const rawExpiry = active.expiryDate || active.ExpiryDate || active.endDate || active.EndDate || 
                          active.planExpiryDate || active.PlanExpiryDate || active.ExpiresAt || active.expiresAt || null;
        let isExpired = Boolean(active.isExpired ?? active.IsExpired ?? false);
        if (rawExpiry) {
          const expDate = new Date(rawExpiry);
          if (!isNaN(expDate.getTime())) {
            isExpired = expDate.getTime() < Date.now();
          }
        }

        const rawName = String(
          active.planName || active.PlanName || 
          active.membershipType || active.MembershipType || 
          active.name || ''
        ).trim();

        const isPaidFlag = Boolean(active.isPaid ?? active.IsPaid ?? active.isCurrentUserPaid ?? active.IsCurrentUserPaid);
        const hasPaidPlanName = rawName.length > 0 && 
          !rawName.toLowerCase().includes('free') && 
          (
            rawName.toLowerCase().includes('gold') || 
            rawName.toLowerCase().includes('silver') || 
            rawName.toLowerCase().includes('diamond') || 
            rawName.toLowerCase().includes('vip') || 
            rawName.toLowerCase().includes('premium') ||
            rawName.toLowerCase().includes('membership')
          );

        const isPaid = !isExpired && (hasPaidPlanName || (isPaidFlag && rawName.length > 0 && !rawName.toLowerCase().includes('free')));
        
        let remainingContacts = 0;
        if (active.remainingContacts != null) remainingContacts = Number(active.remainingContacts);
        else if (active.RemainingContacts != null) remainingContacts = Number(active.RemainingContacts);
        else if (active.remainingContactsAllowed != null) remainingContacts = Number(active.remainingContactsAllowed);
        else if (active.totalContactsAllowed != null && active.contactsUsed != null) remainingContacts = Math.max(0, Number(active.totalContactsAllowed) - Number(active.contactsUsed));
        else if (isPaid) remainingContacts = 50;

        if (isPaid) {
          return {
            isPaid: true,
            planName: rawName || 'VIP Member',
            isExpired: false,
            expiryDate: rawExpiry,
            remainingContacts: Math.max(0, remainingContacts),
            canChat: true,
            canViewContact: remainingContacts > 0
          };
        } else if (isExpired) {
          return {
            isPaid: false,
            planName: 'Free Member',
            isExpired: true,
            expiryDate: rawExpiry,
            remainingContacts: 0,
            canChat: false,
            canViewContact: false
          };
        }
      } catch (e) {}
    }

    // 2. Check user_details / user_session fallback
    const raw = localStorage.getItem("user_details") || localStorage.getItem("user_session");
    if (!raw) {
      return {
        isPaid: false,
        planName: '',
        isExpired: true,
        expiryDate: null,
        remainingContacts: 0,
        canChat: false,
        canViewContact: false
      };
    }

    const u = JSON.parse(raw);
    const expiry = u.planExpiryDate || u.expiryDate || u.ExpiresAt || u.ExpiryDate || u.endDate || u.EndDate || null;
    let isExpired = false;

    if (expiry) {
      const expDate = new Date(expiry);
      if (!isNaN(expDate.getTime()) && expDate.getTime() < Date.now()) {
        isExpired = true;
      }
    }

    const val = (v: any) => v === true || v === 1 || v === "1" || v === "true";
    const explicitPaid = val(u.isPaid) || val(u.IsPaid) || val(u.isCurrentUserPaid) || val(u.IsCurrentUserPaid);
    const planName = String(u.planName || u.membershipType || u.MembershipType || '').trim();
    const hasPaidPlanName = planName.toLowerCase().includes('gold') || 
                            planName.toLowerCase().includes('silver') || 
                            planName.toLowerCase().includes('diamond') || 
                            planName.toLowerCase().includes('vip') || 
                            planName.toLowerCase().includes('premium');

    const isPaid = (explicitPaid || hasPaidPlanName) && !isExpired;
    const remainingContacts = isPaid ? Number(u.remainingContacts ?? u.remainingContactsAllowed ?? u.RemainingContacts ?? 50) : 0;

    return {
      isPaid,
      planName: isPaid ? (planName || 'VIP Member') : 'Free Member',
      isExpired,
      expiryDate: expiry,
      remainingContacts: Math.max(0, remainingContacts),
      canChat: isPaid,
      canViewContact: isPaid && remainingContacts > 0
    };
  } catch (e) {
    return {
      isPaid: false,
      planName: '',
      isExpired: true,
      expiryDate: null,
      remainingContacts: 0,
      canChat: false,
      canViewContact: false
    };
  }
};
