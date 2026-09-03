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
    increment,
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


import {
    CREATOR_PROFIT_SHARE_RATE,
    CREATOR_PROFIT_SHARE_PERCENT,
    DEFAULT_MINIMUM_PAYOUT_INR,
    calculateCreatorProfitShare
} from "../../../creator-earnings-policy.js";


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

const creatorMediaById =
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


const creatorMediaSubmissionCount =
    document.getElementById(
        "creatorMediaSubmissionCount"
    );

const creatorMediaSubmissionsList =
    document.getElementById(
        "creatorMediaSubmissionsList"
    );

const creatorEarningsForm =
    document.getElementById("creatorEarningsForm");

const earningsCreatorUid =
    document.getElementById("earningsCreatorUid");

const earningsMonetizationStatus =
    document.getElementById("earningsMonetizationStatus");

const earningsAttributedProfit =
    document.getElementById("earningsAttributedProfit");

const earningsSharePreview =
    document.getElementById("earningsSharePreview");

const creatorEarningsSaveBtn =
    document.getElementById("creatorEarningsSaveBtn");

const creatorPayoutCount =
    document.getElementById("creatorPayoutCount");

const creatorPayoutRequestsList =
    document.getElementById("creatorPayoutRequestsList");


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

    await loadCreatorMediaSubmissions();

    await loadCreatorPayoutRequests();

    await loadRecentMedia();

}


// ==========================================
// CREATOR EARNINGS + PAYOUT OPERATIONS
// ==========================================

function formatAdminINR(value) {
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 2
    }).format(Math.max(0, Number(value) || 0));
}

function updateCreatorSharePreview() {
    if (!earningsSharePreview) return;
    const attributedProfit = Math.max(0, Number(earningsAttributedProfit?.value) || 0);
    const creatorShare = calculateCreatorProfitShare(attributedProfit);
    earningsSharePreview.textContent =
        `Creator share (${CREATOR_PROFIT_SHARE_PERCENT}%): ${formatAdminINR(creatorShare)}`;
}

async function saveCreatorEarnings(event) {
    event.preventDefault();

    const creatorId = earningsCreatorUid?.value.trim() || "";
    const monetizationStatus = earningsMonetizationStatus?.value || "not_eligible";
    const attributedProfit = Math.max(0, Number(earningsAttributedProfit?.value) || 0);
    const creatorShare = calculateCreatorProfitShare(attributedProfit);

    if (attributedProfit > 0 && monetizationStatus !== "monetized") {
        showStatus("❌ Set monetization status to Monetized before crediting creator profit share.", "error");
        return;
    }

    if (!creatorId || !creatorEarningsSaveBtn) return;

    creatorEarningsSaveBtn.disabled = true;
    creatorEarningsSaveBtn.textContent = "Saving…";

    try {
        const creatorReference = doc(db, "creators", creatorId);
        const earningsReference = doc(db, "creatorEarnings", creatorId);
        const [creatorSnapshot, earningsSnapshot] = await Promise.all([
            getDoc(creatorReference),
            getDoc(earningsReference)
        ]);

        if (
            !creatorSnapshot.exists() ||
            !["active", "approved"].includes(creatorSnapshot.data().status)
        ) {
            throw new Error("Active creator channel not found for this UID.");
        }

        const batch = writeBatch(db);

        if (earningsSnapshot.exists()) {
            const update = {
                monetizationStatus,
                updatedAt: serverTimestamp()
            };

            update.profitShareRate = CREATOR_PROFIT_SHARE_RATE;

            if (attributedProfit > 0) {
                update.attributedPlatformProfit = increment(attributedProfit);
                // Legacy field is retained as cumulative creator-share value.
                update.eligibleRevenue = increment(creatorShare);
                update.estimatedEarnings = increment(creatorShare);
                update.availableBalance = increment(creatorShare);
                update.lifetimeEarnings = increment(creatorShare);
            }

            batch.set(earningsReference, update, { merge: true });
        } else {
            batch.set(earningsReference, {
                creatorId,
                currency: "INR",
                monetizationStatus,
                eligibleRevenue: creatorShare,
                attributedPlatformProfit: attributedProfit,
                profitShareRate: CREATOR_PROFIT_SHARE_RATE,
                estimatedEarnings: creatorShare,
                availableBalance: creatorShare,
                lifetimeEarnings: creatorShare,
                paidOut: 0,
                minimumPayout: DEFAULT_MINIMUM_PAYOUT_INR,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            });
        }

        if (attributedProfit > 0) {
            const transactionReference = doc(
                collection(db, "creatorEarningTransactions")
            );

            batch.set(transactionReference, {
                creatorId,
                type: "profit_share_credit",
                source: "creator_attributed_verified_net_profit",
                attributedPlatformProfit: attributedProfit,
                profitShareRate: CREATOR_PROFIT_SHARE_RATE,
                amount: creatorShare,
                currency: "INR",
                createdAt: serverTimestamp()
            });
        }

        await batch.commit();

        showStatus(
            attributedProfit > 0
                ? `✅ Verified profit ${formatAdminINR(attributedProfit)} settled. Creator gets ${CREATOR_PROFIT_SHARE_PERCENT}% = ${formatAdminINR(creatorShare)}.`
                : "✅ Creator monetization status updated.",
            "success"
        );

        earningsAttributedProfit.value = "0";
        updateCreatorSharePreview();
    } catch (error) {
        console.error("Creator earnings update error:", error);
        showStatus(`❌ ${error.message}`, "error");
    } finally {
        creatorEarningsSaveBtn.disabled = false;
        creatorEarningsSaveBtn.textContent = "Save monetization update";
    }
}

function createPayoutRequestCard(request) {
    const card = document.createElement("article");
    card.className = "creator-payout-card";

    const info = document.createElement("div");
    const title = document.createElement("h3");
    const details = document.createElement("p");

    title.textContent = `Creator ${request.creatorId}`;
    details.textContent = `${formatAdminINR(request.amount)} · ${request.status || "pending"}`;
    info.append(title, details);

    const actions = document.createElement("div");
    actions.className = "creator-payout-actions";

    const paidButton = document.createElement("button");
    paidButton.type = "button";
    paidButton.dataset.payoutAction = "paid";
    paidButton.dataset.creatorId = request.creatorId;
    paidButton.textContent = "✓ Mark paid";

    const rejectButton = document.createElement("button");
    rejectButton.type = "button";
    rejectButton.dataset.payoutAction = "rejected";
    rejectButton.dataset.creatorId = request.creatorId;
    rejectButton.textContent = "Reject";

    actions.append(paidButton, rejectButton);
    card.append(info, actions);
    return card;
}

async function loadCreatorPayoutRequests() {
    if (!creatorPayoutRequestsList || !creatorPayoutCount) return;

    creatorPayoutRequestsList.innerHTML =
        '<div class="empty-state">Loading payout requests…</div>';

    try {
        const snapshot = await getDocs(collection(db, "payoutRequests"));
        const requests = snapshot.docs
            .map((entry) => ({ id: entry.id, ...entry.data() }))
            .filter((entry) => entry.status === "pending")
            .sort((left, right) =>
                (right.requestedAt?.seconds || 0) -
                (left.requestedAt?.seconds || 0)
            );

        creatorPayoutCount.textContent = `${requests.length} pending payouts`;
        creatorPayoutCount.classList.toggle("connection-on", requests.length > 0);
        creatorPayoutCount.classList.toggle("connection-off", requests.length === 0);
        creatorPayoutRequestsList.replaceChildren();

        if (!requests.length) {
            const empty = document.createElement("div");
            empty.className = "empty-state";
            empty.textContent = "No creator payout requests are pending.";
            creatorPayoutRequestsList.append(empty);
            return;
        }

        requests.forEach((request) => {
            creatorPayoutRequestsList.append(createPayoutRequestCard(request));
        });
    } catch (error) {
        console.error("Creator payout load error:", error);
        creatorPayoutCount.textContent = "Unavailable";
        creatorPayoutRequestsList.innerHTML =
            '<div class="empty-state">Payout requests could not be loaded.</div>';
    }
}

async function reviewCreatorPayout(creatorId, action, button) {
    if (!creatorId || !["paid", "rejected"].includes(action)) return;

    const confirmed = window.confirm(
        action === "paid"
            ? "Mark this payout as paid after the real payment has been completed?"
            : "Reject this payout request?"
    );
    if (!confirmed) return;

    button.disabled = true;

    try {
        const payoutReference = doc(db, "payoutRequests", creatorId);
        const earningsReference = doc(db, "creatorEarnings", creatorId);
        const [payoutSnapshot, earningsSnapshot] = await Promise.all([
            getDoc(payoutReference),
            getDoc(earningsReference)
        ]);

        if (!payoutSnapshot.exists() || payoutSnapshot.data().status !== "pending") {
            throw new Error("This payout request is no longer pending.");
        }

        const amount = Math.max(0, Number(payoutSnapshot.data().amount) || 0);
        const batch = writeBatch(db);

        if (action === "paid") {
            if (!earningsSnapshot.exists()) {
                throw new Error("Creator earnings record is missing.");
            }

            const available = Math.max(
                0,
                Number(earningsSnapshot.data().availableBalance) || 0
            );

            if (amount <= 0 || amount > available) {
                throw new Error("Payout amount is greater than the verified available balance.");
            }

            batch.set(
                earningsReference,
                {
                    availableBalance: increment(-amount),
                    paidOut: increment(amount),
                    updatedAt: serverTimestamp()
                },
                { merge: true }
            );
        }

        if (action === "paid") {
            const transactionReference = doc(
                collection(db, "creatorEarningTransactions")
            );

            batch.set(transactionReference, {
                creatorId,
                type: "payout",
                source: "creator_payout",
                amount,
                currency: "INR",
                createdAt: serverTimestamp()
            });
        }

        batch.set(
            payoutReference,
            {
                status: action,
                updatedAt: serverTimestamp()
            },
            { merge: true }
        );

        await batch.commit();
        showStatus(
            action === "paid"
                ? `✅ ${formatAdminINR(amount)} payout marked paid.`
                : "✅ Payout request rejected.",
            "success"
        );
        await loadCreatorPayoutRequests();
    } catch (error) {
        console.error("Creator payout review error:", error);
        showStatus(`❌ ${error.message}`, "error");
        button.disabled = false;
    }
}

creatorEarningsForm?.addEventListener("submit", saveCreatorEarnings);
earningsAttributedProfit?.addEventListener("input", updateCreatorSharePreview);
updateCreatorSharePreview();

creatorPayoutRequestsList?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-payout-action]");
    if (!button) return;

    reviewCreatorPayout(
        button.dataset.creatorId,
        button.dataset.payoutAction,
        button
    );
});

// ==========================================
// CREATOR MEDIA REVIEW QUEUE
// ==========================================

function isTrustedCreatorMediaURL(value) {

    try {

        const url = new URL(value);

        return url.protocol === "https:" &&
            url.hostname === "res.cloudinary.com" &&
            url.pathname.startsWith("/kgxel7wp/");

    } catch {

        return false;

    }

}


function createCreatorMediaReviewCard(submission) {

    const card = document.createElement("article");
    card.className = "creator-media-review-card";
    card.dataset.creatorSubmissionId = submission.id;

    const media = submission.resourceType === "video"
        ? document.createElement("video")
        : document.createElement("img");

    media.src = submission.secureUrl;
    media.preload = "metadata";

    if (media instanceof HTMLImageElement) {
        media.alt = submission.title || "Creator media";
        media.loading = "lazy";
    } else {
        media.controls = true;
    }

    const information = document.createElement("div");
    information.className = "creator-media-review-info";

    const heading = document.createElement("div");
    heading.className = "creator-media-review-heading";

    const title = document.createElement("h3");
    title.textContent = submission.title || "Untitled media";

    const badge = document.createElement("span");
    badge.className = "creator-media-review-badge";
    badge.textContent = "Pending review";

    heading.append(title, badge);

    const creatorLine = document.createElement("p");
    const creatorLabel = document.createElement("strong");
    creatorLabel.textContent = "Creator: ";
    creatorLine.append(
        creatorLabel,
        submission.creator?.channelName ||
            submission.creatorId ||
            "Unknown creator"
    );

    const categoryLine = document.createElement("p");
    const categoryLabel = document.createElement("strong");
    categoryLabel.textContent = "Category: ";
    categoryLine.append(
        categoryLabel,
        `${submission.category || "Other"} · ${submission.mediaType || "media"}`
    );

    const description = document.createElement("p");
    description.textContent =
        submission.description ||
        "No description provided.";

    const rights = document.createElement("p");
    rights.className = "creator-rights-status";
    rights.textContent = submission.rightsConfirmed
        ? "✓ Creator confirmed publishing rights"
        : "⚠ Rights declaration missing";

    const actions = document.createElement("div");
    actions.className = "creator-media-review-actions";

    const publishButton = document.createElement("button");
    publishButton.type = "button";
    publishButton.className =
        "creator-media-review-action publish-creator-media";
    publishButton.dataset.creatorMediaAction = "approve";
    publishButton.textContent = "✓ Approve & publish";

    const rejectButton = document.createElement("button");
    rejectButton.type = "button";
    rejectButton.className =
        "creator-media-review-action reject-creator-media";
    rejectButton.dataset.creatorMediaAction = "reject";
    rejectButton.textContent = "Request changes";

    actions.append(publishButton, rejectButton);

    information.append(
        heading,
        creatorLine,
        categoryLine,
        description,
        rights,
        actions
    );

    card.append(media, information);
    return card;

}


async function loadCreatorMediaSubmissions() {

    if (
        !creatorMediaSubmissionCount ||
        !creatorMediaSubmissionsList
    ) return;

    creatorMediaSubmissionsList.innerHTML =
        '<div class="empty-state">Loading creator media submissions…</div>';

    creatorMediaById.clear();

    try {

        const [submissionSnapshot, creatorSnapshot] =
            await Promise.all([
                getDocs(
                    collection(
                        db,
                        "creatorMediaSubmissions"
                    )
                ),
                getDocs(
                    collection(db, "creators")
                )
            ]);

        const creators = new Map(
            creatorSnapshot.docs.map(
                (creatorDocument) => [
                    creatorDocument.id,
                    creatorDocument.data()
                ]
            )
        );

        const submissions = submissionSnapshot.docs
            .map((submissionDocument) => ({
                id: submissionDocument.id,
                ...submissionDocument.data(),
                creator: creators.get(
                    submissionDocument.data().creatorId
                ) || null
            }))
            .filter(
                (submission) =>
                    submission.status === "pending"
            )
            .sort(
                (a, b) =>
                    (b.createdAt?.seconds || 0) -
                    (a.createdAt?.seconds || 0)
            );

        submissions.forEach((submission) => {
            creatorMediaById.set(
                submission.id,
                submission
            );
        });

        creatorMediaSubmissionCount.textContent =
            `${submissions.length} pending`;

        creatorMediaSubmissionCount.classList.toggle(
            "connection-on",
            submissions.length === 0
        );
        creatorMediaSubmissionCount.classList.toggle(
            "connection-off",
            submissions.length > 0
        );

        creatorMediaSubmissionsList.replaceChildren();

        if (!submissions.length) {
            const empty = document.createElement("div");
            empty.className = "empty-state";
            empty.textContent =
                "No creator media is waiting for review.";
            creatorMediaSubmissionsList.append(empty);
            return;
        }

        submissions.forEach((submission) => {
            creatorMediaSubmissionsList.append(
                createCreatorMediaReviewCard(submission)
            );
        });

    } catch (error) {

        console.error(
            "Creator media queue error:",
            error
        );

        creatorMediaSubmissionCount.textContent =
            "Unavailable";
        creatorMediaSubmissionsList.innerHTML =
            '<div class="empty-state">Creator media submissions could not be loaded. Deploy the latest Firestore rules and refresh.</div>';

    }

}


async function reviewCreatorMedia(
    submissionId,
    action,
    button
) {

    const cachedSubmission =
        creatorMediaById.get(submissionId);

    if (!cachedSubmission) {
        showStatus(
            "❌ Creator submission is no longer available.",
            "error"
        );
        return;
    }

    const isApproval = action === "approve";
    let reviewNote = "";

    if (isApproval) {
        const confirmed = window.confirm(
            `Approve and publicly publish “${cachedSubmission.title || "this media"}”?`
        );
        if (!confirmed) return;
    } else {
        reviewNote = window.prompt(
            "Tell the creator what must be changed:",
            "Please update the media details or upload a corrected file."
        )?.trim() || "";
        if (!reviewNote) return;
    }

    button.disabled = true;
    button.textContent = isApproval
        ? "Publishing…"
        : "Saving…";

    try {
        const submissionReference = doc(
            db,
            "creatorMediaSubmissions",
            submissionId
        );

        const submissionDocument = await getDoc(
            submissionReference
        );

        if (!submissionDocument.exists()) {
            throw new Error("Submission no longer exists.");
        }

        const submission = submissionDocument.data();

        if (submission.status !== "pending") {
            throw new Error(
                "This submission has already been reviewed."
            );
        }

        if (!ALLOWED_COLLECTIONS.has(submission.mediaType)) {
            throw new Error("Unsupported public media collection.");
        }

        if (
            !submission.rightsConfirmed ||
            !isTrustedCreatorMediaURL(submission.secureUrl)
        ) {
            throw new Error(
                "Creator rights or Cloudinary URL validation failed."
            );
        }

        const creatorReference = doc(
            db,
            "creators",
            submission.creatorId
        );
        const creatorDocument = await getDoc(
            creatorReference
        );

        if (
            !creatorDocument.exists() ||
            !["active", "approved"].includes(
                creatorDocument.data().status
            )
        ) {
            throw new Error(
                "The creator channel is no longer active."
            );
        }

        const creator = creatorDocument.data();
        const reviewBatch = writeBatch(db);

        if (isApproval) {
            const publicReference = doc(
                collection(db, submission.mediaType)
            );

            const publicMedia = {
                title: submission.title,
                category:
                    canonicalizeCategory(
                        submission.category
                    ),
                categoryKey:
                    getCategoryKey(
                        submission.category
                    ),
                description:
                    submission.description || "",
                trending: false,
                featured: false,
                storagePath: "",
                cloudinaryAssetId:
                    submission.assetId,
                cloudinaryPublicId:
                    submission.publicId,
                cloudinaryResourceType:
                    submission.resourceType,
                mediaFormat:
                    submission.format || "",
                fileSize:
                    Number(submission.bytes) || 0,
                width:
                    Number(submission.width) || 0,
                height:
                    Number(submission.height) || 0,
                duration:
                    Number(submission.duration) || 0,
                source: "cloudinary-creator",
                creatorId:
                    submission.creatorId,
                creatorName:
                    creator.channelName || "Creator",
                creatorHandle:
                    creator.channelHandle || "",
                createdBy:
                    submission.creatorId,
                downloads: 0,
                favorites: 0,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            };

            if (submission.resourceType === "video") {
                publicMedia.videoUrl = submission.secureUrl;
            } else {
                publicMedia.imageUrl = submission.secureUrl;
            }

            reviewBatch.set(
                publicReference,
                publicMedia
            );

            reviewBatch.update(
                creatorReference,
                {
                    uploads: increment(1),
                    updatedAt: serverTimestamp()
                }
            );

            reviewBatch.update(
                submissionReference,
                {
                    status: "approved",
                    reviewNote: "",
                    reviewedAt: serverTimestamp(),
                    reviewedBy: ADMIN_UID,
                    publicCollection:
                        submission.mediaType,
                    publicMediaId:
                        publicReference.id,
                    updatedAt: serverTimestamp()
                }
            );
        } else {
            reviewBatch.update(
                submissionReference,
                {
                    status: "rejected",
                    reviewNote,
                    reviewedAt: serverTimestamp(),
                    reviewedBy: ADMIN_UID,
                    updatedAt: serverTimestamp()
                }
            );
        }

        await reviewBatch.commit();

        showStatus(
            isApproval
                ? "✅ Creator media approved and published publicly."
                : "✅ Changes requested from the creator.",
            "success"
        );

        await loadDashboard();

    } catch (error) {

        console.error("Creator media review error:", error);
        showStatus(`❌ ${error.message}`, "error");
        button.disabled = false;
        button.textContent = isApproval
            ? "✓ Approve & publish"
            : "Request changes";

    }

}


creatorMediaSubmissionsList?.addEventListener(
    "click",
    (event) => {
        const button = event.target.closest(
            "[data-creator-media-action]"
        );
        const card = button?.closest(
            "[data-creator-submission-id]"
        );

        if (!button || !card) return;

        reviewCreatorMedia(
            card.dataset.creatorSubmissionId,
            button.dataset.creatorMediaAction,
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
