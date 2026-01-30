import { useState } from "react";
import { motion } from "framer-motion";
import { 
  ChevronLeft, 
  ChevronRight, 
  FileText, 
  Info, 
  HelpCircle, 
  CreditCard, 
  LogOut, 
  Loader2, 
  User,
  Shield,
  Heart
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import BottomNavLayout from "@/components/BottomNavLayout";
import { useApp } from "@/contexts/AppContext";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/hooks/useTranslation";

const languages = [
  { code: "en", name: "English", flag: "🇺🇸" },
  { code: "pt", name: "Português", flag: "🇧🇷" },
  { code: "es", name: "Español", flag: "🇪🇸" },
  { code: "fr", name: "Français", flag: "🇫🇷" },
  { code: "de", name: "Deutsch", flag: "🇩🇪" },
  { code: "it", name: "Italiano", flag: "🇮🇹" },
];

const ProfilePage = () => {
  const { user, profile, logout, language, setLanguage, isLoading } = useApp();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useTranslation();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Verifica se é admin usando os dados reais do banco
  const isAdmin = profile?.isAdmin || profile?.is_admin || profile?.role === 'admin';

  // Monta a lista de menus dinamicamente
  const menuItems = [
    // Item exclusivo de Admin
    ...(isAdmin ? [{ 
      icon: Shield, 
      label: "Painel Administrativo", 
      route: "/admin/dashboard",
      color: "text-purple-500" // Destaque visual
    }] : []),
    
    { icon: Heart, label: "Minha Lista", route: "/mylist" },
    { icon: CreditCard, label: t("premium"), route: "/premium" },
    { icon: FileText, label: t("privacyPolicy"), route: "/privacy-policy" },
    { icon: FileText, label: t("termsOfUse"), route: "/terms-of-use" },
    { icon: Info, label: t("about"), route: "/about" },
    { icon: HelpCircle, label: t("faq"), route: "/faq" },
  ];

  const handleLogout = async () => {
    setIsLoggingOut(true);
    
    const logoutTimeout = setTimeout(() => {
      console.warn("[ProfilePage] Logout timeout - forcing navigation");
      navigate("/", { replace: true });
      setIsLoggingOut(false);
    }, 5000);
    
    try {
      await logout();
      clearTimeout(logoutTimeout);
      toast({
        title: t("logoutSuccess"),
        description: t("logoutDescription"),
      });
      navigate("/", { replace: true });
    } catch (error) {
      clearTimeout(logoutTimeout);
      console.error("[ProfilePage] Logout error:", error);
      navigate("/", { replace: true });
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleBack = () => {
    navigate(-1);
  };

  // Se estiver carregando o contexto inicial, mostra spinner
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Dados reais do usuário
  const displayName = profile?.display_name || user?.displayName || user?.email?.split("@")[0] || t("guest");
  const avatarUrl = profile?.avatar_url || user?.photoURL;
  const userEmail = profile?.email || user?.email;

  return (
    <BottomNavLayout>
      <div className="page-padding pb-24">
        {/* Header with Back Button */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <button onClick={handleBack} className="back-button mb-4">
            <ChevronLeft className="w-5 h-5" />
            {t("back")}
          </button>
          
          {/* User Avatar and Name */}
          <div className="flex flex-col items-center mb-6">
            <div className="relative">
              {avatarUrl ? (
                <img 
                  src={avatarUrl} 
                  alt={displayName}
                  className="w-20 h-20 rounded-full object-cover mb-3 border-2 border-border"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.nextElementSibling?.classList.remove('hidden');
                  }}
                />
              ) : null}
              <div className={`w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-3 ${avatarUrl ? 'hidden' : ''}`}>
                <User className="w-10 h-10 text-muted-foreground" />
              </div>
            </div>

            <h2 className="text-lg font-semibold text-foreground">{displayName}</h2>
            
            {userEmail && (
              <p className="text-sm text-muted-foreground">{userEmail}</p>
            )}
            
            <div className="flex gap-2 mt-2">
              {profile?.is_subscribed && (
                <span className="px-3 py-1 bg-amber-500/10 text-amber-500 text-xs rounded-full font-medium border border-amber-500/20">
                  {t("premium")} ⭐
                </span>
              )}
              {isAdmin && (
                <span className="px-3 py-1 bg-purple-500/10 text-purple-500 text-xs rounded-full font-medium border border-purple-500/20 flex items-center gap-1">
                  <Shield className="w-3 h-3" /> Admin
                </span>
              )}
            </div>
          </div>
        </motion.div>

        {/* Language Selection */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <h2 className="text-muted-foreground text-sm mb-3 px-1">
            {t("chooseLanguage")}
          </h2>
          <div className="bg-card rounded-xl p-4 border border-border">
            <div className="grid grid-cols-3 gap-2">
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => setLanguage(lang.code)}
                  className={`flex items-center justify-center gap-2 p-3 rounded-lg transition-all text-sm ${
                    language === lang.code
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <span className="text-lg">{lang.flag}</span>
                  <span className="font-medium">{lang.name}</span>
                </button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* App Info & Menu */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-6"
        >
          <h2 className="text-muted-foreground text-sm mb-3 px-1">
            {t("appInfo")}
          </h2>
          <div className="bg-card rounded-xl overflow-hidden border border-border">
            {menuItems.map((item, index) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.label}
                  onClick={() => navigate(item.route)}
                  className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors border-b border-border last:border-b-0"
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg bg-muted/50 ${item.color || "text-foreground"}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="text-foreground text-sm font-medium">{item.label}</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </button>
              );
            })}
          </div>
        </motion.div>

        {/* Logout Button */}
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="w-full py-4 rounded-xl bg-destructive/10 text-destructive font-semibold flex items-center justify-center gap-2 hover:bg-destructive/20 transition-colors disabled:opacity-50"
        >
          {isLoggingOut ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <LogOut className="w-5 h-5" />
          )}
          {isLoggingOut ? t("loggingOut") : t("logoutAccount")}
        </motion.button>
      </div>
    </BottomNavLayout>
  );
};

export default ProfilePage;