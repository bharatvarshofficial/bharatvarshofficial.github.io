// ==========================================
// BharatVarshOfficial
// Admin Login
// Firebase Authentication
// ==========================================


// ==========================================
// FIREBASE IMPORTS
// ==========================================

import {
    initializeApp
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";


import {
    getAuth,
    signInWithEmailAndPassword,
    sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";


// ==========================================
// FIREBASE CONFIGURATION
// ==========================================

const firebaseConfig = {

    apiKey:
        "AIzaSyAWnWt1ye6c_W259Fv1jI_KupRk5wq4kGE",

    authDomain:
        "bharatvarshofficial-21a59.firebaseapp.com",

    projectId:
        "bharatvarshofficial-21a59",

    storageBucket:
        "bharatvarshofficial-21a59.firebasestorage.app",

    messagingSenderId:
        "182316736380",

    appId:
        "1:182316736380:web:a934fa35bd53c011b20ef9",

    measurementId:
        "G-QS2Y0V3CLE"
};


// ==========================================
// INITIALIZE FIREBASE
// ==========================================

const app =
    initializeApp(firebaseConfig);


const auth =
    getAuth(app);


console.log(
    "✅ Firebase Connected Successfully"
);


// ==========================================
// DOM ELEMENTS
// ==========================================

const email =
    document.getElementById("email");


const password =
    document.getElementById("password");


const loginBtn =
    document.getElementById("loginBtn");


const forgotPassword =
    document.getElementById("forgotPassword");


const togglePassword =
    document.getElementById("togglePassword");


const statusMessage =
    document.getElementById("statusMessage");


// ==========================================
// SHOW STATUS
// ==========================================

function showStatus(
    message,
    type
) {

    statusMessage.textContent =
        message;


    statusMessage.classList.remove(
        "hidden",
        "status-success",
        "status-error"
    );


    if (type === "success") {

        statusMessage.classList.add(
            "status-success"
        );

    } else {

        statusMessage.classList.add(
            "status-error"
        );

    }

}


// ==========================================
// PASSWORD VISIBILITY
// ==========================================

togglePassword.addEventListener(
    "click",
    () => {

        if (
            password.type ===
            "password"
        ) {

            password.type =
                "text";

            togglePassword.textContent =
                "🙈";

            togglePassword.setAttribute(
                "aria-label",
                "Hide password"
            );

        } else {

            password.type =
                "password";

            togglePassword.textContent =
                "👁️";

            togglePassword.setAttribute(
                "aria-label",
                "Show password"
            );

        }

    }
);


// ==========================================
// LOGIN
// ==========================================

loginBtn.addEventListener(
    "click",
    async () => {

        const userEmail =
            email.value.trim();


        const userPassword =
            password.value;


        // ----------------------------------
        // Validation
        // ----------------------------------

        if (!userEmail) {

            showStatus(
                "⚠️ Please enter your admin email.",
                "error"
            );

            email.focus();

            return;
        }


        if (!userPassword) {

            showStatus(
                "⚠️ Please enter your password.",
                "error"
            );

            password.focus();

            return;
        }


        try {

            loginBtn.disabled =
                true;

            loginBtn.textContent =
                "Logging in...";


            showStatus(
                "Checking your credentials...",
                "success"
            );


            // ----------------------------------
            // Firebase Login
            // ----------------------------------

            const userCredential =
                await signInWithEmailAndPassword(
                    auth,
                    userEmail,
                    userPassword
                );


            const user =
                userCredential.user;


            console.log(
                "✅ Login successful:",
                user.uid
            );


            showStatus(
                "✅ Login successful. Opening dashboard...",
                "success"
            );


            // ----------------------------------
            // Dashboard
            // ----------------------------------

            setTimeout(
                () => {

                    window.location.href =
                        "dashboard.html";

                },
                700
            );


        } catch (error) {

            console.error(
                "Login error:",
                error
            );


            let message =
                "❌ Login failed.";


            if (
                error.code ===
                "auth/invalid-credential"
            ) {

                message =
                    "❌ Email किंवा password चुकीचा आहे.";

            }

            else if (
                error.code ===
                "auth/user-not-found"
            ) {

                message =
                    "❌ हा email Firebase Authentication मध्ये registered नाही.";

            }

            else if (
                error.code ===
                "auth/wrong-password"
            ) {

                message =
                    "❌ Password चुकीचा आहे.";

            }

            else if (
                error.code ===
                "auth/too-many-requests"
            ) {

                message =
                    "⚠️ खूप login attempts झाले. थोड्या वेळाने पुन्हा प्रयत्न करा.";

            }

            else {

                message =
                    "❌ " + error.message;

            }


            showStatus(
                message,
                "error"
            );


        } finally {

            loginBtn.disabled =
                false;

            loginBtn.textContent =
                "🔐 Login";

        }

    }
);


// ==========================================
// FORGOT PASSWORD
// ==========================================

forgotPassword.addEventListener(
    "click",
    async () => {

        const userEmail =
            email.value.trim();


        if (!userEmail) {

            showStatus(
                "⚠️ आधी Admin Email टाका.",
                "error"
            );

            email.focus();

            return;
        }


        try {

            forgotPassword.disabled =
                true;

            forgotPassword.textContent =
                "Sending...";


            await sendPasswordResetEmail(
                auth,
                userEmail
            );


            showStatus(
                "✅ Password reset email पाठवला आहे. तुमचा email inbox तपासा.",
                "success"
            );


        } catch (error) {

            console.error(
                "Password reset error:",
                error
            );


            let message =
                "❌ Password reset failed.";


            if (
                error.code ===
                "auth/user-not-found"
            ) {

                message =
                    "❌ हा email Firebase Authentication मध्ये registered नाही.";

            }

            else if (
                error.code ===
                "auth/invalid-email"
            ) {

                message =
                    "❌ Email address चुकीचा आहे.";

            }

            else {

                message =
                    "❌ " + error.message;

            }


            showStatus(
                message,
                "error"
            );


        } finally {

            forgotPassword.disabled =
                false;

            forgotPassword.textContent =
                "Forgot Password?";

        }

    }
);


// ==========================================
// ENTER KEY LOGIN
// ==========================================

password.addEventListener(
    "keydown",
    (event) => {

        if (
            event.key ===
            "Enter"
        ) {

            loginBtn.click();

        }

    }
);