import { auth, db, storage } from "./firebase-global.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { doc, getDoc, setDoc, updateDoc, collection, addDoc, onSnapshot, query, orderBy, limit } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js";

// Navigation
document.querySelectorAll(".nav-btn").forEach(btn=>{
    btn.addEventListener("click",()=>{
        document.querySelectorAll(".nav-btn").forEach(b=>b.classList.remove("active"));
        btn.classList.add("active");
        document.querySelectorAll(".admin-section").forEach(sec=>sec.classList.remove("active"));
        const section = document.getElementById(btn.dataset.section);
        if(section) section.classList.add("active");
    });
});

// Logout
document.getElementById("logout-btn").addEventListener("click",()=>signOut(auth));

// Auth check
onAuthStateChanged(auth,user=>{
    if(!user) return window.location.href="login.html";
});

// Overview stats
function loadOverview(){
    const usersRef = collection(db,"users");
    onSnapshot(usersRef,snap=>{
        document.getElementById("total-users").textContent = snap.size;
        let btcTotal=0, usdTotal=0;
        snap.forEach(doc=>{ const d=doc.data(); btcTotal+=d.balanceBTC||0; usdTotal+=d.balanceUSD||0; });
        document.getElementById("total-btc").textContent=btcTotal.toFixed(4)+" BTC";
        document.getElementById("total-usd").textContent=usdTotal.toFixed(2)+" USD";
    });
}
loadOverview();

// Users list
onSnapshot(collection(db,"users"),snap=>{
    const tbody = document.getElementById("users-list");
    tbody.innerHTML="";
    snap.forEach(doc=>{
        const u=doc.data();
        const tr=document.createElement("tr");
        tr.innerHTML=`<td>${doc.id}</td><td>${u.displayName||"User"}</td><td>${(u.balanceBTC||0).toFixed(4)}</td><td>${(u.balanceUSD||0).toFixed(2)}</td><td>${u.activePlan?.name||"-"}</td>`;
        tbody.appendChild(tr);
    });
});

// Deposits
onSnapshot(query(collection(db,"deposits"), orderBy("createdAt","desc")),snap=>{
    const tbody = document.getElementById("deposits-list");
    tbody.innerHTML="";
    snap.forEach(doc=>{
        const d=doc.data();
        const tr=document.createElement("tr");
        const approveBtn=document.createElement("button");
        approveBtn.textContent="Approve";
        approveBtn.className="btn-primary btn-small";
        approveBtn.addEventListener("click",async ()=>{
            await updateDoc(doc.ref,{status:"approved"});
            alert("Deposit approved! Credit manually in user wallet.");
        });
        tr.innerHTML=`<td>${d.uid}</td><td>${d.amount}</td><td>${d.status}</td>`;
        const tdActions=document.createElement("td");
        tdActions.appendChild(approveBtn);
        tr.appendChild(tdActions);
        tbody.appendChild(tr);
    });
});

// Withdrawals
onSnapshot(query(collection(db,"withdrawals"), orderBy("createdAt","desc")),snap=>{
    const tbody = document.getElementById("withdrawals-list");
    tbody.innerHTML="";
    snap.forEach(doc=>{
        const w=doc.data();
        const tr=document.createElement("tr");
        const approveBtn=document.createElement("button");
        approveBtn.textContent="Approve";
        approveBtn.className="btn-primary btn-small";
        approveBtn.addEventListener("click",async ()=>{
            await updateDoc(doc.ref,{status:"approved"});
            alert("Withdrawal approved! Credit user manually.");
        });
        tr.innerHTML=`<td>${w.uid}</td><td>${w.amount}</td><td>${w.status}</td>`;
        const tdActions=document.createElement("td");
        tdActions.appendChild(approveBtn);
        tr.appendChild(tdActions);
        tbody.appendChild(tr);
    });
});

// Social Buttons
document.getElementById("save-social-btn").addEventListener("click",async ()=>{
    const socialData={
        whatsapp: document.getElementById("social-whatsapp").value,
        facebook: document.getElementById("social-facebook").value,
        instagram: document.getElementById("social-instagram").value,
        email: document.getElementById("social-email").value
    };
    await setDoc(doc(db,"settings","social"),socialData);
    alert("Social links updated!");
});

// Leaderboard toggle
document.getElementById("toggle-leaderboard").addEventListener("change",async (e)=>{
    await setDoc(doc(db,"settings","leaderboard"),{enabled:e.target.checked});
    alert("Leaderboard setting updated!");
});

// QR upload
document.getElementById("save-qr-btn").addEventListener("click",async ()=>{
    const file = document.getElementById("qr-upload").files[0];
    if(!file) return alert("Select a file first");
    const storageRef = ref(storage,"depositQR/"+file.name);
    await uploadBytes(storageRef,file);
    const url = await getDownloadURL(storageRef);
    document.getElementById("qr-preview").innerHTML=`<img src="${url}" style="max-width:200px;">`;
    await setDoc(doc(db,"settings","qr"),{url});
    alert("QR uploaded successfully!");
});

// Portfolio Chart
const ctx = document.getElementById("portfolio-chart").getContext("2d");
const portfolioChart = new Chart(ctx,{
    type:'line',
    data:{
        labels:["Jan","Feb","Mar","Apr","May","Jun"],
        datasets:[{label:"BTC Balance",data:[0,0,0,0,0,0],borderColor:"#7df0ff",backgroundColor:"rgba(125,240,255,0.1)",tension:0.3}]
    },
    options:{responsive:true,plugins:{legend:{display:true}}}
});
