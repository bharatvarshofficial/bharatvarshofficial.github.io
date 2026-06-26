// ==========================================
// Bharat j
// Part 3A - Live Search + Category Filter
// ==========================================

// Select Elements
const searchInput = document.querySelector(".search-input");
const cards = document.querySelectorAll(".card");
const categoryButtons = document.querySelectorAll(".categories button");

// ------------------------------
// Live Search
// ------------------------------

if (searchInput) {
  searchInput.addEventListener("keyup", function() {
    
    const value = this.value.toLowerCase();
    
    cards.forEach(card => {
      
      const title = card.querySelector("h3").textContent.toLowerCase();
      
      if (title.includes(value)) {
        
        card.style.display = "block";
        
      } else {
        
        card.style.display = "none";
        
      }
      
    });
    
  });
}

// ------------------------------
// Category Filter
// ------------------------------

categoryButtons.forEach(button => {
  
  button.addEventListener("click", function() {
    
    // Active Button
    categoryButtons.forEach(btn => btn.classList.remove("active"));
    this.classList.add("active");
    
    const category = this.textContent.trim().toLowerCase();
    
    cards.forEach(card => {
      
      const cardCategory =
        (card.dataset.category || "").toLowerCase();
      
      if (category === "all") {
        
        card.style.display = "block";
        
      } else if (cardCategory === category) {
        
        card.style.display = "block";
        
      } else {
        
        card.style.display = "none";
        
      }
      
    });
    
  });
  
});

// ------------------------------
// Console
// ------------------------------

console.log("BharatVarshOfficial JS Part 3A Loaded");
// =========================================
// BharatVarshOfficial
// Part 3B
// Favorite + Download
// =========================================

// Favorite Buttons

const favoriteButtons =
  document.querySelectorAll(".favorite-btn");

favoriteButtons.forEach((button, index) => {
  
  // Check Local Storage
  
  if (localStorage.getItem("favorite" + index) === "true") {
    
    button.innerHTML = "❤️";
    
    button.classList.add("liked");
    
  }
  
  button.addEventListener("click", () => {
    
    button.classList.toggle("liked");
    
    if (button.classList.contains("liked")) {
      
      button.innerHTML = "❤️";
      
      localStorage.setItem("favorite" + index, true);
      
    }
    
    else {
      
      button.innerHTML = "🤍";
      
      localStorage.setItem("favorite" + index, false);
      
    }
    
  });
  
});


// Download Buttons

const downloadButtons =
  document.querySelectorAll(".download-btn");

downloadButtons.forEach((button) => {
  
  button.addEventListener("click", () => {
    
    const card = button.closest(".card");
    
    const image = card.querySelector("img");
    
    const link = document.createElement("a");
    
    link.href = image.src;
    
    link.download = image.src.split("/").pop();
    
    document.body.appendChild(link);
    
    link.click();
    
    document.body.removeChild(link);
    
  });
  
});

console.log("Part 3B Loaded Successfully");
/* ==========================================
   BharatVarshOfficial v2
   Part 3C - UI Enhancements
========================================== */

/* =========================
   BACK TO TOP BUTTON
========================= */

const topBtn = document.createElement("button");
topBtn.id = "topBtn";
topBtn.innerHTML = "↑";
document.body.appendChild(topBtn);

window.addEventListener("scroll", () => {
  if (window.scrollY > 300) {
    topBtn.style.display = "block";
  } else {
    topBtn.style.display = "none";
  }
});

topBtn.addEventListener("click", () => {
  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
});

/* =========================
   DARK / LIGHT MODE TOGGLE
========================= */

const themeToggle = document.createElement("button");
themeToggle.id = "themeToggle";
themeToggle.innerHTML = "🌙";
document.body.appendChild(themeToggle);

let darkMode = true;

themeToggle.addEventListener("click", () => {
  document.body.classList.toggle("light-mode");
  darkMode = !darkMode;
  
  themeToggle.innerHTML = darkMode ? "🌙" : "☀️";
});

/* Light Mode Styles (inject) */
const style = document.createElement("style");
style.innerHTML = `
.light-mode {
    background: #f5f5f5;
    color: #111;
}

.light-mode .card {
    background: #ffffff;
    color: #000;
}

.light-mode header {
    background: rgba(255,255,255,0.9);
}

.light-mode nav a {
    color: #111;
}
`;
document.head.appendChild(style);

/* =========================
   SCROLL REVEAL ANIMATION
========================= */

const revealElements = document.querySelectorAll(".card, .hero-text, .categories");

const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add("fade");
    }
  });
}, {
  threshold: 0.2
});

revealElements.forEach(el => observer.observe(el));

/* =========================
   MOBILE MENU (HAMBURGER)
========================= */

const header = document.querySelector("header");

const menuBtn = document.createElement("div");
menuBtn.classList.add("menu-btn");
menuBtn.innerHTML = "☰";
header.appendChild(menuBtn);

menuBtn.addEventListener("click", () => {
  document.querySelector("nav").classList.toggle("active");
});

/* =========================
   MOBILE MENU CSS (inject)
========================= */

const mobileCSS = document.createElement("style");
mobileCSS.innerHTML = `
.menu-btn{
    display:none;
    font-size:28px;
    cursor:pointer;
}

nav.active{
    display:flex !important;
    flex-direction:column;
    background:#111;
    position:absolute;
    top:80px;
    right:0;
    padding:20px;
    border-radius:12px;
}

@media(max-width:768px){
    .menu-btn{
        display:block;
    }

    nav{
        display:none;
    }
}
`;
document.head.appendChild(mobileCSS);

/* =========================
   PRELOADER
========================= */

const loader = document.createElement("div");
loader.id = "preloader";
loader.innerHTML = "Loading BharatVarshOfficial...";
document.body.appendChild(loader);

const loaderStyle = document.createElement("style");
loaderStyle.innerHTML = `
#preloader{
    position:fixed;
    inset:0;
    background:#0d1117;
    display:flex;
    justify-content:center;
    align-items:center;
    color:#fff;
    font-size:22px;
    z-index:9999;
}
`;
document.head.appendChild(loaderStyle);

window.addEventListener("load", () => {
  loader.style.display = "none";
});

console.log("BharatVarshOfficial - Part 3C Loaded");