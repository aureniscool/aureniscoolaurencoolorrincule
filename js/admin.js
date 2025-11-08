// admin.js
import { auth, db, storage } from './firebase-global.js'; // exposed from index

import { 
  onAuthStateChanged, signOut
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

import {
  doc, getDoc, setDoc, updateDoc, collection, addDoc, getDocs, query, orderBy, limit
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

import { ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js";

document.addEventListener("DOMContentLoaded", () => {
  const sections = document.querySelectorAll(".dashboard-section");
  const navBtns = document.querySelectorAll(".nav-btn");
  const logoutBtn = document.getElementById("logout-btn");

  // Sidebar nav
  navBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      sections.forEach(s => s.classList.remove("active"));
      const section = document.getElementById(btn.dataset.section);
      section.classList.add("active");
    });
  });

  // Auth check
  onAuthStateChanged(auth, user => {
    if (!user) window.location.href = "login.html"; // redirect non-admin
    // optionally, check custom claim for admin
  });

  logoutBtn.addEventListener("click", () => signOut(auth));

  // Stats overview
  async function loadStats() {
    const docSnap = await getDoc(doc(db, "stats", "overview"));
    if (docSnap.exists()) {
      const data = docSnap.data();
      document.getElementById("stat-investors").innerText = data.activeInvestors || 0;
      document.getElementById("stat-investment").innerText = `$${data.totalInvestment || 0}`;
      document.getElementById("stat-payout").innerText = `$${data.totalPayout || 0}`;
      renderChart(data.portfolio || {});
    }
  }

  // Portfolio Chart
  function renderChart(portfolioData) {
    const ctx = document.getElementById('portfolioChart').getContext('2d');
    new Chart(ctx, {
      type: 'bar',
      data: {
        labels: Object.keys(portfolioData),
        datasets: [{
          label: 'Portfolio Distribution',
          data: Object.values(portfolioData),
          backgroundColor: '#0ff',
        }]
      },
      options: {
        responsive: true,
        plugins: { legend: { display: true } }
      }
    });
  }

  // Leaderboard toggle
  const toggleLeaderboard = document.getElementById("toggle-leaderboard");
  toggleLeaderboard.addEventListener("change", async () => {
    await setDoc(doc(db, "settings", "leaderboard"), { enabled: toggleLeaderboard.checked });
  });

  async function loadLeaderboard() {
    const leaderboardList = document.getElementById("leaderboard-list");
    leaderboardList.innerHTML = "";
    const q = query(collection(db, "leaderboard"), orderBy("total", "desc"), limit(10));
    const snapshot = await getDocs(q);
    snapshot.forEach(docSnap => {
      const li = document.createElement("li");
      const data = docSnap.data();
      li.textContent = `${data.username} — $${data.total}`;
      leaderboardList.appendChild(li);
    });
  }

  // Chat system
  const chatBox = document.getElementById("chat-box");
  const chatInput = document.getElementById("chat-input");
  const chatSend = document.getElementById("chat-send");

  async function loadMessages() {
    const q = query(collection(db, "chat"), orderBy("timestamp"));
    const snapshot = await getDocs(q);
    chatBox.innerHTML = "";
    snapshot.forEach(docSnap => {
      const msg = docSnap.data();
      const div = document.createElement("div");
      div.className = msg.fromAdmin ? "msg admin" : "msg client";
      div.textContent = msg.text;
      chatBox.appendChild(div);
    });
    chatBox.scrollTop = chatBox.scrollHeight;
  }

  chatSend.addEventListener("click", async () => {
    const text = chatInput.value.trim();
    if (!text) return;
    await addDoc(collection(db, "chat"), {
      text,
      fromAdmin: true,
      timestamp: new Date()
    });
    chatInput.value = "";
    loadMessages();
  });

  // QR upload
  const qrInput = document.getElementById("deposit-qr-upload");
  const qrImg = document.getElementById("deposit-qr");
  qrInput.addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const qrRef = ref(storage, `deposit-qr/${file.name}`);
    await uploadBytes(qrRef, file);
    const url = await getDownloadURL(qrRef);
    qrImg.src = url;
    await setDoc(doc(db, "settings", "depositQR"), { url });
  });

  // Admin social form
  const adminForm = document.getElementById("admin-form");
  adminForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    await setDoc(doc(db, "settings", "socialLinks"), {
      whatsapp: document.getElementById("social-whatsapp").value,
      facebook: document.getElementById("social-facebook").value,
      instagram: document.getElementById("social-instagram").value,
      email: document.getElementById("social-email").value
    });
  });

  // Plan change
  const planForm = document.getElementById("plan-form");
  planForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const plan = document.getElementById("plan-select").value;
    const userId = prompt("Enter User ID to switch plan:");
    if (!userId) return;
    await updateDoc(doc(db, "users", userId), { plan });
    alert(`User plan updated to ${plan}`);
  });

  // Initial load
  loadStats();
  loadLeaderboard();
  loadMessages();
});
