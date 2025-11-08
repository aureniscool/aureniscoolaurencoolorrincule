const firebaseConfig = {
  apiKey: "AIzaSyDhyWz14XrUNdj1_M0bcY5kWblmtTVFNiU",
  authDomain: "lumiinvest-3af48.firebaseapp.com",
  projectId: "lumiinvest-3af48",
  storageBucket: "lumiinvest-3af48.firebasestorage.app",
  messagingSenderId: "708008740461",
  appId: "1:708008740461:web:abd673a06c77ae29f52164"
};

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

const auth = firebase.auth();
const db = firebase.firestore();

// ========== REGISTER ==========
const registerForm = document.getElementById("registerForm");
if (registerForm) {
  registerForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const fullName = document.getElementById("fullName").value;
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const confirmPassword = document.getElementById("confirmPassword").value;
    const country = document.getElementById("country").value;
    const plan = document.getElementById("planSelect").value;

    if (password !== confirmPassword) {
      alert("Passwords do not match!");
      return;
    }

    try {
      const userCredential = await auth.createUserWithEmailAndPassword(email, password);
      const user = userCredential.user;

      // Save user details in Firestore
      await db.collection("users").doc(user.uid).set({
        fullName,
        email,
        country,
        plan,
        role: "user", // default role
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      });

      alert("Account created successfully!");
      window.location.href = "login.html";
    } catch (error) {
      alert(error.message);
    }
  });
}

// ========== LOGIN ==========
const loginForm = document.getElementById("loginForm");
if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = loginForm.email.value;
    const password = loginForm.password.value;

    try {
      const userCredential = await auth.signInWithEmailAndPassword(email, password);
      const user = userCredential.user;

      // get user role
      const doc = await db.collection("users").doc(user.uid).get();
      if (doc.exists) {
        const data = doc.data();
        if (data.role === "admin") {
          window.location.href = "admin.html";
        } else {
          window.location.href = "dashboard.html";
        }
      } else {
        alert("User data not found.");
      }
    } catch (error) {
      alert(error.message);
    }
  });
}
