import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { X, Loader2 } from "lucide-react";

interface VideoPlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoUrl: string;
  title?: string;
}

// Parse video URL to get embed URL or direct URL
function getVideoInfo(url: string): { type: "youtube" | "vimeo" | "direct"; embedUrl: string } {
  // YouTube patterns
  const youtubePatterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
  ];
  
  for (const pattern of youtubePatterns) {
    const match = url.match(pattern);
    if (match) {
      return {
        type: "youtube",
        embedUrl: `https://www.youtube.com/embed/${match[1]}?autoplay=1&rel=0&playsinline=1`,
      };
    }
  }
  
  // Vimeo patterns
  const vimeoPattern = /(?:vimeo\.com\/|player\.vimeo\.com\/video\/)(\d+)/;
  const vimeoMatch = url.match(vimeoPattern);
  if (vimeoMatch) {
    return {
      type: "vimeo",
      embedUrl: `https://player.vimeo.com/video/${vimeoMatch[1]}?autoplay=1`,
    };
  }
  
  // Direct video URL (mp4, webm, etc.)
  return {
    type: "direct",
    embedUrl: url,
  };
}

const VideoPlayerModal = ({ isOpen, onClose, videoUrl, title }: VideoPlayerModalProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const videoInfo = getVideoInfo(videoUrl);

  // Lock/unlock body scroll and allow orientation changes
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      // Allow screen rotation on mobile
      if (screen.orientation && 'unlock' in screen.orientation) {
        try {
          (screen.orientation as any).unlock();
        } catch (e) {
          // Orientation API not supported or not allowed
        }
      }
    } else {
      document.body.style.overflow = "";
    }
    
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
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
        height: "100dvh", // Dynamic viewport height for mobile
      }}
    >
      {/* Header with title and close button */}
      <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-4 py-3 bg-gradient-to-b from-black/80 to-transparent">
        {title && (
          <h3 className="text-white font-medium text-sm truncate max-w-[80%]">
            {title}
          </h3>
        )}
        <button
          onClick={onClose}
          className="ml-auto w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center hover:bg-white/20 active:bg-white/30 transition-colors"
          aria-label="Fechar"
        >
          <X className="w-5 h-5 text-white" />
        </button>
      </div>

      {/* Video container - full screen */}
      <div className="flex-1 flex items-center justify-center w-full h-full">
        {/* Loading spinner */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black z-5">
            <Loader2 className="w-12 h-12 text-white animate-spin" />
          </div>
        )}

        {videoInfo.type === "direct" ? (
          <video
            src={videoInfo.embedUrl}
            controls
            autoPlay
            playsInline
            className="w-full h-full object-contain"
            onLoadedData={() => setIsLoading(false)}
            onError={() => setIsLoading(false)}
            style={{ maxWidth: "100%", maxHeight: "100%" }}
          />
        ) : (
          <iframe
            src={videoInfo.embedUrl}
            title={title || "Video"}
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
            allowFullScreen
            onLoad={() => setIsLoading(false)}
            style={{ border: "none" }}
          />
        )}
      </div>
    </motion.div>
  );
};

export default VideoPlayerModal;
