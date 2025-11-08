import { auth, db } from "./firebase-init.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import { doc, getDoc, onSnapshot, updateDoc } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

// Elements
const totalBalanceBTC = document.getElementById("totalBalanceBTC");
const totalBalanceUSD = document.getElementById("totalBalanceUSD");
const activePlanContainer = document.getElementById("activePlan");
const depositBtn = document.getElementById("depositBtn");
const withdrawBtn = document.getElementById("withdrawBtn");
const walletAddress = document.getElementById("walletAddress");

// Auth check
onAuthStateChanged(auth, async user => {
    if(user){
        const userRef = doc(db, "users", user.uid);
        onSnapshot(userRef, docSnap => {
            const data = docSnap.data();
            totalBalanceBTC.textContent = data.balanceBTC.toFixed(4) + " BTC";
            totalBalanceUSD.textContent = data.balanceUSD.toFixed(2) + " USD";
            activePlanContainer.textContent = data.activePlan || "No Active Plan";
            walletAddress.textContent = data.uid;
        });
    } else {
        window.location.href = "login.tml";
    }
});

// Deposit
if(depositBtn){
    depositBtn.addEventListener("click", ()=>{
        const amount = prompt("Enter BTC amount to deposit:");
        alert("Deposit request submitted: " + amount + " BTC");
    });
}

// Withdraw
if(withdrawBtn){
    withdrawBtn.addEventListener("click", ()=>{
        const amount = prompt("Enter BTC amount to withdraw:");
        alert("Withdrawal request submitted: " + amount + " BTC");
    });
}
