import { Story } from "@/hooks/useStories";
import { motion } from "framer-motion";
import { Lock } from "lucide-react";

interface StoryCardProps {
  story: Story;
  size?: "small" | "medium" | "large";
  onClick?: () => void;
}

const StoryCard = ({ story, size = "medium", onClick }: StoryCardProps) => {
  const sizeClasses = {
    small: "w-28 h-40",
    medium: "w-36 h-52",
    large: "w-44 h-64",
  };

  // Use translated title if available
  const displayTitle = story.translated_title || story.title;

  // CORREÇÃO: Prioriza cover_url (novo padrão), com fallback para cover_image
  const coverImageSrc = story.cover_url || (story as any).cover_image || "/placeholder.svg";

  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.98 }}
      className={`story-card ${sizeClasses[size]} flex-shrink-0 cursor-pointer relative overflow-hidden rounded-xl`}
      onClick={onClick}
    >
      <img
        src={coverImageSrc}
        alt={displayTitle}
        className="w-full h-full object-cover transition-transform duration-300"
        onError={(e) => {
           // Fallback visual se a imagem quebrar
           (e.target as HTMLImageElement).src = "/placeholder.svg";
        }}
      />
      
      {/* Overlay Gradiente */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-90" />
      
      {/* Badge - Only show lock for premium */}
      {story.is_premium && (
        <div className="absolute top-2 right-2 w-7 h-7 rounded-full bg-amber-500/90 backdrop-blur-sm flex items-center justify-center shadow-lg z-10">
          <Lock className="w-3.5 h-3.5 text-white" />
        </div>
      )}

      {/* Content */}
      <div className="absolute bottom-0 left-0 right-0 p-3 z-10">
        <h3 className="font-bold text-white text-sm line-clamp-2 drop-shadow-md">
          {displayTitle}
        </h3>
      </div>
    </motion.div>
  );
};

export default StoryCard;