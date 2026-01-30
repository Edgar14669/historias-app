import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface RevenueCatEvent {
  api_version: string;
  event: {
    type: string;
    id: string;
    app_user_id: string;
    original_app_user_id: string;
    product_id: string;
    entitlement_ids?: string[];
    period_type?: string;
    purchased_at_ms?: number;
    expiration_at_ms?: number;
    store?: string;
    environment?: string;
    is_trial_conversion?: boolean;
    cancel_reason?: string;
    new_product_id?: string;
  };
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate authorization header
    const authHeader = req.headers.get("authorization");
    const webhookSecret = Deno.env.get("REVENUECAT_WEBHOOK_SECRET");

    if (!webhookSecret) {
      console.error("REVENUECAT_WEBHOOK_SECRET not configured");
      return new Response(
        JSON.stringify({ error: "Webhook secret not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // RevenueCat sends the secret as "Bearer <secret>"
    const expectedAuth = `Bearer ${webhookSecret}`;
    if (authHeader !== expectedAuth && authHeader !== webhookSecret) {
      console.error("Invalid authorization header");
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse the webhook payload
    const payload: RevenueCatEvent = await req.json();
    console.log("Received RevenueCat event:", payload.event.type);

    // Initialize Supabase client with service role
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const event = payload.event;
    const appUserId = event.app_user_id;
    
    // Extract user_id from app_user_id (we use Supabase user ID as RevenueCat app_user_id)
    // RevenueCat may prefix with $RCAnonymousID: for anonymous users
    let userId = appUserId;
    if (appUserId.startsWith("$RCAnonymousID:")) {
      console.log("Anonymous user, skipping database update");
      return new Response(
        JSON.stringify({ success: true, message: "Anonymous user, no action taken" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Map RevenueCat event types to subscription status
    const statusMap: Record<string, string> = {
      "INITIAL_PURCHASE": "active",
      "RENEWAL": "active",
      "NON_RENEWING_PURCHASE": "active",
      "PRODUCT_CHANGE": "active",
      "CANCELLATION": "cancelled",
      "UNCANCELLATION": "active",
      "EXPIRATION": "expired",
      "BILLING_ISSUE": "billing_issue",
      "SUBSCRIBER_ALIAS": "active", // Just an alias event
      "TRANSFER": "active",
    };

    const newStatus = statusMap[event.type] || "active";

    // Determine if trial or intro offer
    const isTrial = event.period_type === "TRIAL";
    const isIntroOffer = event.period_type === "INTRO";

    // Build subscription data
    const subscriptionData = {
      user_id: userId,
      revenuecat_customer_id: event.original_app_user_id || appUserId,
      product_id: event.new_product_id || event.product_id,
      status: isTrial ? "trial" : isIntroOffer ? "intro_offer" : newStatus,
      current_period_start: event.purchased_at_ms 
        ? new Date(event.purchased_at_ms).toISOString() 
        : null,
      current_period_end: event.expiration_at_ms 
        ? new Date(event.expiration_at_ms).toISOString() 
        : null,
      is_trial: isTrial,
      is_intro_offer: isIntroOffer,
      store: event.store?.toLowerCase() || null,
      updated_at: new Date().toISOString(),
    };

    console.log("Upserting subscription:", subscriptionData);

    // Upsert subscription record
    const { error: upsertError } = await supabase
      .from("subscriptions")
      .upsert(subscriptionData, {
        onConflict: "user_id,product_id",
        ignoreDuplicates: false,
      });

    if (upsertError) {
      console.error("Error upserting subscription:", upsertError);
      return new Response(
        JSON.stringify({ error: "Database error", details: upsertError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Handle expiration - also update is_subscribed directly as a fallback
    if (event.type === "EXPIRATION" || event.type === "CANCELLATION") {
      // Check if user has any other active subscriptions
      const { data: activeSubscriptions } = await supabase
        .from("subscriptions")
        .select("id")
        .eq("user_id", userId)
        .in("status", ["active", "trial", "intro_offer"])
        .gt("current_period_end", new Date().toISOString());

      if (!activeSubscriptions || activeSubscriptions.length === 0) {
        // No active subscriptions, update profile
        await supabase
          .from("user_profiles")
          .update({ is_subscribed: false })
          .eq("user_id", userId);
      }
    }

    console.log("Successfully processed event:", event.type);
    
    return new Response(
      JSON.stringify({ success: true, event_type: event.type }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    console.error("Webhook error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: "Internal server error", message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
