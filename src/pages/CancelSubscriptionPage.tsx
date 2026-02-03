import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, AlertTriangle, CheckCircle, ExternalLink, Apple, Smartphone } from "lucide-react";
import { useNavigate } from "react-router-dom";
import BottomNavLayout from "@/components/BottomNavLayout";
import { useTranslation } from "@/hooks/useTranslation";
import { useApp } from "@/contexts/AppContext";
import { Capacitor } from "@capacitor/core"; // MUDANÇA: Import direto do Capacitor

// MUDANÇA: Imports do Firebase
import { db } from "@/integrations/firebase/client";
import { collection, query, where, getDocs, orderBy, limit } from "firebase/firestore";

const CancelSubscriptionPage = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user } = useApp();
  
  // MUDANÇA: Removemos o hook do RevenueCat e usamos Capacitor direto
  const isNativePlatform = Capacitor.isNativePlatform();
  
  const [isCancelled, setIsCancelled] = useState(false);
  const [subscriptionInfo, setSubscriptionInfo] = useState<{
    product_id: string;
    current_period_end: string | null;
    store: string | null;
  } | null>(null);

  // Fetch subscription info
  useEffect(() => {
    const fetchSubscriptionInfo = async () => {
      // MUDANÇA: Correção para acessar o ID do usuário de forma segura
      const userId = user?.uid || (user as any)?.id;
      
      if (!userId) return;

      try {
        const subsRef = collection(db, "subscriptions");
        const q = query(
          subsRef, 
          where("user_id", "==", userId),
          where("status", "in", ["active", "trial", "intro_offer"]),
          orderBy("created_at", "desc"),
          limit(1)
        );
        
        const snapshot = await getDocs(q);

        if (!snapshot.empty) {
          const data = snapshot.docs[0].data();
          setSubscriptionInfo({
            product_id: data.product_id,
            current_period_end: data.current_period_end?.toDate?.()?.toISOString() || data.current_period_end,
            store: data.store
          });
        }
      } catch (error) {
        console.error("Error fetching subscription:", error);
      }
    };

    fetchSubscriptionInfo();
  }, [user]);

  const handleOpenManagement = () => {
    // MUDANÇA: URLs diretas para gerenciamento de assinatura (Padrão Nativo)
    const isIOS = Capacitor.getPlatform() === 'ios';
    
    // Links oficiais para gerenciamento de assinaturas
    const url = isIOS
      ? "https://apps.apple.com/account/subscriptions" // Link profundo do iOS
      : "https://play.google.com/store/account/subscriptions"; // Link profundo do Android
      
    window.open(url, "_blank");
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const getProductName = (productId: string) => {
    if (!productId) return "Premium";
    if (productId.includes("monthly") || productId.includes("mensal")) return t("monthlyPlan");
    if (productId.includes("annual") || productId.includes("anual")) return t("yearlyPlan");
    return "Premium";
  };

  if (isCancelled) {
    return (
      <BottomNavLayout>
        <div className="page-padding flex flex-col items-center justify-center min-h-[60vh]">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mb-6"
          >
            <CheckCircle className="w-10 h-10 text-green-500" />
          </motion.div>
          <h1 className="text-xl font-bold text-foreground mb-2">{t("cancelSuccess")}</h1>
          <p className="text-muted-foreground text-center text-sm mb-6">
            {t("cancelSuccessText")}
          </p>
          <button
            onClick={() => navigate("/profile")}
            className="btn-primary"
          >
            {t("cancelBackToProfile")}
          </button>
        </div>
      </BottomNavLayout>
    );
  }

  return (
    <BottomNavLayout>
      <div className="page-padding">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <button onClick={() => navigate(-1)} className="back-button mb-4">
            <ChevronLeft className="w-5 h-5" />
            {t("back")}
          </button>
          <h1 className="text-2xl font-bold text-foreground">{t("cancelTitle")}</h1>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-6"
        >
          {/* Info about cancellation via stores */}
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 flex gap-3">
            <Smartphone className="w-6 h-6 text-blue-500 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-blue-500 mb-1">
                {subscriptionInfo?.store === "app_store" || Capacitor.getPlatform() === 'ios' ? "App Store" : "Play Store"}
              </h3>
              <p className="text-sm text-muted-foreground">
                {t("cancelViaStore")}
              </p>
            </div>
          </div>

          {/* Warning */}
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex gap-3">
            <AlertTriangle className="w-6 h-6 text-amber-500 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-amber-500 mb-1">{t("cancelWarning")}</h3>
              <p className="text-sm text-muted-foreground">
                {t("cancelWarningText")}
              </p>
            </div>
          </div>

          {/* What you'll lose */}
          <div className="bg-card rounded-xl p-6">
            <h3 className="font-semibold text-foreground mb-4">{t("cancelWhatYouLose")}</h3>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-destructive" />
                {t("cancelUnlimitedAccess")}
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-destructive" />
                {t("cancelExclusiveContent")}
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-destructive" />
                {t("cancelNoAds")}
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-destructive" />
                {t("cancelOfflineReading")}
              </li>
            </ul>
          </div>

          {/* Current subscription info */}
          <div className="bg-card rounded-xl p-6">
            <h3 className="font-semibold text-foreground mb-2">{t("cancelCurrentSub")}</h3>
            <p className="text-sm text-muted-foreground mb-1">
              {t("cancelPlan").replace("Premium Mensal", subscriptionInfo ? getProductName(subscriptionInfo.product_id) : "Premium")}
            </p>
            {subscriptionInfo?.current_period_end && (
              <p className="text-sm text-muted-foreground">
                {t("cancelValidUntil").replace(/:\s*\d.*$/, `: ${formatDate(subscriptionInfo.current_period_end)}`)}
              </p>
            )}
          </div>

          {/* Open Store Management Button */}
          <button
            onClick={handleOpenManagement}
            className="w-full py-4 rounded-xl bg-destructive/20 text-destructive font-semibold hover:bg-destructive/30 transition-colors flex items-center justify-center gap-2"
          >
            {(subscriptionInfo?.store === "app_store" || Capacitor.getPlatform() === 'ios') ? (
              <>
                <Apple className="w-5 h-5" />
                {t("openInAppStore")}
              </>
            ) : (
              <>
                <ExternalLink className="w-5 h-5" />
                {t("openInPlayStore")}
              </>
            )}
          </button>
        </motion.div>
      </div>
    </BottomNavLayout>
  );
};

export default CancelSubscriptionPage;