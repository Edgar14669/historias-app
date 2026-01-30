import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CustomerInfo {
  subscriber: {
    original_app_user_id: string;
    management_url: string | null;
    subscriptions: Record<string, {
      expires_date: string;
      purchase_date: string;
      original_purchase_date: string;
      product_plan_identifier: string | null;
      period_type: string;
      store: string;
      is_sandbox: boolean;
      unsubscribe_detected_at: string | null;
      billing_issues_detected_at: string | null;
    }>;
    entitlements: Record<string, {
      expires_date: string | null;
      purchase_date: string;
      product_identifier: string;
    }>;
  };
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get the authorization header from the request (Supabase JWT)
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get RevenueCat API key
    const revenueCatApiKey = Deno.env.get("REVENUECAT_API_KEY");
    if (!revenueCatApiKey) {
      console.error("REVENUECAT_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "RevenueCat not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Query RevenueCat API for customer info
    // We use the Supabase user ID as the RevenueCat app_user_id
    const customerId = user.id;
    
    const revenueCatResponse = await fetch(
      `https://api.revenuecat.com/v1/subscribers/${customerId}`,
      {
        headers: {
          "Authorization": `Bearer ${revenueCatApiKey}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!revenueCatResponse.ok) {
      // If 404, user doesn't have any purchases yet
      if (revenueCatResponse.status === 404) {
        return new Response(
          JSON.stringify({ 
            has_premium: false, 
            entitlements: [],
            message: "No purchase history found"
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      throw new Error(`RevenueCat API error: ${revenueCatResponse.status}`);
    }

    const customerInfo: CustomerInfo = await revenueCatResponse.json();
    
    // Check for active premium entitlement
    const premiumEntitlement = customerInfo.subscriber.entitlements["premium"];
    const hasPremium = premiumEntitlement && (
      !premiumEntitlement.expires_date || 
      new Date(premiumEntitlement.expires_date) > new Date()
    );

    // Get active subscriptions
    const activeSubscriptions = Object.entries(customerInfo.subscriber.subscriptions)
      .filter(([_, sub]) => new Date(sub.expires_date) > new Date())
      .map(([productId, sub]) => ({
        product_id: productId,
        expires_date: sub.expires_date,
        purchase_date: sub.purchase_date,
        period_type: sub.period_type,
        store: sub.store,
        is_sandbox: sub.is_sandbox,
        has_billing_issue: !!sub.billing_issues_detected_at,
      }));

    // Update local database with latest status
    const supabaseService = createClient(
      supabaseUrl,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    if (hasPremium) {
      await supabaseService
        .from("user_profiles")
        .update({ is_subscribed: true })
        .eq("user_id", user.id);
    }

    return new Response(
      JSON.stringify({
        has_premium: hasPremium,
        entitlements: Object.keys(customerInfo.subscriber.entitlements),
        active_subscriptions: activeSubscriptions,
        management_url: customerInfo.subscriber.management_url,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    console.error("Validate purchase error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: "Internal server error", message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
