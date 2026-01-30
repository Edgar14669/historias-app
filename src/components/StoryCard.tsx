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

  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.98 }}
      className={`story-card ${sizeClasses[size]} flex-shrink-0`}
      onClick={onClick}
    >
      <img
        src={story.cover_image || "/placeholder.svg"}
        alt={displayTitle}
        className="story-card-image"
      />
      <div className="story-card-overlay" />
      
      {/* Badge - Only show lock for premium */}
      {story.is_premium && (
        <div className="absolute top-2 right-2 w-7 h-7 rounded-full bg-amber-500/90 backdrop-blur-sm flex items-center justify-center shadow-lg">
          <Lock className="w-3.5 h-3.5 text-white" />
        </div>
      )}

      {/* Content */}
      <div className="story-card-content">
        <h3 className="font-bold text-sm line-clamp-2">{displayTitle}</h3>
      </div>
    </motion.div>
  );
};

export default StoryCard;
