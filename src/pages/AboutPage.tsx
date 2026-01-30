import { motion } from "framer-motion";
import { ChevronLeft, BookOpen, Heart, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import BottomNavLayout from "@/components/BottomNavLayout";
import { useTranslation } from "@/hooks/useTranslation";

const AboutPage = () => {
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
          <h1 className="text-2xl font-bold text-foreground">{t("aboutTitle")}</h1>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-6"
        >
          {/* App Logo/Icon */}
          <div className="flex justify-center">
            <div className="w-24 h-24 rounded-2xl gradient-premium flex items-center justify-center">
              <BookOpen className="w-12 h-12 text-white" />
            </div>
          </div>

          {/* App Name and Version */}
          <div className="text-center">
            <h2 className="text-xl font-bold text-foreground">Stories App</h2>
            <p className="text-muted-foreground text-sm">{t("aboutVersion")}</p>
          </div>

          {/* Description */}
          <div className="bg-card rounded-xl p-6 space-y-4">
            <div className="flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-accent mt-0.5" />
              <div>
                <h3 className="font-semibold text-foreground mb-1">{t("aboutMission")}</h3>
                <p className="text-sm text-muted-foreground">
                  {t("aboutMissionText")}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Heart className="w-5 h-5 text-accent mt-0.5" />
              <div>
                <h3 className="font-semibold text-foreground mb-1">{t("aboutMadeWithLove")}</h3>
                <p className="text-sm text-muted-foreground">
                  {t("aboutMadeWithLoveText")}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <BookOpen className="w-5 h-5 text-accent mt-0.5" />
              <div>
                <h3 className="font-semibold text-foreground mb-1">{t("aboutDiverseContent")}</h3>
                <p className="text-sm text-muted-foreground">
                  {t("aboutDiverseContentText")}
                </p>
              </div>
            </div>
          </div>

          {/* Contact */}
          <div className="bg-card rounded-xl p-6">
            <h3 className="font-semibold text-foreground mb-2">{t("aboutContact")}</h3>
            <p className="text-sm text-muted-foreground mb-1">Email: contato@storiesapp.com</p>
            <p className="text-sm text-muted-foreground">Website: www.storiesapp.com</p>
          </div>

          <p className="text-center text-xs text-muted-foreground">
            {t("aboutAllRightsReserved")}
          </p>
        </motion.div>
      </div>
    </BottomNavLayout>
  );
};

export default AboutPage;
