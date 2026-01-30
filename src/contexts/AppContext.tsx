import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { auth, db } from "@/integrations/firebase/client";
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut, 
  User 
} from "firebase/auth";
import { 
  doc, 
  getDoc, 
  setDoc, 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  deleteDoc,
  serverTimestamp 
} from "firebase/firestore";

// Unified UserProfile interface matching your Dashboard needs
interface UserProfile {
  id: string;
  email: string | null;
  display_name: string | null;
  avatar_url: string | null;
  is_subscribed: boolean;
  isAdmin: boolean;
  is_admin?: boolean; // Compatibilidade
  role?: string;
}

interface AppContextType {
  user: User | null;
  profile: UserProfile | null;
  isLoggedIn: boolean;
  isLoading: boolean;
  authReady: boolean;
  isAdmin: boolean;
  adminReady: boolean;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  myList: string[];
  addToMyList: (storyId: string) => Promise<void>;
  removeFromMyList: (storyId: string) => Promise<void>;
  isInMyList: (storyId: string) => boolean;
  language: string;
  setLanguage: (lang: string) => void;
  // Compatibilidade com código antigo que possa usar session
  session: any;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [myList, setMyList] = useState<string[]>([]);
  const [language, setLanguage] = useState("pt");
  const [isLoading, setIsLoading] = useState(true);
  const [authReady, setAuthReady] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminReady, setAdminReady] = useState(false);

  const isLoggedIn = user !== null;

  // Função para buscar ou criar o perfil do usuário no Firestore
  // MUDANÇA: Agora usa a coleção 'users' para bater com o Dashboard
  const fetchOrCreateProfile = async (currentUser: User) => {
    try {
      const docRef = doc(db, "users", currentUser.uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        // Normaliza os dados
        const userProfile: UserProfile = {
            id: docSnap.id,
            email: data.email || currentUser.email,
            display_name: data.display_name || data.name || currentUser.displayName,
            avatar_url: data.avatar_url || currentUser.photoURL,
            is_subscribed: !!data.is_subscribed,
            isAdmin: !!data.isAdmin || !!data.is_admin,
            is_admin: !!data.isAdmin || !!data.is_admin
        };
        return userProfile;
      } else {
        // Cria perfil novo na coleção 'users'
        const newProfile = {
          email: currentUser.email,
          display_name: currentUser.displayName || "Usuário sem nome",
          avatar_url: currentUser.photoURL,
          created_at: serverTimestamp(),
          is_subscribed: false,
          isAdmin: false,
          is_admin: false, // Compatibilidade
          role: "user"
        };
        await setDoc(docRef, newProfile);
        
        return { id: currentUser.uid, ...newProfile } as UserProfile;
      }
    } catch (e) {
      console.error("[AppContext] Erro ao buscar perfil:", e);
      return null;
    }
  };

  const fetchFavorites = async (userId: string) => {
    try {
      const q = query(collection(db, "favorite_stories"), where("user_id", "==", userId));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => doc.data().story_id as string);
    } catch (e) {
      console.error("[AppContext] Erro ao buscar favoritos:", e);
      return [];
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setIsLoading(false);
      setAuthReady(true);

      if (currentUser) {
        setAdminReady(false);
        
        const [userProfile, favorites] = await Promise.all([
          fetchOrCreateProfile(currentUser),
          fetchFavorites(currentUser.uid)
        ]);

        setProfile(userProfile);
        setMyList(favorites);
        
        // Verifica admin
        setIsAdmin(userProfile?.isAdmin || false);
        setAdminReady(true);
      } else {
        setProfile(null);
        setMyList([]);
        setIsAdmin(false);
        setAdminReady(true);
      }
    });

    return () => unsubscribe();
  }, []);

  const loginWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("[AppContext] Erro no login Google:", error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("[AppContext] Erro no logout:", error);
    }
  };

  const addToMyList = async (storyId: string) => {
    if (!user) return;
    setMyList((prev) => [...prev, storyId]);

    try {
      await addDoc(collection(db, "favorite_stories"), {
        user_id: user.uid,
        story_id: storyId,
        created_at: new Date()
      });
    } catch (error) {
      console.error("[AppContext] Erro ao salvar favorito:", error);
      setMyList((prev) => prev.filter((id) => id !== storyId));
    }
  };

  const removeFromMyList = async (storyId: string) => {
    if (!user) return;
    setMyList((prev) => prev.filter((id) => id !== storyId));

    try {
      const q = query(
        collection(db, "favorite_stories"), 
        where("user_id", "==", user.uid),
        where("story_id", "==", storyId)
      );
      const querySnapshot = await getDocs(q);
      const deletePromises = querySnapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deletePromises);
    } catch (error) {
      console.error("[AppContext] Erro ao remover favorito:", error);
      setMyList((prev) => [...prev, storyId]);
    }
  };

  const isInMyList = (storyId: string) => myList.includes(storyId);

  return (
    <AppContext.Provider
      value={{
        user,
        profile,
        isLoggedIn,
        isLoading,
        authReady,
        isAdmin,
        adminReady,
        loginWithGoogle,
        logout,
        myList,
        addToMyList,
        removeFromMyList,
        isInMyList,
        language,
        setLanguage,
        session: user ? { user } : null
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useApp deve ser usado dentro de um AppProvider");
  }
  return context;
}