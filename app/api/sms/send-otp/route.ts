import { NextRequest, NextResponse } from "next/server";
import { sendFast2Sms, DLT_TEMPLATES } from "@/lib/fast2sms";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { mobile, messageId, variables_values, otp } = body;

    if (!mobile) {
      return NextResponse.json({ success: false, message: "Mobile number is required." }, { status: 400 });
    }

    const targetMessageId = messageId || DLT_TEMPLATES.LOGIN_OTP;
    const targetVars = variables_values || otp || "";

    const res = await sendFast2Sms({
      mobile,
      messageId: targetMessageId,
      variablesValues: targetVars,
    });

    return NextResponse.json(res);
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err?.message || "Internal server error." },
      { status: 500 }
    );
  }
}
