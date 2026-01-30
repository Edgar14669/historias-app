import { useState, useEffect, useCallback } from "react";
import { Capacitor } from "@capacitor/core";
import { App, AppState, URLOpenListenerEvent } from "@capacitor/app";
import { useNavigate } from "react-router-dom";

interface AppLifecycleState {
  isActive: boolean;
  lastStateChange: Date | null;
}

export function useNativeApp() {
  const [state, setState] = useState<AppLifecycleState>({
    isActive: true,
    lastStateChange: null,
  });
  const navigate = useNavigate();

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    let stateListener: { remove: () => void } | null = null;
    let urlListener: { remove: () => void } | null = null;
    let backListener: { remove: () => void } | null = null;

    const setupListeners = async () => {
      // App state changes (foreground/background)
      stateListener = await App.addListener(
        "appStateChange",
        (appState: AppState) => {
          setState({
            isActive: appState.isActive,
            lastStateChange: new Date(),
          });
        }
      );

      // Deep links
      urlListener = await App.addListener(
        "appUrlOpen",
        (event: URLOpenListenerEvent) => {
          const url = new URL(event.url);
          const path = url.pathname;
          
          // Handle deep links - navigate to the path
          if (path) {
            navigate(path);
          }
        }
      );

      // Android back button
      backListener = await App.addListener("backButton", ({ canGoBack }) => {
        if (canGoBack) {
          window.history.back();
        } else {
          // Optional: minimize app or show exit confirmation
          App.minimizeApp();
        }
      });
    };

    setupListeners();

    return () => {
      stateListener?.remove();
      urlListener?.remove();
      backListener?.remove();
    };
  }, [navigate]);

  const exitApp = useCallback(async () => {
    if (!Capacitor.isNativePlatform()) return;
    await App.exitApp();
  }, []);

  const minimizeApp = useCallback(async () => {
    if (!Capacitor.isNativePlatform()) return;
    await App.minimizeApp();
  }, []);

  const getAppInfo = useCallback(async () => {
    if (!Capacitor.isNativePlatform()) return null;
    return await App.getInfo();
  }, []);

  const getLaunchUrl = useCallback(async () => {
    if (!Capacitor.isNativePlatform()) return null;
    return await App.getLaunchUrl();
  }, []);

  return {
    ...state,
    exitApp,
    minimizeApp,
    getAppInfo,
    getLaunchUrl,
    isNative: Capacitor.isNativePlatform(),
  };
}
