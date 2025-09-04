// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

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
const analytics = getAnalytics(app);

// Inicializar e exportar serviços
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db, analytics };