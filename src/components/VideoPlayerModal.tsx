import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2 } from "lucide-react";

interface VideoPlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoUrl: string;
  title?: string;
}

// Função aprimorada para detectar e converter URLs
function getVideoInfo(url: string): { type: "youtube" | "vimeo" | "direct"; embedUrl: string } {
  if (!url) return { type: "direct", embedUrl: "" };

  // YouTube (suporta links curtos, longos, embed e mobile)
  const youtubeRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
  const youtubeMatch = url.match(youtubeRegex);
  if (youtubeMatch && youtubeMatch[1]) {
    return {
      type: "youtube",
      // Adiciona parâmetros vitais para mobile: playsinline, rel=0
      embedUrl: `https://www.youtube.com/embed/${youtubeMatch[1]}?autoplay=1&rel=0&playsinline=1&modestbranding=1`,
    };
  }
  
  // Vimeo
  const vimeoRegex = /(?:vimeo\.com\/|player\.vimeo\.com\/video\/)(\d+)/;
  const vimeoMatch = url.match(vimeoRegex);
  if (vimeoMatch && vimeoMatch[1]) {
    return {
      type: "vimeo",
      embedUrl: `https://player.vimeo.com/video/${vimeoMatch[1]}?autoplay=1&title=0&byline=0&portrait=0`,
    };
  }
  
  // URL direta (mp4, etc)
  return {
    type: "direct",
    embedUrl: url,
  };
}

const VideoPlayerModal = ({ isOpen, onClose, videoUrl, title }: VideoPlayerModalProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const videoInfo = getVideoInfo(videoUrl);

  // Efeito para bloquear scroll e gerenciar orientação (mantido do original)
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      if (screen.orientation && 'unlock' in screen.orientation) {
        try { (screen.orientation as any).unlock(); } catch (e) {}
      }
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  // Fechar com ESC
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) onClose();
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] bg-black flex flex-col"
          style={{ 
            position: "fixed",
            top: 0, 
            left: 0, 
            right: 0, 
            bottom: 0, 
            width: "100vw", 
            height: "100dvh" 
          }}
        >
          {/* Header */}
          <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-4 py-3 bg-gradient-to-b from-black/80 to-transparent pointer-events-none">
            {title && (
              <h3 className="text-white font-medium text-sm truncate max-w-[80%] drop-shadow-md">
                {title}
              </h3>
            )}
            <button
              onClick={onClose}
              className="ml-auto pointer-events-auto w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center hover:bg-white/20 active:bg-white/30 transition-colors z-50"
              aria-label="Fechar"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>

          {/* Container do Vídeo */}
          <div className="flex-1 flex items-center justify-center w-full h-full relative">
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black z-0">
                <Loader2 className="w-12 h-12 text-white/50 animate-spin" />
              </div>
            )}

            {videoInfo.type === "direct" ? (
              <video
                src={videoInfo.embedUrl}
                controls
                autoPlay
                playsInline
                className="w-full h-full object-contain max-h-screen"
                onLoadedData={() => setIsLoading(false)}
              />
            ) : (
              <iframe
                src={videoInfo.embedUrl}
                title={title || "Video"}
                className="w-full h-full border-0 absolute inset-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                allowFullScreen
                onLoad={() => setIsLoading(false)}
              />
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default VideoPlayerModal;