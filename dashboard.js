import { auth, db } from "./firebase-global.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { doc, getDoc, setDoc, updateDoc, collection, addDoc, onSnapshot, query, orderBy, limit } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// Elements
const totalBalanceBTC = document.getElementById("btc-balance");
const totalBalanceUSD = document.getElementById("btc-usd");
const activePlanName = document.getElementById("active-plan-name");
const activePlanDetails = document.getElementById("active-plan-details");
const walletAddress = document.getElementById("wallet-address");
const walletLoader = document.getElementById("wallet-loader");
const depositBtn = document.getElementById("quick-deposit");
const withdrawBtn = document.getElementById("quick-withdraw");
const refCodeEl = document.getElementById("referral-code");

// Auth check
onAuthStateChanged(auth, async user => {
    if(!user) return window.location.href="login.html";
    const uid = user.uid;
    walletAddress.textContent = uid;
    walletLoader.classList.add("hidden");
    walletAddress.classList.remove("hidden");

    const userRef = doc(db,"users",uid);
    onSnapshot(userRef, docSnap=>{
        const data = docSnap.data();
        totalBalanceBTC.textContent = (data.balanceBTC||0).toFixed(4)+" BTC";
        totalBalanceUSD.textContent = (data.balanceUSD||0).toFixed(2)+" USD";
        activePlanName.textContent = data.activePlan?.name || "No Active Plan";
        activePlanDetails.textContent = data.activePlan?.details || "Select a plan to start earning";
        refCodeEl.textContent = data.referralCode || uid.slice(0,6).toUpperCase();
    });

    // Leaderboard
    const leaderboardRef = collection(db,"users");
    const leaderboardQuery = query(leaderboardRef, orderBy("balanceBTC","desc"), limit(10));
    onSnapshot(leaderboardQuery,snap=>{
        const listEl = document.getElementById("leaderboardList");
        if(!listEl) return;
        listEl.innerHTML="";
        snap.forEach(doc=>{
            const u = doc.data();
            const li = document.createElement("li");
            li.textContent = `${u.displayName||"User"} - ${(u.balanceBTC||0).toFixed(4)} BTC`;
            listEl.appendChild(li);
        });
    });
});

// Deposit
if(depositBtn){
    depositBtn.addEventListener("click", async ()=>{
        walletLoader.classList.remove("hidden");
        walletAddress.classList.add("hidden");
        setTimeout(()=>{
            walletLoader.classList.add("hidden");
            walletAddress.classList.remove("hidden");
        },Math.random()*5000+5000); // 5-10s delay

        const amount = prompt("Enter BTC amount to deposit:");
        if(!amount || isNaN(amount)) return alert("Invalid amount");
        const user = auth.currentUser;
        if(!user) return alert("Login first");

        await addDoc(collection(db,"deposits"),{
            uid: user.uid,
            amount: parseFloat(amount),
            status: "pending",
            createdAt: new Date()
        });
        alert("Deposit request submitted! Admin will approve and credit your account.");
    });
}

// Withdraw
if(withdrawBtn){
    withdrawBtn.addEventListener("click", async ()=>{
        const amount = prompt("Enter BTC amount to withdraw:");
        if(!amount || isNaN(amount)) return alert("Invalid amount");
        const user = auth.currentUser;
        if(!user) return alert("Login first");

        await addDoc(collection(db,"withdrawals"),{
            uid: user.uid,
            amount: parseFloat(amount),
            status:"pending",
            createdAt: new Date()
        });
        alert("Withdrawal request submitted! Admin will approve and credit.");
    });
}
