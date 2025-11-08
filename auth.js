// auth.js
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

import {
  doc,
  setDoc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// use global Firebase instances from firebase-init.js
const auth = window.auth;
const db = window.db;

/* ------------------------------
   REGISTER
--------------------------------*/
const registerForm = document.getElementById("register-form");
if (registerForm) {
  registerForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = registerForm["email"].value.trim();
    const password = registerForm["password"].value.trim();
    const role = registerForm["role"] ? registerForm["role"].value : "user";

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // store user role in Firestore
      await setDoc(doc(db, "users", user.uid), { email, role });

      alert("Registration successful!");
      if (role === "admin") {
        window.location.href = "admin.html";
      } else {
        window.location.href = "dashboard.html";
      }

    } catch (error) {
      console.error("Registration error:", error);
      alert(error.message);
    }
  });
}

/* ------------------------------
   LOGIN
--------------------------------*/
const loginForm = document.getElementById("login-form");
if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = loginForm["email"].value.trim();
    const password = loginForm["password"].value.trim();

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // get user role from Firestore
      const userDoc = await getDoc(doc(db, "users", user.uid));
      const role = userDoc.exists() ? userDoc.data().role : "user";

      alert("Login successful!");
      if (role === "admin") {
        window.location.href = "admin.html";
      } else {
        window.location.href = "dashboard.html";
      }

    } catch (error) {
      console.error("Login error:", error);
      alert(error.message);
    }
  });
}

/* ------------------------------
   AUTH STATE CHECKER
--------------------------------*/
onAuthStateChanged(auth, async (user) => {
  if (user) {
    console.log("User logged in:", user.email);
  } else {
    console.log("No user logged in");
  }
});

/* ------------------------------
   LOGOUT
--------------------------------*/
const logoutBtn = document.getElementById("logout-btn");
if (logoutBtn) {
  logoutBtn.addEventListener("click", async () => {
    await signOut(auth);
    alert("Logged out!");
    window.location.href = "index.html";
  });
}
