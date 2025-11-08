import { db, auth } from "./firebase-init.js";
import { doc, getDoc, setDoc, updateDoc, collection, getDocs, onSnapshot } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

const usersTable = document.getElementById("usersTable");
const leaderboardContainer = document.getElementById("leaderboardContainer");

// Load all users
async function loadUsers() {
    const usersCol = collection(db, "users");
    onSnapshot(usersCol, snapshot => {
        usersTable.innerHTML = "";
        snapshot.forEach(docSnap => {
            const user = docSnap.data();
            const row = `<tr>
                <td>${user.firstName}</td>
                <td>${user.email}</td>
                <td>${user.rank}</td>
                <td>${user.balanceBTC}</td>
                <td>${user.activePlan || "None"}</td>
                <td><button onclick="creditUser('${docSnap.id}')">Credit</button></td>
                <td><button onclick="debitUser('${docSnap.id}')">Debit</button></td>
                </tr>`;
            usersTable.innerHTML += row;
        });
    });
}

// Admin can credit user
window.creditUser = async uid => {
    const amount = prompt("Enter BTC amount to credit:");
    const userRef = doc(db, "users", uid);
    const userSnap = await getDoc(userRef);
    if(userSnap.exists()){
        const newBalance = (userSnap.data().balanceBTC || 0) + parseFloat(amount);
        await updateDoc(userRef, { balanceBTC: newBalance });
        alert("User credited!");
    }
}

// Admin can debit user
window.debitUser = async uid => {
    const amount = prompt("Enter BTC amount to debit:");
    const userRef = doc(db, "users", uid);
    const userSnap = await getDoc(userRef);
    if(userSnap.exists()){
        const newBalance = (userSnap.data().balanceBTC || 0) - parseFloat(amount);
        await updateDoc(userRef, { balanceBTC: newBalance });
        alert("User debited!");
    }
}

// Leaderboard
function loadLeaderboard() {
    const usersCol = collection(db, "users");
    onSnapshot(usersCol, snapshot => {
        leaderboardContainer.innerHTML = "";
        const sorted = snapshot.docs.map(d=>d.data()).sort((a,b)=>b.balanceBTC - a.balanceBTC);
        sorted.forEach(u=>{
            leaderboardContainer.innerHTML += `<div>${u.firstName} - ${u.rank} - ${u.balanceBTC.toFixed(4)} BTC</div>`;
        });
    });
}

// Call functions
loadUsers();
loadLeaderboard();
