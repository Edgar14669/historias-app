import { motion } from "framer-motion";
import { ChevronLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import BottomNavLayout from "@/components/BottomNavLayout";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useTranslation } from "@/hooks/useTranslation";

const FAQPage = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const faqs = [
    { question: t("faqCreateAccount"), answer: t("faqCreateAccountAnswer") },
    { question: t("faqPremiumIncludes"), answer: t("faqPremiumIncludesAnswer") },
    { question: t("faqCancelSub"), answer: t("faqCancelSubAnswer") },
    { question: t("faqLanguages"), answer: t("faqLanguagesAnswer") },
    { question: t("faqAddToList"), answer: t("faqAddToListAnswer") },
    { question: t("faqOffline"), answer: t("faqOfflineAnswer") },
    { question: t("faqKidsContent"), answer: t("faqKidsContentAnswer") },
    { question: t("faqSupport"), answer: t("faqSupportAnswer") },
  ];

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
          <h1 className="text-2xl font-bold text-foreground">{t("faqTitle")}</h1>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Accordion type="single" collapsible className="space-y-2">
            {faqs.map((faq, index) => (
              <AccordionItem
                key={index}
                value={`item-${index}`}
                className="bg-card rounded-xl border-none overflow-hidden"
              >
                <AccordionTrigger className="px-4 py-3 text-sm text-foreground hover:no-underline hover:bg-muted/50">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4 text-sm text-muted-foreground">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>
      </div>
    </BottomNavLayout>
  );
};

export default FAQPage;
