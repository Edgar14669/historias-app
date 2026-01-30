import { motion } from "framer-motion";
import { ChevronLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import BottomNavLayout from "@/components/BottomNavLayout";
import { useTranslation } from "@/hooks/useTranslation";

const TermsOfUsePage = () => {
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
          <h1 className="text-2xl font-bold text-foreground">{t("termsTitle")}</h1>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card rounded-xl p-6 space-y-4 text-sm text-muted-foreground"
        >
          <section>
            <h2 className="text-foreground font-semibold mb-2">1. {t("termsAcceptance")}</h2>
            <p>{t("termsAcceptanceText")}</p>
          </section>

          <section>
            <h2 className="text-foreground font-semibold mb-2">2. {t("termsServiceUse")}</h2>
            <p>{t("termsServiceUseText")}</p>
          </section>

          <section>
            <h2 className="text-foreground font-semibold mb-2">3. {t("termsAccount")}</h2>
            <p>{t("termsAccountText")}</p>
          </section>

          <section>
            <h2 className="text-foreground font-semibold mb-2">4. {t("termsPremium")}</h2>
            <p>{t("termsPremiumText")}</p>
          </section>

          <section>
            <h2 className="text-foreground font-semibold mb-2">5. {t("termsContent")}</h2>
            <p>{t("termsContentText")}</p>
          </section>

          <section>
            <h2 className="text-foreground font-semibold mb-2">6. {t("termsLiability")}</h2>
            <p>{t("termsLiabilityText")}</p>
          </section>

          <section>
            <h2 className="text-foreground font-semibold mb-2">7. {t("termsChanges")}</h2>
            <p>{t("termsChangesText")}</p>
          </section>

          <p className="text-xs pt-4 border-t border-border">
            {t("lastUpdated")}
          </p>
        </motion.div>
      </div>
    </BottomNavLayout>
  );
};

export default TermsOfUsePage;
