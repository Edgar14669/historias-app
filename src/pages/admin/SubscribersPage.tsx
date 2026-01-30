import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Crown, Calendar, KeyRound, Loader2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
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

// MOCK DATA (Para não quebrar o build enquanto migramos)
const MOCK_SUBSCRIBERS = [
  {
    id: "1",
    user_id: "user_123",
    display_name: "Assinante Exemplo",
    avatar_url: null,
    created_at: new Date().toISOString(),
    is_subscribed: true
  }
];

const SubscribersPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Estado local para simulação
  const [subscribers, setSubscribers] = useState(MOCK_SUBSCRIBERS);
  const isLoading = false;
  const activeSubscribers = subscribers.length;

  const handleCancelSubscription = async (profileId: string) => {
    // Simulação de cancelamento
    toast({
      title: "Em manutenção",
      description: "A gestão de assinaturas está sendo migrada para o novo sistema.",
    });
  };

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
          <div>
            <h1 className="text-xl lg:text-2xl font-bold text-foreground">Assinantes</h1>
            <p className="text-sm text-muted-foreground">
              Total: {subscribers.length} assinantes
            </p>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <div className="bg-gradient-to-r from-red-500 to-rose-500 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/80 text-sm">Assinantes Ativos</p>
                <p className="text-2xl lg:text-3xl font-bold text-white">{activeSubscribers}</p>
              </div>
              <Crown className="w-10 h-10 text-white/30" />
            </div>
          </div>
          <div className="bg-card rounded-lg border border-border p-4">
            <p className="text-sm text-muted-foreground">Observação</p>
            <p className="text-sm text-foreground mt-1">
              Sistema de gestão de assinantes em <strong>migração</strong>.
            </p>
          </div>
        </div>

        {/* Subscribers List */}
        <h2 className="text-lg font-semibold text-foreground mb-4">Lista de Assinantes</h2>
        {isLoading ? (
          <div className="flex items-center justify-center py-12 text-muted-foreground">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        ) : (
          <div className="space-y-3">
            {subscribers.map((subscriber, index) => {
              const createdAt = subscriber.created_at ? new Date(subscriber.created_at) : null;
              const displayName = subscriber.display_name || "Usuário";
              const userIdShort = subscriber.user_id ? `${subscriber.user_id.slice(0, 8)}…` : "—";

              return (
                <motion.div
                  key={subscriber.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-card rounded-lg border border-border p-4"
                >
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {subscriber.avatar_url ? (
                        <img
                          src={subscriber.avatar_url}
                          alt={displayName}
                          className="w-full h-full object-cover"
                          loading="lazy"
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                          }}
                        />
                      ) : (
                        <Crown className="w-6 h-6 text-white" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-foreground text-sm">{displayName}</h3>
                        <span className="text-xs px-2 py-0.5 rounded bg-accent/20 text-accent">
                          Ativo
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <KeyRound className="w-3 h-3" />
                          ID: {userIdShort}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {createdAt ? createdAt.toLocaleDateString("pt-BR") : "—"}
                        </span>
                      </div>
                    </div>

                    <div className="w-full sm:w-auto">
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm" className="w-full sm:w-auto text-destructive hover:text-destructive">
                            <XCircle className="w-4 h-4 mr-2" />
                            Cancelar
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Cancelar assinatura?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Esta função está temporariamente desativada durante a migração do banco de dados.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Voltar</AlertDialogCancel>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </motion.div>
              );
            })}

            {subscribers.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <Crown className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum assinante registrado ainda.</p>
              </div>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default SubscribersPage;