import { Request, Response } from "express";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.VITE_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

interface InitializePaymentRequest {
  email: string;
  amount: number; // in kobo (smallest currency unit)
  plan: string;
  clinic_id: number;
  callback_url: string;
}

export async function initializePayment(req: Request, res: Response) {
  try {
    if (!PAYSTACK_SECRET_KEY) {
      return res.status(500).json({
        status: false,
        message: "Paystack secret key not configured",
      });
    }

    const { email, amount, plan, clinic_id, callback_url }: InitializePaymentRequest = req.body;

    // Validate required fields
    if (!email || !amount || !plan || !clinic_id) {
      return res.status(400).json({
        status: false,
        message: "Missing required fields",
      });
    }

    // Verify clinic exists
    const { data: clinic, error: clinicError } = await supabase
      .from("clinics")
      .select("*")
      .eq("id", clinic_id)
      .single();

    if (clinicError || !clinic) {
      return res.status(404).json({
        status: false,
        message: "Clinic not found",
      });
    }

    // Initialize Paystack transaction
    const paystackResponse = await fetch("https://api.paystack.co/transaction/initialize", {
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
    });

    const paystackData = await paystackResponse.json();

    if (!paystackData.status) {
      return res.status(400).json({
        status: false,
        message: paystackData.message || "Failed to initialize payment",
      });
    }

    // Return Paystack response with authorization URL
    return res.json(paystackData);
  } catch (error: any) {
    console.error("Paystack initialization error:", error);
    return res.status(500).json({
      status: false,
      message: error.message || "Internal server error",
    });
  }
}
