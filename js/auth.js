document.addEventListener("DOMContentLoaded", function() {

  const loginForm = document.getElementById("loginForm");
  const registerForm = document.getElementById("registerForm");

  if (loginForm) {
    loginForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const email = loginForm["email"].value;
      const password = loginForm["password"].value;

      window.auth.signInWithEmailAndPassword(email, password)
        .then((cred) => {
          const user = cred.user;
          window.db.collection("users").doc(user.uid).get()
            .then(doc => {
              if(doc.exists && doc.data().role === "admin") {
                window.location.href = "admin.html";
              } else {
                window.location.href = "dashboard.html";
              }
            });
        })
        .catch((error) => alert(error.message));
    });
  }

  if (registerForm) {
    registerForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const email = registerForm["email"].value;
      const password = registerForm["password"].value;
      const fullname = registerForm["fullname"].value;

      window.auth.createUserWithEmailAndPassword(email, password)
        .then((cred) => {
          const user = cred.user;
          window.db.collection("users").doc(user.uid).set({
            fullname: fullname,
            email: email,
            role: "user",
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
          }).then(() => {
            window.location.href = "dashboard.html";
          });
        })
        .catch((error) => alert(error.message));
    });
  }

});
