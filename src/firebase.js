// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// Alterado: Importamos browserSessionPersistence em vez de browserLocalPersistence
import { getAuth, setPersistence, browserSessionPersistence } from "firebase/auth";
import { getFirestore, enableIndexedDbPersistence } from "firebase/firestore";

// As suas credenciais de configuração do Firebase
const firebaseConfig = {
  apiKey: "AIzaSyDmNhuxBudC_AuEEP21miH-gtvNSJ4J__Y",
  authDomain: "visceliusappdb.firebaseapp.com",
  projectId: "visceliusappdb",
  storageBucket: "visceliusappdb.firebasestorage.app",
  messagingSenderId: "760346577354",
  appId: "1:760346577354:web:e3db5cef362f3a23af2733",
  measurementId: "G-0N0G75S27R"
};

// Inicializar o Firebase
const app = initializeApp(firebaseConfig);

// Analytics (somente em ambiente browser)
let analytics = null;
try {
  analytics = getAnalytics(app);
} catch (e) {
  // getAnalytics falha em ambientes sem window/document (SSR) ou se desabilitado
  console.warn('Firebase analytics não disponível:', e.message || e);
}

// Inicializar e exportar serviços
const auth = getAuth(app);
const db = getFirestore(app);

// Alterado: Ativar persistência de SESSÃO (por aba) para permitir múltiplas contas
setPersistence(auth, browserSessionPersistence).catch((err) => {
  console.warn('Não foi possível definir persistência do Auth:', err && err.message ? err.message : err);
});

// Ativar persistência offline do Firestore (IndexedDB). Se falhar (por exemplo em multi-tab
// com conflitos), logamos e deixamos o cache em modo in-memory.
enableIndexedDbPersistence(db).catch((err) => {
  // Código 'failed-precondition' indica que outro tab não permite persistence
  // 'unimplemented' indica que o navegador não suporta IndexedDB persistence
  console.warn('Persistência IndexedDB do Firestore não pôde ser ativada:', err && err.message ? err.message : err);
});

export { auth, db, analytics };