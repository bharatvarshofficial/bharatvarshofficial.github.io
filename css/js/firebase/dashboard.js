// ==========================================
// BharatVarshOfficial
// Secure Admin Dashboard
// Firebase Authentication + Firestore
// ==========================================


// ==========================================
// FIREBASE SERVICES
// ==========================================

import {
    onAuthStateChanged,
    signOut
} from "firebase/auth";


import {
    collection,
    addDoc,
    deleteDoc,
    doc,
    getDocs,
    query,
    orderBy,
    limit,
    serverTimestamp,
    updateDoc
} from "firebase/firestore";

import {
    deleteObject,
    getDownloadURL,
    ref as storageRef,
    uploadBytes
} from "firebase/storage";

import {
    auth,
    db,
    storage
} from "../../../firebase.js";

import {
    CATEGORY_LABELS,
    canonicalizeCategory,
    getCategoryKey
} from "../../../categories.js";


// ==========================================
// ADMIN UID
// ==========================================

const ADMIN_UID =
    "hGrTepDbtsaCoSQL5D2bBG0iZzD2";

const ALLOWED_COLLECTIONS =
    new Set([
        "wallpapers",
        "images",
        "videos"
    ]);

const MAX_IMAGE_SIZE =
    25 * 1024 * 1024;

const MAX_VIDEO_SIZE =
    250 * 1024 * 1024;

// Firebase Storage requires billing for this project.
// Keep direct file selection disabled until Cloudinary is connected.
const DIRECT_FILE_UPLOAD_ENABLED = false;

const recentMediaByKey =
    new Map();

let editingMedia = null;

let previewObjectURL = null;


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

const cancelEditBtn =
    document.getElementById("cancelEditBtn");

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
// CANONICAL CATEGORY OPTIONS
// ==========================================

function populateCategoryOptions() {

    const currentValue =
        canonicalizeCategory(
            mediaCategory.value
        );


    mediaCategory.innerHTML = `
        <option value="">Select Category</option>
        ${CATEGORY_LABELS.map(
            (category) => `
                <option value="${escapeAttribute(category)}">
                    ${escapeHTML(category)}
                </option>
            `
        ).join("")}
    `;


    if (currentValue) {

        mediaCategory.value =
            currentValue;

    }

}


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
                "../../../admin.html"
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
                "../../../admin.html"
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
                "../../../admin.html"
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


    mediaFile.disabled =
        !DIRECT_FILE_UPLOAD_ENABLED;


    if (!DIRECT_FILE_UPLOAD_ENABLED) {

        mediaFile.accept = "";

        fileHelp.textContent =
            "Direct file upload is paused until Cloudinary is connected. Paste a public HTTPS media URL below.";

        return;

    }


    if (type === "videos") {

        mediaFile.accept =
            "video/mp4,video/webm,video/ogg";

        fileHelp.textContent =
            "Upload to Firebase Storage: MP4, WebM or OGG, maximum 250 MB.";

    } else {

        mediaFile.accept =
            "image/jpeg,image/png,image/webp";

        fileHelp.textContent =
            "Upload to Firebase Storage: JPG, PNG or WebP, maximum 25 MB.";

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


    if (previewObjectURL) {

        URL.revokeObjectURL(
            previewObjectURL
        );

    }


    const fileURL =
        URL.createObjectURL(file);


    previewObjectURL =
        fileURL;


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
// MEDIA VALIDATION + STORAGE
// ==========================================

function getMediaURL(media) {

    return media?.imageUrl ||
        media?.imageURL ||
        media?.videoUrl ||
        media?.url ||
        media?.downloadURL ||
        "";

}


function isValidPublicURL(value) {

    try {

        const parsedURL =
            new URL(value);

        return ["http:", "https:"].includes(
            parsedURL.protocol
        );

    } catch {

        return false;

    }

}


function validateMediaFile(file, type) {

    if (!file) return "";


    if (!DIRECT_FILE_UPLOAD_ENABLED) {

        return "Direct upload is not active. Use a public media URL.";

    }


    const isVideo =
        type === "videos";


    if (
        isVideo &&
        !file.type.startsWith("video/")
    ) {

        return "Please select a valid video file.";

    }


    if (
        !isVideo &&
        !file.type.startsWith("image/")
    ) {

        return "Please select a valid image file.";

    }


    const maximumSize =
        isVideo
            ? MAX_VIDEO_SIZE
            : MAX_IMAGE_SIZE;


    if (file.size > maximumSize) {

        return isVideo
            ? "Video must be 250 MB or smaller."
            : "Image must be 25 MB or smaller.";

    }


    return "";

}


function sanitizeStorageFilename(filename) {

    const extension =
        String(filename || "")
            .split(".")
            .pop()
            .toLowerCase()
            .replace(/[^a-z0-9]/g, "") ||
        "bin";

    const basename =
        String(filename || "media")
            .replace(/\.[^.]+$/, "")
            .normalize("NFKC")
            .replace(/[^a-zA-Z0-9\u0900-\u097f_-]+/g, "-")
            .replace(/-+/g, "-")
            .replace(/^-+|-+$/g, "")
            .slice(0, 80) ||
        "media";

    return `${basename}.${extension}`;

}


async function uploadMediaFile(
    file,
    type,
    user,
    categoryKey
) {

    const storagePath = [
        "media",
        type,
        user.uid,
        `${Date.now()}-${sanitizeStorageFilename(file.name)}`
    ].join("/");


    const fileReference =
        storageRef(
            storage,
            storagePath
        );


    await uploadBytes(
        fileReference,
        file,
        {
            contentType:
                file.type,

            customMetadata: {
                categoryKey
            }
        }
    );


    return {
        storagePath,
        url:
            await getDownloadURL(
                fileReference
            )
    };

}


function clearPreview() {

    if (previewObjectURL) {

        URL.revokeObjectURL(
            previewObjectURL
        );

        previewObjectURL = null;

    }


    imagePreview.removeAttribute("src");
    videoPreview.removeAttribute("src");

    imagePreview.classList.add("hidden");
    videoPreview.classList.add("hidden");
    previewContainer.classList.add("hidden");

}


function resetMediaForm() {

    editingMedia = null;

    mediaForm.reset();

    mediaType.disabled =
        false;

    cancelEditBtn?.classList.add(
        "hidden"
    );

    publishBtn.textContent =
        "🚀 Publish Media";

    clearPreview();
    updateFileSettings();

}


// ==========================================
// PUBLISH OR UPDATE MEDIA
// ==========================================

mediaForm.addEventListener(
    "submit",
    async (event) => {

        event.preventDefault();


        const user =
            auth.currentUser;


        if (!user) {

            showStatus(
                "❌ Please login first.",
                "error"
            );

            return;

        }


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
            canonicalizeCategory(
                mediaCategory.value
            );

        const categoryKey =
            getCategoryKey(category);

        const description =
            mediaDescription.value.trim();

        const enteredURL =
            mediaUrl.value.trim();

        const file =
            mediaFile.files[0];

        const existingURL =
            getMediaURL(editingMedia);


        if (!ALLOWED_COLLECTIONS.has(type)) {

            showStatus(
                "Invalid media type.",
                "error"
            );

            return;

        }


        if (!title) {

            showStatus(
                "Please enter a title.",
                "error"
            );

            return;

        }


        if (!category || !categoryKey) {

            showStatus(
                "Please select a category.",
                "error"
            );

            return;

        }


        if (
            enteredURL &&
            !isValidPublicURL(enteredURL)
        ) {

            showStatus(
                "Please enter a valid http/https media URL.",
                "error"
            );

            return;

        }


        const fileValidationError =
            validateMediaFile(
                file,
                type
            );


        if (fileValidationError) {

            showStatus(
                fileValidationError,
                "error"
            );

            return;

        }


        if (
            !file &&
            !enteredURL &&
            !existingURL
        ) {

            showStatus(
                "Choose a file or enter a public media URL.",
                "error"
            );

            return;

        }


        let newlyUploadedStoragePath =
            "";


        try {

            publishBtn.disabled =
                true;

            publishBtn.textContent =
                editingMedia
                    ? "Updating..."
                    : "Publishing...";


            let finalURL =
                enteredURL ||
                existingURL;

            let finalStoragePath =
                editingMedia?.storagePath ||
                "";

            let mediaSource =
                editingMedia?.source ||
                (finalStoragePath
                    ? "firebase-storage"
                    : "external-url");


            if (file) {

                showStatus(
                    "Uploading media to Firebase Storage...",
                    "success"
                );


                const uploadResult =
                    await uploadMediaFile(
                        file,
                        type,
                        user,
                        categoryKey
                    );


                finalURL =
                    uploadResult.url;

                finalStoragePath =
                    uploadResult.storagePath;

                newlyUploadedStoragePath =
                    uploadResult.storagePath;

                mediaSource =
                    "firebase-storage";

            } else if (
                enteredURL &&
                enteredURL !== existingURL
            ) {

                finalStoragePath =
                    "";

                mediaSource =
                    "external-url";

            }


            const mediaData = {
                title,
                category,
                categoryKey,
                description,
                trending:
                    trending.checked,
                featured:
                    featured.checked,
                storagePath:
                    finalStoragePath,
                source:
                    mediaSource,
                updatedAt:
                    serverTimestamp()
            };


            if (
                type === "wallpapers" ||
                type === "images"
            ) {

                mediaData.imageUrl =
                    finalURL;

            } else {

                mediaData.videoUrl =
                    finalURL;

            }


            const previousStoragePath =
                editingMedia?.storagePath ||
                "";


            if (editingMedia) {

                await updateDoc(
                    doc(
                        db,
                        type,
                        editingMedia.id
                    ),
                    mediaData
                );

            } else {

                const docRef =
                    await addDoc(
                        collection(
                            db,
                            type
                        ),
                        {
                            ...mediaData,
                            createdAt:
                                serverTimestamp(),
                            createdBy:
                                user.uid,
                            downloads:
                                0,
                            favorites:
                                0
                        }
                    );


                console.log(
                    "✅ Published:",
                    docRef.id
                );

            }


            if (
                previousStoragePath &&
                previousStoragePath !==
                    finalStoragePath
            ) {

                deleteObject(
                    storageRef(
                        storage,
                        previousStoragePath
                    )
                ).catch(
                    (error) => console.warn(
                        "Old Storage object cleanup failed:",
                        error
                    )
                );

            }


            showStatus(
                editingMedia
                    ? "✅ Media updated successfully!"
                    : "✅ Media published successfully!",
                "success"
            );


            resetMediaForm();

            await loadDashboard();


        } catch (error) {

            if (newlyUploadedStoragePath) {

                deleteObject(
                    storageRef(
                        storage,
                        newlyUploadedStoragePath
                    )
                ).catch(
                    (cleanupError) => console.warn(
                        "Failed upload cleanup error:",
                        cleanupError
                    )
                );

            }

            console.error(
                "Media save error:",
                error
            );


            showStatus(
                "❌ " + error.message,
                "error"
            );

        } finally {

            publishBtn.disabled =
                false;

            publishBtn.textContent =
                editingMedia
                    ? "💾 Update Media"
                    : "🚀 Publish Media";

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


    recentMediaByKey.clear();


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

            let snapshot;


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


                snapshot =
                    await getDocs(
                        mediaQuery
                    );

            } catch (queryError) {

                console.warn(
                    `Ordered ${collectionName} query failed; using fallback:`,
                    queryError
                );


                snapshot =
                    await getDocs(
                        collection(
                            db,
                            collectionName
                        )
                    );

            }


            snapshot.forEach(
                (doc) => {

                    const data =
                        doc.data();


                    allMedia.push({

                        id:
                            doc.id,

                        type:
                            collectionName,

                        ...data,

                        category:
                            canonicalizeCategory(
                                data.category ||
                                data.categoryKey
                            )

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


    latest.forEach(
        (media) => {

            recentMediaByKey.set(
                `${media.type}:${media.id}`,
                media
            );

        }
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


    const mediaKey =
        `${media.type}:${media.id}`;


    let mediaElement =
        "";


    if (
        media.type ===
        "videos"
    ) {

        mediaElement = `
            <video
                src="${escapeAttribute(
                    getMediaURL(media)
                )}"
                controls
                preload="metadata"
            ></video>
        `;

    } else {

        mediaElement = `
            <img
                src="${escapeAttribute(
                    getMediaURL(media)
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

            <div class="media-actions">

                <button
                    type="button"
                    class="media-action edit-action"
                    data-media-action="edit"
                    data-media-key="${escapeAttribute(mediaKey)}"
                >
                    ✏️ Edit
                </button>

                <button
                    type="button"
                    class="media-action delete-action"
                    data-media-action="delete"
                    data-media-key="${escapeAttribute(mediaKey)}"
                >
                    🗑️ Delete
                </button>

            </div>

        </div>

    `;


    return card;

}


// ==========================================
// EDIT + DELETE MEDIA
// ==========================================

function startEditingMedia(media) {

    if (!media || !ALLOWED_COLLECTIONS.has(media.type)) {

        showStatus(
            "Invalid media record.",
            "error"
        );

        return;

    }


    editingMedia =
        { ...media };

    mediaType.value =
        media.type;

    mediaType.disabled =
        true;

    updateFileSettings();

    mediaTitle.value =
        media.title || "";

    mediaCategory.value =
        canonicalizeCategory(
            media.category ||
            media.categoryKey
        );

    mediaDescription.value =
        media.description || "";

    mediaUrl.value =
        getMediaURL(media);

    trending.checked =
        Boolean(media.trending);

    featured.checked =
        Boolean(media.featured);

    publishBtn.textContent =
        "💾 Update Media";

    cancelEditBtn?.classList.remove(
        "hidden"
    );


    const existingURL =
        getMediaURL(media);


    if (existingURL) {

        previewContainer.classList.remove(
            "hidden"
        );


        if (media.type === "videos") {

            videoPreview.src =
                existingURL;

            videoPreview.classList.remove(
                "hidden"
            );

            imagePreview.classList.add(
                "hidden"
            );

        } else {

            imagePreview.src =
                existingURL;

            imagePreview.classList.remove(
                "hidden"
            );

            videoPreview.classList.add(
                "hidden"
            );

        }

    }


    mediaForm.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });


    showStatus(
        "Editing media. Save changes with Update Media.",
        "success"
    );

}


async function deleteMedia(media) {

    const user =
        auth.currentUser;


    if (
        !user ||
        user.uid !== ADMIN_UID
    ) {

        showStatus(
            "❌ Unauthorized admin.",
            "error"
        );

        return;

    }


    if (
        !media ||
        !ALLOWED_COLLECTIONS.has(media.type)
    ) {

        showStatus(
            "Invalid media record.",
            "error"
        );

        return;

    }


    const confirmed =
        window.confirm(
            `Delete “${media.title || "Untitled"}”? This cannot be undone.`
        );


    if (!confirmed) return;


    showStatus(
        "Deleting media...",
        "success"
    );


    await deleteDoc(
        doc(
            db,
            media.type,
            media.id
        )
    );


    if (media.storagePath) {

        try {

            await deleteObject(
                storageRef(
                    storage,
                    media.storagePath
                )
            );

        } catch (error) {

            console.warn(
                "Storage object cleanup failed:",
                error
            );

        }

    }


    if (
        editingMedia?.id === media.id &&
        editingMedia?.type === media.type
    ) {

        resetMediaForm();

    }


    showStatus(
        "✅ Media deleted successfully.",
        "success"
    );


    await loadDashboard();

}


recentMedia.addEventListener(
    "click",
    async (event) => {

        const button =
            event.target.closest(
                "[data-media-action]"
            );


        if (!button) return;


        const media =
            recentMediaByKey.get(
                button.dataset.mediaKey
            );


        if (!media) {

            showStatus(
                "Media record could not be found. Refresh the dashboard.",
                "error"
            );

            return;

        }


        if (
            button.dataset.mediaAction ===
            "edit"
        ) {

            startEditingMedia(media);

            return;

        }


        if (
            button.dataset.mediaAction ===
            "delete"
        ) {

            button.disabled =
                true;


            try {

                await deleteMedia(media);

            } catch (error) {

                console.error(
                    "Delete media error:",
                    error
                );


                showStatus(
                    "❌ " + error.message,
                    "error"
                );

            } finally {

                button.disabled =
                    false;

            }

        }

    }
);


cancelEditBtn?.addEventListener(
    "click",
    resetMediaForm
);


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

populateCategoryOptions();
updateFileSettings();


console.log(
    "🚀 Secure Admin Dashboard Ready"
);
