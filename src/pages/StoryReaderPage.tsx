import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import DOMPurify from "dompurify";
import { useStory, StoryPage } from "@/hooks/useStories";
import { useTranslation } from "@/hooks/useTranslation";
import { useApp } from "@/contexts/AppContext";
import { useToast } from "@/hooks/use-toast";
import { useRecordStoryView } from "@/hooks/useStoryViews";

const StoryReaderPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { profile } = useApp();
  const { toast } = useToast();
  const [currentPage, setCurrentPage] = useState(0);
  const [currentImageError, setCurrentImageError] = useState(false);

  const { data: story, isLoading } = useStory(id);
  const { mutate: recordView } = useRecordStoryView();

  // Registrar visualização
  useEffect(() => {
    if (story && id) {
       recordView({ storyId: id, userId: profile?.id });
    }
  }, [story, id, profile, recordView]);

  const isSubscribed = profile?.is_subscribed === true;

  // Lógica de Redirecionamento Premium
  useEffect(() => {
    if (story && story.is_premium && !isSubscribed) {
      toast({
        title: t("premiumContent"),
        description: t("subscribeToAccess"),
        variant: "destructive",
      });
      navigate("/premium", { replace: true });
    }
  }, [story, isSubscribed, navigate, toast, t]);

  if (isLoading) {
    return (
      <div className="mobile-container min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!story) {
    return (
      <div className="mobile-container min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">{t("storyNotFound")}</p>
      </div>
    );
  }

  // Garantia de páginas (usa mock se estiver vazio)
  const pages: StoryPage[] = story.story_pages && story.story_pages.length > 0 
    ? [...story.story_pages].sort((a, b) => a.page_number - b.page_number)
    : [
        { id: "1", content: "Era uma vez...", page_number: 1, story_id: story.id, page_image: null },
      ];

  const totalPages = pages.length;
  const currentPageData = pages[currentPage];
  
  // EDIÇÃO: Lógica de imagem simplificada e robusta
  // Como o hook já normalizou para page_image, usamos apenas ele.
  const pageImage = currentPageData?.page_image;
  const currentBackgroundImage = pageImage && pageImage.trim() !== '' 
    ? pageImage 
    : story.cover_url;

  const goToPrevious = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
      setCurrentImageError(false);
    }
  };

  const goToNext = () => {
    if (currentPage < totalPages - 1) {
      setCurrentPage(currentPage + 1);
      setCurrentImageError(false);
    }
  };

  const handleClose = () => {
    navigate(`/story/${id}`, { replace: true });
  };

  const displayTitle = story.translated_title || story.title;

  return (
    <div className="mobile-container min-h-screen bg-background flex flex-col relative overflow-hidden">
      {/* Background Image com Animação */}
      <div className="absolute inset-0 z-0">
        <AnimatePresence mode="wait">
          <motion.img
            key={currentPage}
            src={!currentImageError && currentBackgroundImage ? currentBackgroundImage : "/placeholder.svg"}
            alt={displayTitle}
            className="w-full h-full object-cover"
            onError={() => setCurrentImageError(true)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          />
        </AnimatePresence>
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/30" />
      </div>

      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 flex items-center justify-between p-4 flex-shrink-0"
      >
        <button
          onClick={handleClose}
          className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center"
        >
          <X className="w-5 h-5 text-white" />
        </button>
        <h1 className="text-lg font-bold text-white truncate max-w-[60%] drop-shadow-lg">
          {displayTitle}
        </h1>
        <div className="w-10" />
      </motion.header>

      {/* Content Area */}
      <div className="flex-1 flex flex-col justify-end relative z-10 min-h-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentPage}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            transition={{ duration: 0.3 }}
            className="mx-4 mb-4"
          >
            <div className="bg-black/60 backdrop-blur-md rounded-2xl p-6 shadow-2xl border border-white/10">
              <div 
                className="text-white text-lg leading-relaxed break-words prose prose-invert prose-p:my-2 prose-headings:my-3 prose-ul:my-2 prose-ol:my-2 max-w-none"
                dangerouslySetInnerHTML={{ 
                  __html: DOMPurify.sanitize(currentPageData.content, {
                    ALLOWED_TAGS: ['p', 'br', 'strong', 'b', 'em', 'i', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'a', 'span', 'div', 'blockquote'],
                    ALLOWED_ATTR: ['href', 'target', 'rel', 'class', 'style'],
                  })
                }} 
              />
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation Footer */}
      <motion.footer
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-20 bg-black/70 backdrop-blur-md border-t border-white/10 p-4 flex-shrink-0 safe-area-bottom"
      >
        <div className="flex items-center justify-between gap-2">
          <button
            onClick={goToPrevious}
            disabled={currentPage === 0}
            className={`flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 rounded-xl font-medium transition-all text-sm ${
              currentPage === 0
                ? "text-white/40 bg-white/10"
                : "text-white bg-white/20 hover:bg-white/30 active:bg-white/40"
            }`}
          >
            <ChevronLeft className="w-5 h-5" />
            <span className="hidden xs:inline">{t("previous")}</span>
          </button>

          <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
            <span className="text-white font-bold">{currentPage + 1}</span>
            <span className="text-white/60">{t("of")}</span>
            <span className="text-white font-bold">{totalPages}</span>
          </div>

          <button
            onClick={goToNext}
            disabled={currentPage === totalPages - 1}
            className={`flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 rounded-xl font-medium transition-all text-sm ${
              currentPage === totalPages - 1
                ? "text-white/40 bg-white/10"
                : "gradient-primary text-white active:opacity-80"
            }`}
          >
            <span className="hidden xs:inline">{t("next")}</span>
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="mt-3 h-1 bg-white/20 rounded-full overflow-hidden">
          <motion.div
            className="h-full gradient-primary"
            initial={{ width: 0 }}
            animate={{ width: `${((currentPage + 1) / totalPages) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </motion.footer>
    </div>
  );
};

export default StoryReaderPage;