import { ReactNode } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Home, Heart, Crown, User } from "lucide-react";
import { motion } from "framer-motion";
import { useTranslation } from "@/hooks/useTranslation";
import { useNativeHaptics } from "@/hooks/useNativeHaptics";
import { ImpactStyle } from "@capacitor/haptics";

interface BottomNavProps {
  children: ReactNode;
}

const BottomNavLayout = ({ children }: BottomNavProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { impact, isNative } = useNativeHaptics();

  const navItems = [
    { path: "/my-list", icon: Heart, label: t("navMyList") },
    { path: "/home", icon: Home, label: t("navHome") },
    { path: "/premium", icon: Crown, label: t("navPremium") },
    { path: "/profile", icon: User, label: t("navProfile") },
  ];

  const handleNavClick = async (path: string) => {
    // Haptic feedback on native
    if (isNative) {
      await impact(ImpactStyle.Light);
    }
    navigate(path);
  };

  return (
    <div className="mobile-container safe-area-top">
      {/* Main Content - extra padding for safe area bottom */}
      <div className="pb-24">{children}</div>

      {/* Bottom Navigation with safe area */}
      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-card border-t border-border z-50 safe-area-bottom">
        <div className="flex justify-around items-center py-3">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;

            return (
              <button
                key={item.path}
                onClick={() => handleNavClick(item.path)}
                className={isActive ? "nav-item-active" : "nav-item"}
              >
                <motion.div whileTap={{ scale: 0.9 }}>
                  <Icon
                    className={`w-5 h-5 ${
                      isActive ? "text-white" : "text-muted-foreground"
                    }`}
                  />
                </motion.div>
                <span className="text-xs">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
};

export default BottomNavLayout;
