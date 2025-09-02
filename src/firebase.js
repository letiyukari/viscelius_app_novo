import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Suas credenciais de configuração do Firebase (mantive as que você me passou)
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

// Inicializar e exportar os serviços que estamos usando
// Esta é a maneira mais limpa e padrão de fazer isso
export const auth = getAuth(app);
export const db = getFirestore(app);