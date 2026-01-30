import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Sua configuração do Firebase
const firebaseConfig = {
  apiKey: "AIzaSyCk2N-MvKhCAqu0c5vVycqnOVOTnllLMTg",
  authDomain: "apphistorias-4a78b.firebaseapp.com",
  projectId: "apphistorias-4a78b",
  storageBucket: "apphistorias-4a78b.firebasestorage.app",
  messagingSenderId: "1020538992843",
  appId: "1:1020538992843:web:c4eb737224f53c7e78c34e"
};

// Inicializando o Firebase
const app = initializeApp(firebaseConfig);

// Exportando as ferramentas para usar no resto do app
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);