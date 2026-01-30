import { motion } from "framer-motion";
import { useNavigate, Link } from "react-router-dom";
import { ArrowLeft, BookOpen, Edit, Trash2, Eye, Plus } from "lucide-react";
import { useAllStories, useDeleteStory } from "@/hooks/useStories";
import { toast } from "sonner";

const StoriesListPage = () => {
  const navigate = useNavigate();
  // Os dados agora vêm do Firebase através do nosso hook reescrito
  const { data: stories = [], isLoading, isError, error, refetch } = useAllStories();
  const deleteStory = useDeleteStory();

  const handleDelete = async (id: string) => {
    if (confirm("Tem certeza que deseja excluir esta história?")) {
      try {
        await deleteStory.mutateAsync(id);
        toast.success("História excluída com sucesso!");
      } catch (error) {
        toast.error("Erro ao excluir história");
      }
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-sidebar flex flex-col items-center justify-center gap-4">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        <p className="text-muted-foreground">Carregando histórias...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen bg-sidebar flex flex-col items-center justify-center gap-4">
        <p className="text-destructive">Erro ao carregar histórias</p>
        <p className="text-muted-foreground text-sm">{(error as Error)?.message || "Tente novamente"}</p>
        <button
          onClick={() => refetch()}
          className="px-4 py-2 bg-accent text-accent-foreground rounded-lg hover:bg-accent/90"
        >
          Tentar Novamente
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-sidebar p-4 lg:p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto"
      >
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate("/admin/dashboard")}
            className="p-2 rounded-lg bg-muted hover:bg-muted/80 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <div className="flex-1">
            <h1 className="text-xl lg:text-2xl font-bold text-foreground">Histórias Cadastradas</h1>
            <p className="text-sm text-muted-foreground">
              Total: {stories.length} histórias
            </p>
          </div>
          <button
            onClick={() => navigate("/admin/stories/new/edit")}
            className="flex items-center gap-2 px-4 py-2 bg-accent text-accent-foreground rounded-lg hover:bg-accent/90 transition-colors text-sm"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Nova História</span>
          </button>
        </div>

        {/* Stories List */}
        <div className="space-y-3">
          {stories.map((story, index) => (
            <motion.div
              key={story.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-card rounded-lg border border-border p-4 flex flex-col sm:flex-row items-start sm:items-center gap-4"
            >
              {/* Ajustei de cover_image para cover_url para compatibilidade com nosso hook novo */}
              {story.cover_url && (
                <img
                  src={story.cover_url}
                  alt={story.title}
                  className="w-16 h-16 rounded-lg object-cover"
                />
              )}
              {!story.cover_url && (
                <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-muted-foreground" />
                </div>
              )}
              <div className="flex-1 min-w-0 overflow-hidden">
                <h3 className="font-semibold text-foreground text-sm truncate break-words">{story.title}</h3>
                <p className="text-xs text-muted-foreground line-clamp-1 break-words overflow-wrap-anywhere">{story.description}</p>
                <div className="flex items-center gap-2 mt-1">
                  {story.category && (
                    <span className="text-xs bg-muted px-2 py-0.5 rounded">{story.category.name}</span>
                  )}
                  {story.is_premium && (
                    <span className="text-xs bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded">Premium</span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Link 
                  to={`/admin/stories/${story.id}/preview`}
                  className="flex-1 sm:flex-none p-2 rounded-lg bg-muted hover:bg-muted/80 transition-colors"
                >
                  <Eye className="w-4 h-4 text-foreground mx-auto" />
                </Link>
                <Link 
                  to={`/admin/stories/${story.id}/edit`}
                  className="flex-1 sm:flex-none p-2 rounded-lg bg-muted hover:bg-muted/80 transition-colors"
                >
                  <Edit className="w-4 h-4 text-foreground mx-auto" />
                </Link>
                <button
                  onClick={() => handleDelete(story.id)}
                  className="flex-1 sm:flex-none p-2 rounded-lg bg-destructive/20 hover:bg-destructive/30 transition-colors"
                >
                  <Trash2 className="w-4 h-4 text-destructive mx-auto" />
                </button>
              </div>
            </motion.div>
          ))}

          {stories.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Nenhuma história cadastrada ainda.</p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default StoriesListPage;