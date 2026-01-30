import { useState, useEffect } from "react";
import { Capacitor } from "@capacitor/core";
import { Network, ConnectionStatus } from "@capacitor/network";

interface NetworkState {
  isConnected: boolean;
  connectionType: string;
  isLoading: boolean;
}

export function useNativeNetwork() {
  const [state, setState] = useState<NetworkState>({
    isConnected: true,
    connectionType: "unknown",
    isLoading: true,
  });

  useEffect(() => {
    let listenerHandle: { remove: () => void } | null = null;

    const initNetwork = async () => {
      try {
        // Get initial status
        const status: ConnectionStatus = await Network.getStatus();
        setState({
          isConnected: status.connected,
          connectionType: status.connectionType,
          isLoading: false,
        });

        // Only add listener on native platforms
        if (Capacitor.isNativePlatform()) {
          listenerHandle = await Network.addListener(
            "networkStatusChange",
            (status: ConnectionStatus) => {
              setState({
                isConnected: status.connected,
                connectionType: status.connectionType,
                isLoading: false,
              });
            }
          );
        }
      } catch (error) {
        console.error("Error initializing network:", error);
        setState((prev) => ({ ...prev, isLoading: false }));
      }
    };

    initNetwork();

    return () => {
      if (listenerHandle) {
        listenerHandle.remove();
      }
    };
  }, []);

  return state;
}
