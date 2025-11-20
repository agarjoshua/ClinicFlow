import { createClient } from "@supabase/supabase-js";
import { addMonths } from "date-fns";

const supabaseUrl = process.env.VITE_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

export const handler = async (event: any) => {
  try {
    const params = event.queryStringParameters || {};
    const { reference, trxref } = params;
    const transactionRef = reference || trxref;

    if (!transactionRef) {
      return {
        statusCode: 302,
        headers: {
          Location: "/settings/subscription?error=missing_reference",
        },
        body: "",
      };
    }

    if (!PAYSTACK_SECRET_KEY) {
      return {
        statusCode: 302,
        headers: {
          Location: "/settings/subscription?error=configuration_error",
        },
        body: "",
      };
    }

    // Verify transaction with Paystack
    const verifyResponse = await fetch(
      `https://api.paystack.co/transaction/verify/${transactionRef}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        },
      }
    );

    const verifyData = await verifyResponse.json();

    if (!verifyData.status || verifyData.data.status !== "success") {
      return {
        statusCode: 302,
        headers: {
          Location: "/settings/subscription?error=payment_failed",
        },
        body: "",
      };
    }

    // Extract metadata
    const metadata = verifyData.data.metadata;
    const { clinic_id, plan } = metadata;

    if (!clinic_id || !plan) {
      return {
        statusCode: 302,
        headers: {
          Location: "/settings/subscription?error=invalid_metadata",
        },
        body: "",
      };
    }

    // Calculate subscription end date (1 month from now)
    const subscriptionEndDate = addMonths(new Date(), 1);

    // Update clinic subscription status
    const { error: updateError } = await supabase
      .from("clinics")
      .update({
        subscription_tier: plan,
        subscription_status: "active",
        subscription_end_date: subscriptionEndDate.toISOString(),
      })
      .eq("id", clinic_id);

    if (updateError) {
      console.error("Failed to update clinic subscription:", updateError);
      return {
        statusCode: 302,
        headers: {
          Location: "/settings/subscription?error=database_error",
        },
        body: "",
      };
    }

    return {
      statusCode: 302,
      headers: {
        Location: "/settings/subscription?success=payment_successful",
      },
      body: "",
    };
  } catch (error: any) {
    console.error("Callback error:", error);
    return {
      statusCode: 302,
      headers: {
        Location: "/settings/subscription?error=internal_error",
      },
      body: "",
    };
  }
};
