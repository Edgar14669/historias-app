import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { WifiOff, Wifi } from "lucide-react";
import { useNativeNetwork } from "@/hooks/useNativeNetwork";

const OfflineIndicator = () => {
  const { isConnected, isLoading } = useNativeNetwork();
  const [showReconnected, setShowReconnected] = useState(false);
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    if (isLoading) return;

    if (!isConnected) {
      setWasOffline(true);
    } else if (wasOffline && isConnected) {
      // Show "reconnected" message briefly
      setShowReconnected(true);
      const timer = setTimeout(() => {
        setShowReconnected(false);
        setWasOffline(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isConnected, isLoading, wasOffline]);

  if (isLoading) return null;

  return (
    <AnimatePresence>
      {/* Offline Banner */}
      {!isConnected && (
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="fixed top-0 left-0 right-0 z-[100] safe-area-top"
        >
          <div className="max-w-md mx-auto">
            <div className="mx-4 mt-2 bg-destructive/95 backdrop-blur-sm text-destructive-foreground px-4 py-3 rounded-xl shadow-lg flex items-center gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                <WifiOff className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm">Sem conexão</p>
                <p className="text-xs opacity-90">Verifique sua internet</p>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Reconnected Banner */}
      {showReconnected && isConnected && (
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="fixed top-0 left-0 right-0 z-[100] safe-area-top"
        >
          <div className="max-w-md mx-auto">
            <div className="mx-4 mt-2 bg-success/95 backdrop-blur-sm text-success-foreground px-4 py-3 rounded-xl shadow-lg flex items-center gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                <Wifi className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm">Conectado</p>
                <p className="text-xs opacity-90">Conexão restaurada</p>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default OfflineIndicator;
