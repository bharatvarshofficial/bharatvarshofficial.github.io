// ==========================================
// BharatVarshOfficial
// Firebase Configuration & Services
// ==========================================

import { initializeApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import {
    getAuth,
    GoogleAuthProvider
} from "firebase/auth";


// ==========================================
// FIREBASE CONFIGURATION
// ==========================================

const firebaseConfig = {
    apiKey: "AIzaSyAWnWt1ye6c_W259Fv1jI_KupRk5wq4kGE",
    authDomain: "bharatvarshofficial-21a59.firebaseapp.com",
    projectId: "bharatvarshofficial-21a59",
    storageBucket: "bharatvarshofficial-21a59.firebasestorage.app",
    messagingSenderId: "182316736380",
    appId: "1:182316736380:web:a934fa35bd53c011b20ef9",
    measurementId: "G-QS2Y0V3CLE"
};


// ==========================================
// INITIALIZE FIREBASE
// ==========================================

const app = initializeApp(firebaseConfig);


// ==========================================
// FIRESTORE
// ==========================================

const db = getFirestore(app);


// ==========================================
// FIREBASE STORAGE
// ==========================================

const storage = getStorage(app);


// ==========================================
// FIREBASE AUTHENTICATION
// ==========================================

const auth = getAuth(app);


// ==========================================
// GOOGLE AUTH PROVIDER
// ==========================================

const googleProvider = new GoogleAuthProvider();


// ==========================================
// FIREBASE ANALYTICS
// ==========================================

// Analytics is optional.
// This prevents problems in environments
// where Analytics is not supported.

let analytics = null;

isSupported()
    .then((supported) => {

        if (supported) {

            analytics = getAnalytics(app);

            console.log(
                "Firebase Analytics initialized."
            );

        } else {

            console.log(
                "Firebase Analytics is not supported."
            );

        }

    })
    .catch((error) => {

        console.warn(
            "Firebase Analytics could not initialize:",
            error
        );

    });


// ==========================================
// EXPORT FIREBASE SERVICES
// ==========================================

export {
    app,
    db,
    storage,
    auth,
    googleProvider,
    analytics
};
