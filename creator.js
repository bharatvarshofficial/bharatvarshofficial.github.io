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

function renderUploads(wallpapers) {
    elements.uploadCount.textContent = `${wallpapers.length} published`;
    elements.grid.replaceChildren();
    wallpapers.forEach((wallpaper) => {
        const imageUrl = wallpaper.imageUrl || wallpaper.imageURL || wallpaper.image || wallpaper.url || wallpaper.downloadURL;
        if (!imageUrl) return;
        const card = document.createElement("article");
        card.className = "creator-card";
        const image = document.createElement("img");
        image.src = imageUrl;
        image.alt = wallpaper.title || wallpaper.name || "Creator wallpaper";
        image.loading = "lazy";
        image.decoding = "async";
        const content = document.createElement("div");
        content.className = "creator-card-content";
        const title = document.createElement("h3");
        title.textContent = wallpaper.title || wallpaper.name || "Indian wallpaper";
        const category = document.createElement("p");
        category.textContent = wallpaper.category || "Indian culture";
        content.append(title, category);
        card.append(image, content);
        elements.grid.append(card);
    });
    elements.uploads.hidden = wallpapers.length === 0;
    elements.empty.hidden = wallpapers.length !== 0;
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
        const creatorEntry = creatorSnapshot.docs.find((entry) => entry.data().status === "approved");
        if (!creatorEntry) {
            showError("This creator channel is not available.");
            return;
        }
        const creator = creatorEntry.data();
        elements.name.textContent = creator.channelName || "BharatVarsh Creator";
        elements.handle.textContent = `@${creator.channelHandle || handle}`;
        elements.bio.textContent = creator.bio || "Published wallpapers celebrating Bharat.";
        elements.avatar.textContent = getInitial(creator.channelName);
        if (creator.website) {
            elements.website.href = creator.website;
            elements.website.textContent = "Visit creator website";
            elements.website.hidden = false;
        }
        elements.profile.hidden = false;
        const uploadsSnapshot = await getDocs(
            query(collection(db, "wallpapers"), where("creatorId", "==", creatorEntry.id))
        );
        renderUploads(uploadsSnapshot.docs.map((entry) => ({ id: entry.id, ...entry.data() })));
        elements.loading.hidden = true;
    } catch (error) {
        console.error("Creator channel loading error:", error);
        showError("We could not load this channel right now. Please try again later.");
    }
}

loadCreator();
