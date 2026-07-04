// Firebase SDK
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";
import { signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";

// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyAWnWt1ye6c_W259Fv1jI_KupRk5wq4kGE",
  authDomain: "bharatvarshofficial-21a59.firebaseapp.com",
  projectId: "bharatvarshofficial-21a59",
  storageBucket: "bharatvarshofficial-21a59.firebasestorage.app",
  messagingSenderId: "182316736380",
  appId: "1:182316736380:web:a934fa35bd53c011b20ef9",
  measurementId: "G-QS2Y0V3CLE"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

const email = document.getElementById("email");
const password = document.getElementById("password");
const loginBtn = document.getElementById("loginBtn");

loginBtn.addEventListener("click", async () => {

  try {

    const userCredential = await signInWithEmailAndPassword(
        auth,
        email.value,
        password.value
    );

    alert("✅ Login Successful");

    window.location.href = "dashboard.html";

} catch (error) {

    alert("❌ " + error.message);

  }

});
console.log("✅ Firebase Connected Successfully");
