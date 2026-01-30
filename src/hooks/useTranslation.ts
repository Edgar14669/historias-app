import { useApp } from "@/contexts/AppContext";
import { translations, TranslationKey, Language } from "@/i18n/translations";

export function useTranslation() {
  const { language } = useApp();
  
  const currentLang = (language as Language) || "pt";
  const currentTranslations = translations[currentLang] || translations.pt;
  
  const t = (key: TranslationKey): string => {
    return currentTranslations[key] || translations.pt[key] || key;
  };
  
  return { t, language: currentLang };
}
