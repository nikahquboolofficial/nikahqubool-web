export interface SubscriptionStatus {
  isPaid: boolean;
  planName: string;
  isExpired: boolean;
  expiryDate: string | null;
  remainingContacts: number;
  canChat: boolean;
  canViewContact: boolean;
}

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
    const expiry = u.planExpiryDate || u.expiryDate || u.ExpiresAt || u.ExpiryDate || null;
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
    const remainingContacts = Number(u.remainingContacts ?? u.remainingContactsAllowed ?? u.RemainingContacts ?? 0);

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
