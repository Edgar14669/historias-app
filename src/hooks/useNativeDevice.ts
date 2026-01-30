import { useState, useEffect } from "react";
import { Capacitor } from "@capacitor/core";
import { Device, DeviceInfo, BatteryInfo } from "@capacitor/device";

interface DeviceState {
  info: DeviceInfo | null;
  battery: BatteryInfo | null;
  isNative: boolean;
  platform: "ios" | "android" | "web";
  isLoading: boolean;
}

export function useNativeDevice() {
  const [state, setState] = useState<DeviceState>({
    info: null,
    battery: null,
    isNative: Capacitor.isNativePlatform(),
    platform: Capacitor.getPlatform() as "ios" | "android" | "web",
    isLoading: true,
  });

  useEffect(() => {
    const loadDeviceInfo = async () => {
      if (!Capacitor.isNativePlatform()) {
        setState((prev) => ({ ...prev, isLoading: false }));
        return;
      }

      try {
        const [info, battery] = await Promise.all([
          Device.getInfo(),
          Device.getBatteryInfo(),
        ]);

        setState((prev) => ({
          ...prev,
          info,
          battery,
          isLoading: false,
        }));
      } catch (error) {
        console.error("Error loading device info:", error);
        setState((prev) => ({ ...prev, isLoading: false }));
      }
    };

    loadDeviceInfo();
  }, []);

  return state;
}
