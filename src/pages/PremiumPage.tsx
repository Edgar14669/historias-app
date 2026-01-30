import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, Crown, Check, Loader2, RefreshCw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import BottomNavLayout from "@/components/BottomNavLayout";
import MathCaptcha from "@/components/MathCaptcha";
import premiumMonthly from "@/assets/premium-monthly.jpg";
import premiumAnnual from "@/assets/premium-annual.jpg";
import { useTranslation } from "@/hooks/useTranslation";
import { useRevenueCat, Package } from "@/hooks/useRevenueCat";
import { useApp } from "@/contexts/AppContext";
import { toast } from "sonner";

const PremiumPage = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user, profile } = useApp();
  const { 
    isNativePlatform, 
    isLoading, 
    offerings, 
    purchasePackage, 
    restorePurchases,
    initialize,
    identifyUser
  } = useRevenueCat();
  
  const [purchasingPackage, setPurchasingPackage] = useState<string | null>(null);
  const [showCaptcha, setShowCaptcha] = useState(false);
  const [pendingPackageId, setPendingPackageId] = useState<string | null>(null);

 // Initialize RevenueCat when user is available
  useEffect(() => {
    // MUDANÇA: user.uid em vez de user.id (Firebase)
    const userId = user?.uid || (user as any)?.id; // Fallback seguro
    if (userId) {
      initialize(userId);
      identifyUser(userId);
    }
  }, [user, initialize, identifyUser]);

  // Get packages from offerings or use fallback
  const monthlyPackage = offerings[0]?.availablePackages.find(
    p => p.identifier === "$rc_monthly" || p.product.identifier.includes("monthly")
  );
  const annualPackage = offerings[0]?.availablePackages.find(
    p => p.identifier === "$rc_annual" || p.product.identifier.includes("annual")
  );

  const benefits = [
    t("unlimitedAccess"),
    t("newStoriesWeekly"),
    t("noAds"),
    t("exclusiveContent"),
  ];

  const handleBack = () => {
    navigate(-1);
  };

  const handleSubscribeClick = (packageId: string) => {
    if (!user) {
      toast.error(t("loginRequired"));
      navigate("/login");
      return;
    }

    // Show CAPTCHA before proceeding
    setPendingPackageId(packageId);
    setShowCaptcha(true);
  };

  const handleCaptchaSuccess = async () => {
    if (!pendingPackageId) return;

    if (!isNativePlatform) {
      toast.info(t("purchaseNativeOnly"));
      return;
    }

    setPurchasingPackage(pendingPackageId);
    const success = await purchasePackage(pendingPackageId);
    setPurchasingPackage(null);
    setPendingPackageId(null);

    if (success) {
      navigate("/profile");
    }
  };

  const handleRestore = async () => {
    if (!user) {
      toast.error(t("loginRequired"));
      return;
    }

    const success = await restorePurchases();
    if (success) {
      navigate("/profile");
    }
  };

  const formatIntroOffer = (pkg: Package) => {
    if (!pkg.product.introductoryPrice) return null;
    
    const intro = pkg.product.introductoryPrice;
    const periodText = intro.periodUnit === "DAY" 
      ? `${intro.periodNumberOfUnits} ${t("freeTrialDays")}`
      : intro.priceString;
    
    return {
      text: periodText,
      isTrial: intro.price === 0,
    };
  };

  // If user is already subscribed, show different content
  if (profile?.is_subscribed) {
    return (
      <BottomNavLayout>
        <div className="page-padding">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <button onClick={handleBack} className="back-button mb-4">
              <ChevronLeft className="w-5 h-5" />
              {t("back")}
            </button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-12"
          >
            <div className="w-20 h-20 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 flex items-center justify-center mx-auto mb-6">
              <Crown className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">
              {t("bePremium")} ✓
            </h1>
            <p className="text-muted-foreground">
              {t("unlimitedAccess")}
            </p>
            <button
              onClick={() => navigate("/cancel-subscription")}
              className="mt-6 text-sm text-muted-foreground underline"
            >
              {t("cancelSubscription")}
            </button>
          </motion.div>
        </div>
      </BottomNavLayout>
    );
  }

  return (
    <BottomNavLayout>
      <div className="page-padding">
        {/* Math CAPTCHA Modal */}
        <MathCaptcha
          isOpen={showCaptcha}
          onClose={() => {
            setShowCaptcha(false);
            setPendingPackageId(null);
          }}
          onSuccess={handleCaptchaSuccess}
        />

        {/* Header with Back Button */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <button onClick={handleBack} className="back-button mb-4">
            <ChevronLeft className="w-5 h-5" />
            {t("back")}
          </button>
        </motion.div>

        {/* Title with Crown */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-center mb-6"
        >
          <div className="flex items-center justify-center gap-2 mb-2">
            <Crown className="w-6 h-6 text-amber-500" />
            <h1 className="text-xl font-bold text-foreground">
              {t("bePremium")}
            </h1>
            <Crown className="w-6 h-6 text-amber-500" />
          </div>
        </motion.div>

        {/* Benefits */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-6 bg-card rounded-xl p-4 shadow-lg"
        >
          <h2 className="text-muted-foreground text-sm mb-3 font-medium">
            {t("benefitsList")}
          </h2>
          <ul className="space-y-3">
            {benefits.map((benefit, index) => (
              <motion.li
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + index * 0.1 }}
                className="flex items-center gap-3 text-foreground text-sm"
              >
                <div className="w-5 h-5 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 flex items-center justify-center flex-shrink-0">
                  <Check className="w-3 h-3 text-white" />
                </div>
                <span>{benefit}</span>
              </motion.li>
            ))}
          </ul>
        </motion.div>

        {/* Plans */}
        <div className="space-y-4">
          {/* Monthly Plan */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="rounded-xl overflow-hidden shadow-lg"
          >
            <div className="relative">
              <img
                src={premiumMonthly}
                alt={t("monthlyPlan")}
                className="w-full h-44 object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent flex flex-col items-center justify-end p-5">
                {monthlyPackage && formatIntroOffer(monthlyPackage) && (
                  <div className="px-3 py-1 bg-emerald-500 text-white text-xs font-bold rounded-full mb-2">
                    {formatIntroOffer(monthlyPackage)?.isTrial 
                      ? t("trialPeriod")
                      : t("introOffer")}: {formatIntroOffer(monthlyPackage)?.text}
                  </div>
                )}
                <h3 className="font-bold text-white text-lg">{t("monthlyPlan")}</h3>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-3xl font-bold text-white">
                    {monthlyPackage?.product.priceString || "R$ 14,90"}
                  </span>
                  <span className="text-white/70 text-sm">/{t("perMonth")}</span>
                </div>
                <button 
                  onClick={() => handleSubscribeClick(monthlyPackage?.identifier || "$rc_monthly")}
                  disabled={isLoading || purchasingPackage !== null}
                  className="mt-4 px-10 py-2.5 bg-gradient-to-r from-amber-400 to-orange-500 text-white rounded-full font-semibold text-sm hover:from-amber-500 hover:to-orange-600 transition-all shadow-lg disabled:opacity-50 flex items-center gap-2"
                >
                  {purchasingPackage === (monthlyPackage?.identifier || "$rc_monthly") ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {t("loadingPurchase")}
                    </>
                  ) : (
                    t("subscribe")
                  )}
                </button>
              </div>
            </div>
          </motion.div>

          {/* Annual Plan - Best Value */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="rounded-xl overflow-hidden shadow-lg relative"
          >
            {/* Best Value Badge */}
            <div className="absolute top-3 right-3 z-10 px-3 py-1 bg-gradient-to-r from-emerald-400 to-green-500 text-white text-xs font-bold rounded-full shadow-lg">
              {t("savePercent")} 33%
            </div>
            <div className="relative">
              <img
                src={premiumAnnual}
                alt={t("yearlyPlan")}
                className="w-full h-44 object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent flex flex-col items-center justify-end p-5">
                {annualPackage && formatIntroOffer(annualPackage) && (
                  <div className="px-3 py-1 bg-emerald-500 text-white text-xs font-bold rounded-full mb-2">
                    {formatIntroOffer(annualPackage)?.isTrial 
                      ? t("trialPeriod")
                      : t("introOffer")}: {formatIntroOffer(annualPackage)?.text}
                  </div>
                )}
                <h3 className="font-bold text-white text-lg">{t("yearlyPlan")}</h3>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-3xl font-bold text-white">
                    {annualPackage?.product.priceString || "R$ 9,90"}
                  </span>
                  <span className="text-white/70 text-sm">/{t("perMonth")}</span>
                </div>
                <p className="text-white/60 text-xs mt-1">{t("total")} R$ 118,80</p>
                <button 
                  onClick={() => handleSubscribeClick(annualPackage?.identifier || "$rc_annual")}
                  disabled={isLoading || purchasingPackage !== null}
                  className="mt-4 px-10 py-2.5 bg-gradient-to-r from-amber-400 to-orange-500 text-white rounded-full font-semibold text-sm hover:from-amber-500 hover:to-orange-600 transition-all shadow-lg disabled:opacity-50 flex items-center gap-2"
                >
                  {purchasingPackage === (annualPackage?.identifier || "$rc_annual") ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {t("loadingPurchase")}
                    </>
                  ) : (
                    t("subscribe")
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Restore Purchases */}
        {isNativePlatform && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            onClick={handleRestore}
            disabled={isLoading}
            className="w-full mt-4 py-3 flex items-center justify-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            {t("restorePurchases")}
          </motion.button>
        )}

        {/* Footer */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="text-center text-muted-foreground text-xs mt-6"
        >
          {t("autoRenewal")}
        </motion.p>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="flex justify-center gap-2 mt-4 text-xs text-muted-foreground"
        >
          <span 
            onClick={() => navigate("/terms-of-use")}
            className="hover:text-foreground cursor-pointer underline"
          >
            {t("termsOfUse")}
          </span>
          <span>|</span>
          <span 
            onClick={() => navigate("/privacy-policy")}
            className="hover:text-foreground cursor-pointer underline"
          >
            {t("privacyPolicy")}
          </span>
        </motion.div>
      </div>
    </BottomNavLayout>
  );
};

export default PremiumPage;
