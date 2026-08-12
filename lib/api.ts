const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://localhost:7204/api";

// ⚡ Dynamic SignalR Hub URL
export const SIGNALR_HUB_URL = API_BASE_URL.replace(/\/api\/?$/, '') + "/chatHub";

export interface MasterOption {
  id: number;
  value: string;
}

let masterOptionsCache: MasterOption[] | null = null;
const masterCategoryCache: { [key: string]: MasterOption[] } = {};

// 🕒 Last Seen Formatter Helper
export const formatLastSeen = (lastSeenDate?: string | Date | null) => {
  if (!lastSeenDate) return "Offline";
  const d = new Date(lastSeenDate);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));

  if (diffMins < 1) return "Last seen just now";
  if (diffMins < 60) return `Last seen ${diffMins}m ago`;
  
  const isToday = d.toDateString() === now.toDateString();
  if (isToday) {
    return `Last seen today at ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  }
  return `Last seen ${d.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' })}`;
};

// 🔓 Public: Profile Created For Master
export const fetchProfileCreatedForOptions = async (): Promise<MasterOption[]> => {
  if (masterOptionsCache && masterOptionsCache.length > 0) return masterOptionsCache;
  if (typeof window !== "undefined") {
    const localData = sessionStorage.getItem("cache_profile_options");
    if (localData) {
      try {
        masterOptionsCache = JSON.parse(localData);
        return masterOptionsCache!;
      } catch (e) {}
    }
  }

  try {
    const res = await fetch(`${API_BASE_URL}/Master/PROFILE_CREATED_FOR`);
    const result = await res.json();
    if (result && (result.success || result.Success) && Array.isArray(result.data || result.Data)) {
      const dataList = result.data || result.Data;
      masterOptionsCache = dataList;
      if (typeof window !== "undefined") sessionStorage.setItem("cache_profile_options", JSON.stringify(dataList));
      return dataList;
    }
  } catch (error) {}
  return [];
};

// 🔓 Public: Master Data Fetcher (No Token Needed)
export const fetchMasterDataApi = async (type: string): Promise<MasterOption[]> => {
  const cacheKey = `cache_master_${type.toUpperCase()}`;
  if (masterCategoryCache[cacheKey]) return masterCategoryCache[cacheKey];

  if (typeof window !== "undefined") {
    const local = sessionStorage.getItem(cacheKey);
    if (local) {
      try {
        const parsed = JSON.parse(local);
        masterCategoryCache[cacheKey] = parsed;
        return parsed;
      } catch (e) {}
    }
  }

  try {
    const res = await fetch(`${API_BASE_URL}/Master/${type}`);
    const json = await res.json();
    const list = Array.isArray(json) ? json : (json.data || json.Data || json.result || []);
    if (Array.isArray(list) && list.length > 0) {
      masterCategoryCache[cacheKey] = list;
      if (typeof window !== "undefined") sessionStorage.setItem(cacheKey, JSON.stringify(list));
      return list;
    }
  } catch (e) {}

  return [];
};

// 🔓 Public: Cities Fetcher (No Token Needed)
export const fetchCitiesApi = async (stateId: number): Promise<MasterOption[]> => {
  if (!stateId || stateId <= 0) return [];
  try {
    const res = await fetch(`${API_BASE_URL}/Master/CITIES?parentId=${stateId}`);
    const json = await res.json();
    return Array.isArray(json) ? json : (json.data || json.Data || json.result || []);
  } catch (e) {
    return [];
  }
};

// 🔓 Public: Send OTP (No Token Needed)
export const sendOtpApi = async (phone: string, mail: string, action: 'Register' | 'Login') => {
  try {
    const res = await fetch(`${API_BASE_URL}/auth/send-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mobileNumber: phone, email: mail || "null", source: "Web", action }),
    });
    return await res.json();
  } catch (e) {
    return { success: false, message: 'Server connection error. Please try again.' };
  }
};

// 🔓 Public: Verify OTP & Login (No Token Needed)
export const verifyOtpApi = async (payload: any) => {
  try {
    const res = await fetch(`${API_BASE_URL}/auth/verify-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return await res.json();
  } catch (e) {
    return { success: false, message: 'Connection error. Please check internet connection.' };
  }
};

// 🔒 Protected: Update Profile API (Token MANDATORY)
export const updateProfileApi = async (formDataPayload: FormData, token: string | null | undefined) => {
  if (!token || token.trim() === "") {
    return { success: false, message: "Unauthorized access. Please login to complete your profile." };
  }

  try {
    const response = await fetch(`${API_BASE_URL}/User/update-profile`, {
      method: "POST",
      headers: { "Authorization": `Bearer ${token}` },
      body: formDataPayload,
    });

    if (response.status === 401) {
      return { success: false, message: "Session expired or invalid token. Please login again." };
    }

    const responseText = await response.text();
    let result: any = {};

    try {
      result = responseText ? JSON.parse(responseText) : {};
    } catch (e) {
      return { success: false, message: `Server Error (${response.status})` };
    }

    if (!response.ok) {
      return { success: false, message: result.message || result.Message || "Failed to update profile." };
    }

    const isSuccess = result.success === 1 || result.success === true || result.Success === 1 || result.Success === true;
    return { success: isSuccess, message: result.message || result.Message || "Profile updated successfully." };

  } catch (error: any) {
    return { success: false, message: "Network connection error. Please check your internet connection." };
  }
};

// 🔒 Protected: Dashboard Data Fetcher API (Token MANDATORY)
export const fetchDashboardApi = async (activeTab: string, pageNumber: number, token: string | null | undefined) => {
  if (!token) return { success: false, isUnauthorized: true, message: "Unauthorized token" };

  try {
    const res = await fetch(`${API_BASE_URL}/Dashboard/get-dashboard?activeTab=${activeTab}&pageNumber=${pageNumber}&pageSize=12`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      }
    });

    if (res.status === 401) return { success: false, isUnauthorized: true, message: "Session expired." };
    if (!res.ok) return { success: false, message: `Server error (${res.status})` };

    const data = await res.json();
    return { success: true, data: data?.data || data };
  } catch (error) {
    return { success: false, message: "Failed to connect to backend server." };
  }
};

// 🔒 Protected: Dashboard Interactions API (Token MANDATORY)
export const handleInteractionApiCall = async (receiverUserId: number, interactionType: string, actionStatus: string, token: string | null | undefined) => {
  if (!token) return { success: false, isUnauthorized: true, message: "Unauthorized token" };

  try {
    const res = await fetch(`${API_BASE_URL}/Dashboard/handle-interaction`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ receiverUserId, interactionType, actionStatus })
    });

    if (res.status === 401) return { success: false, isUnauthorized: true, message: "Session expired." };
    const data = await res.json();
    return { success: data.success || data.Success, message: data.message || data.Message, details: data.details || data.Details };
  } catch (error) {
    return { success: false, message: "Network error during action execution." };
  }
};

// 🔒 Protected: Fetch Complete Profile Details
export const fetchProfileDetailsApi = async (targetUserId: number, token: string | null | undefined) => {
  if (!token) return { success: false, isUnauthorized: true, message: "Unauthorized token" };

  try {
    const res = await fetch(`${API_BASE_URL}/User/get-profile-details?targetUserId=${targetUserId}`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      }
    });

    if (res.status === 401) return { success: false, isUnauthorized: true, message: "Session expired." };
    if (!res.ok) return { success: false, message: `Server error (${res.status})` };

    const data = await res.json();
    return { success: true, data: data?.data || data };
  } catch (error) {
    return { success: false, message: "Failed to connect to backend server." };
  }
};

// 🔒 Protected: Unlock & View Contact Details
export const viewContactDetailsApi = async (targetUserId: number, token: string | null | undefined) => {
  if (!token) return { success: false, isUnauthorized: true, message: "Unauthorized token" };

  try {
    const res = await fetch(`${API_BASE_URL}/User/view-contact`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ targetUserId })
    });

    if (res.status === 401) return { success: false, isUnauthorized: true, message: "Session expired." };
    const data = await res.json();
    return { success: data.success || data.Success, message: data.message || data.Message, data: data.data || data.Data || data };
  } catch (error) {
    return { success: false, message: "Network connection error." };
  }
};

// 🔒 Protected: Block / Unblock User API (Single Endpoint for Both)
export const blockUserApiCall = async (targetUserId: number, token: string | null | undefined) => {
  if (!token) return { success: false, isUnauthorized: true, message: "Unauthorized token" };

  try {
    const res = await fetch(`${API_BASE_URL}/User/block-user`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ targetUserId })
    });

    if (res.status === 401) return { success: false, isUnauthorized: true, message: "Session expired." };
    const data = await res.json();
    return { 
      success: Boolean(data.success ?? data.Success), 
      message: data.message ?? data.Message ?? "Block status updated successfully." 
    };
  } catch (error) {
    return { success: false, message: "Failed to connect to server." };
  }
};

export const unblockUserApiCall = blockUserApiCall;

// ===========================================================================
// 💬 CHAT SYSTEM APIs (Token MANDATORY)
// ===========================================================================

export const fetchChatInboxApi = async (page: number = 1, size: number = 20, token: string | null | undefined) => {
  if (!token) return { success: false, isUnauthorized: true, message: "Unauthorized token" };

  try {
    const res = await fetch(`${API_BASE_URL}/Chat/inbox?page=${page}&size=${size}`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      }
    });

    if (res.status === 401) return { success: false, isUnauthorized: true, message: "Session expired." };
    const data = await res.json();
    return { success: true, data: data?.data || data };
  } catch (error) {
    return { success: false, message: "Failed to connect to chat server." };
  }
};

export const fetchChatHistoryApi = async (receiverId: number, page: number = 1, size: number = 50, token: string | null | undefined) => {
  if (!token) return { success: false, isUnauthorized: true, message: "Unauthorized token" };

  try {
    const res = await fetch(`${API_BASE_URL}/Chat/history?rId=${receiverId}&page=${page}&size=${size}`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      }
    });

    if (res.status === 401) return { success: false, isUnauthorized: true, message: "Session expired." };
    const data = await res.json();
    return { success: true, data: data?.data || data };
  } catch (error) {
    return { success: false, message: "Failed to load chat history." };
  }
};

export const sendChatMessageApi = async (receiverId: number, messageText: string, messageType: string = "Text", token: string | null | undefined) => {
  if (!token) return { success: false, isUnauthorized: true, message: "Unauthorized token" };

  try {
    const res = await fetch(`${API_BASE_URL}/Chat/send`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ receiverId, messageText, messageType })
    });

    if (res.status === 401) return { success: false, isUnauthorized: true, message: "Session expired." };
    const data = await res.json();
    return { success: true, data };
  } catch (error) {
    return { success: false, message: "Failed to send message." };
  }
};

export const markChatReadApi = async (senderId: number, token: string | null | undefined) => {
  if (!token) return { success: false, isUnauthorized: true, message: "Unauthorized token" };

  try {
    const res = await fetch(`${API_BASE_URL}/Chat/mark-read?senderId=${senderId}`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      }
    });

    if (res.status === 401) return { success: false, isUnauthorized: true, message: "Session expired." };
    const data = await res.json();
    return { success: true, data };
  } catch (error) {
    return { success: false, message: "Failed to mark messages read." };
  }
};

export const fetchBlockStatusApi = async (targetUserId: number, token: string | null | undefined) => {
  if (!token) return { success: false, isUnauthorized: true, message: "Unauthorized token" };

  try {
    const res = await fetch(`${API_BASE_URL}/Chat/block-status?targetUserId=${targetUserId}`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      }
    });

    if (res.status === 401) return { success: false, isUnauthorized: true, message: "Session expired." };
    const data = await res.json();
    return { success: true, data };
  } catch (error) {
    return { success: false, message: "Failed to fetch block status." };
  }
};

// ===========================================================================
// 👑 SUBSCRIPTION & PROMO CODE APIs (EXPORTS ADDED)
// ===========================================================================

// 🔓 Public / Protected: Fetch Membership Plans
export const fetchSubscriptionPlansApi = async () => {
  try {
    const res = await fetch(`${API_BASE_URL}/Subscription/plans`);
    const data = await res.json();
    return { success: true, data: data?.data || data };
  } catch (error) {
    return { success: false, message: "Failed to load membership plans." };
  }
};

// 🔒 Protected: Validate Promo Code
export const validatePromoCodeApi = async (code: string, planId: number, token: string | null | undefined) => {
  if (!token) return { success: false, isUnauthorized: true, message: "Unauthorized token" };
  try {
    const res = await fetch(`${API_BASE_URL}/Subscription/validate-promo`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ code, planId })
    });
    if (res.status === 401) return { success: false, isUnauthorized: true, message: "Session expired." };
    
    const data = await res.json();
    return { 
      success: Boolean(data.success), 
      message: data.message || "Validation completed.", 
      code: data.code || code,
      discountAmount: data.discountAmount ?? 0,
      finalPrice: data.finalPrice
    };
  } catch (error: any) {
    return { success: false, message: error?.message || "Failed to validate promo code." };
  }
};

// 🔒 Protected: Purchase Membership Plan
export const purchaseSubscriptionApi = async (planId: number, promoCode: string | null, token: string | null | undefined) => {
  if (!token) return { success: false, isUnauthorized: true, message: "Unauthorized token" };

  try {
    const res = await fetch(`${API_BASE_URL}/Subscription/purchase`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ planId, promoCode })
    });

    if (res.status === 401) return { success: false, isUnauthorized: true, message: "Session expired." };
    const data = await res.json();
    return { success: Boolean(data.success), message: data.message || "Plan purchased!", data: data.data };
  } catch (error) {
    return { success: false, message: "Transaction failed. Please try again." };
  }
};

// 🔒 Protected: Fetch Active User Subscription
export const fetchActiveSubscriptionApi = async (token: string | null | undefined) => {
  if (!token) return { success: false, isUnauthorized: true, message: "Unauthorized token" };

  try {
    const res = await fetch(`${API_BASE_URL}/Subscription/active`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      }
    });

    if (res.status === 401) return { success: false, isUnauthorized: true, message: "Session expired." };
    const data = await res.json();
    return { success: true, data: data?.data || data };
  } catch (error) {
    return { success: false, message: "Failed to fetch active subscription." };
  }
};

// 🔒 Protected: Fetch Subscription Payment History
export const fetchSubscriptionHistoryApi = async (token: string | null | undefined) => {
  if (!token) return { success: false, isUnauthorized: true, message: "Unauthorized token" };

  try {
    const res = await fetch(`${API_BASE_URL}/Subscription/history`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      }
    });

    if (res.status === 401) return { success: false, isUnauthorized: true, message: "Session expired." };
    const data = await res.json();
    return { success: true, data: data?.data || data };
  } catch (error) {
    return { success: false, message: "Failed to fetch payment history." };
  }
};

export const searchMatchesApi = async (searchPayload: any, token: string | null | undefined) => {
  if (!token) return { success: false, isUnauthorized: true, message: "Unauthorized token" };
  try {
    const res = await fetch(`${API_BASE_URL}/Match/search`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(searchPayload)
    });
    if (res.status === 401) return { success: false, isUnauthorized: true, message: "Session expired." };
    
    const text = await res.text();
    let data: any = {};
    try { data = text ? JSON.parse(text) : {}; } catch (e) {}
    if (!res.ok) {
      return { success: false, message: data.message || `Server Error (${res.status})` };
    }
    return { 
      success: Boolean(data.success), 
      data: data.data || [],
      isUserPaid: Boolean(data.isUserPaid)
    };
  } catch (error: any) {
    return { success: false, message: error?.message || "Failed to fetch matches." };
  }
};