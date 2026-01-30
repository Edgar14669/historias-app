import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { db } from "@/integrations/firebase/client";
import { 
  collection, 
  addDoc, 
  getDocs, 
  deleteDoc,
  serverTimestamp,
  query,
  orderBy
} from "firebase/firestore";

// Gerador de ID de sessão (para contar views anônimas sem spammar)
const getSessionId = (): string => {
  let sessionId = sessionStorage.getItem('story_session_id');
  if (!sessionId) {
    sessionId = `anon-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
    sessionStorage.setItem('story_session_id', sessionId);
  }
  return sessionId;
};

export function useRecordStoryView() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ storyId, userId }: { storyId: string; userId?: string }) => {
      const sessionId = getSessionId();
      
      // Gravando no Firebase de verdade!
      // Cria a coleção 'story_views' automaticamente se não existir
      await addDoc(collection(db, "story_views"), {
        story_id: storyId,
        user_id: userId || null, // Grava o ID do user ou null se for anônimo
        session_id: sessionId,
        created_at: serverTimestamp()
      });
      
      console.log(`[View Recorded] Story: ${storyId}, User: ${userId || 'anon'}`);
    },
    onSuccess: () => {
      // Atualiza os contadores em tempo real
      queryClient.invalidateQueries({ queryKey: ["story-views-count"] });
      queryClient.invalidateQueries({ queryKey: ["story-views-by-story"] });
    },
  });
}

// Conta o total geral de visualizações do app
export function useStoryViewsCount() {
  return useQuery({
    queryKey: ["story-views-count"],
    queryFn: async () => {
      try {
        const snapshot = await getDocs(collection(db, "story_views"));
        return snapshot.size;
      } catch (e) {
        console.error("Erro ao contar views:", e);
        return 0;
      }
    },
    staleTime: 1000 * 60, // Cache de 1 minuto
  });
}

// Busca views detalhadas por história (para gráficos ou listas)
export function useAllStoryViews() {
  return useQuery({
    queryKey: ["story-views-by-story"],
    queryFn: async () => {
      try {
        const snapshot = await getDocs(collection(db, "story_views"));
        
        // Agrupa as visualizações por história manualmente
        // (O Firestore não tem "GROUP BY" nativo igual SQL)
        const viewsMap = new Map<string, { count: number; lastViewed: any }>();
        
        snapshot.docs.forEach(doc => {
          const data = doc.data();
          const storyId = data.story_id;
          // Converte Timestamp do Firestore para Date JS
          const created = data.created_at?.toDate ? data.created_at.toDate() : new Date();
          
          const existing = viewsMap.get(storyId);
          if (existing) {
            existing.count++;
            if (created > existing.lastViewed) existing.lastViewed = created;
          } else {
            viewsMap.set(storyId, { count: 1, lastViewed: created });
          }
        });

        const result = [];
        viewsMap.forEach((val, key) => {
          result.push({ storyId: key, views: val.count, lastViewed: val.lastViewed });
        });

        // Ordena por quem tem mais views
        return result.sort((a, b) => b.views - a.views);
      } catch (e) {
        console.error("Erro ao agregar views:", e);
        return [];
      }
    },
  });
}

export function useClearAllStoryViews() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const snapshot = await getDocs(collection(db, "story_views"));
      const promises = snapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["story-views-count"] });
      queryClient.invalidateQueries({ queryKey: ["story-views-by-story"] });
    },
  });
}