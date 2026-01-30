import { useCallback } from "react";
import { Capacitor } from "@capacitor/core";
import { Haptics, ImpactStyle, NotificationType } from "@capacitor/haptics";

export function useNativeHaptics() {
  const isNative = Capacitor.isNativePlatform();

  const impact = useCallback(
    async (style: ImpactStyle = ImpactStyle.Medium) => {
      if (!isNative) return;
      try {
        await Haptics.impact({ style });
      } catch (error) {
        console.error("Haptics impact error:", error);
      }
    },
    [isNative]
  );

  const notification = useCallback(
    async (type: NotificationType = NotificationType.Success) => {
      if (!isNative) return;
      try {
        await Haptics.notification({ type });
      } catch (error) {
        console.error("Haptics notification error:", error);
      }
    },
    [isNative]
  );

  const vibrate = useCallback(
    async (duration: number = 300) => {
      if (!isNative) return;
      try {
        await Haptics.vibrate({ duration });
      } catch (error) {
        console.error("Haptics vibrate error:", error);
      }
    },
    [isNative]
  );

  const selectionStart = useCallback(async () => {
    if (!isNative) return;
    try {
      await Haptics.selectionStart();
    } catch (error) {
      console.error("Haptics selectionStart error:", error);
    }
  }, [isNative]);

  const selectionChanged = useCallback(async () => {
    if (!isNative) return;
    try {
      await Haptics.selectionChanged();
    } catch (error) {
      console.error("Haptics selectionChanged error:", error);
    }
  }, [isNative]);

  const selectionEnd = useCallback(async () => {
    if (!isNative) return;
    try {
      await Haptics.selectionEnd();
    } catch (error) {
      console.error("Haptics selectionEnd error:", error);
    }
  }, [isNative]);

  return {
    impact,
    notification,
    vibrate,
    selectionStart,
    selectionChanged,
    selectionEnd,
    ImpactStyle,
    NotificationType,
    isNative,
  };
}
