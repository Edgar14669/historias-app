import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Save, Loader2, Plus, X } from "lucide-react";
import { 
  useStoryAdmin, 
  useCategories, 
  useCreateStory, 
  useUpdateStory, 
  useCreateCategory
} from "@/hooks/useStories";
import { useToast } from "@/hooks/use-toast";
import StoryPagesEditor from "@/components/admin/StoryPagesEditor";
import StoryTranslationsEditor from "@/components/admin/StoryTranslationsEditor";
import CoverImageUploader from "@/components/admin/CoverImageUploader";

const StoryEditPage = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  
  const isNewStory = id === "new";
  const { data: story, isLoading: storyLoading } = useStoryAdmin(isNewStory ? undefined : id);
  const { data: categories = [] } = useCategories();
  
  const createStory = useCreateStory();
  const updateStory = useUpdateStory();
  const createCategory = useCreateCategory();
  
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [language, setLanguage] = useState("pt");
  const [isPremium, setIsPremium] = useState(false);
  const [coverImage, setCoverImage] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Estados para o Modal de Nova Categoria
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  
  const storyLanguages = [
    { code: "pt", name: "Português" },
    { code: "en", name: "English" },
    { code: "es", name: "Español" },
    { code: "fr", name: "Français" },
    { code: "de", name: "Deutsch" },
    { code: "it", name: "Italiano" },
  ];

  useEffect(() => {
    if (story) {
      setTitle(story.title);
      setDescription(story.description || "");
      setCategoryId(story.category_id || "");
      setLanguage((story as any).language || "pt");
      setIsPremium(story.is_premium);
      // CORREÇÃO: Priorizamos cover_url, que é o padrão que definimos
      setCoverImage(story.cover_url || (story as any).cover_image || "");
      setVideoUrl((story as any).video_url || "");
    }
  }, [story]);

  // Função para criar categoria rápida
  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return;

    try {
      const newCat = await createCategory.mutateAsync(newCategoryName.trim());
      setCategoryId(newCat.id);
      setIsCreatingCategory(false);
      setNewCategoryName("");
      toast({
        title: "Sucesso",
        description: "Categoria criada e selecionada!",
      });
    } catch (error) {
      console.error("Erro ao criar categoria:", error);
      toast({
        title: "Erro",
        description: "Não foi possível criar a categoria.",
        variant: "destructive",
      });
    }
  };

  const handleSave = async () => {
    if (!title.trim()) {
      toast({
        title: "Erro",
        description: "O título é obrigatório",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    
    try {
      // Objeto com os dados corrigidos (usando cover_url)
      const storyData = {
        title: title.trim(),
        description: description.trim() || null,
        category_id: categoryId || null,
        is_premium: isPremium,
        // CORREÇÃO: Salvamos como cover_url para unificar com o resto do app
        cover_url: coverImage.trim() || null,
        video_url: videoUrl.trim() || null,
        language,
      };

      if (isNewStory) {
        const newStory = await createStory.mutateAsync(storyData as any);
        toast({
          title: "Sucesso",
          description: "História criada! Agora você pode adicionar as páginas.",
        });
        navigate(`/admin/stories/${newStory.id}/edit`);
        return;
      } else if (id) {
        await updateStory.mutateAsync({
          id,
          ...storyData
        } as any);
        toast({
          title: "Sucesso",
          description: "História atualizada com sucesso!",
        });
      }
      navigate("/admin/stories");
    } catch (error: any) {
      console.error("Error saving story:", error);
      const errorMessage = error?.message || error?.error_description || "Erro desconhecido";
      toast({
        title: "Erro ao salvar história",
        description: `${errorMessage}. Verifique se você tem permissão de administrador.`,
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (!isNewStory && storyLoading) {
    return (
      <div className="min-h-screen bg-sidebar flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  if (!isNewStory && !story && !storyLoading) {
    return (
      <div className="min-h-screen bg-sidebar flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">História não encontrada</p>
          <button
            onClick={() => navigate("/admin/stories")}
            className="px-4 py-2 bg-accent text-accent-foreground rounded-lg"
          >
            Voltar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-sidebar p-4 lg:p-6 relative">
      {/* Modal de Criar Categoria */}
      {isCreatingCategory && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-card w-full max-w-sm rounded-xl border border-border p-6 shadow-2xl"
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-foreground">Nova Categoria</h3>
              <button onClick={() => setIsCreatingCategory(false)} className="text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <input
              type="text"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="Nome da categoria (ex: Aventura)"
              className="w-full py-2 px-3 bg-muted text-foreground rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-accent mb-4"
              autoFocus
            />

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setIsCreatingCategory(false)}
                className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateCategory}
                disabled={!newCategoryName.trim()}
                className="px-4 py-2 text-sm bg-accent text-accent-foreground rounded-lg hover:bg-accent/90 disabled:opacity-50"
              >
                Criar
              </button>
            </div>
          </motion.div>
        </div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto"
      >
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate("/admin/stories")}
            className="p-2 rounded-lg bg-muted hover:bg-muted/80 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <div className="flex-1">
            <h1 className="text-xl lg:text-2xl font-bold text-foreground">
              {isNewStory ? "Nova História" : "Editar História"}
            </h1>
            <p className="text-sm text-muted-foreground">
              {isNewStory ? "Preencha os dados da nova história" : title}
            </p>
          </div>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-4 py-2 bg-accent text-accent-foreground rounded-lg hover:bg-accent/90 transition-colors text-sm disabled:opacity-50"
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span className="hidden sm:inline">Salvar</span>
          </button>
        </div>

        {/* Form */}
        <div className="bg-card rounded-lg border border-border p-4 lg:p-6">
          <div className="space-y-4">
            {/* Cover Image */}
            <div className="pb-4 border-b border-border">
              <label className="block text-sm font-medium text-foreground mb-3">
                Imagem de Capa
              </label>
              <CoverImageUploader
                value={coverImage}
                onChange={setCoverImage}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Título da História</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Digite o título da história"
                className="w-full py-2 px-3 bg-muted text-foreground rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-accent text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Descrição</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Descreva a história..."
                rows={3}
                className="w-full py-2 px-3 bg-muted text-foreground rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-accent text-sm resize-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* CATEGORIA COM BOTÃO DE + */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Categoria</label>
                <div className="flex gap-2">
                  <select 
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="flex-1 py-2 px-3 bg-muted text-foreground rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-accent text-sm"
                  >
                    <option value="">Selecione uma categoria</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => setIsCreatingCategory(true)}
                    className="p-2 bg-accent text-accent-foreground rounded-lg hover:bg-accent/90 transition-colors"
                    title="Criar nova categoria"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Idioma</label>
                <select 
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full py-2 px-3 bg-muted text-foreground rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-accent text-sm"
                >
                  {storyLanguages.map((lang) => (
                    <option key={lang.code} value={lang.code}>
                      {lang.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Tipo</label>
                <div className="flex items-center gap-4 h-[38px]">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isPremium}
                      onChange={(e) => setIsPremium(e.target.checked)}
                      className="w-4 h-4 rounded border-border text-accent focus:ring-accent"
                    />
                    <span className="text-sm text-foreground">Conteúdo Premium</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Video URL */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                URL do Vídeo (opcional)
              </label>
              <input
                type="text"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                placeholder="Ex: https://www.youtube.com/watch?v=..."
                className="w-full py-2 px-3 bg-muted text-foreground rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-accent text-sm"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Suporta YouTube, Vimeo ou link direto para vídeo (mp4, webm)
              </p>
            </div>

            {/* Story Pages Editor - Only show for existing stories */}
            {!isNewStory && id && (
              <div className="border-t border-border pt-4 mt-4">
                <StoryPagesEditor
                  storyId={id}
                  existingPages={story?.story_pages || []}
                />
              </div>
            )}

            {/* Translations Editor - Only show for existing stories with pages */}
            {!isNewStory && id && story?.story_pages && story.story_pages.length > 0 && (
              <div className="border-t border-border pt-4 mt-4">
                <StoryTranslationsEditor
                  storyId={id}
                  storyBaseLanguage={(story as any).language || "pt"}
                  storyTitle={story.title}
                  storyDescription={story.description || ""}
                  storyPages={story.story_pages}
                />
              </div>
            )}

            {isNewStory && (
              <div className="border-t border-border pt-4 mt-4">
                <div className="text-center py-8 border border-dashed border-border rounded-lg">
                  <p className="text-sm text-muted-foreground mb-2">
                    💡 Clique em <strong>"Salvar"</strong> para criar a história
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Após salvar, você será redirecionado para adicionar as páginas com conteúdo.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default StoryEditPage;