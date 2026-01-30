import { motion } from "framer-motion";
import { ChevronLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import BottomNavLayout from "@/components/BottomNavLayout";
import { useTranslation } from "@/hooks/useTranslation";

const PrivacyPolicyPage = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

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
          <h1 className="text-2xl font-bold text-foreground">{t("privacyPolicyTitle")}</h1>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card rounded-xl p-6 space-y-4 text-sm text-muted-foreground"
        >
          <section>
            <h2 className="text-foreground font-semibold mb-2">1. {t("privacyDataCollection")}</h2>
            <p>{t("privacyDataCollectionText")}</p>
          </section>

          <section>
            <h2 className="text-foreground font-semibold mb-2">2. {t("privacyDataUse")}</h2>
            <p>{t("privacyDataUseText")}</p>
          </section>

          <section>
            <h2 className="text-foreground font-semibold mb-2">3. {t("privacyDataSharing")}</h2>
            <p>{t("privacyDataSharingText")}</p>
          </section>

          <section>
            <h2 className="text-foreground font-semibold mb-2">4. {t("privacySecurity")}</h2>
            <p>{t("privacySecurityText")}</p>
          </section>

          <section>
            <h2 className="text-foreground font-semibold mb-2">5. {t("privacyRights")}</h2>
            <p>{t("privacyRightsText")}</p>
          </section>

          <section>
            <h2 className="text-foreground font-semibold mb-2">6. {t("privacyCookies")}</h2>
            <p>{t("privacyCookiesText")}</p>
          </section>

          <p className="text-xs pt-4 border-t border-border">
            {t("lastUpdated")}
          </p>
        </motion.div>
      </div>
    </BottomNavLayout>
  );
};

export default PrivacyPolicyPage;
