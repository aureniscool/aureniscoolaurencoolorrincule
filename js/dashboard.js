import { auth, db } from "./firebase-global.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { doc, getDoc, updateDoc, collection, addDoc, onSnapshot, query, orderBy, limit } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// Elements
const totalBalanceBTC = document.getElementById("btc-balance");
const totalBalanceUSD = document.getElementById("btc-usd");
const activePlanName = document.getElementById("active-plan-name");
const activePlanDetails = document.getElementById("active-plan-details");
const walletAddress = document.getElementById("wallet-address");
const depositBtn = document.getElementById("Request-Deposit");
const withdrawBtn = document.getElementById("withdraw-submit");
const referralCode = document.getElementById("ref-code");
const leaderboardList = document.getElementById("leaderboard-full-list");

// Auth check
let currentUserData = {};
onAuthStateChanged(auth, async user => {
    if(!user) return window.location.href = "login.html";
    const userRef = doc(db, "users", user.uid);

    // Snapshot: live updates
    onSnapshot(userRef, docSnap => {
        if(!docSnap.exists()) return;
        currentUserData = docSnap.data();

        // Display balances
        totalBalanceBTC.textContent = currentUserData.balanceBTC?.toFixed(4) + " BTC" || "0 BTC";
        totalBalanceUSD.textContent = currentUserData.balanceUSD?.toFixed(2) + " USD" || "0 USD";

        // Active plan
        activePlanName.textContent = currentUserData.activePlan || "—";
        activePlanDetails.textContent = currentUserData.planDetails || "Select a plan to start earning";

        // Referral
        referralCode.textContent = currentUserData.referral || "—";

        // Welcome
        const displayNameEl = document.getElementById("user-displayname");
        if(displayNameEl) displayNameEl.textContent = `Welcome, ${currentUserData.name || "User"}!`;

        // Wallet delay show
        setTimeout(() => {
            walletAddress.textContent = user.uid;
            walletAddress.classList.remove("hidden");
        }, 10000);
    });
});

// Deposit request
if(depositBtn){
    depositBtn.addEventListener("click", async e=>{
        e.preventDefault();
        const amount = parseFloat(document.getElementById("deposit-amount").value);
        const plan = document.getElementById("deposit-plan").value;
        if(!amount || amount <=0) return alert("Enter a valid amount");
        try {
            await addDoc(collection(db, "deposits"), {
                uid: auth.currentUser.uid,
                name: currentUserData.name || "User",
                amount,
                plan,
                status: "pending",
                createdAt: new Date()
            });
            alert("Deposit request sent! Admin will confirm.");
        } catch(err){ console.error(err); alert("Error sending deposit request"); }
    });
}

// Withdraw request
if(withdrawBtn){
    withdrawBtn.addEventListener("click", async e=>{
        e.preventDefault();
        const amount = parseFloat(document.getElementById("withdraw-amount").value);
        const wallet = document.getElementById("withdraw-wallet").value;
        if(!amount || !wallet) return alert("Enter valid amount and wallet");
        try {
            await addDoc(collection(db, "withdrawals"), {
                uid: auth.currentUser.uid,
                name: currentUserData.name || "User",
                amount,
                wallet,
                status: "pending",
                createdAt: new Date()
            });
            alert("Withdrawal request submitted for admin approval!");
        } catch(err){ console.error(err); alert("Error submitting withdrawal"); }
    });
}

// Leaderboard
const leaderboardToggleRef = doc(db, "adminControls", "leaderboard");
onSnapshot(leaderboardToggleRef, snap=>{
    if(!snap.exists()) return;
    const enabled = snap.data()?.enabled;
    leaderboardList.parentElement.style.display = enabled ? "block" : "none";

    if(enabled){
        const q = query(collection(db, "users"), orderBy("balanceUSD","desc"), limit(10));
        onSnapshot(q, snapUsers=>{
            leaderboardList.innerHTML = "";
            snapUsers.forEach(u=>{
                const li = document.createElement("li");
                li.textContent = `${u.data().name || "User"} — $${u.data().balanceUSD?.toFixed(2) || 0}`;
                leaderboardList.appendChild(li);
            });
        });
    }
});
