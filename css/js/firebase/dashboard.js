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
    getCountFromServer,
    getDoc,
    getDocs,
    query,
    orderBy,
    limit,
    serverTimestamp,
    updateDoc,
    writeBatch
} from "firebase/firestore";

import {
    deleteObject,
    ref as storageRef
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

import {
    isCloudinaryConfigured,
    loadCloudinaryConfig,
    saveCloudinaryConfig,
    uploadToCloudinary,
    validateCloudinaryFile
} from "../../../cloudinary-uploader.js";


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

const recentMediaByKey =
    new Map();

let cloudinaryConfig =
    loadCloudinaryConfig();

let editingMedia = null;

let previewObjectURL = null;

let statusMessageTimeout = null;


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

const cloudinaryCloudName =
    document.getElementById("cloudinaryCloudName");

const cloudinaryUploadPreset =
    document.getElementById("cloudinaryUploadPreset");

const cloudinarySaveBtn =
    document.getElementById("cloudinarySaveBtn");

const cloudinaryStatus =
    document.getElementById("cloudinaryStatus");

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

const creatorApplicationCount =
    document.getElementById(
        "creatorApplicationCount"
    );

const creatorApplicationsList =
    document.getElementById(
        "creatorApplicationsList"
    );


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
// CLOUDINARY CONNECTION
// ==========================================

function renderCloudinaryConnection() {
    const connected =
        isCloudinaryConfigured(
            cloudinaryConfig
        );

    cloudinaryCloudName.value =
        cloudinaryConfig.cloudName;

    cloudinaryUploadPreset.value =
        cloudinaryConfig.uploadPreset;

    cloudinaryStatus.textContent =
        connected
            ? "Connected"
            : "Not connected";

    cloudinaryStatus.classList.toggle(
        "connection-on",
        connected
    );

    cloudinaryStatus.classList.toggle(
        "connection-off",
        !connected
    );
}


cloudinarySaveBtn?.addEventListener(
    "click",
    () => {
        try {
            cloudinaryConfig =
                saveCloudinaryConfig({
                    cloudName:
                        cloudinaryCloudName.value,
                    uploadPreset:
                        cloudinaryUploadPreset.value
                });

            renderCloudinaryConnection();
            updateFileSettings();

            showStatus(
                "✅ Cloudinary connection saved. Direct upload is ready.",
                "success"
            );
        } catch (error) {
            showStatus(
                "❌ " + error.message,
                "error"
            );
        }
    }
);


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

    const directUploadReady =
        isCloudinaryConfigured(
            cloudinaryConfig
        );


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
        !directUploadReady;


    if (!directUploadReady) {

        mediaFile.accept = "";

        fileHelp.textContent =
            "Save your Cloudinary cloud name and unsigned upload preset above to enable direct upload. You can still paste a public HTTPS media URL below.";

        return;

    }


    if (type === "videos") {

        mediaFile.accept =
            "video/mp4,video/webm,video/ogg";

        fileHelp.textContent =
            "Upload to Cloudinary: MP4, WebM or OGG, maximum 100 MB.";

    } else {

        mediaFile.accept =
            "image/jpeg,image/png,image/webp";

        fileHelp.textContent =
            "Upload to Cloudinary: JPG, PNG or WebP, maximum 25 MB.";

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


    if (
        !isCloudinaryConfigured(
            cloudinaryConfig
        )
    ) {

        return "Connect Cloudinary above or use a public media URL.";

    }


    return validateCloudinaryFile(
        file,
        type
    );

}


async function uploadMediaFile(
    file,
    type
) {
    return uploadToCloudinary({
        file,
        mediaType: type,
        config: cloudinaryConfig,
        onProgress: (progress) => {
            showStatus(
                `Uploading to Cloudinary... ${progress}%`,
                "success",
                0
            );
        }
    });

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


        let uploadedCloudinaryPublicId =
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

            let cloudinaryDetails = {
                assetId:
                    editingMedia?.cloudinaryAssetId || "",
                publicId:
                    editingMedia?.cloudinaryPublicId || "",
                resourceType:
                    editingMedia?.cloudinaryResourceType || "",
                format:
                    editingMedia?.mediaFormat || "",
                bytes:
                    Number(editingMedia?.fileSize) || 0,
                width:
                    Number(editingMedia?.width) || 0,
                height:
                    Number(editingMedia?.height) || 0,
                duration:
                    Number(editingMedia?.duration) || 0
            };

            let mediaSource =
                editingMedia?.source ||
                (cloudinaryDetails.publicId
                    ? "cloudinary"
                    : (finalStoragePath
                        ? "firebase-storage"
                        : "external-url"));


            if (file) {

                showStatus(
                    "Uploading media to Cloudinary... 0%",
                    "success",
                    0
                );


                const uploadResult =
                    await uploadMediaFile(
                        file,
                        type
                    );


                finalURL =
                    uploadResult.url;

                finalStoragePath =
                    "";

                cloudinaryDetails =
                    uploadResult;

                uploadedCloudinaryPublicId =
                    uploadResult.publicId;

                mediaSource =
                    "cloudinary";

            } else if (
                enteredURL &&
                enteredURL !== existingURL
            ) {

                finalStoragePath =
                    "";

                cloudinaryDetails = {
                    assetId: "",
                    publicId: "",
                    resourceType: "",
                    format: "",
                    bytes: 0,
                    width: 0,
                    height: 0,
                    duration: 0
                };

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
                cloudinaryAssetId:
                    cloudinaryDetails.assetId,
                cloudinaryPublicId:
                    cloudinaryDetails.publicId,
                cloudinaryResourceType:
                    cloudinaryDetails.resourceType,
                mediaFormat:
                    cloudinaryDetails.format,
                fileSize:
                    cloudinaryDetails.bytes,
                width:
                    cloudinaryDetails.width,
                height:
                    cloudinaryDetails.height,
                duration:
                    cloudinaryDetails.duration,
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

            const previousCloudinaryPublicId =
                editingMedia?.cloudinaryPublicId ||
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
                previousCloudinaryPublicId &&
                previousCloudinaryPublicId !==
                    cloudinaryDetails.publicId
                    ? `✅ Media updated. Remove old Cloudinary asset “${previousCloudinaryPublicId}” from the Cloudinary Media Library.`
                    : (editingMedia
                        ? "✅ Media updated successfully!"
                        : "✅ Media published successfully!"),
                "success"
            );


            resetMediaForm();

            await loadDashboard();


        } catch (error) {

            console.error(
                "Media save error:",
                error
            );


            showStatus(
                "❌ " + error.message +
                (uploadedCloudinaryPublicId
                    ? ` Cloudinary asset ${uploadedCloudinaryPublicId} was uploaded but the Firestore record was not saved.`
                    : ""),
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

    await loadCreatorApplications();

    await loadRecentMedia();

}


// ==========================================
// CREATOR VERIFICATION QUEUE
// ==========================================

function getApplicationTime(application) {

    return application.submittedAt?.seconds ||
        application.updatedAt?.seconds ||
        0;

}


function appendApplicationDetail(
    container,
    label,
    value
) {

    const detail =
        document.createElement("p");

    const labelElement =
        document.createElement("strong");

    labelElement.textContent = `${label}: `;
    detail.append(labelElement, value || "Not provided");
    container.append(detail);

}


function createCreatorApplicationCard(application) {

    const card =
        document.createElement("article");

    card.className =
        "creator-application-card";

    card.dataset.applicationUid =
        application.uid;


    const heading =
        document.createElement("div");

    heading.className =
        "creator-application-heading";


    const identity =
        document.createElement("div");

    const title =
        document.createElement("h3");

    title.textContent =
        application.channelName ||
        "Unnamed creator";

    const handle =
        document.createElement("span");

    handle.textContent =
        `@${application.channelHandle || "unknown"}`;

    identity.append(title, handle);


    const badge =
        document.createElement("span");

    badge.className =
        "creator-queue-badge";

    badge.textContent =
        "Pending review";

    heading.append(identity, badge);


    const details =
        document.createElement("div");

    details.className =
        "creator-application-details";

    appendApplicationDetail(
        details,
        "Category",
        application.category
    );

    appendApplicationDetail(
        details,
        "Description",
        application.bio
    );


    if (
        application.website &&
        isValidPublicURL(application.website)
    ) {

        const websiteLine =
            document.createElement("p");

        const websiteLabel =
            document.createElement("strong");

        const websiteLink =
            document.createElement("a");

        websiteLabel.textContent =
            "Website: ";

        websiteLink.href =
            application.website;

        websiteLink.textContent =
            application.website;

        websiteLink.target = "_blank";
        websiteLink.rel = "noopener noreferrer";

        websiteLine.append(
            websiteLabel,
            websiteLink
        );

        details.append(websiteLine);

    }


    const declaration =
        document.createElement("p");

    declaration.className =
        "creator-rights-status";

    declaration.textContent =
        application.rightsConfirmed
            ? "✓ Content-rights declaration confirmed"
            : "⚠ Content-rights declaration missing";


    const actions =
        document.createElement("div");

    actions.className =
        "creator-application-actions";

    const approveButton =
        document.createElement("button");

    approveButton.type = "button";
    approveButton.className =
        "creator-review-action approve-creator";
    approveButton.dataset.creatorAction =
        "approve";
    approveButton.textContent =
        "✓ Approve creator";


    const rejectButton =
        document.createElement("button");

    rejectButton.type = "button";
    rejectButton.className =
        "creator-review-action reject-creator";
    rejectButton.dataset.creatorAction =
        "reject";
    rejectButton.textContent =
        "Request changes";

    actions.append(
        approveButton,
        rejectButton
    );

    card.append(
        heading,
        details,
        declaration,
        actions
    );

    return card;

}


async function loadCreatorApplications() {

    if (
        !creatorApplicationsList ||
        !creatorApplicationCount
    ) return;

    creatorApplicationsList.innerHTML =
        '<div class="empty-state">Loading creator applications…</div>';


    try {

        const snapshot =
            await getDocs(
                collection(
                    db,
                    "creatorApplications"
                )
            );

        const applications =
            snapshot.docs
                .map((applicationDoc) => ({
                    id: applicationDoc.id,
                    ...applicationDoc.data()
                }))
                .filter(
                    (application) =>
                        application.status ===
                            "pending"
                )
                .sort(
                    (a, b) =>
                        getApplicationTime(b) -
                        getApplicationTime(a)
                );


        creatorApplicationCount.textContent =
            `${applications.length} pending`;

        creatorApplicationCount.classList.toggle(
            "connection-on",
            applications.length === 0
        );

        creatorApplicationCount.classList.toggle(
            "connection-off",
            applications.length > 0
        );


        creatorApplicationsList.replaceChildren();


        if (!applications.length) {

            const emptyState =
                document.createElement("div");

            emptyState.className =
                "empty-state";

            emptyState.textContent =
                "No creator applications are waiting for review.";

            creatorApplicationsList.append(
                emptyState
            );

            return;

        }


        applications.forEach(
            (application) => {
                creatorApplicationsList.append(
                    createCreatorApplicationCard(
                        application
                    )
                );
            }
        );

    } catch (error) {

        console.error(
            "Creator application load error:",
            error
        );

        creatorApplicationCount.textContent =
            "Unavailable";

        creatorApplicationsList.innerHTML =
            '<div class="empty-state">Creator applications could not be loaded. Deploy the latest Firestore rules and refresh.</div>';

    }

}


async function reviewCreatorApplication(
    uid,
    action,
    button
) {

    const applicationReference =
        doc(
            db,
            "creatorApplications",
            uid
        );

    const isApproval =
        action === "approve";

    let reviewNote = "";


    if (isApproval) {

        const confirmed = window.confirm(
            "Approve this creator channel? Creator Studio access will become eligible."
        );

        if (!confirmed) return;

    } else {

        reviewNote = window.prompt(
            "Tell the creator what must be changed:",
            "Please update your channel information and resubmit."
        )?.trim() || "";

        if (!reviewNote) return;

    }


    button.disabled = true;
    button.textContent =
        isApproval
            ? "Approving…"
            : "Saving…";


    try {

        const applicationDocument =
            await getDoc(
                applicationReference
            );


        if (!applicationDocument.exists()) {
            throw new Error(
                "Creator application no longer exists."
            );
        }


        const application =
            applicationDocument.data();

        if (application.status !== "pending") {
            throw new Error(
                "This application has already been reviewed."
            );
        }


        const status =
            isApproval
                ? "approved"
                : "rejected";

        const reviewBatch =
            writeBatch(db);

        reviewBatch.update(
            applicationReference,
            {
                status,
                reviewNote,
                reviewedAt:
                    serverTimestamp(),
                reviewedBy:
                    ADMIN_UID,
                updatedAt:
                    serverTimestamp()
            }
        );


        reviewBatch.set(
            doc(db, "users", uid),
            {
                creatorStatus: status,
                updatedAt:
                    serverTimestamp()
            },
            { merge: true }
        );


        if (isApproval) {

            reviewBatch.set(
                doc(db, "creators", uid),
                {
                    uid,
                    channelName:
                        application.channelName,
                    channelHandle:
                        application.channelHandle,
                    category:
                        application.category,
                    website:
                        application.website || "",
                    bio:
                        application.bio,
                    status:
                        "approved",
                    followers: 0,
                    uploads: 0,
                    approvedAt:
                        serverTimestamp(),
                    updatedAt:
                        serverTimestamp()
                },
                { merge: true }
            );

        }


        await reviewBatch.commit();


        showStatus(
            isApproval
                ? "✅ Creator approved. Public creator record created."
                : "✅ Changes requested. The creator can edit and resubmit.",
            "success"
        );

        await loadCreatorApplications();

    } catch (error) {

        console.error(
            "Creator review error:",
            error
        );

        showStatus(
            `❌ ${error.message}`,
            "error"
        );

        button.disabled = false;
        button.textContent =
            isApproval
                ? "✓ Approve creator"
                : "Request changes";

    }

}


creatorApplicationsList?.addEventListener(
    "click",
    (event) => {

        const button =
            event.target.closest(
                "[data-creator-action]"
            );

        const card =
            button?.closest(
                "[data-application-uid]"
            );

        if (!button || !card) return;

        reviewCreatorApplication(
            card.dataset.applicationUid,
            button.dataset.creatorAction,
            button
        );

    }
);


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

            const countSnapshot =
                await getCountFromServer(
                    collection(
                        db,
                        collectionName
                    )
                );

            const collectionCount =
                countSnapshot.data().count;


            if (
                collectionName ===
                "wallpapers"
            ) {

                wallpaperCount.textContent =
                    collectionCount;

            }


            if (
                collectionName ===
                "images"
            ) {

                imageCount.textContent =
                    collectionCount;

            }


            if (
                collectionName ===
                "videos"
            ) {

                videoCount.textContent =
                    collectionCount;

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

                const collectionReference =
                    collection(
                        db,
                        collectionName
                    );

                const mediaQuery =
                    query(
                        collectionReference,

                        orderBy(
                            "createdAt",
                            "desc"
                        ),

                        limit(10)
                    );


                const orderedSnapshot =
                    await getDocs(
                        mediaQuery
                    );

                const countSnapshot =
                    await getCountFromServer(
                        collectionReference
                    );

                const expectedRecentCount =
                    Math.min(
                        10,
                        countSnapshot.data().count
                    );

                snapshot =
                    orderedSnapshot.size <
                        expectedRecentCount
                        ? await getDocs(
                            collectionReference
                        )
                        : orderedSnapshot;

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

    const existingURL =
        getMediaURL(media);

    mediaUrl.value =
        isValidPublicURL(existingURL)
            ? existingURL
            : "";

    trending.checked =
        Boolean(media.trending);

    featured.checked =
        Boolean(media.featured);

    publishBtn.textContent =
        "💾 Update Media";

    cancelEditBtn?.classList.remove(
        "hidden"
    );


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
            `Delete “${media.title || "Untitled"}”? This cannot be undone.` +
            (media.cloudinaryPublicId
                ? `\n\nThe website record will be deleted. Also remove Cloudinary asset “${media.cloudinaryPublicId}” from the Cloudinary Media Library.`
                : "")
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
        media.cloudinaryPublicId
            ? `✅ Website record deleted. Now remove Cloudinary asset “${media.cloudinaryPublicId}” from the Cloudinary Media Library.`
            : "✅ Media deleted successfully.",
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
    type,
    hideAfter = 5000
) {

    if (statusMessageTimeout) {

        clearTimeout(
            statusMessageTimeout
        );

        statusMessageTimeout = null;

    }

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


    if (hideAfter > 0) {

        statusMessageTimeout =
            setTimeout(
                () => {

                    statusMessage.classList.add(
                        "hidden"
                    );

                    statusMessageTimeout = null;

                },
                hideAfter
            );

    }

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
renderCloudinaryConnection();
updateFileSettings();


console.log(
    "🚀 Secure Admin Dashboard Ready"
);
