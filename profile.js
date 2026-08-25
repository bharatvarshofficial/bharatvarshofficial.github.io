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
    creatorApplicationForm: document.getElementById(
        "creatorApplicationForm"
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
    creatorApplicationStatus: document.getElementById(
        "creatorApplicationStatus"
    ),
    creatorApplicationBadge: document.getElementById(
        "creatorApplicationBadge"
    ),
    creatorApplicationHeading: document.getElementById(
        "creatorApplicationHeading"
    ),
    creatorApplicationMessage: document.getElementById(
        "creatorApplicationMessage"
    ),
    submitCreatorApplication: document.getElementById(
        "submitCreatorApplication"
    ),
    toast: document.getElementById("profileToast")
};

let currentUser = null;
let currentProfile = {};
let currentApplication = null;
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

function renderCreatorState(profile, application = null) {
    const status =
        application?.status ||
        profile.creatorStatus ||
        "not-created";

    const hasDraft =
        status !== "not-created";

    const labels = {
        draft: "Draft",
        pending: "Pending review",
        approved: "Approved",
        rejected: "Changes required"
    };

    elements.creatorMetric.textContent =
        labels[status] || "Not created";

    elements.creatorBadge.textContent =
        status === "draft"
            ? "Private draft"
            : (labels[status] || "Not created");

    elements.creatorHeading.textContent =
        hasDraft
            ? application?.channelName ||
                profile.channelName ||
                "Creator channel draft"
            : "Create your BharatVarsh creator channel";

    elements.creatorDescription.textContent =
        hasDraft
            ? `@${application?.channelHandle || profile.channelHandle || profile.username} is linked to your private account.`
            : "Reserve a private channel draft now. Public uploads, followers and verification will be enabled after approval.";

    const buttonLabels = {
        draft: "Complete application below",
        pending: "Awaiting admin review",
        approved: "Open Creator Studio",
        rejected: "Update application below"
    };

    elements.creatorButton.textContent =
        buttonLabels[status] ||
        "Create channel draft";

    elements.creatorButton.disabled =
        hasDraft && status !== "approved";

    const showApplicationForm =
        status === "draft" ||
        status === "rejected";

    elements.creatorApplicationForm.hidden =
        !showApplicationForm;

    elements.creatorApplicationStatus.hidden =
        !["pending", "approved", "rejected"].includes(status);

    if (showApplicationForm) {
        elements.creatorChannelName.value =
            application?.channelName ||
            profile.channelName || "";
        elements.creatorChannelHandle.value =
            application?.channelHandle ||
            profile.channelHandle ||
            profile.username || "";
        elements.creatorCategory.value =
            application?.category || "";
        elements.creatorWebsite.value =
            application?.website || "";
        elements.creatorBio.value =
            application?.bio || "";
    }

    if (status === "pending") {
        elements.creatorApplicationBadge.textContent =
            "Pending review";
        elements.creatorApplicationHeading.textContent =
            "Your creator application is with the admin";
        elements.creatorApplicationMessage.textContent =
            "Uploads will unlock after the channel information and ownership declaration are approved.";
    }

    if (status === "approved") {
        elements.creatorApplicationBadge.textContent =
            "Approved creator";
        elements.creatorApplicationHeading.textContent =
            "Your creator channel is approved";
        elements.creatorApplicationMessage.textContent =
            "Creator Studio and secure uploads are the next activation step.";
    }

    if (status === "rejected") {
        elements.creatorApplicationBadge.textContent =
            "Changes required";
        elements.creatorApplicationHeading.textContent =
            "Update your creator application";
        elements.creatorApplicationMessage.textContent =
            application?.reviewNote ||
            "Review your channel information below and submit it again.";
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
        const applicationSnapshot =
            await getDoc(
                doc(
                    db,
                    "creatorApplications",
                    user.uid
                )
            );

        currentApplication =
            applicationSnapshot.exists()
                ? applicationSnapshot.data()
                : null;
    } catch (error) {
        console.warn(
            "Creator application is not available yet:",
            error
        );
        currentApplication = null;
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
        currentApplication
    );
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

async function submitCreatorApplication(event) {
    event.preventDefault();

    if (!currentUser) return;

    const channelName =
        elements.creatorChannelName.value.trim();
    const channelHandle =
        elements.creatorChannelHandle.value.trim();
    const category =
        elements.creatorCategory.value;
    const website =
        elements.creatorWebsite.value.trim();
    const bio =
        elements.creatorBio.value.trim();

    if (
        !channelName ||
        !channelHandle ||
        !category ||
        bio.length < 20
    ) {
        showToast(
            "Complete every required field and write at least 20 characters in the description."
        );
        return;
    }

    const application = {
        uid: currentUser.uid,
        channelName,
        channelHandle,
        category,
        website,
        bio,
        rightsConfirmed: true,
        status: "pending",
        submittedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
    };

    elements.submitCreatorApplication.disabled = true;
    elements.submitCreatorApplication.textContent =
        "Submitting…";

    try {
        await setDoc(
            doc(
                db,
                "creatorApplications",
                currentUser.uid
            ),
            application,
            { merge: true }
        );

        await setDoc(
            doc(db, "users", currentUser.uid),
            {
                creatorStatus: "pending",
                channelName,
                channelHandle,
                updatedAt: serverTimestamp()
            },
            { merge: true }
        );

        currentApplication = {
            ...application,
            submittedAt: new Date(),
            updatedAt: new Date()
        };

        currentProfile = {
            ...currentProfile,
            creatorStatus: "pending",
            channelName,
            channelHandle
        };

        renderCreatorState(
            currentProfile,
            currentApplication
        );

        showToast(
            "Creator application submitted for admin verification."
        );
    } catch (error) {
        console.error("Creator application error:", error);
        showToast(
            "Creator application could not be submitted. Deploy the new Firestore rules and try again."
        );
    } finally {
        elements.submitCreatorApplication.disabled = false;
        elements.submitCreatorApplication.textContent =
            "Submit for admin verification";
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
        const status =
            currentApplication?.status ||
            currentProfile.creatorStatus;

        if (status === "approved") {
            window.location.assign(
                "./creator-studio.html"
            );
            return;
        }

        createCreatorDraft();
    }
);

elements.creatorApplicationForm.addEventListener(
    "submit",
    submitCreatorApplication
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
