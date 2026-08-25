import {
    doc,
    getDoc,
    serverTimestamp,
    setDoc
} from "firebase/firestore";

import {
    onAuthStateChanged,
    signOut
} from "firebase/auth";

import {
    auth,
    db
} from "./firebase.js";

const elements = {
    loading: document.getElementById("profileLoading"),
    signedOut: document.getElementById("signedOutState"),
    content: document.getElementById("profileContent"),
    signOut: document.getElementById("profileSignOut"),
    avatar: document.getElementById("profileAvatar"),
    initial: document.getElementById("profileInitial"),
    name: document.getElementById("profileName"),
    handle: document.getElementById("profileHandle"),
    favouriteCount: document.getElementById(
        "profilePageFavouriteCount"
    ),
    downloadCount: document.getElementById(
        "profilePageDownloadCount"
    ),
    creatorMetric: document.getElementById(
        "profilePageCreatorStatus"
    ),
    favouritesGrid: document.getElementById(
        "profileFavouritesGrid"
    ),
    creatorBadge: document.getElementById(
        "creatorStatusBadge"
    ),
    creatorHeading: document.getElementById(
        "creatorHeading"
    ),
    creatorDescription: document.getElementById(
        "creatorDescription"
    ),
    creatorButton: document.getElementById(
        "createCreatorChannel"
    ),
    toast: document.getElementById("profileToast")
};

let currentUser = null;
let currentProfile = {};
let toastTimer = null;

function getInitial(user) {
    const source =
        user?.displayName ||
        user?.email ||
        "U";

    return source.trim().charAt(0).toUpperCase() || "U";
}

function makeHandle(user, profile) {
    if (profile?.username) {
        return profile.username;
    }

    const source =
        user?.displayName ||
        user?.email?.split("@")[0] ||
        "bharatvarsh-user";

    const base = source
        .toLowerCase()
        .normalize("NFKD")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 24) || "bharatvarsh-user";

    const suffix = String(user?.uid || "user")
        .slice(-5)
        .toLowerCase();

    return `${base}-${suffix}`;
}

function getMediaURL(media) {
    return media?.imageUrl ||
        media?.imageURL ||
        media?.downloadURL ||
        media?.url ||
        "";
}

function showToast(message) {
    if (!elements.toast) return;

    window.clearTimeout(toastTimer);
    elements.toast.textContent = message;
    elements.toast.hidden = false;

    toastTimer = window.setTimeout(() => {
        elements.toast.hidden = true;
    }, 3600);
}

function setProfileAvatar(user) {
    if (user.photoURL) {
        elements.avatar.src = user.photoURL;
        elements.avatar.hidden = false;
        elements.initial.hidden = true;
        return;
    }

    elements.avatar.hidden = true;
    elements.initial.textContent = getInitial(user);
    elements.initial.hidden = false;
}

function setActiveTab(tabName) {
    const selected = [
        "overview",
        "favourites",
        "creator"
    ].includes(tabName)
        ? tabName
        : "overview";

    document.querySelectorAll("[data-profile-tab]")
        .forEach((button) => {
            const isActive =
                button.dataset.profileTab === selected;

            button.classList.toggle("active", isActive);
            button.setAttribute(
                "aria-selected",
                String(isActive)
            );
        });

    document.querySelectorAll("[data-profile-panel]")
        .forEach((panel) => {
            panel.hidden =
                panel.dataset.profilePanel !== selected;
        });
}

function renderCreatorState(profile) {
    const isDraft =
        profile.creatorStatus === "draft";

    elements.creatorMetric.textContent =
        isDraft ? "Draft" : "Not created";

    elements.creatorBadge.textContent =
        isDraft ? "Private draft" : "Not created";

    elements.creatorHeading.textContent =
        isDraft
            ? profile.channelName || "Creator channel draft"
            : "Create your BharatVarsh creator channel";

    elements.creatorDescription.textContent =
        isDraft
            ? `@${profile.channelHandle || profile.username} is reserved in your private account. Public verification and uploads come next.`
            : "Reserve a private channel draft now. Public uploads, followers and verification will be enabled in the next creator milestone.";

    elements.creatorButton.textContent =
        isDraft ? "Channel draft created" : "Create channel draft";

    elements.creatorButton.disabled =
        isDraft;
}

function createFavouriteCard(media) {
    const card = document.createElement("article");
    card.className = "profile-favourite-card";

    const image = document.createElement("img");
    image.src = getMediaURL(media);
    image.alt = media.title || media.name || "Favourite wallpaper";
    image.loading = "lazy";

    image.addEventListener("error", () => {
        image.removeAttribute("src");
        image.alt = "Wallpaper image unavailable";
    });

    const information = document.createElement("div");
    const title = document.createElement("h3");
    const category = document.createElement("p");

    title.textContent =
        media.title || media.name || "Untitled wallpaper";

    category.textContent =
        media.category || "Other";

    information.append(title, category);
    card.append(image, information);

    return card;
}

async function loadFavourites(favouriteIds) {
    elements.favouritesGrid.replaceChildren();

    if (!favouriteIds.length) {
        const empty = document.createElement("p");
        empty.className = "empty-panel";
        empty.textContent =
            "You have not saved any favourite wallpapers yet.";
        elements.favouritesGrid.append(empty);
        return;
    }

    const snapshots = await Promise.all(
        favouriteIds.slice(0, 12).map((wallpaperId) =>
            getDoc(doc(db, "wallpapers", wallpaperId))
                .catch(() => null)
        )
    );

    const wallpapers = snapshots
        .filter((snapshot) => snapshot?.exists())
        .map((snapshot) => ({
            id: snapshot.id,
            ...snapshot.data()
        }));

    if (!wallpapers.length) {
        const empty = document.createElement("p");
        empty.className = "empty-panel";
        empty.textContent =
            "Your saved wallpapers are currently unavailable.";
        elements.favouritesGrid.append(empty);
        return;
    }

    wallpapers.forEach((wallpaper) => {
        elements.favouritesGrid.append(
            createFavouriteCard(wallpaper)
        );
    });
}

async function loadProfile(user) {
    const userReference =
        doc(db, "users", user.uid);

    let snapshot =
        await getDoc(userReference);

    if (!snapshot.exists()) {
        await setDoc(userReference, {
            uid: user.uid,
            name: user.displayName || "BharatVarsh User",
            email: user.email || "",
            photoURL: user.photoURL || "",
            favourites: [],
            downloads: 0,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        });

        snapshot = await getDoc(userReference);
    }

    currentProfile = snapshot.data() || {};

    const username =
        makeHandle(user, currentProfile);

    if (!currentProfile.username) {
        await setDoc(
            userReference,
            {
                username,
                updatedAt: serverTimestamp()
            },
            { merge: true }
        );

        currentProfile.username = username;
    }

    const favouriteIds = Array.isArray(
        currentProfile.favourites
    )
        ? currentProfile.favourites
        : [];

    elements.name.textContent =
        user.displayName ||
        currentProfile.name ||
        "BharatVarsh User";

    elements.handle.textContent =
        `@${username}`;

    elements.favouriteCount.textContent =
        String(favouriteIds.length);

    elements.downloadCount.textContent =
        String(Number(currentProfile.downloads) || 0);

    setProfileAvatar(user);
    renderCreatorState(currentProfile);
    await loadFavourites(favouriteIds);
}

async function createCreatorDraft() {
    if (!currentUser || currentProfile.creatorStatus === "draft") {
        return;
    }

    const channelName =
        currentUser.displayName ||
        currentProfile.name ||
        "BharatVarsh Creator";

    const channelHandle =
        currentProfile.username ||
        makeHandle(currentUser, currentProfile);

    elements.creatorButton.disabled = true;
    elements.creatorButton.textContent = "Creating…";

    try {
        await setDoc(
            doc(db, "users", currentUser.uid),
            {
                creatorStatus: "draft",
                channelName,
                channelHandle,
                creatorCreatedAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            },
            { merge: true }
        );

        currentProfile = {
            ...currentProfile,
            creatorStatus: "draft",
            channelName,
            channelHandle
        };

        renderCreatorState(currentProfile);
        showToast("Creator channel draft created successfully.");
    } catch (error) {
        console.error("Creator draft error:", error);
        elements.creatorButton.disabled = false;
        elements.creatorButton.textContent = "Create channel draft";
        showToast("Creator channel draft could not be created.");
    }
}

document.querySelectorAll("[data-profile-tab]")
    .forEach((button) => {
        button.addEventListener("click", () => {
            const tab = button.dataset.profileTab;
            setActiveTab(tab);
            window.history.replaceState(
                null,
                "",
                tab === "overview" ? "./profile.html" : `#${tab}`
            );
        });
    });

window.addEventListener("hashchange", () => {
    setActiveTab(window.location.hash.slice(1));
});

elements.creatorButton.addEventListener(
    "click",
    createCreatorDraft
);

elements.signOut.addEventListener("click", async () => {
    await signOut(auth);
    window.location.replace("./index.html");
});

onAuthStateChanged(auth, async (user) => {
    elements.loading.hidden = true;

    if (!user) {
        currentUser = null;
        elements.signedOut.hidden = false;
        elements.content.hidden = true;
        elements.signOut.hidden = true;
        return;
    }

    currentUser = user;
    elements.signedOut.hidden = true;
    elements.content.hidden = false;
    elements.signOut.hidden = false;

    try {
        await loadProfile(user);
        setActiveTab(window.location.hash.slice(1));
    } catch (error) {
        console.error("Profile load error:", error);
        showToast("Your profile could not be loaded.");
    }
});
