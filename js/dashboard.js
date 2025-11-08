// dashboard.js
document.addEventListener('DOMContentLoaded', () => {

  // --- Firebase references ---
  const auth = firebase.auth();
  const db = firebase.firestore();
  const storage = firebase.storage();

  let currentUser = null;
  let isAdmin = false;

  // --- DOM Elements ---
  const sections = document.querySelectorAll('.dashboard-section');
  const navButtons = document.querySelectorAll('.nav-btn');
  const logoutBtn = document.getElementById('logout-btn');
  const snackbar = document.getElementById('dt-snackbar');

  // Overview
  const totalBalanceBTC = document.getElementById('totalBalanceBTC');
  const totalBalanceUSD = document.getElementById('totalBalanceUSD');
  const activePlanEl = document.getElementById('activePlan');
  const portfolioChartEl = document.getElementById('portfolioChart');

  // Transactions
  const txTableBody = document.getElementById('tx-table-body');

  // Deposit
  const depositWalletAddress = document.getElementById('deposit-wallet-address');
  const depositQR = document.getElementById('deposit-qr');
  const depositCopyBtn = document.getElementById('deposit-copy');
  const depositForm = document.getElementById('deposit-form');
  const depositAmount = document.getElementById('deposit-amount');
  const depositPlan = document.getElementById('deposit-plan');

  // Withdraw
  const withdrawForm = document.getElementById('withdraw-form');
  const withdrawAmount = document.getElementById('withdraw-amount');
  const withdrawWallet = document.getElementById('withdraw-wallet');

  // Leaderboard
  const leaderboardList = document.getElementById('leaderboard-list');
  const toggleLeaderboard = document.getElementById('toggle-leaderboard');

  // Chat
  const chatBox = document.getElementById('chat-box');
  const chatInput = document.getElementById('chat-input');
  const chatSend = document.getElementById('chat-send');

  // Admin
  const qrUpload = document.getElementById('qr-upload');
  const adminPlanSwitch = document.getElementById('admin-plan-switch');
  const applyPlanSwitch = document.getElementById('apply-plan-switch');

  // --- Functions ---
  function showSection(id) {
    sections.forEach(sec => sec.style.display = sec.id === id ? 'block' : 'none');
  }

  function showSnackbar(msg, duration = 3000) {
    snackbar.textContent = msg;
    snackbar.classList.add('show');
    setTimeout(() => snackbar.classList.remove('show'), duration);
  }

  function updateOverview(userData) {
    totalBalanceBTC.textContent = `${userData.btcBalance || 0} BTC`;
    totalBalanceUSD.textContent = `$${userData.usdBalance || 0}`;
    activePlanEl.textContent = userData.plan || '—';
  }

  function loadTransactions(uid) {
    txTableBody.innerHTML = '<tr><td colspan="4">Loading...</td></tr>';
    db.collection('transactions')
      .where('uid', '==', uid)
      .orderBy('date', 'desc')
      .get()
      .then(snapshot => {
        txTableBody.innerHTML = '';
        snapshot.forEach(doc => {
          const tx = doc.data();
          const tr = document.createElement('tr');
          tr.innerHTML = `<td>${new Date(tx.date.seconds * 1000).toLocaleString()}</td>
                          <td>${tx.type}</td>
                          <td>${tx.amount}</td>
                          <td>${tx.status}</td>`;
          txTableBody.appendChild(tr);
        });
      });
  }

  function loadPortfolioChart(userData) {
    const ctx = portfolioChartEl.getContext('2d');
    new Chart(ctx, {
      type: 'line',
      data: {
        labels: userData.portfolioDates || [],
        datasets: [{
          label: 'Portfolio Value (USD)',
          data: userData.portfolioValues || [],
          borderColor: '#0ff',
          backgroundColor: 'rgba(0,255,255,0.2)',
          tension: 0.2
        }]
      },
      options: { responsive: true, plugins: { legend: { display: false } } }
    });
  }

  function loadLeaderboard() {
    db.collection('users')
      .orderBy('usdBalance', 'desc')
      .limit(10)
      .get()
      .then(snapshot => {
        leaderboardList.innerHTML = '';
        snapshot.forEach(doc => {
          const user = doc.data();
          const li = document.createElement('li');
          li.textContent = `${user.displayName || 'Anonymous'} — $${user.usdBalance || 0}`;
          leaderboardList.appendChild(li);
        });
      });
  }

  function loadChat() {
    db.collection('chat')
      .orderBy('timestamp', 'asc')
      .onSnapshot(snapshot => {
        chatBox.innerHTML = '';
        snapshot.forEach(doc => {
          const msg = doc.data();
          const div = document.createElement('div');
          div.className = msg.uid === currentUser.uid ? 'chat-msg self' : 'chat-msg';
          div.textContent = `${msg.sender}: ${msg.text}`;
          chatBox.appendChild(div);
          chatBox.scrollTop = chatBox.scrollHeight;
        });
      });
  }

  // --- Event Listeners ---
  navButtons.forEach(btn => {
    btn.addEventListener('click', () => showSection(btn.dataset.target));
  });

  logoutBtn.addEventListener('click', () => auth.signOut());

  depositCopyBtn.addEventListener('click', () => {
    navigator.clipboard.writeText(depositWalletAddress.textContent)
      .then(() => showSnackbar('Wallet address copied!'));
  });

  depositForm.addEventListener('submit', e => {
    e.preventDefault();
    const amount = parseFloat(depositAmount.value);
    const plan = depositPlan.value;
    if (!amount || amount <= 0) return showSnackbar('Invalid amount!');
    db.collection('transactions').add({
      uid: currentUser.uid,
      type: 'deposit',
      amount: amount,
      plan,
      status: 'pending',
      date: firebase.firestore.FieldValue.serverTimestamp()
    }).then(() => showSnackbar('Deposit request submitted!'));
  });

  withdrawForm.addEventListener('submit', e => {
    e.preventDefault();
    const amount = parseFloat(withdrawAmount.value);
    const wallet = withdrawWallet.value.trim();
    if (!amount || !wallet) return showSnackbar('Fill all fields!');
    db.collection('transactions').add({
      uid: currentUser.uid,
      type: 'withdraw',
      amount,
      wallet,
      status: 'pending',
      date: firebase.firestore.FieldValue.serverTimestamp()
    }).then(() => showSnackbar('Withdrawal request submitted!'));
  });

  chatSend.addEventListener('click', () => {
    const text = chatInput.value.trim();
    if (!text) return;
    db.collection('chat').add({
      uid: currentUser.uid,
      sender: currentUser.displayName || 'User',
      text,
      timestamp: firebase.firestore.FieldValue.serverTimestamp()
    });
    chatInput.value = '';
  });

  toggleLeaderboard.addEventListener('change', () => {
    db.collection('settings').doc('leaderboard').set({ enabled: toggleLeaderboard.checked });
    showSnackbar(`Leaderboard ${toggleLeaderboard.checked ? 'enabled' : 'disabled'}`);
  });

  qrUpload.addEventListener('change', e => {
    if (!isAdmin) return;
    const file = e.target.files[0];
    if (!file) return;
    const storageRef = storage.ref(`deposit_qr/${file.name}`);
    storageRef.put(file).then(() => {
      storageRef.getDownloadURL().then(url => {
        db.collection('settings').doc('depositQR').set({ url });
        depositQR.src = url;
        showSnackbar('Deposit QR updated!');
      });
    });
  });

  applyPlanSwitch.addEventListener('click', () => {
    if (!isAdmin) return;
    const plan = adminPlanSwitch.value;
    db.collection('users').get().then(snapshot => {
      snapshot.forEach(doc => {
        doc.ref.update({ plan });
      });
    });
    showSnackbar(`All user plans switched to ${plan}`);
  });

  // --- Auth Listener ---
  auth.onAuthStateChanged(user => {
    if (!user) {
      window.location.href = '/login.html';
      return;
    }
    currentUser = user;
    db.collection('users').doc(user.uid).get().then(doc => {
      const data = doc.data() || {};
      isAdmin = data.role === 'admin';

      depositWalletAddress.textContent = data.walletAddress || '—';
      if (data.depositQR) depositQR.src = data.depositQR;

      updateOverview(data);
      loadTransactions(user.uid);
      loadPortfolioChart(data);
      loadLeaderboard();
      loadChat();

      if (!isAdmin) {
        document.getElementById('admin').style.display = 'none';
      }
    });
  });

});
