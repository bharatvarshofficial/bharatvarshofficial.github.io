/* ==========================================
   BharatVarshOfficial V3
   Premium Script - Part 3A
========================================== */

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
        
        card.style.display = "block";
        
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
  
  if (localStorage.getItem(key) === "true") {
    
    btn.innerHTML = "❤️";
    
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
/* ==========================================
   DARK MODE
========================================== */

const darkModeBtn = document.getElementById("darkMode");

if (darkModeBtn) {
  
  darkModeBtn.addEventListener("click", () => {
    
    document.body.classList.toggle("light-mode");
    
    localStorage.setItem(
      "theme",
      document.body.classList.contains("light-mode") ?
      "light" :
      "dark"
    );
    
  });
  
}

if (localStorage.getItem("theme") === "light") {
  
  document.body.classList.add("light-mode");
  
}

/* ==========================================
   BACK TO TOP
========================================== */

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

/* ==========================================
   MOBILE MENU
========================================== */

const menuBtn = document.getElementById("menuBtn");

const navbar = document.querySelector(".navbar");

if (menuBtn && navbar) {
  
  menuBtn.addEventListener("click", () => {
    
    navbar.classList.toggle("show");
    
  });
  
}

/* ==========================================
   SCROLL ANIMATION
========================================== */

const observer = new IntersectionObserver(entries => {
  
  entries.forEach(entry => {
    
    if (entry.isIntersecting) {
      
      entry.target.classList.add("show-card");
      
    }
    
  });
  
});

document.querySelectorAll(".card").forEach(card => {
  
  observer.observe(card);
  
});

/* ==========================================
   LOADING ANIMATION
========================================== */

window.addEventListener("load", () => {
  
  const loader = document.getElementById("loader");
  
  if (loader) {
    
    loader.style.opacity = "0";
    
    setTimeout(() => {
      
      loader.style.display = "none";
      
    }, 500);
    
  }
  
});
