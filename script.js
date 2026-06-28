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
