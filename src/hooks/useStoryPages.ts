import { useMutation, useQueryClient } from "@tanstack/react-query";
import { db } from "@/integrations/firebase/client";
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  serverTimestamp 
} from "firebase/firestore";

interface CreateStoryPageParams {
  story_id: string;
  content: string;
  page_number: number;
  page_image?: string | null;
}

interface UpdateStoryPageParams {
  id: string;
  storyId: string;
  content?: string;
  page_number?: number;
  page_image?: string | null;
}

export function useCreateStoryPage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (page: CreateStoryPageParams) => {
      const docRef = await addDoc(collection(db, "story_pages"), {
        story_id: page.story_id,
        content: page.content,
        page_number: page.page_number,
        page_image: page.page_image || null,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp()
      });

      return { id: docRef.id, ...page };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["story", variables.story_id] });
      queryClient.invalidateQueries({ queryKey: ["stories"] });
    },
  });
}

export function useUpdateStoryPage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, storyId, content, page_number, page_image }: UpdateStoryPageParams) => {
      const updates: any = {
        updated_at: serverTimestamp()
      };
      
      if (content !== undefined) updates.content = content;
      if (page_number !== undefined) updates.page_number = page_number;
      if (page_image !== undefined) updates.page_image = page_image;

      const docRef = doc(db, "story_pages", id);
      await updateDoc(docRef, updates);

      return { id, storyId, ...updates };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["story", result.storyId] });
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
      queryClient.invalidateQueries({ queryKey: ["stories"] });
    },
  });
}