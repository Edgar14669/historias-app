import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { db } from "@/integrations/firebase/client";
import { 
  collection, 
  getDocs, 
  query, 
  where, 
  doc, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc,
  serverTimestamp
} from "firebase/firestore";
import { useApp } from "@/contexts/AppContext";

// --- TIPAGEM ---

export interface Category {
  id: string;
  name: string;
  created_at?: string;
}

export interface StoryPage {
  id: string;
  story_id: string;
  content: string;
  page_number: number;
  page_image?: string | null;
  audio_url?: string | null;
}

export interface Story {
  id: string;
  title: string;
  description: string;
  cover_url: string | null;
  language: string;
  is_premium: boolean;
  category_id: string | null;
  created_at: string;
  category?: Category | null;
  story_pages?: StoryPage[];
  translated_title?: string;
  translated_description?: string;
  has_translation?: boolean;
  video_url?: string | null;
}

// --- AUXILIARES ---

const formatDate = (date: any): string => {
  if (!date) return new Date().toISOString();
  if (date?.toDate && typeof date.toDate === 'function') return date.toDate().toISOString();
  if (date instanceof Date) return date.toISOString();
  return String(date);
};

const fetchCategoriesMap = async () => {
  const catSnapshot = await getDocs(collection(db, "categories"));
  const catMap = new Map<string, Category>();
  catSnapshot.docs.forEach(doc => {
    const data = doc.data();
    catMap.set(doc.id, { id: doc.id, name: data.name, created_at: formatDate(data.created_at) });
  });
  return catMap;
};

// --- HOOKS DE LEITURA (QUERIES) ---

// 1. Lista pública de histórias
export function useStories() {
  const { language } = useApp();
  return useQuery({
    queryKey: ["stories", language],
    queryFn: async () => {
      const storiesSnapshot = await getDocs(collection(db, "stories"));
      const allStories = storiesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        created_at: formatDate(doc.data().created_at)
      })) as Story[];

      const categoriesMap = await fetchCategoriesMap();
      const transSnapshot = await getDocs(query(collection(db, "story_translations"), where("language", "==", language)));
      
      const translationsMap = new Map();
      transSnapshot.docs.forEach(doc => translationsMap.set(doc.data().story_id, doc.data()));

      return allStories
        .filter(s => s.language === language || translationsMap.has(s.id))
        .map(story => {
          if (story.category_id) story.category = categoriesMap.get(story.category_id);
          const trans = translationsMap.get(story.id);
          if (trans && story.language !== language) {
            return { ...story, translated_title: trans.title, translated_description: trans.description, has_translation: true };
          }
          return story;
        })
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    },
    staleTime: 1000 * 60, 
  });
}

// 2. Lista completa para Admin
export function useAllStories() {
  return useQuery({
    queryKey: ["stories", "all"],
    queryFn: async () => {
      const snapshot = await getDocs(collection(db, "stories"));
      const categoriesMap = await fetchCategoriesMap();

      return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          created_at: formatDate(data.created_at),
          category: data.category_id ? categoriesMap.get(data.category_id) : null,
          cover_url: data.cover_url || data.cover_image || null
        } as Story;
      }).sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    },
  });
}

// 3. História Única Pública
export function useStory(id: string | undefined) {
  const { language } = useApp();
  return useQuery({
    queryKey: ["story", id, language],
    queryFn: async () => {
      if (!id) return null;
      const storyDoc = await getDoc(doc(db, "stories", id));
      if (!storyDoc.exists()) return null;
      
      const storyData = storyDoc.data();
      let story = { 
        id: storyDoc.id, 
        ...storyData, 
        created_at: formatDate(storyData.created_at),
        cover_url: storyData.cover_url || storyData.cover_image || null
      } as Story;

      if (story.category_id) {
        const catDoc = await getDoc(doc(db, "categories", story.category_id));
        if (catDoc.exists()) {
           story.category = { id: catDoc.id, ...catDoc.data() } as Category;
        }
      }

      const pagesSnapshot = await getDocs(query(collection(db, "story_pages"), where("story_id", "==", id)));
      story.story_pages = pagesSnapshot.docs.map(d => {
        const p = d.data();
        return { 
            id: d.id, 
            ...p, 
            page_image: p.page_image || p.image_url || null 
        } as StoryPage;
      }).sort((a, b) => a.page_number - b.page_number);

      if (story.language !== language) {
        const transSnapshot = await getDocs(query(collection(db, "story_translations"), where("story_id", "==", id), where("language", "==", language)));
        if (!transSnapshot.empty) {
          const transData = transSnapshot.docs[0].data();
          story = { ...story, translated_title: transData.title, translated_description: transData.description, has_translation: true };
        }
      }
      return story;
    },
    enabled: !!id,
  });
}

// 4. História Única Admin
export function useStoryAdmin(id: string | undefined) {
  return useQuery({
    queryKey: ["story-admin", id],
    queryFn: async () => {
      if (!id) return null;
      const storyDoc = await getDoc(doc(db, "stories", id));
      if (!storyDoc.exists()) return null;
      
      const data = storyDoc.data();
      const story = { 
          id: storyDoc.id, 
          ...data, 
          created_at: formatDate(data.created_at),
          cover_url: data.cover_url || data.cover_image || null
      } as Story;

      const pagesSnapshot = await getDocs(query(collection(db, "story_pages"), where("story_id", "==", id)));
      story.story_pages = pagesSnapshot.docs.map(d => {
        const p = d.data();
        return { 
            id: d.id, 
            ...p, 
            page_image: p.page_image || p.image_url || null 
        } as StoryPage;
      }).sort((a, b) => a.page_number - b.page_number);

      return story;
    },
    enabled: !!id,
  });
}

// 5. Categorias
export function useCategories() {
  return useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const snapshot = await getDocs(collection(db, "categories"));
      return snapshot.docs.map(doc => ({ 
          id: doc.id, 
          ...doc.data(),
          created_at: formatDate(doc.data().created_at)
      } as Category));
    },
  });
}

// --- MUTAÇÕES (GRAVAÇÃO) ---

export function useCreateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (name: string) => {
      const data = { name, created_at: serverTimestamp() };
      const docRef = await addDoc(collection(db, "categories"), data);
      return { id: docRef.id, ...data };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
  });
}

export function useCreateStory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (story: any) => {
      const data = { 
          ...story,
          cover_url: story.cover_url || story.cover_image || null,
          created_at: serverTimestamp()
      };
      if (data.cover_image) delete data.cover_image;

      const docRef = await addDoc(collection(db, "stories"), data);
      return { id: docRef.id, ...data };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stories"] });
    },
  });
}

export function useUpdateStory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & any) => {
      const storyRef = doc(db, "stories", id);
      const { category, story_pages, translated_title, translated_description, has_translation, ...cleanUpdates } = updates;
      
      if (cleanUpdates.cover_image || cleanUpdates.cover_url) {
          cleanUpdates.cover_url = cleanUpdates.cover_url || cleanUpdates.cover_image || null;
          delete cleanUpdates.cover_image;
      }
      
      await updateDoc(storyRef, cleanUpdates);
      return { id, ...cleanUpdates };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["stories"] });
      queryClient.invalidateQueries({ queryKey: ["story", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["story-admin", variables.id] });
    },
  });
}

export function useDeleteStory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await deleteDoc(doc(db, "stories", id));
      const pagesSnapshot = await getDocs(query(collection(db, "story_pages"), where("story_id", "==", id)));
      const deletePromises = pagesSnapshot.docs.map(d => deleteDoc(d.ref));
      await Promise.all(deletePromises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stories"] });
    },
  });
}

// --- MUTAÇÕES DE PÁGINAS (ESTAS ESTAVAM FALTANDO) ---

export function useCreateStoryPage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (page: any) => {
      const cleanPage = {
        story_id: page.story_id,
        content: page.content,
        page_number: page.page_number,
        // Garante o nome correto no banco
        page_image: page.page_image || page.image_url || null,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp()
      };
      const docRef = await addDoc(collection(db, "story_pages"), cleanPage);
      return { id: docRef.id, ...cleanPage };
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["story", vars.story_id] });
      queryClient.invalidateQueries({ queryKey: ["story-admin", vars.story_id] });
      queryClient.invalidateQueries({ queryKey: ["stories"] });
    },
  });
}

export function useUpdateStoryPage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, storyId, ...updates }: any) => {
      const cleanUpdates: any = { ...updates, updated_at: serverTimestamp() };
      
      // Consolida o campo de imagem antes de salvar
      if (updates.image_url || updates.page_image !== undefined) {
        cleanUpdates.page_image = updates.page_image || updates.image_url || null;
        delete cleanUpdates.image_url; 
      }
      
      await updateDoc(doc(db, "story_pages", id), cleanUpdates);
      return { id, storyId, ...cleanUpdates };
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["story", vars.storyId] });
      queryClient.invalidateQueries({ queryKey: ["story-admin", vars.storyId] });
      queryClient.invalidateQueries({ queryKey: ["stories"] });
    },
  });
}

export function useDeleteStoryPage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, storyId }: { id: string; storyId: string }) => {
      await deleteDoc(doc(db, "story_pages", id));
      return storyId;
    },
    onSuccess: (storyId) => {
      queryClient.invalidateQueries({ queryKey: ["story", storyId] });
      queryClient.invalidateQueries({ queryKey: ["story-admin", storyId] });
      queryClient.invalidateQueries({ queryKey: ["stories"] });
    },
  });
}