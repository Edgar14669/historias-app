import { motion } from "framer-motion";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Edit, Crown, Calendar, Tag, BookOpen } from "lucide-react";
import { useStory } from "@/hooks/useStories";

const StoryPreviewPage = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  
  const { data: story, isLoading, isError } = useStory(id);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-sidebar flex flex-col items-center justify-center gap-4">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        <p className="text-muted-foreground">Carregando história...</p>
      </div>
    );
  }

  if (isError || !story) {
    return (
      <div className="min-h-screen bg-sidebar flex items-center justify-center">
        <div className="text-center">
          <BookOpen className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
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

  const pages = story.story_pages || [];
  const totalWords = pages.reduce((acc, p) => acc + (p.content?.split(' ').length || 0), 0);

  return (
    <div className="min-h-screen bg-sidebar">
      {/* Cover Image */}
      <div className="relative h-48 lg:h-64">
        {story.cover_url ? (
          <img
            src={story.cover_url}
            alt={story.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-muted flex items-center justify-center">
            <BookOpen className="w-16 h-16 text-muted-foreground opacity-50" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-sidebar via-sidebar/50 to-transparent" />
        
        {/* Header Actions */}
        <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
          <button
            onClick={() => navigate("/admin/stories")}
            className="p-2 rounded-lg bg-black/50 backdrop-blur-sm hover:bg-black/70 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <button
            onClick={() => navigate(`/admin/stories/${id}/edit`)}
            className="flex items-center gap-2 px-4 py-2 bg-accent text-accent-foreground rounded-lg hover:bg-accent/90 transition-colors text-sm"
          >
            <Edit className="w-4 h-4" />
            <span className="hidden sm:inline">Editar</span>
          </button>
        </div>
      </div>

      {/* Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto px-4 lg:px-6 -mt-16 relative z-10 pb-8"
      >
        {/* Title and Meta */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            {story.is_premium && (
              <span className="flex items-center gap-1 text-xs bg-amber-500/20 text-amber-400 px-2 py-1 rounded">
                <Crown className="w-3 h-3" />
                Premium
              </span>
            )}
            {story.category && (
              <span className="flex items-center gap-1 text-xs bg-muted text-muted-foreground px-2 py-1 rounded">
                <Tag className="w-3 h-3" />
                {story.category.name}
              </span>
            )}
          </div>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground mb-2">{story.title}</h1>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="w-4 h-4" />
            <span>Criado em {new Date(story.created_at).toLocaleDateString("pt-BR")}</span>
          </div>
        </div>

        {/* Description */}
        <div className="bg-card rounded-lg border border-border p-4 lg:p-6 mb-6 overflow-hidden">
          <h2 className="text-lg font-semibold text-foreground mb-3">Descrição</h2>
          <p className="text-muted-foreground leading-relaxed break-words overflow-wrap-anywhere">{story.description || "Sem descrição"}</p>
        </div>

        {/* Pages/Content */}
        <div className="bg-card rounded-lg border border-border p-4 lg:p-6 overflow-hidden">
          <h2 className="text-lg font-semibold text-foreground mb-4">
            Conteúdo ({pages.length} {pages.length === 1 ? 'página' : 'páginas'})
          </h2>
          
          {pages.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground border border-dashed border-border rounded-lg">
              <p>Nenhum conteúdo adicionado ainda.</p>
              <button
                onClick={() => navigate(`/admin/stories/${id}/edit`)}
                className="mt-4 px-4 py-2 bg-accent text-accent-foreground rounded-lg text-sm"
              >
                Adicionar Conteúdo
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {pages
                .sort((a, b) => a.page_number - b.page_number)
                .map((page, index) => (
                <motion.div
                  key={page.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-muted rounded-lg p-4 overflow-hidden"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-6 h-6 rounded-full bg-accent/20 text-accent text-xs flex items-center justify-center font-medium flex-shrink-0">
                      {page.page_number}
                    </span>
                    <span className="text-sm text-muted-foreground">Página {page.page_number}</span>
                  </div>
                  <div 
                    className="text-foreground text-sm leading-relaxed break-words overflow-wrap-anywhere max-w-full"
                    style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}
                    dangerouslySetInnerHTML={{ __html: page.content }}
                  />
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mt-6">
          <div className="bg-card rounded-lg border border-border p-4 text-center">
            <p className="text-2xl font-bold text-foreground">{pages.length}</p>
            <p className="text-sm text-muted-foreground">Páginas</p>
          </div>
          <div className="bg-card rounded-lg border border-border p-4 text-center">
            <p className="text-2xl font-bold text-foreground">{totalWords}</p>
            <p className="text-sm text-muted-foreground">Palavras</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default StoryPreviewPage;
