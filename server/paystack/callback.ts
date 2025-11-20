import { Request, Response } from "express";
import { createClient } from "@supabase/supabase-js";
import { addMonths } from "date-fns";

const supabaseUrl = process.env.VITE_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

export async function handleCallback(req: Request, res: Response) {
  try {
    const { reference, trxref } = req.query;
    const transactionRef = reference || trxref;

    if (!transactionRef) {
      return res.redirect("/settings/subscription?error=missing_reference");
    }

    if (!PAYSTACK_SECRET_KEY) {
      return res.redirect("/settings/subscription?error=configuration_error");
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
      return res.redirect("/settings/subscription?error=payment_failed");
    }

    // Extract metadata
    const metadata = verifyData.data.metadata;
    const { clinic_id, plan } = metadata;
    const amount = verifyData.data.amount / 100; // Convert from kobo to currency

    if (!clinic_id || !plan) {
      return res.redirect("/settings/subscription?error=invalid_metadata");
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
      return res.redirect("/settings/subscription?error=database_error");
    }

    // Create payment record (optional - you might want to add a payments table)
    // For now, we'll just redirect with success
    
    return res.redirect("/settings/subscription?success=payment_successful");
  } catch (error: any) {
    console.error("Callback error:", error);
    return res.redirect("/settings/subscription?error=internal_error");
  }
}
