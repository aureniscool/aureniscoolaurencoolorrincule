import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDhyWz14XrUNdj1_M0bcY5kWblmtTVFNiU",
  authDomain: "lumiinvest-3af48.firebaseapp.com",
  projectId: "lumiinvest-3af48",
  storageBucket: "lumiinvest-3af48.firebasestorage.app",
  messagingSenderId: "708008740461",
  appId: "1:708008740461:web:abd673a06c77ae29f52164"
};

// --- Initialize Firebase ---
const app = initializeApp(firebaseConfig);

// --- Initialize services ---
const auth = getAuth(app);
const db = getFirestore(app);

// --- Export to global scope (for other scripts) ---
window.app = app;
window.auth = auth;
window.db = db;

export { app, auth, db };
