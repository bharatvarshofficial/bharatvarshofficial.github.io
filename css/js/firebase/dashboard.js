// ==========================================
// BharatVarshOfficial
// Secure Admin Dashboard
// Firebase Authentication + Firestore
// ==========================================


// ==========================================
// FIREBASE IMPORTS
// ==========================================

import {
    initializeApp
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";


import {
    getAuth,
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";


import {
    getFirestore,
    collection,
    addDoc,
    getDocs,
    query,
    orderBy,
    limit,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";


// ==========================================
// ADMIN UID
// ==========================================

const ADMIN_UID =
    "hGrTepDbtsaCoSQL5D2bBG0iZzD2";


// ==========================================
// FIREBASE CONFIG
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

const db =
    getFirestore(app);


console.log(
    "✅ Dashboard Firebase Connected"
);


// ==========================================
// DOM ELEMENTS
// ==========================================

const adminEmail =
    document.getElementById("adminEmail");

const logoutBtn =
    document.getElementById("logoutBtn");

const mediaForm =
    document.getElementById("mediaForm");

const mediaType =
    document.getElementById("mediaType");

const mediaFile =
    document.getElementById("mediaFile");

const fileHelp =
    document.getElementById("fileHelp");

const mediaTitle =
    document.getElementById("mediaTitle");

const mediaCategory =
    document.getElementById("mediaCategory");

const mediaDescription =
    document.getElementById("mediaDescription");

const mediaUrl =
    document.getElementById("mediaUrl");

const trending =
    document.getElementById("trending");

const featured =
    document.getElementById("featured");

const publishBtn =
    document.getElementById("publishBtn");

const statusMessage =
    document.getElementById("statusMessage");

const previewContainer =
    document.getElementById("previewContainer");

const imagePreview =
    document.getElementById("imagePreview");

const videoPreview =
    document.getElementById("videoPreview");

const recentMedia =
    document.getElementById("recentMedia");

const wallpaperCount =
    document.getElementById("wallpaperCount");

const imageCount =
    document.getElementById("imageCount");

const videoCount =
    document.getElementById("videoCount");


// ==========================================
// ADMIN AUTHENTICATION CHECK
// ==========================================

onAuthStateChanged(
    auth,
    async (user) => {

        // ----------------------------------
        // Not logged in
        // ----------------------------------

        if (!user) {

            console.log(
                "❌ No authenticated user"
            );

            window.location.replace(
                "./admin.html"
            );

            return;
        }


        console.log(
            "🔐 Authenticated UID:",
            user.uid
        );


        // ----------------------------------
        // Admin UID verification
        // ----------------------------------

        if (user.uid !== ADMIN_UID) {

            console.error(
                "❌ Unauthorized user attempted dashboard access"
            );


            await signOut(auth);


            alert(
                "❌ Access Denied\n\nOnly the BharatVarshOfficial Admin can access this dashboard."
            );


            window.location.replace(
                "./admin.html"
            );


            return;
        }


        // ----------------------------------
        // Admin verified
        // ----------------------------------

        console.log(
            "✅ Admin verified"
        );


        adminEmail.textContent =
            user.email || "Admin";


        await loadDashboard();

    }
);


// ==========================================
// LOGOUT
// ==========================================

logoutBtn.addEventListener(
    "click",
    async () => {

        try {

            logoutBtn.disabled =
                true;

            logoutBtn.textContent =
                "Logging out...";


            await signOut(auth);


            window.location.replace(
                "./admin.html"
            );


        } catch (error) {

            console.error(
                "Logout error:",
                error
            );


            alert(
                "❌ Logout failed."
            );


            logoutBtn.disabled =
                false;

            logoutBtn.textContent =
                "Logout";

        }

    }
);


// ==========================================
// MEDIA TYPE
// ==========================================

mediaType.addEventListener(
    "change",
    updateFileSettings
);


function updateFileSettings() {

    const type =
        mediaType.value;


    mediaFile.value =
        "";


    previewContainer.classList.add(
        "hidden"
    );


    imagePreview.classList.add(
        "hidden"
    );


    videoPreview.classList.add(
        "hidden"
    );


    if (type === "videos") {

        mediaFile.accept =
            "video/mp4,video/webm,video/ogg";

        fileHelp.textContent =
            "Supported video formats: MP4, WebM, OGG";

    } else {

        mediaFile.accept =
            "image/jpeg,image/png,image/webp";

        fileHelp.textContent =
            "Supported image formats: JPG, PNG, WebP";

    }

}


// ==========================================
// FILE PREVIEW
// ==========================================

mediaFile.addEventListener(
    "change",
    previewSelectedFile
);


function previewSelectedFile() {

    const file =
        mediaFile.files[0];


    if (!file) {

        previewContainer.classList.add(
            "hidden"
        );

        return;
    }


    const fileURL =
        URL.createObjectURL(file);


    previewContainer.classList.remove(
        "hidden"
    );


    if (file.type.startsWith("image/")) {

        imagePreview.src =
            fileURL;

        imagePreview.classList.remove(
            "hidden"
        );

        videoPreview.classList.add(
            "hidden"
        );

    }

    else if (file.type.startsWith("video/")) {

        videoPreview.src =
            fileURL;

        videoPreview.classList.remove(
            "hidden"
        );

        imagePreview.classList.add(
            "hidden"
        );

    }

}


// ==========================================
// PUBLISH MEDIA
// ==========================================

mediaForm.addEventListener(
    "submit",
    async (event) => {

        event.preventDefault();


        const user =
            auth.currentUser;


        // ----------------------------------
        // Authentication
        // ----------------------------------

        if (!user) {

            showStatus(
                "❌ Please login first.",
                "error"
            );

            return;
        }


        // ----------------------------------
        // Admin verification
        // ----------------------------------

        if (user.uid !== ADMIN_UID) {

            showStatus(
                "❌ Unauthorized admin.",
                "error"
            );

            return;
        }


        const type =
            mediaType.value;

        const title =
            mediaTitle.value.trim();

        const category =
            mediaCategory.value;

        const description =
            mediaDescription.value.trim();

        const url =
            mediaUrl.value.trim();

        const file =
            mediaFile.files[0];


        // ----------------------------------
        // Validation
        // ----------------------------------

        if (!title) {

            showStatus(
                "Please enter a title.",
                "error"
            );

            return;
        }


        if (!category) {

            showStatus(
                "Please select a category.",
                "error"
            );

            return;
        }


        if (!url) {

            showStatus(
                "Please enter the media URL.",
                "error"
            );

            return;
        }


        if (!file) {

            showStatus(
                "Please select a file.",
                "error"
            );

            return;
        }


        if (
            type === "videos" &&
            !file.type.startsWith("video/")
        ) {

            showStatus(
                "Please select a valid video file.",
                "error"
            );

            return;
        }


        if (
            type !== "videos" &&
            !file.type.startsWith("image/")
        ) {

            showStatus(
                "Please select a valid image file.",
                "error"
            );

            return;
        }


        try {

            publishBtn.disabled =
                true;

            publishBtn.textContent =
                "Publishing...";


            showStatus(
                "Saving media to Firestore...",
                "success"
            );


            // ----------------------------------
            // Base data
            // ----------------------------------

            const mediaData = {

                title,

                category,

                description,

                trending:
                    trending.checked,

                featured:
                    featured.checked,

                createdAt:
                    serverTimestamp(),

                createdBy:
                    user.uid,

                createdByEmail:
                    user.email || "",

                downloads:
                    0,

                favorites:
                    0

            };


            // ----------------------------------
            // Media URL
            // ----------------------------------

            if (
                type === "wallpapers" ||
                type === "images"
            ) {

                mediaData.imageUrl =
                    url;

            }


            if (type === "videos") {

                mediaData.videoUrl =
                    url;

            }


            // ----------------------------------
            // Firestore
            // ----------------------------------

            const docRef =
                await addDoc(
                    collection(
                        db,
                        type
                    ),
                    mediaData
                );


            console.log(
                "✅ Published:",
                docRef.id
            );


            showStatus(
                "✅ Media published successfully!",
                "success"
            );


            // ----------------------------------
            // Reset
            // ----------------------------------

            mediaForm.reset();

            updateFileSettings();


            previewContainer.classList.add(
                "hidden"
            );


            await loadDashboard();


        } catch (error) {

            console.error(
                "Publish error:",
                error
            );


            showStatus(
                "❌ " + error.message,
                "error"
            );

        }


        finally {

            publishBtn.disabled =
                false;

            publishBtn.textContent =
                "🚀 Publish Media";

        }

    }
);


// ==========================================
// LOAD DASHBOARD
// ==========================================

async function loadDashboard() {

    await loadCounts();

    await loadRecentMedia();

}


// ==========================================
// LOAD COUNTS
// ==========================================

async function loadCounts() {

    const collections = [
        "wallpapers",
        "images",
        "videos"
    ];


    for (
        const collectionName
        of collections
    ) {

        try {

            const snapshot =
                await getDocs(
                    collection(
                        db,
                        collectionName
                    )
                );


            if (
                collectionName ===
                "wallpapers"
            ) {

                wallpaperCount.textContent =
                    snapshot.size;

            }


            if (
                collectionName ===
                "images"
            ) {

                imageCount.textContent =
                    snapshot.size;

            }


            if (
                collectionName ===
                "videos"
            ) {

                videoCount.textContent =
                    snapshot.size;

            }

        } catch (error) {

            console.error(
                `Error loading ${collectionName}:`,
                error
            );

        }

    }

}


// ==========================================
// LOAD RECENT MEDIA
// ==========================================

async function loadRecentMedia() {

    recentMedia.innerHTML =
        '<div class="empty-state">Loading...</div>';


    const allMedia = [];


    const collections = [
        "wallpapers",
        "images",
        "videos"
    ];


    for (
        const collectionName
        of collections
    ) {

        try {

            const mediaQuery =
                query(
                    collection(
                        db,
                        collectionName
                    ),

                    orderBy(
                        "createdAt",
                        "desc"
                    ),

                    limit(10)
                );


            const snapshot =
                await getDocs(
                    mediaQuery
                );


            snapshot.forEach(
                (doc) => {

                    allMedia.push({

                        id:
                            doc.id,

                        type:
                            collectionName,

                        ...doc.data()

                    });

                }
            );


        } catch (error) {

            console.warn(
                `Could not load ${collectionName}:`,
                error
            );

        }

    }


    allMedia.sort(
        (a, b) => {

            const aTime =
                a.createdAt?.seconds || 0;

            const bTime =
                b.createdAt?.seconds || 0;

            return bTime - aTime;

        }
    );


    const latest =
        allMedia.slice(
            0,
            12
        );


    if (!latest.length) {

        recentMedia.innerHTML = `
            <div class="empty-state">
                No media found yet.
            </div>
        `;

        return;
    }


    recentMedia.innerHTML =
        "";


    latest.forEach(
        (media) => {

            recentMedia.appendChild(
                createMediaCard(media)
            );

        }
    );

}


// ==========================================
// CREATE MEDIA CARD
// ==========================================

function createMediaCard(media) {

    const card =
        document.createElement("div");


    card.className =
        "media-card";


    let mediaElement =
        "";


    if (
        media.type ===
        "videos"
    ) {

        mediaElement = `
            <video
                src="${escapeAttribute(
                    media.videoUrl || ""
                )}"
                controls
                preload="metadata"
            ></video>
        `;

    } else {

        mediaElement = `
            <img
                src="${escapeAttribute(
                    media.imageUrl || ""
                )}"
                alt="${escapeAttribute(
                    media.title || "Media"
                )}"
                loading="lazy"
            >
        `;

    }


    card.innerHTML = `

        ${mediaElement}

        <div class="media-info">

            <h3>
                ${escapeHTML(
                    media.title ||
                    "Untitled"
                )}
            </h3>

            <p>
                📂
                ${escapeHTML(
                    media.category ||
                    "Other"
                )}
            </p>

            <div class="media-badges">

                <span class="badge">
                    ${getMediaLabel(
                        media.type
                    )}
                </span>

                ${
                    media.trending
                    ? `
                        <span class="badge trending">
                            🔥 Trending
                        </span>
                    `
                    : ""
                }

                ${
                    media.featured
                    ? `
                        <span class="badge featured">
                            ⭐ Featured
                        </span>
                    `
                    : ""
                }

            </div>

        </div>

    `;


    return card;

}


// ==========================================
// MEDIA LABEL
// ==========================================

function getMediaLabel(type) {

    if (
        type ===
        "wallpapers"
    ) {

        return "🖼️ Wallpaper";

    }


    if (
        type ===
        "images"
    ) {

        return "📷 Image";

    }


    if (
        type ===
        "videos"
    ) {

        return "🎬 Video";

    }


    return "Media";

}


// ==========================================
// STATUS
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


    statusMessage.classList.add(
        type === "success"
            ? "status-success"
            : "status-error"
    );


    setTimeout(
        () => {

            statusMessage.classList.add(
                "hidden"
            );

        },
        5000
    );

}


// ==========================================
// SECURITY HELPERS
// ==========================================

function escapeHTML(value) {

    return String(value)

        .replaceAll(
            "&",
            "&amp;"
        )

        .replaceAll(
            "<",
            "&lt;"
        )

        .replaceAll(
            ">",
            "&gt;"
        )

        .replaceAll(
            '"',
            "&quot;"
        )

        .replaceAll(
            "'",
            "&#039;"
        );

}


function escapeAttribute(value) {

    return escapeHTML(value);

}


// ==========================================
// INITIAL SETTINGS
// ==========================================

updateFileSettings();


console.log(
    "🚀 Secure Admin Dashboard Ready"
);