import { useState, useEffect, useId } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, ChevronLeft, ChevronRight, Save, Loader2, Eye, EyeOff } from "lucide-react";
import DOMPurify from "dompurify";
// Mudança: Importamos storage do Firebase
import { storage } from "@/integrations/firebase/client";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useCreateStoryPage, useUpdateStoryPage, useDeleteStoryPage } from "@/hooks/useStories";
import { useToast } from "@/hooks/use-toast";
import PageImageUploader from "./PageImageUploader";
import { StoryPage as StoryPageType } from "@/hooks/useStories"; // Importando nosso tipo

interface StoryPagesEditorProps {
  storyId: string;
  // Mudança: Aceita o tipo genérico do Firebase, não mais Tables do Supabase
  existingPages: any[]; 
}

// Adaptando a interface para o estado local
interface StoryPageLocal extends Partial<StoryPageType> {
  isNew?: boolean;
  // Garantir que esses campos existam mesmo que vazios
  content: string;
  page_number: number;
  story_id: string;
  page_image?: string | null; // Firebase usa snake_case ou camelCase? No banco definimos page_image no hook
}

const StoryPagesEditor = ({ storyId, existingPages }: StoryPagesEditorProps) => {
  const [pages, setPages] = useState<StoryPageLocal[]>(() => {
    if (existingPages && existingPages.length > 0) {
      return [...existingPages]
        .sort((a, b) => a.page_number - b.page_number)
        .map(p => ({ 
          ...p, 
          // Ajuste de compatibilidade caso venha do banco como undefined
          page_image: p.page_image || p.image_url || null, 
          isNew: false 
        }));
    }
    return [{
      id: `new-${Date.now()}`,
      content: "",
      page_number: 1,
      story_id: storyId,
      page_image: null,
      isNew: true,
    }];
  });

  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const editorId = useId();
  const { toast } = useToast();

  const createPage = useCreateStoryPage();
  const updatePage = useUpdateStoryPage();
  const deletePage = useDeleteStoryPage();

  useEffect(() => {
    if (isInitialized) return;
    
    if (existingPages && existingPages.length > 0) {
      const sortedPages = [...existingPages]
        .sort((a, b) => a.page_number - b.page_number)
        .map(p => ({ 
          ...p, 
          page_image: p.page_image || p.image_url || null, 
          isNew: false 
        }));
      setPages(sortedPages);
      setIsInitialized(true);
    } else if (!isInitialized) {
      setIsInitialized(true);
    }
  }, [existingPages, isInitialized]);

  const addNewPage = () => {
    const newPage: StoryPageLocal = {
      id: `new-${Date.now()}`,
      content: "",
      page_number: pages.length + 1,
      story_id: storyId,
      page_image: null,
      isNew: true,
    };
    setPages([...pages, newPage]);
    setCurrentPageIndex(pages.length);
  };

  const updateCurrentPageContent = (content: string) => {
    const updatedPages = [...pages];
    updatedPages[currentPageIndex] = {
      ...updatedPages[currentPageIndex],
      content,
    };
    setPages(updatedPages);
  };

  const updateCurrentPageImage = (imageUrl: string | null) => {
    const updatedPages = [...pages];
    updatedPages[currentPageIndex] = {
      ...updatedPages[currentPageIndex],
      page_image: imageUrl,
    };
    setPages(updatedPages);
  };

  const persistCurrentPageImageIfPossible = async (imageUrl: string | null) => {
    const current = pages[currentPageIndex];
    if (!current || current.isNew || !current.id) return;

    try {
      await updatePage.mutateAsync({
        id: current.id,
        storyId, // Necessário para invalidar cache
        page_image: imageUrl,
      });
    } catch (error) {
      console.error("Error persisting page image:", error);
      toast({
        title: "Erro",
        description: "A imagem foi adicionada, mas não pôde ser salva automaticamente. Clique em Salvar para garantir.",
        variant: "destructive",
      });
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: "Erro",
        description: "Por favor, selecione uma imagem válida",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Erro",
        description: "A imagem deve ter no máximo 5MB",
        variant: "destructive",
      });
      return;
    }

    setIsUploadingImage(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${storyId}-page-${currentPageIndex + 1}-${Date.now()}.${fileExt}`;
      
      // MUDANÇA: Upload para Firebase Storage
      const storageRef = ref(storage, `page-images/${fileName}`);
      const snapshot = await uploadBytes(storageRef, file);
      const publicUrl = await getDownloadURL(snapshot.ref);

      updateCurrentPageImage(publicUrl);
      await persistCurrentPageImageIfPossible(publicUrl);
      toast({ title: "Imagem adicionada!" });
    } catch (error) {
      console.error("Error uploading image:", error);
      toast({
        title: "Erro",
        description: "Não foi possível fazer upload da imagem",
        variant: "destructive",
      });
    } finally {
      setIsUploadingImage(false);
      // Reset the file input by getting it from the DOM
      const fileInput = document.getElementById(`page-image-input-${editorId}-${currentPageIndex}`) as HTMLInputElement;
      if (fileInput) {
        fileInput.value = '';
      }
    }
  };

  const deleteCurrentPage = async () => {
    if (pages.length <= 1) {
      toast({
        title: "Erro",
        description: "A história deve ter pelo menos uma página",
        variant: "destructive",
      });
      return;
    }

    const pageToDelete = pages[currentPageIndex];

    try {
      if (!pageToDelete.isNew && pageToDelete.id) {
        await deletePage.mutateAsync({ id: pageToDelete.id, storyId });
      }

      const remainingPages = pages.filter((_, index) => index !== currentPageIndex);
      const renumberedPages = remainingPages.map((p, idx) => ({
        ...p,
        page_number: idx + 1,
      }));
      
      setPages(renumberedPages);
      setCurrentPageIndex(Math.min(currentPageIndex, renumberedPages.length - 1));
      
      toast({ title: "Página removida" });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível remover a página",
        variant: "destructive",
      });
    }
  };

  const saveAllPages = async () => {
    setIsSaving(true);

    try {
      for (const page of pages) {
        if (page.isNew) {
          await createPage.mutateAsync({
            story_id: storyId,
            content: page.content,
            page_number: page.page_number,
            page_image: page.page_image,
          });
        } else if (page.id) {
          await updatePage.mutateAsync({
            id: page.id,
            storyId,
            content: page.content,
            page_number: page.page_number,
            page_image: page.page_image,
          });
        }
      }

      toast({ title: "Páginas salvas com sucesso!" });
      // Pequeno delay para garantir que o cache atualize antes de recarregar (se necessário)
      // window.location.reload(); // Não é ideal no React, melhor confiar no State/Query
    } catch (error) {
      console.error("Error saving pages:", error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar as páginas",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const goToPrevious = () => {
    if (currentPageIndex > 0) {
      setCurrentPageIndex(currentPageIndex - 1);
    }
  };

  const goToNext = () => {
    if (currentPageIndex < pages.length - 1) {
      setCurrentPageIndex(currentPageIndex + 1);
    }
  };

  const currentPage = pages[currentPageIndex];

  if (!currentPage || pages.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-center py-8">
          <div className="text-muted-foreground text-sm">Carregando páginas...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with pagination controls */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-medium text-foreground">
          Páginas da História ({pages.length})
        </h3>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={addNewPage}
            className="flex items-center gap-1 px-3 py-1.5 bg-accent text-accent-foreground rounded-lg text-sm hover:bg-accent/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden xs:inline">Nova Página</span>
          </button>
          <button
            type="button"
            onClick={saveAllPages}
            disabled={isSaving}
            className="flex items-center gap-1 px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-sm hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span className="hidden xs:inline">Salvar</span>
          </button>
        </div>
      </div>

      {/* Page navigation */}
      <div className="flex items-center justify-center gap-2 sm:gap-4 py-2 overflow-x-auto">
        <button
          type="button"
          onClick={goToPrevious}
          disabled={currentPageIndex === 0}
          className={`p-2 rounded-lg transition-colors flex-shrink-0 ${
            currentPageIndex === 0
              ? "text-muted-foreground bg-muted"
              : "text-foreground bg-secondary hover:bg-secondary/80"
          }`}
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        {/* Page indicators */}
        <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto">
          {pages.map((_, index) => (
            <button
              key={index}
              type="button"
              onClick={() => setCurrentPageIndex(index)}
              className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg text-xs sm:text-sm font-medium transition-colors flex-shrink-0 ${
                index === currentPageIndex
                  ? "bg-accent text-accent-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {index + 1}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={goToNext}
          disabled={currentPageIndex === pages.length - 1}
          className={`p-2 rounded-lg transition-colors flex-shrink-0 ${
            currentPageIndex === pages.length - 1
              ? "text-muted-foreground bg-muted"
              : "text-foreground bg-secondary hover:bg-secondary/80"
          }`}
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Current page editor */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentPageIndex}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
          className="bg-muted rounded-lg p-4 border border-border"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-foreground">
              Página {currentPageIndex + 1}
              {currentPage.isNew && (
                <span className="ml-2 text-xs text-accent">(nova)</span>
              )}
            </span>
            <button
              type="button"
              onClick={deleteCurrentPage}
              disabled={pages.length <= 1}
              className="p-1 text-muted-foreground hover:text-destructive transition-colors disabled:opacity-50"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          {/* Page Image Section */}
          <PageImageUploader
            value={currentPage.page_image || ""}
            onChange={(url) => {
              updateCurrentPageImage(url || null);
              void persistCurrentPageImageIfPossible(url || null);
            }}
            isUploading={isUploadingImage}
            onUpload={handleImageUpload}
            inputId={`page-image-input-${editorId}-${currentPageIndex}`}
          />

          <div className="flex items-center justify-between mb-2">
            <label className="text-xs text-muted-foreground">
              Conteúdo (suporta HTML)
            </label>
            <button
              type="button"
              onClick={() => setShowPreview(!showPreview)}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              {showPreview ? (
                <>
                  <EyeOff className="w-3 h-3" />
                  Ocultar Preview
                </>
              ) : (
                <>
                  <Eye className="w-3 h-3" />
                  Ver Preview
                </>
              )}
            </button>
          </div>

          <textarea
            placeholder="Escreva o conteúdo desta página da história... (suporta HTML: <b>, <i>, <p>, <h1>-<h6>, <ul>, <ol>, <li>)"
            rows={6}
            value={currentPage.content}
            onChange={(e) => updateCurrentPageContent(e.target.value)}
            className="w-full py-3 px-4 bg-background text-foreground rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-accent text-sm resize-none leading-relaxed font-mono"
          />

          {/* HTML Preview */}
          {showPreview && currentPage.content && (
            <div className="mt-3 p-4 bg-background rounded-lg border border-border overflow-hidden">
              <p className="text-xs text-muted-foreground mb-2">Preview:</p>
              <div 
                className="text-foreground text-sm leading-relaxed prose prose-sm max-w-none dark:prose-invert break-words overflow-wrap-anywhere"
                dangerouslySetInnerHTML={{ 
                  __html: DOMPurify.sanitize(currentPage.content, {
                    ALLOWED_TAGS: ['p', 'br', 'strong', 'b', 'em', 'i', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'a', 'span', 'div', 'blockquote'],
                    ALLOWED_ATTR: ['href', 'target', 'rel', 'class', 'style'],
                  })
                }} 
              />
            </div>
          )}

          <p className="text-xs text-muted-foreground mt-2">
            {currentPage.content.length} caracteres
          </p>
        </motion.div>
      </AnimatePresence>

      {/* Progress bar */}
      <div className="h-1 bg-secondary rounded-full overflow-hidden">
        <div
          className="h-full bg-accent transition-all duration-300"
          style={{ width: `${((currentPageIndex + 1) / pages.length) * 100}%` }}
        />
      </div>
    </div>
  );
};

export default StoryPagesEditor;