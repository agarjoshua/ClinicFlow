import { Request, Response } from "express";
import { createClient } from "@supabase/supabase-js";
import * as crypto from "crypto";
import { addMonths } from "date-fns";

const supabaseUrl = process.env.VITE_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

export async function handleWebhook(req: Request, res: Response) {
  try {
    // Verify webhook signature
    const hash = crypto
      .createHmac("sha512", PAYSTACK_SECRET_KEY || "")
      .update(JSON.stringify(req.body))
      .digest("hex");

    const signature = req.headers["x-paystack-signature"];

    if (hash !== signature) {
      console.error("Invalid webhook signature");
      return res.status(400).json({ status: false, message: "Invalid signature" });
    }

    const event = req.body;
    const eventType = event.event;
    const data = event.data;

    console.log(`Processing webhook event: ${eventType}`);

    switch (eventType) {
      case "charge.success":
        await handleChargeSuccess(data);
        break;

      case "subscription.disable":
        await handleSubscriptionDisable(data);
        break;

      case "subscription.not_renew":
        await handleSubscriptionNotRenew(data);
        break;

      case "subscription.create":
        await handleSubscriptionCreate(data);
        break;

      default:
        console.log(`Unhandled event type: ${eventType}`);
    }

    return res.status(200).json({ status: true, message: "Webhook processed" });
  } catch (error: any) {
    console.error("Webhook error:", error);
    return res.status(500).json({ status: false, message: error.message });
  }
}

async function handleChargeSuccess(data: any) {
  try {
    const metadata = data.metadata;
    
    if (!metadata?.clinic_id || !metadata?.plan) {
      console.error("Missing clinic_id or plan in metadata");
      return;
    }

    const subscriptionEndDate = addMonths(new Date(), 1);

    const { error } = await supabase
      .from("clinics")
      .update({
        subscription_tier: metadata.plan,
        subscription_status: "active",
        subscription_end_date: subscriptionEndDate.toISOString(),
      })
      .eq("id", metadata.clinic_id);

    if (error) {
      console.error("Failed to update clinic on charge success:", error);
    } else {
      console.log(`Successfully updated clinic ${metadata.clinic_id} to active`);
    }

    // TODO: Create payment record in payments table
    // await createPaymentRecord({
    //   clinic_id: metadata.clinic_id,
    //   amount: data.amount / 100,
    //   reference: data.reference,
    //   status: 'success',
    // });

  } catch (error) {
    console.error("Error handling charge success:", error);
  }
}

async function handleSubscriptionDisable(data: any) {
  try {
    const metadata = data.metadata;
    
    if (!metadata?.clinic_id) {
      console.error("Missing clinic_id in metadata");
      return;
    }

    const { error } = await supabase
      .from("clinics")
      .update({
        subscription_status: "suspended",
      })
      .eq("id", metadata.clinic_id);

    if (error) {
      console.error("Failed to suspend clinic:", error);
    } else {
      console.log(`Successfully suspended clinic ${metadata.clinic_id}`);
    }
  } catch (error) {
    console.error("Error handling subscription disable:", error);
  }
}

async function handleSubscriptionNotRenew(data: any) {
  try {
    const metadata = data.metadata;
    
    if (!metadata?.clinic_id) {
      console.error("Missing clinic_id in metadata");
      return;
    }

    const { error } = await supabase
      .from("clinics")
      .update({
        subscription_status: "cancelled",
      })
      .eq("id", metadata.clinic_id);

    if (error) {
      console.error("Failed to cancel clinic subscription:", error);
    } else {
      console.log(`Successfully cancelled subscription for clinic ${metadata.clinic_id}`);
    }
  } catch (error) {
    console.error("Error handling subscription not renew:", error);
  }
}

async function handleSubscriptionCreate(data: any) {
  try {
    const metadata = data.metadata;
    
    if (!metadata?.clinic_id) {
      console.error("Missing clinic_id in metadata");
      return;
    }

    console.log(`Subscription created for clinic ${metadata.clinic_id}`);
    // Additional processing if needed
  } catch (error) {
    console.error("Error handling subscription create:", error);
  }
}
