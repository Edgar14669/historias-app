import { useCallback } from "react";
import { Capacitor } from "@capacitor/core";
import { StatusBar, Style } from "@capacitor/status-bar";

export function useNativeStatusBar() {
  const isNative = Capacitor.isNativePlatform();

  const setStyle = useCallback(
    async (style: Style) => {
      if (!isNative) return;
      try {
        await StatusBar.setStyle({ style });
      } catch (error) {
        console.error("StatusBar setStyle error:", error);
      }
    },
    [isNative]
  );

  const setBackgroundColor = useCallback(
    async (color: string) => {
      if (!isNative) return;
      try {
        await StatusBar.setBackgroundColor({ color });
      } catch (error) {
        console.error("StatusBar setBackgroundColor error:", error);
      }
    },
    [isNative]
  );

  const show = useCallback(async () => {
    if (!isNative) return;
    try {
      await StatusBar.show();
    } catch (error) {
      console.error("StatusBar show error:", error);
    }
  }, [isNative]);

  const hide = useCallback(async () => {
    if (!isNative) return;
    try {
      await StatusBar.hide();
    } catch (error) {
      console.error("StatusBar hide error:", error);
    }
  }, [isNative]);

  const setOverlaysWebView = useCallback(
    async (overlay: boolean) => {
      if (!isNative) return;
      try {
        await StatusBar.setOverlaysWebView({ overlay });
      } catch (error) {
        console.error("StatusBar setOverlaysWebView error:", error);
      }
    },
    [isNative]
  );

  // Configure for dark theme (light content on dark background)
  const configureForDarkTheme = useCallback(async () => {
    if (!isNative) return;
    try {
      await StatusBar.setStyle({ style: Style.Dark });
      await StatusBar.setBackgroundColor({ color: "#1a1a2e" });
    } catch (error) {
      console.error("StatusBar configureForDarkTheme error:", error);
    }
  }, [isNative]);

  return {
    setStyle,
    setBackgroundColor,
    show,
    hide,
    setOverlaysWebView,
    configureForDarkTheme,
    Style,
    isNative,
  };
}
