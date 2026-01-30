import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { 
  ArrowLeft, 
  Eye, 
  TrendingUp, 
  Calendar, 
  Trash2, 
  BookOpen,
  Loader2
} from "lucide-react";
import { 
  useAllStoryViews, 
  useStoryViewsCount, 
  useClearAllStoryViews 
} from "@/hooks/useStoryViews";
import { useAllStories } from "@/hooks/useStories";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const StoryViewsPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Hooks reais (Conectados ao Firebase)
  const { data: viewsList = [], isLoading: isLoadingViews } = useAllStoryViews();
  const { data: totalViews = 0 } = useStoryViewsCount();
  const { data: stories = [] } = useAllStories(); // Para pegar os títulos das histórias
  const clearViews = useClearAllStoryViews();

  // Cria um mapa para achar o título da história pelo ID rápido
  const getStoryTitle = (id: string) => {
    const story = stories.find(s => s.id === id);
    return story ? story.title : "História desconhecida (ou excluída)";
  };

  const handleClearViews = async () => {
    try {
      await clearViews.mutateAsync();
      toast({
        title: "Sucesso",
        description: "Contador de visualizações zerado.",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível zerar as visualizações.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-sidebar p-4 lg:p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/admin/dashboard")}
              className="p-2 rounded-lg bg-muted hover:bg-muted/80 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-foreground" />
            </button>
            <div>
              <h1 className="text-xl lg:text-2xl font-bold text-foreground">Histórias Vistas</h1>
              <p className="text-sm text-muted-foreground">
                Total: {totalViews} visualizações
              </p>
            </div>
          </div>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button 
                disabled={totalViews === 0}
                className="flex items-center gap-2 px-3 py-2 bg-red-500/10 text-red-500 hover:bg-red-500/20 rounded-lg text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Trash2 className="w-4 h-4" />
                <span className="hidden sm:inline">Zerar</span>
              </button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
                <AlertDialogDescription>
                  Isso apagará TODO o histórico de visualizações de todas as histórias. Essa ação não pode ser desfeita.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleClearViews} className="bg-red-500 hover:bg-red-600">
                  Sim, zerar tudo
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        {/* Big Counter Card */}
        <div className="bg-gradient-to-r from-orange-500 to-amber-500 rounded-xl p-6 text-white mb-8 shadow-lg relative overflow-hidden">
          <div className="relative z-10">
            <p className="text-white/80 font-medium mb-1">Total de Visualizações</p>
            <h2 className="text-4xl font-bold">{totalViews}</h2>
          </div>
          <TrendingUp className="absolute right-4 bottom-4 w-24 h-24 text-white/20" />
        </div>

        <h2 className="text-lg font-semibold text-foreground mb-4">Ranking por Visualizações</h2>

        {/* Loading State */}
        {isLoadingViews && (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-accent" />
          </div>
        )}

        {/* Empty State */}
        {!isLoadingViews && viewsList.length === 0 && (
          <div className="text-center py-16 bg-card rounded-lg border border-border">
            <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">Nenhuma visualização registrada ainda.</p>
            <p className="text-xs text-muted-foreground mt-1">Leia uma história no app para testar!</p>
          </div>
        )}

        {/* List */}
        <div className="space-y-3">
          {viewsList.map((item, index) => (
            <motion.div
              key={item.storyId}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-card p-4 rounded-lg border border-border flex items-center justify-between hover:border-orange-500/50 transition-colors group"
            >
              <div className="flex items-center gap-4">
                <div className="w-8 h-8 rounded-full bg-orange-500/10 text-orange-500 flex items-center justify-center font-bold text-sm">
                  #{index + 1}
                </div>
                <div>
                  <h3 className="font-medium text-foreground group-hover:text-orange-500 transition-colors">
                    {getStoryTitle(item.storyId)}
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                    <Calendar className="w-3 h-3" />
                    Último acesso: {new Date(item.lastViewed).toLocaleDateString()} às {new Date(item.lastViewed).toLocaleTimeString().slice(0,5)}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2 bg-muted px-3 py-1 rounded-full">
                <Eye className="w-4 h-4 text-muted-foreground" />
                <span className="font-bold text-foreground">{item.views}</span>
              </div>
            </motion.div>
          ))}
        </div>

      </motion.div>
    </div>
  );
};

export default StoryViewsPage;