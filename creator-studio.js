import {
    addDoc,
    collection,
    doc,
    getDoc,
    getDocs,
    query,
    serverTimestamp,
    where
} from "firebase/firestore";

import {
    onAuthStateChanged,
    signOut
} from "firebase/auth";

import {
    auth,
    db
} from "./firebase.js";

import {
    CATEGORY_LABELS,
    canonicalizeCategory
} from "./categories.js";

import {
    CREATOR_UPLOAD_CONFIG
} from "./creator-upload-config.js";

const FILE_RULES = Object.freeze({
    wallpapers: {
        accept: "image/jpeg,image/png,image/webp",
        types: new Set([
            "image/jpeg",
            "image/png",
            "image/webp"
        ]),
        maxBytes: 25 * 1024 * 1024,
        help: "JPG, PNG or WebP; maximum 25 MB."
    },
    images: {
        accept: "image/jpeg,image/png,image/webp",
        types: new Set([
            "image/jpeg",
            "image/png",
            "image/webp"
        ]),
        maxBytes: 25 * 1024 * 1024,
        help: "JPG, PNG or WebP; maximum 25 MB."
    },
    videos: {
        accept: "video/mp4,video/webm,video/ogg",
        types: new Set([
            "video/mp4",
            "video/webm",
            "video/ogg"
        ]),
        maxBytes: 100 * 1024 * 1024,
        help: "MP4, WebM or OGG; maximum 100 MB."
    }
});

const elements = {
    loading: document.getElementById("studioLoading"),
    signedOut: document.getElementById("studioSignedOut"),
    locked: document.getElementById("studioLocked"),
    content: document.getElementById("studioContent"),
    signOut: document.getElementById("studioSignOut"),
    channelName: document.getElementById("studioChannelName"),
    channelHandle: document.getElementById("studioChannelHandle"),
    uploadCount: document.getElementById("studioUploadCount"),
    followerCount: document.getElementById("studioFollowerCount"),
    uploadServiceStatus: document.getElementById("uploadServiceStatus"),
    uploadForm: document.getElementById("creatorUploadForm"),
    mediaType: document.getElementById("creatorMediaType"),
    category: document.getElementById("creatorMediaCategory"),
    file: document.getElementById("creatorMediaFile"),
    fileHelp: document.getElementById("creatorFileHelp"),
    preview: document.getElementById("creatorPreview"),
    imagePreview: document.getElementById("creatorImagePreview"),
    videoPreview: document.getElementById("creatorVideoPreview"),
    title: document.getElementById("creatorMediaTitle"),
    description: document.getElementById("creatorMediaDescription"),
    rights: document.getElementById("creatorMediaRights"),
    uploadButton: document.getElementById("creatorUploadButton"),
    uploadMessage: document.getElementById("creatorUploadMessage"),
    progressWrap: document.getElementById("uploadProgressWrap"),
    progress: document.getElementById("creatorUploadProgress"),
    progressLabel: document.getElementById("creatorUploadProgressLabel"),
    submissionsList: document.getElementById("creatorSubmissionsList")
};

let currentUser = null;
let currentCreator = null;
let previewObjectUrl = "";

function showState(state) {
    elements.loading.hidden = state !== "loading";
    elements.signedOut.hidden = state !== "signed-out";
    elements.locked.hidden = state !== "locked";
    elements.content.hidden = state !== "approved";
    elements.signOut.hidden = state === "signed-out";
}

function isSigningEndpointConfigured() {
    try {
        const endpoint = new URL(
            CREATOR_UPLOAD_CONFIG.signingEndpoint
        );

        return endpoint.protocol === "https:" ||
            (
                endpoint.protocol === "http:" &&
                ["localhost", "127.0.0.1"].includes(
                    endpoint.hostname
                )
            );
    } catch {
        return false;
    }
}

function renderUploadServiceState() {
    const configured =
        isSigningEndpointConfigured();

    elements.uploadServiceStatus.textContent =
        configured ? "Secure service ready" : "Setup required";

    elements.uploadServiceStatus.classList.toggle(
        "service-online",
        configured
    );
    elements.uploadServiceStatus.classList.toggle(
        "service-offline",
        !configured
    );

    elements.uploadButton.disabled = !configured;
    elements.uploadMessage.textContent = configured
        ? "Your upload will be sent to the admin review queue."
        : "Deploy the signed upload Worker and add its URL to creator-upload-config.js.";
}

function populateCategories() {
    CATEGORY_LABELS.forEach((category) => {
        const option = document.createElement("option");
        option.value = category;
        option.textContent = category;
        elements.category.append(option);
    });
}

function updateFileRules() {
    const rules =
        FILE_RULES[elements.mediaType.value];

    elements.file.accept = rules.accept;
    elements.fileHelp.textContent = rules.help;
    elements.file.value = "";
    clearPreview();
}

function clearPreview() {
    if (previewObjectUrl) {
        URL.revokeObjectURL(previewObjectUrl);
        previewObjectUrl = "";
    }

    elements.imagePreview.removeAttribute("src");
    elements.videoPreview.removeAttribute("src");
    elements.imagePreview.hidden = true;
    elements.videoPreview.hidden = true;
    elements.preview.hidden = true;
}

function validateFile(file, mediaType) {
    const rules = FILE_RULES[mediaType];

    if (!file) return "Choose a media file.";

    if (!rules.types.has(file.type)) {
        return `Unsupported file format. ${rules.help}`;
    }

    if (file.size <= 0 || file.size > rules.maxBytes) {
        return `File size is not allowed. ${rules.help}`;
    }

    return "";
}

function previewSelectedFile() {
    clearPreview();

    const file = elements.file.files[0];
    if (!file) return;

    const validationError = validateFile(
        file,
        elements.mediaType.value
    );

    if (validationError) {
        elements.uploadMessage.textContent = validationError;
        elements.file.value = "";
        return;
    }

    previewObjectUrl = URL.createObjectURL(file);
    elements.preview.hidden = false;

    if (file.type.startsWith("video/")) {
        elements.videoPreview.src = previewObjectUrl;
        elements.videoPreview.hidden = false;
    } else {
        elements.imagePreview.src = previewObjectUrl;
        elements.imagePreview.hidden = false;
    }
}

async function requestUploadSignature(mediaType) {
    const idToken = await currentUser.getIdToken();

    const response = await fetch(
        CREATOR_UPLOAD_CONFIG.signingEndpoint,
        {
            method: "POST",
            headers: {
                Authorization: `Bearer ${idToken}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ mediaType })
        }
    );

    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
        throw new Error(
            result.error ||
            "Secure upload authorization failed."
        );
    }

    return result;
}

function uploadToCloudinary(file, authorization) {
    return new Promise((resolve, reject) => {
        const request = new XMLHttpRequest();
        const formData = new FormData();

        formData.append("file", file);
        formData.append("api_key", authorization.apiKey);
        formData.append("signature", authorization.signature);

        Object.entries(authorization.signedParameters)
            .forEach(([key, value]) => {
                formData.append(key, String(value));
            });

        request.open(
            "POST",
            `https://api.cloudinary.com/v1_1/${encodeURIComponent(authorization.cloudName)}/${authorization.resourceType}/upload`
        );

        request.upload.addEventListener("progress", (event) => {
            if (!event.lengthComputable) return;

            const progress = Math.round(
                (event.loaded / event.total) * 100
            );

            elements.progress.value = progress;
            elements.progressLabel.textContent =
                `Uploading securely… ${progress}%`;
        });

        request.addEventListener("load", () => {
            let result = {};

            try {
                result = JSON.parse(request.responseText || "{}");
            } catch {
                reject(new Error("Cloudinary returned an invalid response."));
                return;
            }

            if (request.status < 200 || request.status >= 300) {
                reject(new Error(
                    result.error?.message ||
                    "Cloudinary upload failed."
                ));
                return;
            }

            resolve(result);
        });

        request.addEventListener("error", () => {
            reject(new Error("Network error during Cloudinary upload."));
        });

        request.send(formData);
    });
}

function createSubmissionCard(submission) {
    const card = document.createElement("article");
    card.className = "creator-submission-card";

    const media = submission.resourceType === "video"
        ? document.createElement("video")
        : document.createElement("img");

    media.src = submission.secureUrl;
    media.preload = "metadata";
    media.loading = "lazy";

    if (media instanceof HTMLImageElement) {
        media.alt = submission.title || "Creator submission";
    } else {
        media.controls = true;
    }

    const information = document.createElement("div");
    information.className = "creator-submission-info";

    const heading = document.createElement("div");
    heading.className = "submission-heading";

    const title = document.createElement("h3");
    title.textContent = submission.title || "Untitled";

    const status = document.createElement("span");
    status.className = `submission-status status-${submission.status || "pending"}`;
    status.textContent = submission.status || "pending";

    heading.append(title, status);

    const category = document.createElement("p");
    category.textContent =
        `${submission.category || "Other"} · ${submission.mediaType || "media"}`;

    information.append(heading, category);

    if (submission.status === "rejected" && submission.reviewNote) {
        const reviewNote = document.createElement("p");
        reviewNote.className = "submission-review-note";
        reviewNote.textContent = `Admin: ${submission.reviewNote}`;
        information.append(reviewNote);
    }

    card.append(media, information);
    return card;
}

async function loadCreatorSubmissions() {
    elements.submissionsList.innerHTML =
        '<p class="studio-empty-state">Loading submissions…</p>';

    try {
        const snapshot = await getDocs(
            query(
                collection(db, "creatorMediaSubmissions"),
                where("creatorId", "==", currentUser.uid)
            )
        );

        const submissions = snapshot.docs
            .map((submissionDoc) => ({
                id: submissionDoc.id,
                ...submissionDoc.data()
            }))
            .sort((a, b) =>
                (b.createdAt?.seconds || 0) -
                (a.createdAt?.seconds || 0)
            );

        elements.submissionsList.replaceChildren();

        if (!submissions.length) {
            const empty = document.createElement("p");
            empty.className = "studio-empty-state";
            empty.textContent = "No submissions yet.";
            elements.submissionsList.append(empty);
            return;
        }

        submissions.forEach((submission) => {
            elements.submissionsList.append(
                createSubmissionCard(submission)
            );
        });
    } catch (error) {
        console.error("Creator submission load error:", error);
        elements.submissionsList.innerHTML =
            '<p class="studio-empty-state">Submissions are unavailable. Deploy the latest Firestore rules and refresh.</p>';
    }
}

async function submitCreatorMedia(event) {
    event.preventDefault();

    if (
        !currentUser ||
        !currentCreator ||
        !isSigningEndpointConfigured()
    ) return;

    const mediaType = elements.mediaType.value;
    const file = elements.file.files[0];
    const title = elements.title.value.trim();
    const description = elements.description.value.trim();
    const category = canonicalizeCategory(
        elements.category.value
    );
    const validationError = validateFile(file, mediaType);

    if (validationError) {
        elements.uploadMessage.textContent = validationError;
        return;
    }

    if (!title || !category || !elements.rights.checked) {
        elements.uploadMessage.textContent =
            "Complete the required fields and confirm your content rights.";
        return;
    }

    elements.uploadButton.disabled = true;
    elements.uploadButton.textContent = "Submitting…";
    elements.progressWrap.hidden = false;
    elements.progress.value = 0;
    elements.progressLabel.textContent = "Authorizing creator upload…";

    let cloudinaryResult = null;

    try {
        const authorization = await requestUploadSignature(mediaType);

        cloudinaryResult = await uploadToCloudinary(
            file,
            authorization
        );

        elements.progressLabel.textContent =
            "Saving submission for admin review…";

        await addDoc(
            collection(db, "creatorMediaSubmissions"),
            {
                creatorId: currentUser.uid,
                title,
                description,
                category,
                mediaType,
                resourceType:
                    cloudinaryResult.resource_type,
                secureUrl:
                    cloudinaryResult.secure_url,
                publicId:
                    cloudinaryResult.public_id,
                assetId:
                    cloudinaryResult.asset_id,
                format:
                    cloudinaryResult.format || "",
                bytes:
                    Math.trunc(Number(cloudinaryResult.bytes) || 0),
                width:
                    Math.trunc(Number(cloudinaryResult.width) || 0),
                height:
                    Math.trunc(Number(cloudinaryResult.height) || 0),
                duration:
                    Number(cloudinaryResult.duration) || 0,
                status: "pending",
                rightsConfirmed: true,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            }
        );

        elements.progress.value = 100;
        elements.progressLabel.textContent =
            "Submission saved successfully.";
        elements.uploadMessage.textContent =
            "✅ Media submitted. It will remain pending until the admin approves it.";

        elements.uploadForm.reset();
        updateFileRules();
        await loadCreatorSubmissions();
    } catch (error) {
        console.error("Creator upload error:", error);

        elements.uploadMessage.textContent = cloudinaryResult?.public_id
            ? `The file reached Cloudinary but the review record failed. Give this asset ID to the admin: ${cloudinaryResult.public_id}`
            : `❌ ${error.message}`;
    } finally {
        elements.uploadButton.disabled =
            !isSigningEndpointConfigured();
        elements.uploadButton.textContent =
            "Submit media for review";
    }
}

async function loadCreatorStudio(user) {
    const creatorSnapshot = await getDoc(
        doc(db, "creators", user.uid)
    );

    if (
        !creatorSnapshot.exists() ||
        creatorSnapshot.data().status !== "approved"
    ) {
        showState("locked");
        return;
    }

    currentCreator = creatorSnapshot.data();

    elements.channelName.textContent =
        currentCreator.channelName || "BharatVarsh Creator";

    elements.channelHandle.textContent =
        `@${currentCreator.channelHandle || "creator"}`;

    elements.uploadCount.textContent =
        String(Number(currentCreator.uploads) || 0);

    elements.followerCount.textContent =
        String(Number(currentCreator.followers) || 0);

    showState("approved");
    renderUploadServiceState();
    await loadCreatorSubmissions();
}

populateCategories();
updateFileRules();
renderUploadServiceState();

elements.mediaType.addEventListener("change", updateFileRules);
elements.file.addEventListener("change", previewSelectedFile);
elements.uploadForm.addEventListener("submit", submitCreatorMedia);

elements.signOut.addEventListener("click", async () => {
    await signOut(auth);
    window.location.replace("./index.html");
});

onAuthStateChanged(auth, async (user) => {
    if (!user) {
        currentUser = null;
        currentCreator = null;
        showState("signed-out");
        return;
    }

    currentUser = user;
    elements.signOut.hidden = false;

    try {
        await loadCreatorStudio(user);
    } catch (error) {
        console.error("Creator Studio access error:", error);
        showState("locked");
    }
});
