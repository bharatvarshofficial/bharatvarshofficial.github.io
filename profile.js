import {
    doc,
    getDoc,
    serverTimestamp,
    setDoc,
    writeBatch
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
    CREATOR_PROFIT_SHARE_RATE,
    DEFAULT_MINIMUM_PAYOUT_INR
} from "./creator-earnings-policy.js";

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
    creatorChannelForm: document.getElementById(
        "creatorChannelForm"
    ),
    creatorChannelName: document.getElementById(
        "creatorChannelName"
    ),
    creatorChannelHandle: document.getElementById(
        "creatorChannelHandle"
    ),
    creatorCategory: document.getElementById(
        "creatorCategory"
    ),
    creatorWebsite: document.getElementById(
        "creatorWebsite"
    ),
    creatorBio: document.getElementById("creatorBio"),
    creatorChannelStatus: document.getElementById(
        "creatorChannelStatus"
    ),
    createCreatorChannelNow: document.getElementById(
        "createCreatorChannelNow"
    ),
    toast: document.getElementById("profileToast")
};

let currentUser = null;
let currentProfile = {};
let currentCreator = null;
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

function renderCreatorState(profile, creator = null) {
    const status = creator?.status || profile.creatorStatus || "not-created";
    const isActive = ["active", "approved"].includes(status);

    elements.creatorMetric.textContent = isActive ? "Active" : "Not created";
    elements.creatorBadge.textContent = isActive ? "Active creator" : "Instant setup";

    elements.creatorHeading.textContent = isActive
        ? creator?.channelName || profile.channelName || "Your creator channel"
        : "Create your BharatVarsh creator channel";

    elements.creatorDescription.textContent = isActive
        ? `@${creator?.channelHandle || profile.channelHandle || profile.username} can publish wallpapers, photos, images and videos through Creator Studio.`
        : "Create your channel instantly. No admin approval is required to become a creator or open Creator Studio.";

    elements.creatorButton.textContent = isActive
        ? "Open Creator Studio"
        : "Create channel";

    elements.creatorButton.disabled = false;
    elements.creatorChannelForm.hidden = isActive;
    elements.creatorChannelStatus.hidden = !isActive;

    if (!isActive) {
        elements.creatorChannelName.value =
            creator?.channelName ||
            profile.channelName ||
            currentUser?.displayName ||
            "";
        elements.creatorChannelHandle.value =
            creator?.channelHandle ||
            profile.channelHandle ||
            profile.username ||
            "";
        elements.creatorCategory.value = creator?.category || "";
        elements.creatorWebsite.value = creator?.website || "";
        elements.creatorBio.value = creator?.bio || "";
    }
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

    try {
        const creatorSnapshot = await getDoc(
            doc(db, "creators", user.uid)
        );

        currentCreator = creatorSnapshot.exists()
            ? creatorSnapshot.data()
            : null;
    } catch (error) {
        console.warn("Creator channel is not available yet:", error);
        currentCreator = null;
    }

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
    renderCreatorState(
        currentProfile,
        currentCreator
    );
    await loadFavourites(favouriteIds);
}

async function createCreatorChannel(event) {
    event.preventDefault();

    if (!currentUser || currentCreator) return;

    const channelName = elements.creatorChannelName.value.trim();
    const channelHandle = elements.creatorChannelHandle.value.trim();
    const category = elements.creatorCategory.value;
    const website = elements.creatorWebsite.value.trim();
    const bio = elements.creatorBio.value.trim();

    if (
        !channelName ||
        !channelHandle ||
        !category ||
        bio.length < 20 ||
        !elements.creatorRightsConfirmation.checked
    ) {
        showToast(
            "Complete the required fields, write at least 20 characters, and confirm your content rights."
        );
        return;
    }

    elements.createCreatorChannelNow.disabled = true;
    elements.createCreatorChannelNow.textContent = "Creating…";

    try {
        const creatorReference = doc(db, "creators", currentUser.uid);
        const earningsReference = doc(db, "creatorEarnings", currentUser.uid);
        const userReference = doc(db, "users", currentUser.uid);
        const earningsSnapshot = await getDoc(earningsReference);
        const batch = writeBatch(db);

        const creator = {
            uid: currentUser.uid,
            channelName,
            channelHandle,
            category,
            website,
            bio,
            status: "active",
            uploads: 0,
            followers: 0,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        };

        batch.set(creatorReference, creator);
        batch.set(
            userReference,
            {
                creatorStatus: "active",
                channelName,
                channelHandle,
                creatorCreatedAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            },
            { merge: true }
        );

        if (!earningsSnapshot.exists()) {
            batch.set(earningsReference, {
                creatorId: currentUser.uid,
                currency: "INR",
                monetizationStatus: "not_eligible",
                eligibleRevenue: 0,
                attributedPlatformProfit: 0,
                profitShareRate: CREATOR_PROFIT_SHARE_RATE,
                estimatedEarnings: 0,
                availableBalance: 0,
                lifetimeEarnings: 0,
                paidOut: 0,
                minimumPayout: DEFAULT_MINIMUM_PAYOUT_INR,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            });
        }

        await batch.commit();

        currentCreator = {
            ...creator,
            createdAt: new Date(),
            updatedAt: new Date()
        };
        currentProfile = {
            ...currentProfile,
            creatorStatus: "active",
            channelName,
            channelHandle
        };

        renderCreatorState(currentProfile, currentCreator);
        showToast("Creator channel created. Creator Studio is ready now.");
    } catch (error) {
        console.error("Creator channel creation error:", error);
        showToast(
            "Creator channel could not be created. Deploy the latest Firestore rules and try again."
        );
    } finally {
        elements.createCreatorChannelNow.disabled = false;
        elements.createCreatorChannelNow.textContent = "Create channel instantly";
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
    () => {
        const status = currentCreator?.status || currentProfile.creatorStatus;

        if (["active", "approved"].includes(status)) {
            window.location.assign("./creator-studio.html");
            return;
        }

        elements.creatorChannelForm.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });
        elements.creatorChannelName.focus();
    }
);

elements.creatorChannelForm.addEventListener(
    "submit",
    createCreatorChannel
);

elements.avatar.addEventListener("error", () => {
    elements.avatar.hidden = true;
    elements.initial.textContent = getInitial(currentUser);
    elements.initial.hidden = false;
});

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
