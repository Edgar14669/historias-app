import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Heart, Loader2, LogIn } from "lucide-react";
import BottomNavLayout from "@/components/BottomNavLayout";
import StoryCard from "@/components/StoryCard";
import { useApp } from "@/contexts/AppContext";
import { useStories } from "@/hooks/useStories";
import { useTranslation } from "@/hooks/useTranslation";

const MyListPage = () => {
  const { myList, isLoggedIn, isLoading: authLoading } = useApp();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { data: stories = [], isLoading: storiesLoading, isError, refetch } = useStories();

  const myListStories = stories.filter((story) => myList.includes(story.id));

  const handleStoryClick = (storyId: string) => {
    navigate(`/story/${storyId}`);
  };

  // Show loading only while auth OR stories are loading
  const isLoading = authLoading || storiesLoading;

  return (
    <BottomNavLayout>
      <div className="page-padding">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Heart className="w-6 h-6 text-destructive" fill="currentColor" />
            {t("myList")}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {isLoggedIn ? `${myListStories.length} ${t("storiesSaved")}` : t("loginToSeeList")}
          </p>
        </motion.div>

        {/* Content */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
            <p className="text-sm text-muted-foreground">{t("loading")}</p>
          </div>
        ) : isError ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center py-20 text-center"
          >
            <p className="text-destructive mb-4">{t("errorLoadingStories")}</p>
            <button
              onClick={() => refetch()}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg"
            >
              {t("tryAgain")}
            </button>
          </motion.div>
        ) : !isLoggedIn ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center py-20 text-center"
          >
            <div className="w-24 h-24 rounded-full bg-secondary flex items-center justify-center mb-4">
              <LogIn className="w-12 h-12 text-muted-foreground" />
            </div>
            <h2 className="text-lg font-semibold text-foreground mb-2">
              {t("loginToSeeList")}
            </h2>
            <p className="text-muted-foreground text-sm max-w-xs">
              {t("loginToAccessFavorites")}
            </p>
            <button
              onClick={() => navigate("/")}
              className="mt-6 px-6 py-3 gradient-primary text-white rounded-full font-semibold"
            >
              {t("login")}
            </button>
          </motion.div>
        ) : myListStories.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center py-20 text-center"
          >
            <div className="w-24 h-24 rounded-full bg-secondary flex items-center justify-center mb-4">
              <Heart className="w-12 h-12 text-muted-foreground" />
            </div>
            <h2 className="text-lg font-semibold text-foreground mb-2">
              {t("yourListIsEmpty")}
            </h2>
            <p className="text-muted-foreground text-sm max-w-xs">
              {t("addStoriesToList")}
            </p>
            <button
              onClick={() => navigate("/home")}
              className="mt-6 px-6 py-3 gradient-primary text-white rounded-full font-semibold"
            >
              {t("exploreStories")}
            </button>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-2 gap-4"
          >
            {myListStories.map((story, index) => (
              <motion.div
                key={story.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <StoryCard
                  story={story}
                  size="medium"
                  onClick={() => handleStoryClick(story.id)}
                />
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </BottomNavLayout>
  );
};

export default MyListPage;
