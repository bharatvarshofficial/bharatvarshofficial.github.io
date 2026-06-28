/* ==========================================
   BharatVarshOfficial
   Premium Professional Script
========================================== */

// ==========================
// LOADING ANIMATION
// ==========================
window.addEventListener("load", () => {
  const loader = document.getElementById("loader");
  if (loader) {
    loader.style.transition = "opacity 0.5s ease";
    loader.style.opacity = "0";
    setTimeout(() => {
      loader.style.display = "none";
    }, 500);
  }
});

// ==========================
// LIVE SEARCH
// ==========================
const searchInput = document.getElementById("searchInput");
const cards = document.querySelectorAll(".card");

if (searchInput) {
  searchInput.addEventListener("keyup", function() {
    const value = this.value.toLowerCase();
    
    cards.forEach(card => {
      const title = card.querySelector("h3").textContent.toLowerCase();
      
      if (title.includes(value)) {
        card.style.display = ""; 
      } else {
        card.style.display = "none";
      }
    });
  });
}

// ==========================
// FAVORITE BUTTON
// ==========================
const favButtons = document.querySelectorAll(".favorite-btn");

favButtons.forEach((btn, index) => {
  const key = "favorite_" + index;
  
  // LocalStorage check for previous favorites
  if (localStorage.getItem(key) === "true") {
    btn.innerHTML = "❤️";
  } else {
    btn.innerHTML = "🤍";
  }
  
  btn.addEventListener("click", () => {
    if (btn.innerHTML === "🤍") {
      btn.innerHTML = "❤️";
      localStorage.setItem(key, "true");
    } else {
      btn.innerHTML = "🤍";
      localStorage.removeItem(key);
    }
  });
});

// ==========================
// DOWNLOAD BUTTON
// ==========================
const downloadButtons = document.querySelectorAll(".download-btn");

downloadButtons.forEach(button => {
  button.addEventListener("click", () => {
    alert("Download feature will be connected in Firebase Version.");
  });
});

// ==========================
// DARK / LIGHT MODE WITH EMOJI TOGGLE
// ==========================
const darkModeBtn = document.getElementById("darkMode");

// Initialize Theme from LocalStorage
if (localStorage.getItem("theme") === "light") {
  document.body.classList.add("light-mode");
  if (darkModeBtn) darkModeBtn.innerHTML = "☀️";
}

if (darkModeBtn) {
  darkModeBtn.addEventListener("click", () => {
    document.body.classList.toggle("light-mode");
    
    const isLight = document.body.classList.contains("light-mode");
    localStorage.setItem("theme", isLight ? "light" : "dark");
    
    // Update button icon
    darkModeBtn.innerHTML = isLight ? "☀️" : "🌙";
  });
}

// ==========================
// BACK TO TOP
// ==========================
const backBtn = document.getElementById("backToTop");

window.addEventListener("scroll", () => {
  if (!backBtn) return;
  if (window.scrollY > 300) {
    backBtn.style.display = "block";
  } else {
    backBtn.style.display = "none";
  }
});

if (backBtn) {
  backBtn.addEventListener("click", () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  });
}

// ==========================
// MOBILE NAVBAR TOGGLE
// ==========================
const menuBtn = document.getElementById("menuBtn");
const navbar = document.querySelector(".navbar");

if (menuBtn && navbar) {
  menuBtn.addEventListener("click", () => {
    navbar.classList.toggle("show");
    // Change menu icon when opened
    menuBtn.innerHTML = navbar.classList.contains("show") ? "✖" : "☰" : “+” ;
  });
}
