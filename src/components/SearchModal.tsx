import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { X, Search, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogOverlay, DialogPortal } from "@/components/ui/dialog";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { useStories } from "@/hooks/useStories";
import { useTranslation } from "@/hooks/useTranslation";

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SearchModal = ({ isOpen, onClose }: SearchModalProps) => {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { data: stories = [], isLoading } = useStories();

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Reset query when modal closes
  useEffect(() => {
    if (!isOpen) {
      setQuery("");
      setDebouncedQuery("");
    }
  }, [isOpen]);

  // Filter stories by title and description
  const filteredStories = debouncedQuery.trim()
    ? stories.filter(
        (story) =>
          story.title.toLowerCase().includes(debouncedQuery.toLowerCase()) ||
          (story.description || "").toLowerCase().includes(debouncedQuery.toLowerCase())
      )
    : [];

  const handleStoryClick = (storyId: string) => {
    onClose();
    navigate(`/story/${storyId}`);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogPortal>
        <DialogOverlay className="bg-black/60 backdrop-blur-sm" />
        <DialogPrimitive.Content className="fixed left-[50%] top-[10%] z-50 grid w-[95%] translate-x-[-50%] gap-4 border bg-card p-0 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 sm:max-w-lg sm:rounded-lg border-border overflow-hidden">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col max-h-[80vh]"
          >
            {/* Search header */}
            <div className="flex items-center gap-3 p-4 border-b border-border">
              <Search className="w-5 h-5 text-muted-foreground flex-shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t("search") + "..."}
                className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground outline-none text-base"
              />
              <button
                onClick={onClose}
                className="p-1 hover:bg-muted rounded-full transition-colors"
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>

            {/* Results */}
            <div className="flex-1 overflow-y-auto">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : debouncedQuery.trim() === "" ? (
                <div className="px-4 py-12 text-center text-muted-foreground text-sm">
                  {t("search")}...
                </div>
              ) : filteredStories.length === 0 ? (
                <div className="px-4 py-12 text-center text-muted-foreground text-sm">
                  {t("noStoriesAvailable")}
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {filteredStories.slice(0, 10).map((story) => (
                    <motion.button
                      key={story.id}
                      onClick={() => handleStoryClick(story.id)}
                      className="w-full flex items-center gap-3 p-3 hover:bg-muted/50 transition-colors text-left"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      {/* Thumbnail */}
                      <div className="w-14 h-14 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                        {story.cover_image ? (
                          <img
                            src={story.cover_image}
                            alt={story.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Search className="w-5 h-5 text-muted-foreground" />
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-foreground truncate">
                          {story.title}
                        </h4>
                        {story.description && (
                          <p className="text-sm text-muted-foreground line-clamp-1">
                            {story.description}
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-1">
                          {story.is_premium ? (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-600">
                              {t("premium")}
                            </span>
                          ) : (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/20 text-green-600">
                              {t("free")}
                            </span>
                          )}
                        </div>
                      </div>
                    </motion.button>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  );
};

export default SearchModal;
