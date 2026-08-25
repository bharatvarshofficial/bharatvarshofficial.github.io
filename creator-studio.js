import {
    doc,
    getDoc
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
    loading: document.getElementById("studioLoading"),
    signedOut: document.getElementById("studioSignedOut"),
    locked: document.getElementById("studioLocked"),
    content: document.getElementById("studioContent"),
    signOut: document.getElementById("studioSignOut"),
    channelName: document.getElementById("studioChannelName"),
    channelHandle: document.getElementById("studioChannelHandle"),
    uploadCount: document.getElementById("studioUploadCount"),
    followerCount: document.getElementById("studioFollowerCount")
};

function showState(state) {
    elements.loading.hidden = state !== "loading";
    elements.signedOut.hidden = state !== "signed-out";
    elements.locked.hidden = state !== "locked";
    elements.content.hidden = state !== "approved";
    elements.signOut.hidden = state === "signed-out";
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

    const creator = creatorSnapshot.data();

    elements.channelName.textContent =
        creator.channelName || "BharatVarsh Creator";

    elements.channelHandle.textContent =
        `@${creator.channelHandle || "creator"}`;

    elements.uploadCount.textContent =
        String(Number(creator.uploads) || 0);

    elements.followerCount.textContent =
        String(Number(creator.followers) || 0);

    showState("approved");
}

elements.signOut.addEventListener("click", async () => {
    await signOut(auth);
    window.location.replace("./index.html");
});

onAuthStateChanged(auth, async (user) => {
    if (!user) {
        showState("signed-out");
        return;
    }

    elements.signOut.hidden = false;

    try {
        await loadCreatorStudio(user);
    } catch (error) {
        console.error("Creator Studio access error:", error);
        showState("locked");
    }
});
