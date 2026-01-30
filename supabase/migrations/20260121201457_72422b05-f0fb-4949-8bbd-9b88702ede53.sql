-- Create subscriptions table for RevenueCat IAP
CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  revenuecat_customer_id TEXT NOT NULL,
  product_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  is_trial BOOLEAN DEFAULT false,
  is_intro_offer BOOLEAN DEFAULT false,
  store TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT valid_status CHECK (status IN ('active', 'cancelled', 'expired', 'trial', 'intro_offer', 'billing_issue'))
);

-- Create index for faster lookups
CREATE INDEX idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX idx_subscriptions_revenuecat_customer_id ON public.subscriptions(revenuecat_customer_id);
CREATE UNIQUE INDEX idx_subscriptions_user_product ON public.subscriptions(user_id, product_id);

-- Enable RLS
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Users can view their own subscriptions
CREATE POLICY "Users can view their own subscriptions"
ON public.subscriptions
FOR SELECT
USING (user_id = auth.uid());

-- Service role can manage all subscriptions (for webhooks)
CREATE POLICY "Service role can manage subscriptions"
ON public.subscriptions
FOR ALL
USING (true)
WITH CHECK (true);

-- Create trigger for updated_at
CREATE TRIGGER update_subscriptions_updated_at
BEFORE UPDATE ON public.subscriptions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to sync subscription status with user_profiles
CREATE OR REPLACE FUNCTION public.sync_subscription_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Update is_subscribed based on active subscription
  UPDATE public.user_profiles
  SET is_subscribed = (
    SELECT EXISTS (
      SELECT 1 FROM public.subscriptions
      WHERE subscriptions.user_id = NEW.user_id
      AND subscriptions.status IN ('active', 'trial', 'intro_offer')
      AND (subscriptions.current_period_end IS NULL OR subscriptions.current_period_end > now())
    )
  )
  WHERE user_profiles.user_id = NEW.user_id;
  
  RETURN NEW;
END;
$$;

-- Create trigger to sync subscription status
CREATE TRIGGER sync_subscription_status_trigger
AFTER INSERT OR UPDATE ON public.subscriptions
FOR EACH ROW
EXECUTE FUNCTION public.sync_subscription_status();