import { useState, useEffect, useCallback } from "react";
import { Capacitor } from "@capacitor/core";
import { Keyboard, KeyboardInfo } from "@capacitor/keyboard";

interface KeyboardState {
  isVisible: boolean;
  keyboardHeight: number;
}

export function useNativeKeyboard() {
  const [state, setState] = useState<KeyboardState>({
    isVisible: false,
    keyboardHeight: 0,
  });

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    let showListener: { remove: () => void } | null = null;
    let hideListener: { remove: () => void } | null = null;

    const setupListeners = async () => {
      showListener = await Keyboard.addListener(
        "keyboardWillShow",
        (info: KeyboardInfo) => {
          setState({
            isVisible: true,
            keyboardHeight: info.keyboardHeight,
          });
        }
      );

      hideListener = await Keyboard.addListener("keyboardWillHide", () => {
        setState({
          isVisible: false,
          keyboardHeight: 0,
        });
      });
    };

    setupListeners();

    return () => {
      showListener?.remove();
      hideListener?.remove();
    };
  }, []);

  const show = useCallback(async () => {
    if (!Capacitor.isNativePlatform()) return;
    try {
      await Keyboard.show();
    } catch (error) {
      console.error("Keyboard show error:", error);
    }
  }, []);

  const hide = useCallback(async () => {
    if (!Capacitor.isNativePlatform()) return;
    try {
      await Keyboard.hide();
    } catch (error) {
      console.error("Keyboard hide error:", error);
    }
  }, []);

  const setAccessoryBarVisible = useCallback(async (visible: boolean) => {
    if (!Capacitor.isNativePlatform()) return;
    try {
      await Keyboard.setAccessoryBarVisible({ isVisible: visible });
    } catch (error) {
      console.error("Keyboard setAccessoryBarVisible error:", error);
    }
  }, []);

  const setScroll = useCallback(async (enabled: boolean) => {
    if (!Capacitor.isNativePlatform()) return;
    try {
      await Keyboard.setScroll({ isDisabled: !enabled });
    } catch (error) {
      console.error("Keyboard setScroll error:", error);
    }
  }, []);

  return {
    ...state,
    show,
    hide,
    setAccessoryBarVisible,
    setScroll,
    isNative: Capacitor.isNativePlatform(),
  };
}
