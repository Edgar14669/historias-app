import { useEffect, useState } from "react";
import { Capacitor } from "@capacitor/core";
import { StatusBar, Style } from "@capacitor/status-bar";
import { SplashScreen } from "@capacitor/splash-screen";

/**
 * Hook to initialize native app configuration on startup
 * Sets up status bar, hides splash screen, and handles platform-specific setup
 */
export function useNativeInit() {
  const [isInitialized, setIsInitialized] = useState(false);
  const isNative = Capacitor.isNativePlatform();
  const platform = Capacitor.getPlatform();

  useEffect(() => {
    const initializeNativeApp = async () => {
      if (!isNative) {
        setIsInitialized(true);
        return;
      }

      try {
        // Configure Status Bar for dark theme
        await StatusBar.setStyle({ style: Style.Dark });
        
        // Android-specific: set background color
        if (platform === "android") {
          await StatusBar.setBackgroundColor({ color: "#1a1a2e" });
        }

        // iOS-specific: overlay status bar
        if (platform === "ios") {
          await StatusBar.setOverlaysWebView({ overlay: true });
        }

        // Hide splash screen after initialization
        await SplashScreen.hide({ fadeOutDuration: 300 });

        console.log("[Native] App initialized successfully");
      } catch (error) {
        console.error("[Native] Initialization error:", error);
      } finally {
        setIsInitialized(true);
      }
    };

    initializeNativeApp();
  }, [isNative, platform]);

  return {
    isInitialized,
    isNative,
    platform,
  };
}
