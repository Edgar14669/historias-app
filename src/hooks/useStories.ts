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

// --- DEFINIÇÃO DOS TIPOS ---

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
  image_url?: string | null;
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
  
  // Campos "virtuais"
  category?: Category | null;
  story_pages?: StoryPage[];
  
  // Traduções
  translated_title?: string;
  translated_description?: string;
  has_translation?: boolean;
}

// --- FUNÇÕES AUXILIARES ---

const formatDate = (date: any): string => {
  if (!date) return new Date().toISOString();
  if (date?.toDate && typeof date.toDate === 'function') {
    return date.toDate().toISOString();
  }
  if (date instanceof Date) {
    return date.toISOString();
  }
  return String(date);
};

const fetchCategoriesMap = async () => {
  const catSnapshot = await getDocs(collection(db, "categories"));
  const catMap = new Map<string, Category>();
  catSnapshot.docs.forEach(doc => {
    const data = doc.data();
    catMap.set(doc.id, { 
      id: doc.id, 
      name: data.name,
      created_at: formatDate(data.created_at)
    });
  });
  return catMap;
};

// --- HOOKS ---

export function useStories() {
  const { language } = useApp();
  
  return useQuery({
    queryKey: ["stories", language],
    queryFn: async () => {
      try {
        const storiesRef = collection(db, "stories");
        const storiesSnapshot = await getDocs(storiesRef);
        
        const allStories = storiesSnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                created_at: formatDate(data.created_at)
            };
        }) as Story[];

        const categoriesMap = await fetchCategoriesMap();

        const translationsRef = collection(db, "story_translations");
        const transQuery = query(translationsRef, where("language", "==", language));
        const transSnapshot = await getDocs(transQuery);
        
        const translationsMap = new Map();
        transSnapshot.docs.forEach(doc => {
          const data = doc.data();
          translationsMap.set(data.story_id, data);
        });

        const filteredStories = allStories
          .filter(story => {
            if (story.language === language) return true;
            if (translationsMap.has(story.id)) return true;
            return false; 
          })
          .map(story => {
            if (story.category_id && categoriesMap.has(story.category_id)) {
              story.category = categoriesMap.get(story.category_id);
            }

            const translation = translationsMap.get(story.id);
            if (translation && story.language !== language) {
              return {
                ...story,
                translated_title: translation.title,
                translated_description: translation.description,
                has_translation: true,
              };
            }
            return story;
          });

        return filteredStories.sort((a, b) => 
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
      } catch (e) {
        console.error("[useStories] Erro:", e);
        throw e;
      }
    },
    staleTime: 1000 * 60, 
  });
}

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
          category: data.category_id ? categoriesMap.get(data.category_id) : null
        } as Story;
      }).sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    },
  });
}

export function useStory(id: string | undefined) {
  const { language } = useApp();
  
  return useQuery({
    queryKey: ["story", id, language],
    queryFn: async () => {
      if (!id) return null;
      
      const storyDoc = await getDoc(doc(db, "stories", id));
      if (!storyDoc.exists()) return null;
      
      const data = storyDoc.data();
      let story = { 
          id: storyDoc.id, 
          ...data,
          created_at: formatDate(data.created_at)
      } as Story;

      if (story.category_id) {
        const catDoc = await getDoc(doc(db, "categories", story.category_id));
        if (catDoc.exists()) {
            const catData = catDoc.data();
            story.category = { 
                id: catDoc.id, 
                name: catData.name,
                created_at: formatDate(catData.created_at)
            };
        }
      }

      const pagesQuery = query(collection(db, "story_pages"), where("story_id", "==", id));
      const pagesSnapshot = await getDocs(pagesQuery);
      story.story_pages = pagesSnapshot.docs
        .map(d => ({ 
            id: d.id, 
            ...d.data(),
            page_image: d.data().page_image || d.data().image_url,
            image_url: d.data().image_url || d.data().page_image
        } as StoryPage))
        .sort((a, b) => a.page_number - b.page_number);

      if (story.language !== language) {
        const transQuery = query(
          collection(db, "story_translations"), 
          where("story_id", "==", id),
          where("language", "==", language)
        );
        const transSnapshot = await getDocs(transQuery);
        
        if (!transSnapshot.empty) {
          const transData = transSnapshot.docs[0].data();
          story = {
            ...story,
            translated_title: transData.title,
            translated_description: transData.description,
            has_translation: true,
          };
        }
      }

      return story;
    },
    enabled: !!id,
  });
}

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
          created_at: formatDate(data.created_at)
      } as Story;

      const pagesQuery = query(collection(db, "story_pages"), where("story_id", "==", id));
      const pagesSnapshot = await getDocs(pagesQuery);
      story.story_pages = pagesSnapshot.docs
        .map(d => ({ 
            id: d.id, 
            ...d.data(),
            page_image: d.data().page_image || d.data().image_url,
            image_url: d.data().image_url || d.data().page_image
        } as StoryPage))
        .sort((a, b) => a.page_number - b.page_number);

      return story;
    },
    enabled: !!id,
  });
}

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

// --- MUTAÇÕES ---

export function useCreateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (name: string) => {
      const data = { 
        name, 
        created_at: serverTimestamp() 
      };
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
          created_at: serverTimestamp()
      };
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
      const pagesQuery = query(collection(db, "story_pages"), where("story_id", "==", id));
      const pagesSnapshot = await getDocs(pagesQuery);
      const deletePromises = pagesSnapshot.docs.map(d => deleteDoc(d.ref));
      await Promise.all(deletePromises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stories"] });
    },
  });
}

export function useCreateStoryPage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (page: any) => {
      const cleanPage = {
          story_id: page.story_id,
          content: page.content,
          page_number: page.page_number,
          page_image: page.page_image || page.image_url || null
      };
      const docRef = await addDoc(collection(db, "story_pages"), cleanPage);
      return { id: docRef.id, ...cleanPage };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["story", variables.story_id] });
      queryClient.invalidateQueries({ queryKey: ["story-admin", variables.story_id] });
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
    },
  });
}

export function useUpdateStoryPage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, storyId, ...updates }: { id: string; storyId: string } & any) => {
      const pageRef = doc(db, "story_pages", id);
      const cleanUpdates: any = {};
      if (updates.content !== undefined) cleanUpdates.content = updates.content;
      if (updates.page_number !== undefined) cleanUpdates.page_number = updates.page_number;
      if (updates.page_image !== undefined) cleanUpdates.page_image = updates.page_image;
      if (updates.image_url !== undefined && updates.page_image === undefined) cleanUpdates.page_image = updates.image_url;

      await updateDoc(pageRef, cleanUpdates);
      return { id, ...cleanUpdates };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["story", variables.storyId] });
      queryClient.invalidateQueries({ queryKey: ["story-admin", variables.storyId] });
    },
  });
}