export function copyToClipboard(text, msg = "Copied!") {
  navigator.clipboard.writeText(text).then(() => {
    showSnackbar(msg);
  });
}

export function showSnackbar(message, duration = 3000) {
  let snackbar = document.getElementById("dt-snackbar");
  if (!snackbar) {
    snackbar = document.createElement("div");
    snackbar.id = "dt-snackbar";
    snackbar.className = "snackbar";
    document.body.appendChild(snackbar);
  }
  snackbar.textContent = message;
  snackbar.classList.remove("hidden");
  setTimeout(() => snackbar.classList.add("hidden"), duration);
}

export function updateSocialLinks(socialLinks) {
  // Update homepage/social buttons dynamically
  document.querySelectorAll(".nt-social-vertical a").forEach(a => {
    const platform = a.title.toLowerCase();
    if (socialLinks[platform]) a.href = socialLinks[platform];
  });
}

export function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
