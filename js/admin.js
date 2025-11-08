import { auth, db, storage } from "./firebase-global.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { doc, getDoc, collection, onSnapshot, updateDoc, addDoc, query, orderBy } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js";

onAuthStateChanged(auth, async user => {
    if(!user) return window.location.href="login.html";
    const adminRef = doc(db,"admins",user.uid);
    const snap = await getDoc(adminRef);
    if(!snap.exists()) return window.location.href="login.html";

    // Deposits
    const depositsList = document.getElementById("admin-deposit-list");
    onSnapshot(collection(db,"deposits"), snapDep=>{
        depositsList.innerHTML = "";
        snapDep.forEach(d=>{
            const data = d.data();
            const li = document.createElement("li");
            li.innerHTML = `${data.name} — $${data.amount} — ${data.status} 
            <button onclick="approveDeposit('${d.id}', ${data.amount})">Approve</button>`;
            depositsList.appendChild(li);
        });
    });

    window.approveDeposit = async (id, amount)=>{
        const depRef = doc(db,"deposits",id);
        const depSnap = await getDoc(depRef);
        if(depSnap.exists()){
            const uid = depSnap.data().uid;
            const userRef = doc(db,"users",uid);
            const userSnap = await getDoc(userRef);
            const currentBalance = userSnap.data()?.balanceUSD || 0;
            await updateDoc(userRef,{ balanceUSD: currentBalance+amount });
            await updateDoc(depRef,{ status: "approved" });
            alert("Deposit approved and balance updated");
        }
    };

    // Withdrawals
    const withdrawList = document.getElementById("admin-withdraw-list");
    onSnapshot(collection(db,"withdrawals"), snapW=>{
        withdrawList.innerHTML="";
        snapW.forEach(d=>{
            const data = d.data();
            const li = document.createElement("li");
            li.innerHTML = `${data.name} — $${data.amount} — ${data.status} 
            <button onclick="approveWithdraw('${d.id}', ${data.amount})">Approve</button>`;
            withdrawList.appendChild(li);
        });
    });

    window.approveWithdraw = async (id, amount)=>{
        const wRef = doc(db,"withdrawals",id);
        const wSnap = await getDoc(wRef);
        if(wSnap.exists()){
            const uid = wSnap.data().uid;
            const userRef = doc(db,"users",uid);
            const userSnap = await getDoc(userRef);
            const currentBalance = userSnap.data()?.balanceUSD || 0;
            if(currentBalance<amount){ alert("Insufficient user balance"); return; }
            await updateDoc(userRef,{ balanceUSD: currentBalance-amount });
            await updateDoc(wRef,{ status: "approved" });
            alert("Withdrawal approved and balance deducted");
        }
    };

    // QR upload
    const qrInput = document.getElementById("upload-qr");
    qrInput?.addEventListener("change", async e=>{
        const file = e.target.files[0];
        if(!file) return;
        const qrRef = ref(storage, "deposit-qr/"+file.name);
        await uploadBytes(qrRef,file);
        const url = await getDownloadURL(qrRef);
        await updateDoc(doc(db,"adminControls","wallet"),{ qrURL:url });
        alert("QR uploaded and set");
    });

    // Leaderboard toggle
    const lbToggle = document.getElementById("toggle-leaderboard");
    lbToggle?.addEventListener("click", async ()=>{
        const refDoc = doc(db,"adminControls","leaderboard");
        const snap = await getDoc(refDoc);
        const enabled = snap.exists()? snap.data().enabled : true;
        await updateDoc(refDoc,{ enabled: !enabled });
        alert(`Leaderboard now ${!enabled ? "enabled" : "disabled"}`);
    });

});
