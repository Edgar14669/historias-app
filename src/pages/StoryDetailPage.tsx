import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ChevronLeft, BookOpen, Heart, Share2, Lock, Play } from "lucide-react";
import { useApp } from "@/contexts/AppContext";
import { useStory, useStories } from "@/hooks/useStories";
// import { useRecordStoryView } from "@/hooks/useStoryViews"; // Views temporariamente off
import StoryCard from "@/components/StoryCard";
import VideoPlayerModal from "@/components/VideoPlayerModal";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/hooks/useTranslation";

const StoryDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToMyList, removeFromMyList, isInMyList, isLoggedIn, user, profile } = useApp();
  const { toast } = useToast();
  const { t } = useTranslation();
  const viewRecorded = useRef(false);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);

  // Check if user can access premium content
  const isSubscribed = profile?.is_subscribed === true;

  const { data: story, isLoading } = useStory(id);
  const { data: allStories = [] } = useStories();
  // const recordView = useRecordStoryView(); // Desativado
  
  // Record view when story is loaded
  // Record view when story is loaded
  useEffect(() => {
    if (story && id && !viewRecorded.current) {
      viewRecorded.current = true;
      // recordView.mutate({ storyId: id, userId: user?.id }); // Desativado temporariamente
      console.log("View recorded (mock):", id);
    }
    // REMOVIDO: user?.id da lista abaixo para parar o erro
  }, [story, id]);
  
  const relatedStories = allStories
    .filter((s) => s.category_id === story?.category_id && s.id !== id)
    .slice(0, 4);

  if (isLoading) {
    return (
      <div className="mobile-container min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!story) {
    return (
      <div className="mobile-container min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">{t("storyNotFound")}</p>
      </div>
    );
  }

  const isFavorite = isInMyList(story.id);

  const handleToggleFavorite = async () => {
    if (!isLoggedIn) {
      toast({
        title: t("loginRequired"),
        description: t("loginToAddFavorites"),
        variant: "destructive",
      });
      // navigate("/"); // Melhor não redirecionar drasticamente, apenas avisar
      return;
    }
    
    try {
      if (isFavorite) {
        await removeFromMyList(story.id);
        toast({ title: t("removedFromFavorites") });
      } else {
        await addToMyList(story.id);
        toast({ title: t("addedToFavorites") });
      }
    } catch (error) {
      toast({
        title: t("error"),
        description: t("errorUpdatingFavorites"),
        variant: "destructive",
      });
    }
  };

  const handleShare = async () => {
    const displayTitle = story.translated_title || story.title;
    const displayDescription = story.translated_description || story.description;
    
    const shareData = {
      title: displayTitle,
      text: displayDescription || `${t("checkOutStory")} ${displayTitle}`,
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(window.location.href);
        toast({ title: t("linkCopied") });
      }
    } catch (error) {
      if ((error as Error).name !== "AbortError") {
        await navigator.clipboard.writeText(window.location.href);
        toast({ title: t("linkCopied") });
      }
    }
  };

  const handleRead = () => {
    // Check if story is premium and user is not subscribed
    if (story.is_premium && !isSubscribed) {
      toast({
        title: t("premiumContent"),
        description: t("subscribeToAccess"),
        variant: "destructive",
      });
      navigate("/premium");
      return;
    }
    navigate(`/story/${id}/read`);
  };

  const handleWatch = () => {
    if ((story as any).video_url) {
      setIsVideoModalOpen(true);
    }
  };

  const hasVideo = Boolean((story as any).video_url);

  return (
    <div className="mobile-container min-h-screen">
      {/* Hero Image */}
      <div className="relative h-80">
        <img
          src={story.cover_url || "/placeholder.svg"}
          alt={story.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />

        {/* Back Button */}
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 w-10 h-10 rounded-full glass-effect flex items-center justify-center shadow-lg"
        >
          <ChevronLeft className="w-6 h-6 text-foreground" />
        </motion.button>

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="absolute top-4 right-4 flex gap-2"
        >
          <button
            onClick={handleToggleFavorite}
            className="w-10 h-10 rounded-full glass-effect flex items-center justify-center shadow-lg"
          >
            <Heart
              className={`w-5 h-5 ${
                isFavorite ? "text-destructive fill-destructive" : "text-foreground"
              }`}
            />
          </button>
          <button
            onClick={handleShare}
            className="w-10 h-10 rounded-full glass-effect flex items-center justify-center shadow-lg"
          >
            <Share2 className="w-5 h-5 text-foreground" />
          </button>
        </motion.div>

        {/* Badge */}
        {story.is_premium ? (
          <div className="absolute bottom-20 left-5 px-3 py-1 rounded-full gradient-premium text-white text-sm font-bold shadow-lg">
            {t("premium")}
          </div>
        ) : (
          <div className="absolute bottom-20 left-5 px-3 py-1 rounded-full bg-success text-white text-sm font-bold shadow-lg">
            {t("free")}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="page-padding -mt-12 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-2xl p-5 shadow-xl"
        >
          <h1 className="text-2xl font-bold text-foreground mb-2 break-words">
            {story.translated_title || story.title}
          </h1>
          <p className="text-muted-foreground text-sm mb-4 leading-relaxed break-words overflow-wrap-anywhere">
            {story.translated_description || story.description}
          </p>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleRead}
              className={`flex-1 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 ${
                story.is_premium && !isSubscribed
                  ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white"
                  : "gradient-primary text-white"
              }`}
            >
              {story.is_premium && !isSubscribed ? (
                <>
                  <Lock className="w-5 h-5" />
                  {t("subscribeToContinue")}
                </>
              ) : (
                <>
                  <BookOpen className="w-5 h-5" />
                  {t("read")}
                </>
              )}
            </button>
            <button
              onClick={handleWatch}
              disabled={!hasVideo}
              className={`py-3 px-5 rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors ${
                hasVideo
                  ? "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                  : "bg-muted text-muted-foreground cursor-not-allowed opacity-50"
              }`}
            >
              <Play className="w-5 h-5" />
              {t("watch")}
            </button>
          </div>
        </motion.div>

        {/* Video Player Modal */}
        {hasVideo && (
          <VideoPlayerModal
            isOpen={isVideoModalOpen}
            onClose={() => setIsVideoModalOpen(false)}
            videoUrl={(story as any).video_url}
            title={story.title}
          />
        )}

        {/* Related Stories */}
        {relatedStories.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-8"
          >
            <h2 className="text-lg font-bold text-foreground mb-3">
              {t("relatedStories")}
            </h2>
            <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2">
              {relatedStories.map((related) => (
                <StoryCard
                  key={related.id}
                  story={related}
                  size="small"
                  onClick={() => navigate(`/story/${related.id}`)}
                />
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default StoryDetailPage;