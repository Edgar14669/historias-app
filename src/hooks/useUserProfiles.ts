import { useQuery } from "@tanstack/react-query";
import { db } from "@/integrations/firebase/client";
import { collection, getDocs } from "firebase/firestore";

// Definindo o tipo COMPLETO para evitar erros no Dashboard
export interface UserProfile {
  id: string;
  email?: string;          // Adicionado
  display_name?: string;   // Adicionado
  avatar_url?: string;     // Adicionado
  is_subscribed?: boolean;
  isAdmin?: boolean;       // Adicionado
  is_admin?: boolean;      // Compatibilidade
  role?: string;
  created_at?: any;
}

export function useUserProfiles() {
  return useQuery({
    queryKey: ["user_profiles"],
    queryFn: async () => {
      console.log("Fetching user profiles (Firebase Real)");
      
      try {
        const usersRef = collection(db, "users");
        const snapshot = await getDocs(usersRef);

        const users = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            // Garante que o email apareça mesmo se estiver fora do padrão
            email: data.email || "", 
            display_name: data.display_name || data.name || "",
          };
        }) as UserProfile[];

        return users;
      } catch (error) {
        console.error("Erro ao buscar usuários:", error);
        return [] as UserProfile[];
      }
    },
    staleTime: 1000 * 60, // Cache de 1 minuto
  });
}

export function useSubscribedUsers() {
  return useQuery({
    queryKey: ["subscribed_users"],
    queryFn: async () => {
      try {
        const usersRef = collection(db, "users");
        const snapshot = await getDocs(usersRef);

        const users = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as UserProfile[];

        // Filtra apenas quem tem assinatura ativa
        return users.filter(u => u.is_subscribed === true);
      } catch (error) {
        console.error("Erro ao buscar assinantes:", error);
        return [];
      }
    },
  });
}