import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { db } from "@/integrations/firebase/client";
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  orderBy, 
  writeBatch,
  serverTimestamp,
  Timestamp 
} from "firebase/firestore";

export interface StoryTranslation {
  id: string;
  story_id: string;
  language: string;
  title: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface StoryPageTranslation {
  id: string;
  story_page_id: string;
  language: string;
  content: string;
  created_at: string;
  updated_at: string;
}

// Helper para converter Timestamp do Firestore para string ISO
const formatDate = (date: any) => {
  if (!date) return new Date().toISOString();
  if (date instanceof Timestamp) return date.toDate().toISOString();
  return new Date(date).toISOString();
};

// Fetch all translations for a story
export function useStoryTranslations(storyId: string | undefined) {
  return useQuery({
    queryKey: ["story-translations", storyId],
    queryFn: async () => {
      if (!storyId) return [];
      
      const q = query(
        collection(db, "story_translations"),
        where("story_id", "==", storyId)
        // Firestore requer índice composto para ordenar por campo diferente do filtro de igualdade
        // Se der erro de índice, remova o orderBy ou crie o índice no console do Firebase
        // .orderBy("language") 
      );

      const snapshot = await getDocs(q);
      const translations = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        created_at: formatDate(doc.data().created_at),
        updated_at: formatDate(doc.data().updated_at)
      })) as StoryTranslation[];

      // Ordenação manual no cliente para evitar erro de índice composto inicial
      return translations.sort((a, b) => a.language.localeCompare(b.language));
    },
    enabled: !!storyId,
  });
}

// Fetch all page translations for a story's pages
export function useStoryPageTranslations(storyPageIds: string[]) {
  return useQuery({
    queryKey: ["story-page-translations", storyPageIds],
    queryFn: async () => {
      if (!storyPageIds.length) return [];
      
      // Firestore limita 'in' queries a 10 ou 30 itens. Se tiver muitas páginas, pode dar erro.
      // Assumindo que uma história não tem centenas de páginas carregadas de uma vez aqui.
      const q = query(
        collection(db, "story_page_translations"),
        where("story_page_id", "in", storyPageIds)
      );

      const snapshot = await getDocs(q);
      const translations = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        created_at: formatDate(doc.data().created_at),
        updated_at: formatDate(doc.data().updated_at)
      })) as StoryPageTranslation[];

      return translations.sort((a, b) => a.language.localeCompare(b.language));
    },
    enabled: storyPageIds.length > 0,
  });
}

// Fetch translation for a specific language
export function useStoryTranslation(storyId: string | undefined, language: string) {
  return useQuery({
    queryKey: ["story-translation", storyId, language],
    queryFn: async () => {
      if (!storyId) return null;
      
      const q = query(
        collection(db, "story_translations"),
        where("story_id", "==", storyId),
        where("language", "==", language)
      );

      const snapshot = await getDocs(q);
      if (snapshot.empty) return null;

      const docData = snapshot.docs[0];
      return {
        id: docData.id,
        ...docData.data(),
        created_at: formatDate(docData.data().created_at),
        updated_at: formatDate(docData.data().updated_at)
      } as StoryTranslation;
    },
    enabled: !!storyId && !!language,
  });
}

// Create or update story translation (upsert logic simulation)
export function useUpsertStoryTranslation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      story_id: string;
      language: string;
      title: string;
      description?: string | null;
    }) => {
      // 1. Check if translation exists
      const q = query(
        collection(db, "story_translations"),
        where("story_id", "==", params.story_id),
        where("language", "==", params.language)
      );
      
      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        // 2. Update existing
        const existingDoc = snapshot.docs[0];
        const docRef = doc(db, "story_translations", existingDoc.id);
        
        await updateDoc(docRef, {
          title: params.title,
          description: params.description,
          updated_at: serverTimestamp()
        });

        return { id: existingDoc.id, ...params }; // Optimistic return
      } else {
        // 3. Insert new
        const docRef = await addDoc(collection(db, "story_translations"), {
          story_id: params.story_id,
          language: params.language,
          title: params.title,
          description: params.description,
          created_at: serverTimestamp(),
          updated_at: serverTimestamp()
        });

        return { id: docRef.id, ...params };
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["story-translations", variables.story_id] });
      queryClient.invalidateQueries({ queryKey: ["story-translation", variables.story_id, variables.language] });
    },
  });
}

// Delete story translation
export function useDeleteStoryTranslation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, storyId }: { id: string; storyId: string }) => {
      await deleteDoc(doc(db, "story_translations", id));
      return storyId;
    },
    onSuccess: (storyId) => {
      queryClient.invalidateQueries({ queryKey: ["story-translations", storyId] });
    },
  });
}

// Create or update story page translation (upsert logic)
export function useUpsertStoryPageTranslation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      story_page_id: string;
      language: string;
      content: string;
    }) => {
      const q = query(
        collection(db, "story_page_translations"),
        where("story_page_id", "==", params.story_page_id),
        where("language", "==", params.language)
      );
      
      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        // Update
        const existingDoc = snapshot.docs[0];
        await updateDoc(doc(db, "story_page_translations", existingDoc.id), {
          content: params.content,
          updated_at: serverTimestamp()
        });
        return { id: existingDoc.id, ...params };
      } else {
        // Insert
        const docRef = await addDoc(collection(db, "story_page_translations"), {
          story_page_id: params.story_page_id,
          language: params.language,
          content: params.content,
          created_at: serverTimestamp(),
          updated_at: serverTimestamp()
        });
        return { id: docRef.id, ...params };
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["story-page-translations"] });
    },
  });
}

// Delete story page translation
export function useDeleteStoryPageTranslation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id }: { id: string }) => {
      await deleteDoc(doc(db, "story_page_translations", id));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["story-page-translations"] });
    },
  });
}

// Bulk save page translations for a language (Using Batch)
export function useBulkSavePageTranslations() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      translations: Array<{
        story_page_id: string;
        language: string;
        content: string;
      }>;
    }) => {
      const batch = writeBatch(db);
      
      // Precisamos verificar cada tradução para saber se é insert ou update
      // Isso pode ser lento se forem muitas, pois exige leituras antes.
      // Como Firestore não tem "upsert" em batch nativo sem ID conhecido, faremos um loop de promises.
      
      const promises = params.translations.map(async (t) => {
        const q = query(
          collection(db, "story_page_translations"),
          where("story_page_id", "==", t.story_page_id),
          where("language", "==", t.language)
        );
        const snapshot = await getDocs(q);
        
        if (!snapshot.empty) {
          // Update
          const ref = doc(db, "story_page_translations", snapshot.docs[0].id);
          batch.update(ref, { 
            content: t.content,
            updated_at: serverTimestamp()
          });
        } else {
          // Insert
          const ref = doc(collection(db, "story_page_translations"));
          batch.set(ref, {
            story_page_id: t.story_page_id,
            language: t.language,
            content: t.content,
            created_at: serverTimestamp(),
            updated_at: serverTimestamp()
          });
        }
      });

      await Promise.all(promises);
      await batch.commit();
      
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["story-page-translations"] });
    },
  });
}