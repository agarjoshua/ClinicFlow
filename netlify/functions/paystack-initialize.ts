import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.VITE_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

export const handler = async (event: any) => {
  // Only allow POST requests
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ status: false, message: "Method not allowed" }),
    };
  }

  try {
    if (!PAYSTACK_SECRET_KEY) {
      return {
        statusCode: 500,
        body: JSON.stringify({
          status: false,
          message: "Paystack secret key not configured",
        }),
      };
    }

    const body = JSON.parse(event.body || "{}");
    const { email, amount, plan, clinic_id, callback_url } = body;

    // Validate required fields
    if (!email || !amount || !plan || !clinic_id) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          status: false,
          message: "Missing required fields",
        }),
      };
    }

    // Verify clinic exists
    const { data: clinic, error: clinicError } = await supabase
      .from("clinics")
      .select("*")
      .eq("id", clinic_id)
      .single();

    if (clinicError || !clinic) {
      return {
        statusCode: 404,
        body: JSON.stringify({
          status: false,
          message: "Clinic not found",
        }),
      };
    }

    // Initialize Paystack transaction
    const paystackResponse = await fetch(
      "https://api.paystack.co/transaction/initialize",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          amount,
          callback_url,
          metadata: {
            clinic_id,
            plan,
            clinic_name: clinic.name,
          },
          channels: ["card", "bank", "ussd", "mobile_money"],
        }),
      }
    );

    const paystackData = await paystackResponse.json();

    if (!paystackData.status) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          status: false,
          message: paystackData.message || "Failed to initialize payment",
        }),
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify(paystackData),
    };
  } catch (error: any) {
    console.error("Paystack initialization error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        status: false,
        message: error.message || "Internal server error",
      }),
    };
  }
};
