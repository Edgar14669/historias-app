import { useMutation, useQueryClient } from "@tanstack/react-query";
import { db } from "@/integrations/firebase/client";
import { doc, updateDoc, deleteDoc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";

export function useAdminActions() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // 1. Promover ou Rebaixar Admin
  const toggleAdmin = useMutation({
    mutationFn: async ({ userId, isAdmin }: { userId: string; isAdmin: boolean }) => {
      const userRef = doc(db, "users", userId);
      // Atualiza isAdmin e is_admin (compatibilidade)
      await updateDoc(userRef, { 
        isAdmin: isAdmin,
        is_admin: isAdmin,
        role: isAdmin ? "admin" : "user"
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user_profiles"] });
      toast({ title: "Sucesso", description: "Permissões de administrador atualizadas." });
    },
    onError: (error) => {
      console.error(error);
      toast({ title: "Erro", description: "Não foi possível alterar a permissão.", variant: "destructive" });
    }
  });

  // 2. Gerenciar Assinatura (Ativar/Cancelar)
  const toggleSubscription = useMutation({
    mutationFn: async ({ userId, isSubscribed }: { userId: string; isSubscribed: boolean }) => {
      const userRef = doc(db, "users", userId);
      await updateDoc(userRef, { is_subscribed: isSubscribed });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["user_profiles"] });
      toast({ 
        title: "Sucesso", 
        description: variables.isSubscribed ? "Assinatura ativada manualmente." : "Assinatura cancelada." 
      });
    },
    onError: (error) => {
      console.error(error);
      toast({ title: "Erro", description: "Falha ao atualizar assinatura.", variant: "destructive" });
    }
  });

  // 3. Excluir Usuário (Do banco de dados)
  // Nota: Isso remove o perfil do Firestore. O login (Auth) permanece até ser excluido no painel Firebase Authentication
  // ou via Cloud Function, mas o usuário perde acesso aos dados do perfil.
  const deleteUser = useMutation({
    mutationFn: async (userId: string) => {
      const userRef = doc(db, "users", userId);
      await deleteDoc(userRef);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user_profiles"] });
      toast({ title: "Usuário excluído", description: "O perfil foi removido do banco de dados." });
    },
    onError: (error) => {
      console.error(error);
      toast({ title: "Erro", description: "Falha ao excluir usuário.", variant: "destructive" });
    }
  });

  return {
    toggleAdmin,
    toggleSubscription,
    deleteUser
  };
}