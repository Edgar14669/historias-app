import { initializeApp } from "firebase/app";
import { getAuth, setPersistence, browserLocalPersistence } from "firebase/auth";
import { getFirestore, initializeFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
// ADICIONE: Import do Messaging
import { getMessaging } from "firebase/messaging"; 

const firebaseConfig = {
  // ... suas configurações existentes (mantenha igual)
  apiKey: "AIzaSyCL2Sr5NDkTiMrhZlO_6cdia8W_1YRkD9Y",
  authDomain: "historias-biblicas-1b601.firebaseapp.com",
  databaseURL: "https://historias-biblicas-1b601-default-rtdb.firebaseio.com",
  projectId: "historias-biblicas-1b601",
  storageBucket: "historias-biblicas-1b601.firebasestorage.app",
  messagingSenderId: "929017910323",
  appId: "1:929017910323:web:2e031bb046daac19857f46"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
// Mantendo sua configuração de banco corrigida
const db = initializeFirestore(app, {
  experimentalForceLongPolling: true, 
}, "apphistoriasfinal");
const storage = getStorage(app);

// ADICIONE: Inicialização do Messaging
const messaging = getMessaging(app);

setPersistence(auth, browserLocalPersistence)
  .then(() => console.log("Persistência: LOCAL"))
  .catch((e) => console.error("Erro persistência:", e));

// ADICIONE: export do messaging
export { auth, db, storage, messaging };