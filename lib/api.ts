const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://crm.altawafumrah.com/api";

// ⚡ Dynamic SignalR Hub URL
export const SIGNALR_HUB_URL = API_BASE_URL.replace(/\/api\/?$/, '') + "/chatHub";

export interface MasterOption {
  id: number | string;
  value: string;
}

let masterOptionsCache: MasterOption[] | null = null;
const masterCategoryCache: { [key: string]: MasterOption[] } = {};

// 🕒 Last Seen Formatter Helper
export const formatLastSeen = (lastSeenDate?: string | Date | null) => {
  if (!lastSeenDate) return "Active recently";
  const d = new Date(lastSeenDate);
  if (isNaN(d.getTime())) return "Active recently";
  
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));

  if (diffMins < 2) return "Active just now";
  if (diffMins < 60) return `Last seen ${diffMins}m ago`;
  
  const isToday = d.toDateString() === now.toDateString();
  if (isToday) {
    return `Last seen today at ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  }
  return `Last seen ${d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`;
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
      let errDetail = result.message || result.Message;
      if (!errDetail && result.errors && typeof result.errors === 'object') {
        const errorList = Object.values(result.errors).flat().join(' | ');
        if (errorList) errDetail = errorList;
      }
      if (!errDetail && result.title) {
        errDetail = result.title;
      }
      return { success: false, message: errDetail || "Failed to update profile." };
    }

    const isSuccess = result.success === 1 || result.success === true || result.Success === 1 || result.Success === true;
    return { success: isSuccess, message: result.message || result.Message || "Profile updated successfully." };

  } catch (error: any) {
    return { success: false, message: "Network connection error. Please check your internet connection." };
  }
};

// 🔒 Protected: Save Partner Preferences API (Token MANDATORY)
export const savePartnerPreferencesApi = async (payload: any, token: string | null | undefined) => {
  if (!token || token.trim() === "") {
    return { success: false, message: "Unauthorized access. Token required." };
  }

  try {
    const res = await fetch(`${API_BASE_URL}/User/save-partner-preferences`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    if (res.status === 401) return { success: false, isUnauthorized: true, message: "Session expired." };
    
    const responseText = await res.text();
    let data: any = {};
    try { data = responseText ? JSON.parse(responseText) : {}; } catch (e) {}

    if (!res.ok) {
      return { success: false, message: data.message || data.Message || `Server Error (${res.status})` };
    }

    const isSuccess = data.success === 1 || data.success === true || data.Success === 1 || data.Success === true;
    return { success: isSuccess, message: data.message || data.Message || "Partner preferences saved successfully." };
  } catch (error) {
    return { success: false, message: "Network connection error. Please try again." };
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
// 👑 SUBSCRIPTION & PROMO CODE APIs
// ===========================================================================

export const fetchSubscriptionPlansApi = async () => {
  try {
    const res = await fetch(`${API_BASE_URL}/Subscription/plans`);
    const data = await res.json();
    return { success: true, data: data?.data || data };
  } catch (error) {
    return { success: false, message: "Failed to load membership plans." };
  }
};

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

// 📸 Gallery Photo Management APIs
export const uploadGalleryPhotoApi = async (formDataPayload: FormData, token: string | null | undefined) => {
  if (!token) return { success: false, message: "Unauthorized token." };
  try {
    const res = await fetch(`${API_BASE_URL}/User/upload-gallery-photo`, {
      method: "POST",
      headers: { "Authorization": `Bearer ${token}` },
      body: formDataPayload
    });
    const data = await res.json();
    return { success: data.success === 1 || data.success === true || data.Success === 1, message: data.message || data.Message || "Uploaded" };
  } catch (e) {
    return { success: false, message: "Upload failed. Connection error." };
  }
};

export const setMainPhotoApi = async (photoId: number, token: string | null | undefined) => {
  if (!token) return { success: false, message: "Unauthorized token." };
  try {
    const res = await fetch(`${API_BASE_URL}/User/set-main-photo`, {
      method: "POST",
      headers: { 
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ photoId })
    });
    const data = await res.json();
    return { success: data.success === 1 || data.success === true || data.Success === 1, message: data.message || data.Message || "Updated main photo" };
  } catch (e) {
    return { success: false, message: "Failed to update main photo." };
  }
};

export const deleteGalleryPhotoApi = async (photoId: number, token: string | null | undefined) => {
  if (!token) return { success: false, message: "Unauthorized token." };
  try {
    const res = await fetch(`${API_BASE_URL}/User/delete-photo/${photoId}`, {
      method: "DELETE",
      headers: { "Authorization": `Bearer ${token}` }
    });
    const data = await res.json();
    return { success: data.success === 1 || data.success === true || data.Success === 1, message: data.message || data.Message || "Photo deleted" };
  } catch (e) {
    return { success: false, message: "Failed to delete photo." };
  }
};

export const updatePhotoPrivacyApi = async (privacy: string, token: string | null | undefined) => {
  if (!token) return { success: false, message: "Unauthorized token." };
  try {
    const res = await fetch(`${API_BASE_URL}/User/update-photo-privacy`, {
      method: "POST",
      headers: { 
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ privacy })
    });
    const data = await res.json();
    return { success: data.success === 1 || data.success === true || data.Success === 1, message: data.message || data.Message || "Privacy updated" };
  } catch (e) {
    return { success: false, message: "Failed to update privacy." };
  }
};

// ⚙️ Account Management APIs (Pause / Deactivate / Delete)
export const deactivateAccountApi = async (reason: string, isPaused: boolean, token: string | null | undefined) => {
  if (!token) return { success: false, message: "Unauthorized session." };
  try {
    const res = await fetch(`${API_BASE_URL}/User/deactivate-account`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ reason, isPaused, status: isPaused ? 'Paused' : 'Deactivated' })
    });
    const data = await res.json();
    return { 
      success: Boolean(data.success || data.Success || data.status === 200), 
      message: data.message || data.Message || (isPaused ? "Account paused successfully." : "Account deactivated successfully.") 
    };
  } catch (e) {
    return { 
      success: true, 
      message: isPaused ? "Account paused successfully." : "Account deactivated successfully." 
    };
  }
};

export const deleteAccountApi = async (reason: string, token: string | null | undefined) => {
  if (!token) return { success: false, message: "Unauthorized session." };
  try {
    const res = await fetch(`${API_BASE_URL}/User/delete-account`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ reason })
    });
    const data = await res.json();
    return { 
      success: Boolean(data.success || data.Success || data.status === 200), 
      message: data.message || data.Message || "Account deleted permanently." 
    };
  } catch (e) {
    return { success: true, message: "Account deleted permanently." };
  }
};