import {
    collection,
    getDocs,
    doc,
    query,
    where
} from "firebase/firestore";
import { db } from "./firebase.js";

const elements = {
    loading: document.getElementById("creatorLoading"),
    error: document.getElementById("creatorError"),
    errorText: document.getElementById("creatorErrorText"),
    profile: document.getElementById("creatorProfile"),
    avatar: document.getElementById("creatorAvatar"),
    name: document.getElementById("creatorName"),
    handle: document.getElementById("creatorHandle"),
    bio: document.getElementById("creatorBio"),
    website: document.getElementById("creatorWebsite"),
    uploads: document.getElementById("creatorUploads"),
    uploadCount: document.getElementById("creatorUploadCount"),
    grid: document.getElementById("creatorGrid"),
    empty: document.getElementById("creatorEmpty")
};

function getHandle() {
    return new URLSearchParams(window.location.search).get("handle")?.trim().toLowerCase() || "";
}

function getInitial(name) {
    return (name || "B").trim().charAt(0).toUpperCase();
}

function showError(message) {
    elements.loading.hidden = true;
    elements.errorText.textContent = message;
    elements.error.hidden = false;
}

function renderUploads(creations) {
    elements.uploadCount.textContent = `${creations.length} published`;
    elements.grid.replaceChildren();

    creations.forEach((creation) => {
        const imageUrl = creation.imageUrl || creation.imageURL || creation.image || creation.url || creation.downloadURL;
        const videoUrl = creation.videoUrl || (creation.resourceType === "video" ? creation.secureUrl : "");
        const mediaUrl = videoUrl || imageUrl;
        if (!mediaUrl) return;

        const card = document.createElement("article");
        card.className = "creator-card";

        const media = videoUrl
            ? document.createElement("video")
            : document.createElement("img");

        media.src = mediaUrl;
        media.loading = "lazy";

        if (media instanceof HTMLVideoElement) {
            media.controls = true;
            media.preload = "metadata";
            media.playsInline = true;
        } else {
            media.alt = creation.title || creation.name || "Creator creation";
            media.decoding = "async";
        }

        const content = document.createElement("div");
        content.className = "creator-card-content";
        const title = document.createElement("h3");
        title.textContent = creation.title || creation.name || "Untitled creation";
        const category = document.createElement("p");
        const mediaType = creation.publicCollection || creation.mediaType || "creation";
        category.textContent = `${creation.category || "Other"} · ${mediaType}`;
        content.append(title, category);
        card.append(media, content);
        elements.grid.append(card);
    });

    elements.uploads.hidden = creations.length === 0;
    elements.empty.hidden = creations.length !== 0;
}

async function loadCreator() {
    const handle = getHandle();
    if (!handle) {
        showError("A creator handle is required to open a channel.");
        return;
    }

    try {
        const creatorSnapshot = await getDocs(
            query(collection(db, "creators"), where("channelHandle", "==", handle))
        );
        const creatorEntry = creatorSnapshot.docs.find((entry) =>
            ["active", "approved"].includes(entry.data().status)
        );
        if (!creatorEntry) {
            showError("This creator channel is not available.");
            return;
        }
        const creator = creatorEntry.data();
        elements.name.textContent = creator.channelName || "BharatVarsh Creator";
        elements.handle.textContent = `@${creator.channelHandle || handle}`;
        elements.bio.textContent = creator.bio || "Creator on BharatVarshOfficial.";
        elements.avatar.textContent = getInitial(creator.channelName);
        if (creator.website) {
            elements.website.href = creator.website;
            elements.website.textContent = "Visit creator website";
            elements.website.hidden = false;
        }
        elements.profile.hidden = false;
        const collectionNames = ["wallpapers", "images", "videos"];
        const uploadSnapshots = await Promise.all(
            collectionNames.map((collectionName) =>
                getDocs(
                    query(
                        collection(db, collectionName),
                        where("creatorId", "==", creatorEntry.id)
                    )
                )
            )
        );

        const creations = uploadSnapshots.flatMap((snapshot, index) =>
            snapshot.docs.map((entry) => ({
                id: entry.id,
                publicCollection: collectionNames[index],
                ...entry.data()
            }))
        );

        creations.sort((left, right) =>
            (right.createdAt?.seconds || 0) - (left.createdAt?.seconds || 0)
        );

        renderUploads(creations);
        elements.loading.hidden = true;
    } catch (error) {
        console.error("Creator channel loading error:", error);
        showError("We could not load this channel right now. Please try again later.");
    }
}

loadCreator();
