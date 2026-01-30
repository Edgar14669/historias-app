import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { RefreshCw, Search } from "lucide-react";
import BottomNavLayout from "@/components/BottomNavLayout";
import StoryCard from "@/components/StoryCard";
import SectionHeader from "@/components/SectionHeader";
import CategoryPill from "@/components/CategoryPill";
import SearchModal from "@/components/SearchModal";
import { useApp } from "@/contexts/AppContext";
import { useStories, useCategories } from "@/hooks/useStories";
// import { useAllStoryViews } from "@/hooks/useStoryViews"; // Comentado temporariamente até migrarmos
import { useTranslation } from "@/hooks/useTranslation";
import { useCategoryTranslation } from "@/hooks/useCategoryTranslation";

const HomePage = () => {
  const { profile } = useApp();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { translateCategory } = useCategoryTranslation();
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  
  const { data: stories = [], isLoading: storiesLoading, isError: storiesError, refetch: refetchStories } = useStories();
  const { data: categories = [], isLoading: categoriesLoading } = useCategories();
  
  // Views temporariamente desativados ou mockados para não quebrar a home
  const storyViews: any[] = []; 
  // const { data: storyViews = [] } = useAllStoryViews();

  // Derived story sections
  const freeStories = stories.filter((story) => !story.is_premium);
  const premiumStories = stories.filter((story) => story.is_premium);
  
  // Ordenação segura (tratando created_at que pode ser Timestamp ou string)
  const latestStories = [...stories].sort((a, b) => {
    const dateA = a.created_at?.toDate ? a.created_at.toDate().getTime() : new Date(a.created_at).getTime();
    const dateB = b.created_at?.toDate ? b.created_at.toDate().getTime() : new Date(b.created_at).getTime();
    return (dateB || 0) - (dateA || 0);
  }).slice(0, 10);

  const filteredStories = activeCategory
    ? stories.filter((story) => story.category?.name === activeCategory)
    : stories;
  
  // Featured stories: sorted by most views (Mockado por enquanto, pega os primeiros)
  const featuredStories = useMemo(() => {
    if (storyViews.length === 0) return stories.slice(0, 3);
    
    const viewsMap = new Map(storyViews.map(sv => [sv.storyId, sv.views]));
    
    return [...stories]
      .sort((a, b) => (viewsMap.get(b.id) || 0) - (viewsMap.get(a.id) || 0))
      .slice(0, 3);
  }, [stories, storyViews]);

  // Top 10 stories
  const topStories = useMemo(() => {
    if (storyViews.length === 0) return stories.slice(0, 10);
    
    const viewsMap = new Map(storyViews.map(sv => [sv.storyId, sv.views]));
    
    return [...stories]
      .sort((a, b) => (viewsMap.get(b.id) || 0) - (viewsMap.get(a.id) || 0))
      .slice(0, 10);
  }, [stories, storyViews]);

  const handleStoryClick = (storyId: string) => {
    navigate(`/story/${storyId}`);
  };

  const StorySkeleton = ({ size = "medium" }: { size?: "small" | "medium" | "large" }) => {
    const sizeClasses = {
      small: "w-28 h-40",
      medium: "w-36 h-52",
      large: "w-44 h-64",
    };
    return (
      <div className={`${sizeClasses[size]} bg-muted rounded-xl animate-pulse flex-shrink-0`} />
    );
  };

  if (storiesError) {
    return (
      <BottomNavLayout>
        <div className="page-padding flex flex-col items-center justify-center min-h-[60vh]">
          <p className="text-destructive mb-4">{t("errorLoadingStories")}</p>
          <button
            onClick={() => refetchStories()}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg"
          >
            <RefreshCw className="w-4 h-4" />
            {t("tryAgain")}
          </button>
        </div>
      </BottomNavLayout>
    );
  }

  return (
    <BottomNavLayout>
      <div className="page-padding">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 flex items-start justify-between"
        >
          <div>
            <p className="text-muted-foreground text-sm">{t("hello")}</p>
            <h1 className="text-2xl font-bold text-foreground">
              {profile?.display_name || t("guest")} 👋
            </h1>
          </div>
          <button
            onClick={() => setIsSearchOpen(true)}
            className="p-3 rounded-full bg-muted hover:bg-muted/80 transition-colors"
            aria-label={t("search")}
          >
            <Search className="w-5 h-5 text-foreground" />
          </button>
        </motion.div>

        {/* Search Modal */}
        <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />

        {/* Categories */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
            <CategoryPill
              name={t("all")}
              isActive={activeCategory === null}
              onClick={() => setActiveCategory(null)}
            />
            {categoriesLoading ? (
              <>
                <div className="w-20 h-8 bg-muted rounded-full animate-pulse" />
                <div className="w-24 h-8 bg-muted rounded-full animate-pulse" />
                <div className="w-20 h-8 bg-muted rounded-full animate-pulse" />
              </>
            ) : (
              categories.map((category) => (
                <CategoryPill
                  key={category.id}
                  name={translateCategory(category.name)}
                  isActive={activeCategory === category.name}
                  onClick={() => setActiveCategory(category.name)}
                />
              ))
            )}
          </div>
        </motion.div>

        {/* Featured Stories */}
        {!activeCategory && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-8"
          >
            <SectionHeader title={t("featured")} />
            <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2">
              {storiesLoading ? (
                <>
                  <StorySkeleton size="large" />
                  <StorySkeleton size="large" />
                  <StorySkeleton size="large" />
                </>
              ) : featuredStories.length === 0 ? (
                <p className="text-muted-foreground text-sm py-4">{t("noStoriesAvailable")}</p>
              ) : (
                featuredStories.map((story) => (
                  <StoryCard
                    key={story.id}
                    story={story}
                    size="large"
                    onClick={() => handleStoryClick(story.id)}
                  />
                ))
              )}
            </div>
          </motion.section>
        )}

        {/* Filtered by Category */}
        {activeCategory && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mb-8"
          >
            <SectionHeader title={translateCategory(activeCategory)} />
            <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2">
              {storiesLoading ? (
                <>
                  <StorySkeleton size="medium" />
                  <StorySkeleton size="medium" />
                  <StorySkeleton size="medium" />
                </>
              ) : filteredStories.length === 0 ? (
                <p className="text-muted-foreground text-sm py-4">
                  {t("noStoriesInCategory")} "{translateCategory(activeCategory)}"
                </p>
              ) : (
                filteredStories.map((story) => (
                  <StoryCard
                    key={story.id}
                    story={story}
                    size="medium"
                    onClick={() => handleStoryClick(story.id)}
                  />
                ))
              )}
            </div>
          </motion.section>
        )}

        {/* Free Stories Section */}
        {!activeCategory && freeStories.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mb-8"
          >
            <SectionHeader title={t("freeStories")} />
            <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2">
              {storiesLoading ? (
                <>
                  <StorySkeleton size="medium" />
                  <StorySkeleton size="medium" />
                  <StorySkeleton size="medium" />
                </>
              ) : (
                freeStories.map((story) => (
                  <StoryCard
                    key={story.id}
                    story={story}
                    size="medium"
                    onClick={() => handleStoryClick(story.id)}
                  />
                ))
              )}
            </div>
          </motion.section>
        )}

        {/* Premium Stories Section */}
        {!activeCategory && premiumStories.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="mb-8"
          >
            <SectionHeader title={t("premiumStories")} />
            <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2">
              {storiesLoading ? (
                <>
                  <StorySkeleton size="medium" />
                  <StorySkeleton size="medium" />
                  <StorySkeleton size="medium" />
                </>
              ) : (
                premiumStories.map((story) => (
                  <StoryCard
                    key={story.id}
                    story={story}
                    size="medium"
                    onClick={() => handleStoryClick(story.id)}
                  />
                ))
              )}
            </div>
          </motion.section>
        )}

        {/* Latest Stories Section */}
        {!activeCategory && latestStories.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mb-8"
          >
            <SectionHeader title={t("latestStories")} />
            <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2">
              {storiesLoading ? (
                <>
                  <StorySkeleton size="medium" />
                  <StorySkeleton size="medium" />
                  <StorySkeleton size="medium" />
                </>
              ) : (
                latestStories.map((story) => (
                  <StoryCard
                    key={story.id}
                    story={story}
                    size="medium"
                    onClick={() => handleStoryClick(story.id)}
                  />
                ))
              )}
            </div>
          </motion.section>
        )}

        {/* Top 10 - Horizontal Scroll like Netflix */}
        {!activeCategory && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
            className="mb-8"
          >
            <SectionHeader title={t("topStories")} />
            {storiesLoading ? (
              <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2">
                <StorySkeleton size="medium" />
                <StorySkeleton size="medium" />
                <StorySkeleton size="medium" />
              </div>
            ) : topStories.length === 0 ? (
              <p className="text-muted-foreground text-sm py-4">{t("noStoriesAvailable")}</p>
            ) : (
              <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2">
                {topStories.map((story, index) => (
                  <motion.div
                    key={story.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.45 + index * 0.05 }}
                    className="relative flex-shrink-0"
                  >
                    <div className="absolute -top-1 -left-1 z-10 w-7 h-7 rounded-full gradient-premium flex items-center justify-center text-white font-bold text-xs shadow-lg">
                      {index + 1}
                    </div>
                    <StoryCard
                      story={story}
                      size="medium"
                      onClick={() => handleStoryClick(story.id)}
                    />
                  </motion.div>
                ))}
              </div>
            )}
          </motion.section>
        )}
      </div>
    </BottomNavLayout>
  );
};

export default HomePage;