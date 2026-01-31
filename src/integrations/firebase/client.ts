import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  setPersistence, 
  browserLocalPersistence 
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Configuração do Firebase (Projeto: historias-biblicas-1b601)
const firebaseConfig = {
  apiKey: "AIzaSyCL2Sr5NDkTiMrhZlO_6cdia8W_1YRkD9Y",
  authDomain: "historias-biblicas-1b601.firebaseapp.com",
  databaseURL: "https://historias-biblicas-1b601-default-rtdb.firebaseio.com",
  projectId: "historias-biblicas-1b601",
  storageBucket: "historias-biblicas-1b601.firebasestorage.app",
  messagingSenderId: "929017910323",
  appId: "1:929017910323:web:2e031bb046daac19857f46"
};

// Inicializando o Firebase
const app = initializeApp(firebaseConfig);

// Ferramentas do Firebase
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// Configuração de Persistência (Para o login não expirar ao fechar a aba)
setPersistence(auth, browserLocalPersistence)
  .then(() => {
    console.log("Persistência de sessão: LOCAL (Conectado a historias-biblicas)");
  })
  .catch((error) => {
    console.error("Erro ao configurar persistência:", error);
  });

export { auth, db, storage };