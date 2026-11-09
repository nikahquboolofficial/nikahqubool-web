/**
 * 📲 Fast2SMS DLT Gateway Service for Nikah Qubool (Next.js)
 */

const FAST2SMS_API_KEY = process.env.FAST2SMS_API_KEY || "r1fgrN0mvVT1d4aDrqRBuZtKyWaX6ALmI0MAho3qswl9Yz2JNPWiq0JWOHD3KmNv7X5Djv1y5EV719oT";
const SENDER_ID = "NKHQBL";
const ROUTE = "dlt";

export const DLT_TEMPLATES = {
  // 6-digit dynamic OTP for Login & Registration
  LOGIN_OTP: "230951",
  WELCOME_COMPLETE_PROFILE: "",
  PAYMENT_SUCCESS: "",
  PLAN_EXPIRING: "",
  PROFILE_VERIFIED: "",
  PROFILE_REJECTED: ""
};

export interface SendSmsParams {
  mobile: string;
  messageId: string;
  variablesValues: string;
}

/**
 * Core reusable function to dispatch any DLT SMS via Fast2SMS
 */
export async function sendFast2Sms({ mobile, messageId, variablesValues }: SendSmsParams) {
  if (!FAST2SMS_API_KEY) {
    return { success: false, message: "Fast2SMS API Key is not configured." };
  }

  const cleanMobile = mobile.replace(/\D/g, '').slice(-10);
  if (cleanMobile.length !== 10) {
    return { success: false, message: "Invalid 10-digit mobile number." };
  }

  // Fast2SMS DLT requires application/x-www-form-urlencoded
  const params = new URLSearchParams();
  params.append("sender_id", SENDER_ID);
  params.append("message", messageId);
  params.append("route", ROUTE);
  params.append("numbers", cleanMobile);
  params.append("variables_values", variablesValues);

  try {
    const response = await fetch("https://www.fast2sms.com/dev/bulkV2", {
      method: "POST",
      headers: {
        "authorization": FAST2SMS_API_KEY,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });

    const data = await response.json();
    const isSuccess = !!data.return;
    const msg = Array.isArray(data.message) ? data.message.join(', ') : (data.message || (isSuccess ? "SMS sent successfully" : "SMS failed"));

    return {
      success: isSuccess,
      message: msg,
      requestId: data.request_id,
      data
    };
  } catch (err: any) {
    console.error("[Fast2SMS] Error sending SMS:", err);
    return {
      success: false,
      message: err?.message || "Failed to connect to Fast2SMS gateway."
    };
  }
}

/**
 * Direct helper for Login OTP SMS
 */
export async function sendOtpSms(mobile: string, otp: string) {
  return sendFast2Sms({
    mobile,
    messageId: DLT_TEMPLATES.LOGIN_OTP,
    variablesValues: otp
  });
}
