// ==========================================
// BharatVarshOfficial
// Secure Google Admin Login
// ==========================================

import {
    GoogleAuthProvider,
    onAuthStateChanged,
    signInWithPopup,
    signOut
} from "firebase/auth";

import {
    auth
} from "./firebase.js";

const ADMIN_UID =
    "hGrTepDbtsaCoSQL5D2bBG0iZzD2";

const DASHBOARD_URL =
    "./css/js/firebase/dashboard.html";

const googleAdminLogin =
    document.getElementById("googleAdminLogin");

const googleAdminLoginLabel =
    document.getElementById("googleAdminLoginLabel");

const statusMessage =
    document.getElementById("statusMessage");

const googleProvider =
    new GoogleAuthProvider();

googleProvider.setCustomParameters({
    prompt: "select_account"
});

let authenticationReady = false;

function showStatus(message, type) {
    statusMessage.textContent = message;
    statusMessage.classList.remove(
        "hidden",
        "status-success",
        "status-error"
    );
    statusMessage.classList.add(
        type === "success"
            ? "status-success"
            : "status-error"
    );
}

function openDashboard() {
    window.location.replace(DASHBOARD_URL);
}

onAuthStateChanged(auth, (user) => {
    authenticationReady = true;

    if (user?.uid === ADMIN_UID) {
        showStatus(
            "✅ Authorized admin detected. Opening dashboard…",
            "success"
        );
        openDashboard();
        return;
    }

    googleAdminLogin.disabled = false;

    if (user) {
        showStatus(
            "Choose the authorized administrator Google account to continue.",
            "error"
        );
    }
});

googleAdminLogin.addEventListener("click", async () => {
    if (!authenticationReady) {
        showStatus(
            "Please wait while Firebase Authentication starts.",
            "error"
        );
        return;
    }

    googleAdminLogin.disabled = true;
    googleAdminLoginLabel.textContent =
        "Checking account…";

    showStatus(
        "Select the authorized admin Google account.",
        "success"
    );

    try {
        const credential =
            await signInWithPopup(
                auth,
                googleProvider
            );

        if (credential.user.uid !== ADMIN_UID) {
            await signOut(auth);

            showStatus(
                "❌ Access denied. This Google account is not the authorized administrator.",
                "error"
            );
            return;
        }

        showStatus(
            "✅ Admin verified. Opening dashboard…",
            "success"
        );

        openDashboard();
    } catch (error) {
        console.error("Admin Google login error:", error);

        let message =
            "❌ Google sign-in failed. Please try again.";

        if (
            error.code === "auth/popup-closed-by-user" ||
            error.code === "auth/cancelled-popup-request"
        ) {
            message =
                "Google sign-in was cancelled.";
        } else if (
            error.code === "auth/popup-blocked"
        ) {
            message =
                "Allow pop-ups for this website and try again.";
        }

        showStatus(message, "error");
    } finally {
        googleAdminLogin.disabled = false;
        googleAdminLoginLabel.textContent =
            "Continue with Google";
    }
});
