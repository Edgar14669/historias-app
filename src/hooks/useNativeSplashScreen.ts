import { useCallback } from "react";
import { Capacitor } from "@capacitor/core";
import { SplashScreen } from "@capacitor/splash-screen";

export function useNativeSplashScreen() {
  const isNative = Capacitor.isNativePlatform();

  const show = useCallback(
    async (options?: {
      autoHide?: boolean;
      fadeInDuration?: number;
      fadeOutDuration?: number;
      showDuration?: number;
    }) => {
      if (!isNative) return;
      try {
        await SplashScreen.show({
          autoHide: options?.autoHide ?? true,
          fadeInDuration: options?.fadeInDuration ?? 200,
          fadeOutDuration: options?.fadeOutDuration ?? 200,
          showDuration: options?.showDuration ?? 2000,
        });
      } catch (error) {
        console.error("SplashScreen show error:", error);
      }
    },
    [isNative]
  );

  const hide = useCallback(
    async (options?: { fadeOutDuration?: number }) => {
      if (!isNative) return;
      try {
        await SplashScreen.hide({
          fadeOutDuration: options?.fadeOutDuration ?? 200,
        });
      } catch (error) {
        console.error("SplashScreen hide error:", error);
      }
    },
    [isNative]
  );

  return {
    show,
    hide,
    isNative,
  };
}
