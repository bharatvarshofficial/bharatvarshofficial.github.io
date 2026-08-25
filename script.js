// ============================================================
// BharatVarshOfficial
// Premium Indian Wallpapers
// script.js - COMPLETE UPDATED VERSION
// ============================================================


// ============================================================
// 1. FIREBASE IMPORTS + GLOBAL STATE
// ============================================================

import {
    collection,
    getDocs,
    getDoc,
    doc,
    setDoc,
    updateDoc,
    increment,
    arrayUnion,
    arrayRemove,
    serverTimestamp
} from "firebase/firestore";

import {
    onAuthStateChanged,
    signInWithPopup,
    GoogleAuthProvider,
    signOut
} from "firebase/auth";

import {
    db,
    auth
} from "./firebase.js";

import {
    CATEGORY_LABELS,
    canonicalizeCategory,
    categoriesEqual,
    mergeCategoryLabels
} from "./categories.js";

import {
    getDeviceRecommendation,
    getWallpaperFitMessage
} from "./device-utils.js";


// ============================================================
// GLOBAL STATE
// ============================================================

const STATE = {

    initialized: false,

    currentUser: null,

    wallpapers: [],

    filteredWallpapers: [],

    categories: [],

    favourites: new Set(),

    userDownloads: 0,

    activeWallpaperId: null,

    deviceRecommendation: null,

    lastFocusedElement: null,

    currentCategory: "All",

    searchTerm: "",

    isDarkMode: false,

    isLoading: false,

    currentPage: 1,

    wallpapersPerPage: 12,

    unsubscribeAuth: null

};


// ============================================================
// DOM CACHE
// ============================================================

const DOM = {};


// ============================================================
// 2. WEBSITE INITIALIZATION
// ============================================================

document.addEventListener("DOMContentLoaded", async () => {

    try {

        cacheDOM();

        initializeWebsite();

        setupEventListeners();

        initializeDarkMode();

        initializeMobileMenu();

        initializeNewsletter();

        initializeAuthentication();

        await loadWallpapers();

        await loadCategories();

        STATE.initialized = true;

        debugLog("Website initialized successfully.");

    } catch (error) {

        console.error(
            "BharatVarshOfficial initialization error:",
            error
        );

        showToast(
            "Website load करताना समस्या आली.",
            "error"
        );
    } finally {

        hidePageLoader();
    }

});


// ============================================================
// CACHE DOM ELEMENTS
// ============================================================

function cacheDOM() {

    DOM.body =
        document.body;

    DOM.wallpaperGrid =
        document.querySelector(
            "#wallpaperGrid"
        ) ||
        document.querySelector(
            "#wallpaperGallery"
        ) ||
        document.querySelector(
            ".wallpaper-grid"
        ) ||
        document.querySelector(
            ".wallpapers-grid"
        ) ||
        document.querySelector(
            ".gallery"
        );

    DOM.categoryContainer =
        document.querySelector(
            "#categoryContainer"
        ) ||
        document.querySelector(
            ".category-container"
        ) ||
        document.querySelector(
            ".categories"
        );

    DOM.searchInput =
        document.querySelector(
            "#searchInput"
        ) ||
        document.querySelector(
            'input[type="search"]'
        );

    DOM.searchButton =
        document.querySelector(
            "#searchButton"
        ) ||
        document.querySelector(
            "#searchBtn"
        );

    DOM.loginButton =
        document.querySelector(
            "#loginButton"
        );

    DOM.logoutButton =
        document.querySelector(
            "#logoutButton"
        );

    DOM.googleLoginButton =
        document.querySelector(
            "#googleLoginButton"
        ) ||
        document.querySelector(
            "#google-login"
        ) ||
        document.querySelector(
            "#googleLoginBtn"
        );

    DOM.mobileLoginButton =
        document.querySelector(
            "#mobileLoginBtn"
        );

    DOM.loginModal =
        document.querySelector(
            "#loginModal"
        );

    DOM.loginClose =
        document.querySelector(
            "#loginClose"
        ) ||
        document.querySelector(
            ".login-close"
        );

    DOM.userProfile =
        document.querySelector(
            "#userProfile"
        ) ||
        document.querySelector(
            ".user-profile"
        );

    DOM.userName =
        document.querySelector(
            "#userName"
        );

    DOM.userEmail =
        document.querySelector(
            "#userEmail"
        );

    DOM.userPhoto =
        document.querySelector(
            "#userPhoto"
        );

    DOM.favouritesContainer =
        document.querySelector(
            "#favouritesContainer"
        );

    DOM.darkModeButton =
        document.querySelector(
            "#darkModeButton"
        ) ||
        document.querySelector(
            "#themeToggle"
        ) ||
        document.querySelector(
            "#darkMode"
        );

    DOM.mobileMenuButton =
        document.querySelector(
            "#mobileMenuButton"
        ) ||
        document.querySelector(
            "#menuBtn"
        ) ||
        document.querySelector(
            ".mobile-menu-button"
        ) ||
        document.querySelector(
            ".hamburger"
        );

    DOM.mobileMenu =
        document.querySelector(
            "#mobileMenu"
        ) ||
        document.querySelector(
            ".mobile-menu"
        ) ||
        document.querySelector(
            ".navbar"
        );

    DOM.newsletterForm =
        document.querySelector(
            "#newsletterForm"
        );

    DOM.newsletterEmail =
        document.querySelector(
            "#newsletterEmail"
        );

    DOM.loadMoreButton =
        document.querySelector(
            "#loadMoreButton"
        );

    DOM.wallpaperCount =
        document.querySelector(
            "#wallpaperCount"
        );

    DOM.loading =
        document.querySelector(
            "#loading"
        );

    DOM.backToTop =
        document.querySelector(
            "#backToTop"
        );

    DOM.loginSection =
        document.querySelector(
            "#login"
        );

    DOM.profileFavouriteCount =
        document.querySelector(
            "#profileFavouriteCount"
        );

    DOM.profileDownloadCount =
        document.querySelector(
            "#profileDownloadCount"
        );

    DOM.showFavouritesButton =
        document.querySelector(
            "#showFavouritesButton"
        );

    DOM.deviceResolution =
        document.querySelector(
            "#deviceResolution"
        );

    DOM.deviceOrientation =
        document.querySelector(
            "#deviceOrientation"
        );

    DOM.deviceAspectRatio =
        document.querySelector(
            "#deviceAspectRatio"
        );

    DOM.deviceAdvisorMessage =
        document.querySelector(
            "#deviceAdvisorMessage"
        );

    DOM.statWallpaperCount =
        document.querySelector(
            "#statWallpaperCount"
        );

    DOM.statDownloadCount =
        document.querySelector(
            "#statDownloadCount"
        );

    DOM.statCategoryCount =
        document.querySelector(
            "#statCategoryCount"
        );

    DOM.wallpaperModal =
        document.querySelector(
            "#wallpaperModal"
        );

    DOM.wallpaperModalClose =
        document.querySelector(
            "#wallpaperModalClose"
        );

    DOM.wallpaperModalImage =
        document.querySelector(
            "#wallpaperModalImage"
        );

    DOM.wallpaperModalCategory =
        document.querySelector(
            "#wallpaperModalCategory"
        );

    DOM.wallpaperModalTitle =
        document.querySelector(
            "#wallpaperModalTitle"
        );

    DOM.wallpaperModalDescription =
        document.querySelector(
            "#wallpaperModalDescription"
        );

    DOM.wallpaperModalResolution =
        document.querySelector(
            "#wallpaperModalResolution"
        );

    DOM.wallpaperModalDevice =
        document.querySelector(
            "#wallpaperModalDevice"
        );

    DOM.wallpaperModalFit =
        document.querySelector(
            "#wallpaperModalFit"
        );

    DOM.wallpaperModalFavourite =
        document.querySelector(
            "#wallpaperModalFavourite"
        );

    DOM.wallpaperModalDownload =
        document.querySelector(
            "#wallpaperModalDownload"
        );

}


// ============================================================
// WEBSITE INITIALIZATION
// ============================================================

function initializeWebsite() {

    updateCopyrightYear();

    updatePageTitle();

    updateDeviceAdvisor();

    updateSiteStats();

    debugLog(
        "BharatVarshOfficial started."
    );

}


// ============================================================
// PAGE LOADER
// ============================================================

function hidePageLoader() {

    const loader =
        document.querySelector(
            "#loader"
        );

    if (!loader) return;

    loader.classList.add(
        "loader-hidden"
    );

    window.setTimeout(
        () => loader.remove(),
        500
    );

}


// ============================================================
// 3. AUTHENTICATION + USER PROFILE
// ============================================================

function initializeAuthentication() {

    if (!auth) {

        console.error(
            "Firebase Auth is not available."
        );

        return;
    }


    STATE.unsubscribeAuth =
        onAuthStateChanged(
            auth,
            async (user) => {

                STATE.currentUser = user || null;

                if (user) {

                    debugLog(
                        "User logged in:",
                        user.email
                    );

                    await createOrUpdateUserProfile(
                        user
                    );

                    await loadUserFavourites();

                    updateUserUI(user);

                } else {

                    debugLog(
                        "No user logged in."
                    );

                    STATE.favourites.clear();

                    updateGuestUI();

                }

                renderWallpapers();

            }
        );

}


// ============================================================
// CREATE / UPDATE USER PROFILE
// ============================================================

async function createOrUpdateUserProfile(user) {

    if (!user) return;


    try {

        const userRef =
            doc(
                db,
                "users",
                user.uid
            );

        const snapshot =
            await getDoc(userRef);


        if (!snapshot.exists()) {

            await setDoc(
                userRef,
                {
                    uid: user.uid,

                    name:
                        user.displayName ||
                        "BharatVarsh User",

                    email:
                        user.email || "",

                    photoURL:
                        user.photoURL || "",

                    provider:
                        user.providerData?.[0]
                            ?.providerId ||
                        "unknown",

                    favourites: [],

                    downloads: 0,

                    createdAt:
                        serverTimestamp(),

                    updatedAt:
                        serverTimestamp()
                }
            );

        } else {

            await updateDoc(
                userRef,
                {
                    name:
                        user.displayName ||
                        "BharatVarsh User",

                    email:
                        user.email || "",

                    photoURL:
                        user.photoURL || "",

                    updatedAt:
                        serverTimestamp()
                }
            );

        }

    } catch (error) {

        console.error(
            "User profile error:",
            error
        );

    }

}


// ============================================================
// UPDATE USER UI
// ============================================================

function updateUserUI(user) {

    if (DOM.loginButton) {

        DOM.loginButton.style.display =
            "none";

    }

    if (DOM.googleLoginButton) {

        DOM.googleLoginButton.style.display =
            "none";

    }

    if (DOM.mobileLoginButton) {

        DOM.mobileLoginButton.style.display =
            "none";

    }


    if (DOM.logoutButton) {

        DOM.logoutButton.style.display =
            "inline-flex";

    }


    if (DOM.userProfile) {

        DOM.userProfile.hidden =
            false;

        DOM.userProfile.style.display =
            "flex";

    }


    if (DOM.userName) {

        DOM.userName.textContent =
            user.displayName ||
            "BharatVarsh User";

    }


    if (DOM.userEmail) {

        DOM.userEmail.textContent =
            user.email || "";

    }


    if (DOM.userPhoto) {

        if (user.photoURL) {

            DOM.userPhoto.src =
                user.photoURL;

            DOM.userPhoto.style.display =
                "block";

        } else {

            DOM.userPhoto.style.display =
                "none";

        }

    }

    updateProfileMetrics();

}


// ============================================================
// GUEST UI
// ============================================================

function updateGuestUI() {

    STATE.userDownloads = 0;

    if (DOM.loginButton) {

        DOM.loginButton.style.display =
            "inline-flex";

    }

    if (DOM.googleLoginButton) {

        DOM.googleLoginButton.style.display =
            "inline-flex";

    }

    if (DOM.mobileLoginButton) {

        DOM.mobileLoginButton.style.display =
            "inline-flex";

    }


    if (DOM.logoutButton) {

        DOM.logoutButton.style.display =
            "none";

    }


    if (DOM.userProfile) {

        DOM.userProfile.hidden =
            true;

        DOM.userProfile.style.display =
            "none";

    }

    updateProfileMetrics();

}


// ============================================================
// 4. WALLPAPER LOADING
// ============================================================

function getWallpaperTimestamp(wallpaper) {

    const value = wallpaper.createdAt;

    if (!value) return 0;

    if (typeof value.toMillis === "function") {
        return value.toMillis();
    }

    if (typeof value.seconds === "number") {
        return value.seconds * 1000;
    }

    const timestamp = new Date(value).getTime();

    return Number.isFinite(timestamp)
        ? timestamp
        : 0;

}


function sortWallpapersNewestFirst(wallpapers) {

    return [...wallpapers].sort(
        (first, second) => {

            const timestampDifference =
                getWallpaperTimestamp(second) -
                getWallpaperTimestamp(first);

            if (timestampDifference !== 0) {
                return timestampDifference;
            }

            const firstTitle = String(
                first.title || first.name || first.id || ""
            );

            const secondTitle = String(
                second.title || second.name || second.id || ""
            );

            return firstTitle.localeCompare(secondTitle);

        }
    );

}

async function loadWallpapers() {

    if (!DOM.wallpaperGrid) {

        console.warn(
            "Wallpaper grid not found."
        );

        return;
    }


    showLoading(true);

    STATE.isLoading = true;


    try {

        const wallpapersRef =
            collection(
                db,
                "wallpapers"
            );


        const snapshot =
            await getDocs(
                wallpapersRef
            );


        STATE.wallpapers =
            sortWallpapersNewestFirst(
                snapshot.docs.map(
                    document => {

                        const data =
                            document.data();


                        return {

                            id:
                                document.id,

                            ...data,

                            category:
                                canonicalizeCategory(
                                    data.category ||
                                    data.categoryKey
                                )

                        };

                    }
                )
            );


        STATE.filteredWallpapers =
            [...STATE.wallpapers];


        updateWallpaperCount();

        renderWallpapers();


        debugLog(
            `${STATE.wallpapers.length} wallpapers loaded.`
        );


    } catch (error) {

        console.error(
            "Wallpaper loading error:",
            error
        );


        /*
         * Fallback query.
         *
         * जर createdAt field नसलेल्या
         * documents मुळे query fail झाली
         * तर simple getDocs वापरतो.
         */

        try {

            const fallbackSnapshot =
                await getDocs(
                    collection(
                        db,
                        "wallpapers"
                    )
                );


            STATE.wallpapers =
                fallbackSnapshot.docs.map(
                    document => {

                        const data =
                            document.data();


                        return {
                            id:
                                document.id,

                            ...data,

                            category:
                                canonicalizeCategory(
                                    data.category ||
                                    data.categoryKey
                                )
                        };

                    }
                );


            STATE.filteredWallpapers =
                [...STATE.wallpapers];


            updateWallpaperCount();

            renderWallpapers();


        } catch (fallbackError) {

            console.error(
                "Fallback wallpaper loading failed:",
                fallbackError
            );


            showWallpaperError();

        }

    } finally {

        STATE.isLoading = false;

        showLoading(false);

    }

}


// ============================================================
// 5. WALLPAPER CARDS
// ============================================================

function renderWallpapers() {

    if (!DOM.wallpaperGrid) return;


    const wallpapers =
        STATE.filteredWallpapers;

    updateWallpaperCount();

    updateSiteStats();


    if (!wallpapers.length) {

        showNoWallpapers();

        return;

    }


    const start =
        0;

    const end =
        STATE.currentPage *
        STATE.wallpapersPerPage;


    const visibleWallpapers =
        wallpapers.slice(
            start,
            end
        );


    DOM.wallpaperGrid.innerHTML =
        visibleWallpapers
            .map(
                wallpaper =>
                    createWallpaperCard(
                        wallpaper
                    )
            )
            .join("");


    updateLoadMoreButton();

}


// ============================================================
// WALLPAPER IMAGE ERROR
// ============================================================

function handleWallpaperImageError(event) {

    const image =
        event.target.closest?.(
            ".wallpaper-image"
        );

    if (!image) return;

    const container =
        image.closest(
            ".wallpaper-image-container"
        );

    container?.classList.add(
        "image-error"
    );

    image.remove();

}


// ============================================================
// CREATE WALLPAPER CARD
// ============================================================

function createWallpaperCard(
    wallpaper
) {

    const id =
        escapeHTML(
            wallpaper.id
        );


    const title =
        escapeHTML(
            wallpaper.title ||
            wallpaper.name ||
            "Indian Wallpaper"
        );


    const category =
        escapeHTML(
            wallpaper.category ||
            "Indian"
        );


    const imageURL =
        wallpaper.imageUrl ||
        wallpaper.imageURL ||
        wallpaper.image ||
        wallpaper.url ||
        wallpaper.downloadURL ||
        "";


    const safeImageURL =
        escapeAttribute(
            imageURL
        );


    const isFavourite =
        STATE.favourites.has(
            wallpaper.id
        );


    const favouriteClass =
        isFavourite
            ? "active"
            : "";


    const favouriteIcon =
        isFavourite
            ? "♥"
            : "♡";


    return `

        <article
            class="card wallpaper-card"
            data-id="${id}"
        >

            <button
                type="button"
                class="wallpaper-image-container wallpaper-preview-trigger"
                data-action="preview"
                data-id="${id}"
                aria-label="Preview ${title}"
            >

                <img
                    class="wallpaper-image"
                    src="${safeImageURL}"
                    alt="${title}"
                    loading="lazy"
                    decoding="async"
                >

                <div
                    class="image-error-message"
                >
                    Image unavailable
                </div>

                <span class="preview-hint">
                    View details
                </span>

            </button>

            <h3>
                ${title}
            </h3>

            <p class="wallpaper-category">
                ${category}
            </p>

            <div class="card-buttons">

                <button
                    type="button"
                    class="favorite-btn favourite-btn ${favouriteClass}"
                    data-action="favourite"
                    data-id="${id}"
                    aria-label="${isFavourite ? "Remove from favourites" : "Add to favourites"}"
                    title="Favourite"
                >
                    ${favouriteIcon}
                </button>

                <button
                    type="button"
                    class="download-btn"
                    data-action="download"
                    data-id="${id}"
                    aria-label="Download ${title}"
                    title="Download"
                >
                    ↓ Download
                </button>

            </div>

        </article>

    `;

}


// ============================================================
// WALLPAPER CARD EVENTS
// ============================================================

function handleWallpaperGridClick(
    event
) {

    const button =
        event.target.closest(
            "[data-action]"
        );


    if (!button) return;


    const action =
        button.dataset.action;


    const wallpaperId =
        button.dataset.id;


    if (!wallpaperId) return;


    if (action === "favourite") {

        toggleFavourite(
            wallpaperId
        );

    }


    if (action === "download") {

        downloadWallpaper(
            wallpaperId
        );

    }


    if (action === "preview") {

        openWallpaperPreview(
            wallpaperId
        );

    }

}


// ============================================================
// 6. DOWNLOAD SYSTEM
// ============================================================

async function downloadWallpaper(
    wallpaperId
) {

    const wallpaper =
        STATE.wallpapers.find(
            item =>
                item.id === wallpaperId
        );


    if (!wallpaper) {

        showToast(
            "Wallpaper सापडला नाही.",
            "error"
        );

        return;

    }


    const imageURL =
        getWallpaperImageURL(
            wallpaper
        );


    if (!imageURL) {

        showToast(
            "Wallpaper image उपलब्ध नाही.",
            "error"
        );

        return;

    }


    try {

        const link =
            document.createElement(
                "a"
            );


        link.href =
            imageURL;


        const filename =
            createFilename(
                wallpaper.title ||
                wallpaper.name ||
                "BharatVarshWallpaper"
            );


        link.download =
            `${filename}.${getImageExtension(imageURL)}`;


        link.target =
            "_blank";


        link.rel =
            "noopener";


        document.body.appendChild(
            link
        );


        link.click();


        link.remove();


        await updateDownloadCount(
            wallpaperId
        );


        showToast(
            "Wallpaper download किंवा image open सुरू झाले.",
            "success"
        );


    } catch (error) {

        console.error(
            "Download error:",
            error
        );


        /*
         * Browser / CORS मुळे direct download
         * fail झाल्यास image नवीन tab मध्ये उघडतो.
         */

        window.open(
            imageURL,
            "_blank",
            "noopener"
        );


        showToast(
            "Wallpaper नवीन tab मध्ये उघडला.",
            "info"
        );

    }

}


// ============================================================
// UPDATE DOWNLOAD COUNT
// ============================================================

async function updateDownloadCount(
    wallpaperId
) {

    try {

        const wallpaperRef =
            doc(
                db,
                "wallpapers",
                wallpaperId
            );


        await updateDoc(
            wallpaperRef,
            {
                downloads:
                    increment(1),

                updatedAt:
                    serverTimestamp()
            }
        );


        if (STATE.currentUser) {

            const userRef =
                doc(
                    db,
                    "users",
                    STATE.currentUser.uid
                );


            await updateDoc(
                userRef,
                {
                    downloads:
                        increment(1)
                }
            );

            STATE.userDownloads += 1;

            updateProfileMetrics();

        }

        const wallpaper =
            STATE.wallpapers.find(
                item => item.id === wallpaperId
            );

        if (wallpaper) {

            wallpaper.downloads =
                Math.max(
                    0,
                    Number(wallpaper.downloads) || 0
                ) + 1;

        }

        updateSiteStats();

    } catch (error) {

        console.warn(
            "Download count update failed:",
            error
        );

    }

}


// ============================================================
// 7. FIRESTORE FAVOURITE SYSTEM
// ============================================================

async function loadUserFavourites() {

    if (!STATE.currentUser) {

        STATE.favourites.clear();

        STATE.userDownloads = 0;

        updateProfileMetrics();

        return;

    }


    try {

        const userRef =
            doc(
                db,
                "users",
                STATE.currentUser.uid
            );


        const snapshot =
            await getDoc(
                userRef
            );


        if (
            snapshot.exists()
        ) {

            const data =
                snapshot.data();


            const favourites =
                Array.isArray(
                    data.favourites
                )
                    ? data.favourites
                    : [];


            STATE.favourites =
                new Set(
                    favourites
                );

            STATE.userDownloads =
                Number.isFinite(
                    Number(data.downloads)
                )
                    ? Math.max(
                        0,
                        Number(data.downloads)
                    )
                    : 0;

        } else {

            STATE.favourites.clear();

            STATE.userDownloads = 0;

        }

        updateProfileMetrics();

    } catch (error) {

        console.error(
            "Favourite loading error:",
            error
        );

        STATE.userDownloads = 0;

        updateProfileMetrics();

    }

}


// ============================================================
// TOGGLE FAVOURITE
// ============================================================

async function toggleFavourite(
    wallpaperId
) {

    if (!STATE.currentUser) {

        showLoginRequired();

        return;

    }


    const userRef =
        doc(
            db,
            "users",
            STATE.currentUser.uid
        );


    const isFavourite =
        STATE.favourites.has(
            wallpaperId
        );


    try {

        if (isFavourite) {

            await updateDoc(
                userRef,
                {
                    favourites:
                        arrayRemove(
                            wallpaperId
                        ),

                    updatedAt:
                        serverTimestamp()
                }
            );


            STATE.favourites.delete(
                wallpaperId
            );


            showToast(
                "Favourite मधून remove केले.",
                "info"
            );


        } else {

            await updateDoc(
                userRef,
                {
                    favourites:
                        arrayUnion(
                            wallpaperId
                        ),

                    updatedAt:
                        serverTimestamp()
                }
            );


            STATE.favourites.add(
                wallpaperId
            );


            showToast(
                "Favourite मध्ये save केले ❤️",
                "success"
            );

        }


        updateProfileMetrics();

        renderWallpapers();

        updateWallpaperModalFavouriteState();


    } catch (error) {

        console.error(
            "Favourite error:",
            error
        );


        showToast(
            "Favourite update करता आले नाही.",
            "error"
        );

    }

}


// ============================================================
// SHOW USER FAVOURITES
// ============================================================

function showFavourites() {

    if (!STATE.currentUser) {

        showLoginRequired();

        return;

    }


    STATE.filteredWallpapers =
        STATE.wallpapers.filter(
            wallpaper =>
                STATE.favourites.has(
                    wallpaper.id
                )
        );


    STATE.currentCategory =
        "Favourites";


    STATE.searchTerm =
        "";


    STATE.currentPage =
        1;


    renderWallpapers();

}


// ============================================================
// SHOW ALL WALLPAPERS
// ============================================================

function showAllWallpapers() {

    STATE.currentCategory =
        "All";


    STATE.searchTerm =
        "";


    STATE.filteredWallpapers =
        [...STATE.wallpapers];


    STATE.currentPage =
        1;


    renderWallpapers();

}


// ============================================================
// 8. CATEGORIES
// ============================================================

async function loadCategories() {

    try {

        const categoriesRef =
            collection(
                db,
                "categories"
            );


        const snapshot =
            await getDocs(
                categoriesRef
            );


        const firestoreCategories =
            snapshot.docs.map(
                document => {

                    const data =
                        document.data();


                    return canonicalizeCategory(
                        data.name ||
                        data.title ||
                        data.key ||
                        document.id
                    );

                }
            );


        const wallpaperCategories =
            STATE.wallpapers
                .map(
                    wallpaper =>
                        canonicalizeCategory(
                            wallpaper.category ||
                            wallpaper.categoryKey
                        )
                )
                .filter(Boolean);


        STATE.categories =
            [
                "All",

                ...mergeCategoryLabels(
                    CATEGORY_LABELS,
                    firestoreCategories,
                    wallpaperCategories
                )
            ];


        renderCategories();


    } catch (error) {

        console.warn(
            "Category loading error:",
            error
        );


        STATE.categories = [
            "All",
            ...CATEGORY_LABELS
        ];


        renderCategories();

    }

}


// ============================================================
// RENDER CATEGORIES
// ============================================================

function renderCategories() {

    if (!DOM.categoryContainer) return;


    DOM.categoryContainer.innerHTML =
        STATE.categories
            .map(
                category => {

                    const active =
                        (
                            category === "All" &&
                            STATE.currentCategory === "All"
                        ) ||
                        categoriesEqual(
                            category,
                            STATE.currentCategory
                        )
                            ? "active"
                            : "";


                    return `

                        <button
                            class="category-btn ${active}"
                            data-category="${escapeAttribute(category)}"
                        >
                            ${escapeHTML(category)}
                        </button>

                    `;

                }
            )
            .join("");

    updateSiteStats();

}


// ============================================================
// CATEGORY FILTER
// ============================================================

function filterByCategory(
    category
) {

    STATE.currentCategory =
        ["All", "Favourites"].includes(category)
            ? category
            : canonicalizeCategory(category);


    STATE.currentPage =
        1;


    if (STATE.currentCategory === "All") {

        STATE.filteredWallpapers =
            [...STATE.wallpapers];

    }

    else if (
        STATE.currentCategory === "Favourites"
    ) {

        if (!STATE.currentUser) {

            showLoginRequired();

            return;

        }


        STATE.filteredWallpapers =
            STATE.wallpapers.filter(
                wallpaper =>
                    STATE.favourites.has(
                        wallpaper.id
                    )
            );

    }

    else {

        STATE.filteredWallpapers =
            STATE.wallpapers.filter(
                wallpaper => {

                    return (
                        categoriesEqual(
                            wallpaper.category ||
                            wallpaper.categoryKey,
                            STATE.currentCategory
                        )
                    );

                }
            );

    }


    renderCategories();

    renderWallpapers();

}


// ============================================================
// 9. SEARCH
// ============================================================

function performSearch(
    value
) {

    const searchTerm =
        String(
            value || ""
        )
            .trim()
            .toLowerCase();


    STATE.searchTerm =
        searchTerm;


    STATE.currentPage =
        1;


    let results =
        [...STATE.wallpapers];


    if (STATE.currentCategory !== "All") {

        if (
            STATE.currentCategory ===
            "Favourites"
        ) {

            results =
                results.filter(
                    wallpaper =>
                        STATE.favourites.has(
                            wallpaper.id
                        )
                );

        } else {

            results =
                results.filter(
                    wallpaper =>
                        categoriesEqual(
                            wallpaper.category ||
                            wallpaper.categoryKey,
                            STATE.currentCategory
                        )
                );

        }

    }


    if (searchTerm) {

        results =
            results.filter(
                wallpaper => {

                    const searchableText = [

                        wallpaper.title,

                        wallpaper.name,

                        wallpaper.category,

                        wallpaper.description,

                        ...(Array.isArray(
                            wallpaper.tags
                        )
                            ? wallpaper.tags
                            : [])

                    ]
                        .filter(Boolean)
                        .join(" ")
                        .toLowerCase();


                    return searchableText.includes(
                        searchTerm
                    );

                }
            );

    }


    STATE.filteredWallpapers =
        results;


    renderWallpapers();

}


// ============================================================
// 10. LOGIN UI
// ============================================================

function openLoginModal() {

    if (!DOM.loginModal) {

        loginWithGoogle();

        return;

    }


    DOM.loginModal.classList.add(
        "active"
    );


    DOM.loginModal.style.display =
        "flex";


    document.body.classList.add(
        "modal-open"
    );

}


// ============================================================
// CLOSE LOGIN MODAL
// ============================================================

function closeLoginModal() {

    if (!DOM.loginModal) return;


    DOM.loginModal.classList.remove(
        "active"
    );


    DOM.loginModal.style.display =
        "none";


    document.body.classList.remove(
        "modal-open"
    );

}


// ============================================================
// LOGIN REQUIRED
// ============================================================

function showLoginRequired() {

    showToast(
        "Favourite वापरण्यासाठी Login करा.",
        "info"
    );


    openLoginModal();

}


// ============================================================
// 11. GOOGLE LOGIN
// ============================================================

async function loginWithGoogle() {

    if (!auth) {

        showToast(
            "Firebase Authentication available नाही.",
            "error"
        );

        return;

    }


    try {

        const provider =
            new GoogleAuthProvider();


        provider.setCustomParameters({
            prompt: "select_account"
        });


        await signInWithPopup(
            auth,
            provider
        );


        closeLoginModal();


        showToast(
            "Google Login successful! स्वागत आहे ❤️",
            "success"
        );


    } catch (error) {

        console.error(
            "Google Login error:",
            error
        );


        if (
            error.code ===
            "auth/popup-closed-by-user"
        ) {

            return;

        }


        if (
            error.code ===
            "auth/popup-blocked"
        ) {

            showToast(
                "Browser ने popup block केला आहे.",
                "error"
            );

            return;

        }


        showToast(
            "Google Login failed.",
            "error"
        );

    }

}


// ============================================================
// LOGOUT
// ============================================================

async function logoutUser() {

    try {

        await signOut(
            auth
        );


        showToast(
            "Logout successful.",
            "success"
        );


    } catch (error) {

        console.error(
            "Logout error:",
            error
        );


        showToast(
            "Logout failed.",
            "error"
        );

    }

}


// ============================================================
// 12. DARK MODE
// ============================================================

function initializeDarkMode() {

    const savedTheme =
        localStorage.getItem(
            "bvo-theme"
        );


    STATE.isDarkMode = savedTheme
        ? savedTheme === "dark"
        : !(
            window.matchMedia &&
            window.matchMedia(
                "(prefers-color-scheme: light)"
            ).matches
        );


    applyDarkMode();

}


// ============================================================
// APPLY DARK MODE
// ============================================================

function applyDarkMode() {

    if (!DOM.body) return;


    DOM.body.classList.toggle(
        "light-mode",
        !STATE.isDarkMode
    );

    document.documentElement.classList.toggle(
        "light-mode",
        !STATE.isDarkMode
    );


    if (DOM.darkModeButton) {

        DOM.darkModeButton.setAttribute(
            "aria-label",
            STATE.isDarkMode
                ? "Switch to light mode"
                : "Switch to dark mode"
        );


        DOM.darkModeButton.title =
            STATE.isDarkMode
                ? "Switch to light mode"
                : "Switch to dark mode";

        DOM.darkModeButton.textContent =
            STATE.isDarkMode
                ? "☀️"
                : "🌙";

    }


    localStorage.setItem(
        "bvo-theme",
        STATE.isDarkMode
            ? "dark"
            : "light"
    );

}


// ============================================================
// TOGGLE DARK MODE
// ============================================================

function toggleDarkMode() {

    STATE.isDarkMode =
        !STATE.isDarkMode;


    applyDarkMode();

}


// ============================================================
// 13. MOBILE MENU
// ============================================================

function initializeMobileMenu() {

    if (
        !DOM.mobileMenuButton ||
        !DOM.mobileMenu
    ) {

        return;

    }


    DOM.mobileMenuButton.addEventListener(
        "click",
        () => {

            const isOpen =
                DOM.mobileMenu.classList.toggle(
                    "show"
                );


            DOM.mobileMenuButton.classList.toggle(
                "active",
                isOpen
            );


            DOM.mobileMenuButton.setAttribute(
                "aria-expanded",
                String(isOpen)
            );

            DOM.mobileMenuButton.textContent =
                isOpen
                    ? "✖"
                    : "☰";

        }
    );


    document.addEventListener(
        "click",
        event => {

            if (
                !DOM.mobileMenu.contains(
                    event.target
                ) &&
                !DOM.mobileMenuButton.contains(
                    event.target
                )
            ) {

                DOM.mobileMenu.classList.remove(
                    "show"
                );


                DOM.mobileMenuButton.classList.remove(
                    "active"
                );

                DOM.mobileMenuButton.setAttribute(
                    "aria-expanded",
                    "false"
                );

                DOM.mobileMenuButton.textContent =
                    "☰";

            }

        }
    );

    DOM.mobileMenu.querySelectorAll(
        "a"
    ).forEach(
        link => link.addEventListener(
            "click",
            () => {

                DOM.mobileMenu.classList.remove(
                    "show"
                );

                DOM.mobileMenuButton.classList.remove(
                    "active"
                );

                DOM.mobileMenuButton.setAttribute(
                    "aria-expanded",
                    "false"
                );

                DOM.mobileMenuButton.textContent =
                    "☰";

            }
        )
    );

}


// ============================================================
// 14. NEWSLETTER
// ============================================================

function initializeNewsletter() {

    if (!DOM.newsletterForm) return;


    DOM.newsletterForm.addEventListener(
        "submit",
        async event => {

            event.preventDefault();


            const email =
                DOM.newsletterEmail?.value
                    ?.trim()
                    .toLowerCase();


            if (!email) {

                showToast(
                    "Email address enter करा.",
                    "error"
                );

                return;

            }


            if (!isValidEmail(email)) {

                showToast(
                    "Valid email address enter करा.",
                    "error"
                );

                return;

            }


            try {

                const subscriberRef =
                    doc(
                        db,
                        "newsletter",
                        normalizeDocumentId(
                            email
                        )
                    );


                await setDoc(
                    subscriberRef,
                    {
                        email: email,

                        subscribedAt:
                            serverTimestamp(),

                        active: true
                    },
                    {
                        merge: true
                    }
                );


                if (DOM.newsletterEmail) {

                    DOM.newsletterEmail.value =
                        "";

                }


                showToast(
                    "Newsletter मध्ये subscribe झाले! 🎉",
                    "success"
                );


            } catch (error) {

                console.error(
                    "Newsletter error:",
                    error
                );


                showToast(
                    "Subscription save करता आले नाही.",
                    "error"
                );

            }

        }
    );

}


// ============================================================
// 15. UTILITY FUNCTIONS
// ============================================================


// ============================================================
// EVENT LISTENERS
// ============================================================

function setupEventListeners() {

    // Wallpaper grid
    if (DOM.wallpaperGrid) {

        DOM.wallpaperGrid.addEventListener(
            "click",
            handleWallpaperGridClick
        );

        DOM.wallpaperGrid.addEventListener(
            "error",
            handleWallpaperImageError,
            true
        );

    }


    // Category buttons
    if (DOM.categoryContainer) {

        DOM.categoryContainer.addEventListener(
            "click",
            event => {

                const button =
                    event.target.closest(
                        "[data-category]"
                    );


                if (!button) return;


                const category =
                    button.dataset.category;


                filterByCategory(
                    category
                );

            }
        );

    }


    // Search input
    if (DOM.searchInput) {

        DOM.searchInput.addEventListener(
            "input",
            event => {

                performSearch(
                    event.target.value
                );

            }
        );

        DOM.searchInput.addEventListener(
            "keydown",
            event => {

                if (
                    event.key ===
                    "Enter"
                ) {

                    event.preventDefault();

                    performSearch(
                        event.target.value
                    );

                }

            }
        );

    }


    // Search button
    if (DOM.searchButton) {

        DOM.searchButton.addEventListener(
            "click",
            () => {

                performSearch(
                    DOM.searchInput?.value
                );

            }
        );

    }


    // Login
    if (DOM.loginButton) {

        DOM.loginButton.addEventListener(
            "click",
            openLoginModal
        );

    }


    // Google Login
    if (DOM.googleLoginButton) {

        DOM.googleLoginButton.addEventListener(
            "click",
            loginWithGoogle
        );

    }


    // Logout
    if (DOM.logoutButton) {

        DOM.logoutButton.addEventListener(
            "click",
            logoutUser
        );

    }


    // Close login
    if (DOM.loginClose) {

        DOM.loginClose.addEventListener(
            "click",
            closeLoginModal
        );

    }


    // Dark mode
    if (DOM.darkModeButton) {

        DOM.darkModeButton.addEventListener(
            "click",
            toggleDarkMode
        );

    }


    // Load more
    if (DOM.loadMoreButton) {

        DOM.loadMoreButton.addEventListener(
            "click",
            () => {

                STATE.currentPage++;

                renderWallpapers();

            }
        );

    }


    // Signed-in user favourites
    if (DOM.showFavouritesButton) {

        DOM.showFavouritesButton.addEventListener(
            "click",
            () => {

                showFavourites();

                document.querySelector(
                    "#featured"
                )?.scrollIntoView({
                    behavior: "smooth",
                    block: "start"
                });

            }
        );

    }


    // Back to top
    if (DOM.backToTop) {

        const updateBackToTop = () => {

            DOM.backToTop.classList.toggle(
                "visible",
                window.scrollY > 300
            );

        };

        window.addEventListener(
            "scroll",
            updateBackToTop,
            { passive: true }
        );

        DOM.backToTop.addEventListener(
            "click",
            () => window.scrollTo({
                top: 0,
                behavior: "smooth"
            })
        );

        updateBackToTop();

    }


    // Device recommendation follows orientation changes
    let deviceResizeTimer = null;

    window.addEventListener(
        "resize",
        () => {

            window.clearTimeout(
                deviceResizeTimer
            );

            deviceResizeTimer =
                window.setTimeout(
                    updateDeviceAdvisor,
                    150
                );

        },
        { passive: true }
    );


    // Footer category links
    document.querySelectorAll(
        "[data-footer-category]"
    ).forEach(
        link => link.addEventListener(
            "click",
            () => {

                filterByCategory(
                    link.dataset.footerCategory
                );

            }
        )
    );


    // Escape key
    document.addEventListener(
        "keydown",
        event => {

            if (
                event.key ===
                "Escape"
            ) {

                closeLoginModal();

                closeWallpaperPreview();

            }

        }
    );


    // Close modal by background
    if (DOM.loginModal) {

        DOM.loginModal.addEventListener(
            "click",
            event => {

                if (
                    event.target ===
                    DOM.loginModal
                ) {

                    closeLoginModal();

                }

            }
        );

    }


    // Wallpaper preview dialog
    DOM.wallpaperModalClose?.addEventListener(
        "click",
        closeWallpaperPreview
    );

    DOM.wallpaperModal?.addEventListener(
        "click",
        event => {

            if (event.target === DOM.wallpaperModal) {

                closeWallpaperPreview();

            }

        }
    );

    DOM.wallpaperModalFavourite?.addEventListener(
        "click",
        () => {

            if (STATE.activeWallpaperId) {

                toggleFavourite(
                    STATE.activeWallpaperId
                );

            }

        }
    );

    DOM.wallpaperModalDownload?.addEventListener(
        "click",
        () => {

            if (STATE.activeWallpaperId) {

                downloadWallpaper(
                    STATE.activeWallpaperId
                );

            }

        }
    );

}


// ============================================================
// SHOW LOADING
// ============================================================

function showLoading(
    isLoading
) {

    if (DOM.loading) {

        DOM.loading.style.display =
            isLoading
                ? "flex"
                : "none";

        return;
    }

    if (
        isLoading &&
        DOM.wallpaperGrid
    ) {

        DOM.wallpaperGrid.innerHTML = `
            <div class="content-message loading">
                <h3>Loading wallpapers...</h3>
                <p>Please wait while wallpapers are loading.</p>
            </div>
        `;

    }


}


// ============================================================
// NO WALLPAPERS
// ============================================================

function showNoWallpapers() {

    if (!DOM.wallpaperGrid) return;


    DOM.wallpaperGrid.innerHTML = `

        <div
            class="content-message no-wallpapers"
        >

            <div class="no-wallpapers-icon">
                🖼️
            </div>

            <h3>
                No wallpapers found
            </h3>

            <p>
                दुसरी category किंवा search वापरून पहा.
            </p>

        </div>

    `;


    updateLoadMoreButton();

}


// ============================================================
// WALLPAPER ERROR
// ============================================================

function showWallpaperError() {

    if (!DOM.wallpaperGrid) return;


    DOM.wallpaperGrid.innerHTML = `

        <div
            class="content-message error wallpaper-error"
        >

            <h3>
                Wallpapers load झाले नाहीत.
            </h3>

            <p>
                Firebase connection किंवा Firestore
                configuration तपासा.
            </p>

            <button
                id="retryWallpaperButton"
                type="button"
            >
                Retry
            </button>

        </div>

    `;


    const retryButton =
        document.querySelector(
            "#retryWallpaperButton"
        );


    if (retryButton) {

        retryButton.addEventListener(
            "click",
            loadWallpapers
        );

    }

}


// ============================================================
// LOAD MORE BUTTON
// ============================================================

function updateLoadMoreButton() {

    if (!DOM.loadMoreButton) return;


    const visibleCount =
        STATE.currentPage *
        STATE.wallpapersPerPage;


    const hasMore =
        visibleCount <
        STATE.filteredWallpapers.length;


    DOM.loadMoreButton.style.display =
        hasMore
            ? "inline-flex"
            : "none";

}


// ============================================================
// WALLPAPER COUNT
// ============================================================

function updateWallpaperCount() {

    if (!DOM.wallpaperCount) return;


    DOM.wallpaperCount.textContent =
        STATE.filteredWallpapers.length ||
        STATE.wallpapers.length ||
        0;

}


// ============================================================
// DEVICE RECOMMENDATION + LIVE SITE STATS
// ============================================================

function updateDeviceAdvisor() {

    const screenWidth =
        window.screen?.width ||
        window.innerWidth;

    const screenHeight =
        window.screen?.height ||
        window.innerHeight;

    STATE.deviceRecommendation =
        getDeviceRecommendation({
            screenWidth,
            screenHeight,
            devicePixelRatio:
                window.devicePixelRatio || 1
        });

    const recommendation =
        STATE.deviceRecommendation;

    if (DOM.deviceResolution) {

        DOM.deviceResolution.textContent =
            recommendation.label;

    }

    if (DOM.deviceOrientation) {

        DOM.deviceOrientation.textContent =
            recommendation.orientation;

    }

    if (DOM.deviceAspectRatio) {

        DOM.deviceAspectRatio.textContent =
            recommendation.aspectRatio;

    }

    if (DOM.deviceAdvisorMessage) {

        DOM.deviceAdvisorMessage.textContent =
            `For the best fit, choose a ${recommendation.orientation.toLowerCase()} wallpaper near ${recommendation.label}. Always download the original-quality file.`;

    }

    if (DOM.wallpaperModalDevice) {

        DOM.wallpaperModalDevice.textContent =
            recommendation.label;

    }


}


function formatCompactNumber(value) {

    const number =
        Math.max(
            0,
            Number(value) || 0
        );

    return new Intl.NumberFormat(
        "en-IN",
        {
            notation:
                number >= 1000
                    ? "compact"
                    : "standard",
            maximumFractionDigits: 1
        }
    ).format(number);

}


function updateSiteStats() {

    const downloads =
        STATE.wallpapers.reduce(
            (total, wallpaper) =>
                total + Math.max(
                    0,
                    Number(wallpaper.downloads) || 0
                ),
            0
        );

    const categoryCount =
        new Set(
            STATE.wallpapers
                .map(
                    wallpaper =>
                        canonicalizeCategory(
                            wallpaper.category ||
                            wallpaper.categoryKey
                        )
                )
                .filter(Boolean)
        ).size ||
        STATE.categories.filter(
            category => category !== "All"
        ).length;

    if (DOM.statWallpaperCount) {

        DOM.statWallpaperCount.textContent =
            formatCompactNumber(
                STATE.wallpapers.length
            );

    }

    if (DOM.statDownloadCount) {

        DOM.statDownloadCount.textContent =
            formatCompactNumber(downloads);

    }

    if (DOM.statCategoryCount) {

        DOM.statCategoryCount.textContent =
            formatCompactNumber(categoryCount);

    }

}


function updateProfileMetrics() {

    if (DOM.profileFavouriteCount) {

        DOM.profileFavouriteCount.textContent =
            formatCompactNumber(
                STATE.favourites.size
            );

    }

    if (DOM.profileDownloadCount) {

        DOM.profileDownloadCount.textContent =
            formatCompactNumber(
                STATE.userDownloads
            );

    }

}


// ============================================================
// UPDATE COPYRIGHT YEAR
// ============================================================

function updateCopyrightYear() {

    const yearElements =
        document.querySelectorAll(
            "[data-current-year]"
        );


    yearElements.forEach(
        element => {

            element.textContent =
                new Date().getFullYear();

        }
    );

}


// ============================================================
// PAGE TITLE
// ============================================================

function updatePageTitle() {

    document.title =
        "BharatVarshOfficial | Premium Indian Wallpapers";

}


// ============================================================
// TOAST SYSTEM
// ============================================================

function showToast(
    message,
    type = "info"
) {

    let container =
        document.querySelector(
            "#toastContainer"
        );


    if (!container) {

        container =
            document.createElement(
                "div"
            );


        container.id =
            "toastContainer";


        container.className =
            "toast-container";

        container.setAttribute(
            "aria-live",
            "polite"
        );

        container.setAttribute(
            "aria-atomic",
            "false"
        );


        document.body.appendChild(
            container
        );

    }


    const toast =
        document.createElement(
            "div"
        );


    toast.className =
        `toast toast-${type}`;

    toast.setAttribute(
        "role",
        type === "error"
            ? "alert"
            : "status"
    );


    toast.textContent =
        message;


    container.appendChild(
        toast
    );


    requestAnimationFrame(
        () => {

            toast.classList.add(
                "show"
            );

        }
    );


    setTimeout(
        () => {

            toast.classList.remove(
                "show"
            );


            setTimeout(
                () => {

                    toast.remove();

                },
                300
            );

        },
        3000
    );

}


// ============================================================
// EMAIL VALIDATION
// ============================================================

function isValidEmail(
    email
) {

    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        .test(email);

}


// ============================================================
// CREATE SAFE FILENAME
// ============================================================

function createFilename(
    name
) {

    return String(
        name
    )
        .trim()
        .replace(
            /[^a-zA-Z0-9\u0900-\u097F_-]+/g,
            "-"
        )
        .replace(
            /-+/g,
            "-"
        )
        .replace(
            /^-|-$/g,
            ""
        )
        .substring(
            0,
            80
        ) ||
        "BharatVarshWallpaper";

}


// ============================================================
// WALLPAPER PREVIEW
// ============================================================

function getWallpaperImageURL(wallpaper) {

    return wallpaper?.imageUrl ||
        wallpaper?.imageURL ||
        wallpaper?.image ||
        wallpaper?.url ||
        wallpaper?.downloadURL ||
        "";

}


function getActiveWallpaper() {

    if (!STATE.activeWallpaperId) return null;

    return STATE.wallpapers.find(
        wallpaper =>
            wallpaper.id ===
            STATE.activeWallpaperId
    ) || null;

}


function openWallpaperPreview(wallpaperId) {

    const wallpaper =
        STATE.wallpapers.find(
            item => item.id === wallpaperId
        );

    if (!wallpaper || !DOM.wallpaperModal) {

        showToast(
            "Wallpaper preview उपलब्ध नाही.",
            "error"
        );

        return;

    }

    const imageURL =
        getWallpaperImageURL(wallpaper);

    if (!imageURL) {

        showToast(
            "Wallpaper image उपलब्ध नाही.",
            "error"
        );

        return;

    }

    STATE.activeWallpaperId = wallpaperId;
    STATE.lastFocusedElement = document.activeElement;

    const title =
        wallpaper.title ||
        wallpaper.name ||
        "Indian Wallpaper";

    const category =
        canonicalizeCategory(
            wallpaper.category ||
            wallpaper.categoryKey ||
            "Indian"
        );

    DOM.wallpaperModalTitle.textContent = title;
    DOM.wallpaperModalCategory.textContent = category;
    DOM.wallpaperModalDescription.textContent =
        wallpaper.description ||
        "Premium wallpaper from BharatVarshOfficial.";

    DOM.wallpaperModalImage.alt = title;
    DOM.wallpaperModalImage.removeAttribute("src");
    DOM.wallpaperModalResolution.textContent =
        "Detecting…";

    updateDeviceAdvisor();

    const recommendation =
        STATE.deviceRecommendation;

    DOM.wallpaperModalDevice.textContent =
        recommendation?.label ||
        "Not available";

    const updateImageDetails = () => {

        const width =
            DOM.wallpaperModalImage.naturalWidth ||
            Number(wallpaper.width) ||
            Number(wallpaper.imageWidth) ||
            0;

        const height =
            DOM.wallpaperModalImage.naturalHeight ||
            Number(wallpaper.height) ||
            Number(wallpaper.imageHeight) ||
            0;

        DOM.wallpaperModalResolution.textContent =
            width && height
                ? `${width} × ${height} px`
                : "Original quality";

        DOM.wallpaperModalFit.textContent =
            getWallpaperFitMessage(
                width,
                height,
                recommendation
            );

    };

    DOM.wallpaperModalImage.onload =
        updateImageDetails;

    DOM.wallpaperModalImage.onerror = () => {

        DOM.wallpaperModalResolution.textContent =
            "Image unavailable";

        DOM.wallpaperModalFit.textContent =
            "Try opening or downloading the original URL.";

    };

    DOM.wallpaperModalImage.src = imageURL;

    DOM.wallpaperModal.hidden = false;
    DOM.wallpaperModal.classList.add("open");
    document.body.classList.add("modal-open");

    updateWallpaperModalFavouriteState();

    requestAnimationFrame(
        () => DOM.wallpaperModalClose?.focus()
    );

}


function closeWallpaperPreview() {

    if (!DOM.wallpaperModal) return;

    DOM.wallpaperModal.classList.remove("open");
    DOM.wallpaperModal.hidden = true;

    if (!DOM.loginModal?.classList.contains("active")) {

        document.body.classList.remove("modal-open");

    }

    DOM.wallpaperModalImage?.removeAttribute("src");
    STATE.activeWallpaperId = null;

    if (
        STATE.lastFocusedElement &&
        document.contains(STATE.lastFocusedElement)
    ) {

        STATE.lastFocusedElement.focus();

    }

    STATE.lastFocusedElement = null;

}


function updateWallpaperModalFavouriteState() {

    if (!DOM.wallpaperModalFavourite) return;

    const isFavourite =
        Boolean(STATE.activeWallpaperId) &&
        STATE.favourites.has(
            STATE.activeWallpaperId
        );

    DOM.wallpaperModalFavourite.classList.toggle(
        "active",
        isFavourite
    );

    DOM.wallpaperModalFavourite.textContent =
        isFavourite
            ? "♥ Saved"
            : "♡ Favourite";

}


// ============================================================
// IMAGE FILE EXTENSION
// ============================================================

function getImageExtension(
    imageURL
) {

    try {

        const pathname =
            new URL(
                imageURL,
                window.location.href
            ).pathname;

        const extension =
            pathname
                .split(".")
                .pop()
                ?.toLowerCase();

        return [
            "jpg",
            "jpeg",
            "png",
            "webp",
            "avif"
        ].includes(extension)
            ? extension
            : "jpg";

    } catch {

        return "jpg";

    }

}


// ============================================================
// NORMALIZE FIRESTORE DOCUMENT ID
// ============================================================

function normalizeDocumentId(
    value
) {

    return btoa(
        encodeURIComponent(
            value
        )
    )
        .replace(
            /[/+=]/g,
            ""
        )
        .substring(
            0,
            120
        );

}


// ============================================================
// ESCAPE HTML
// ============================================================

function escapeHTML(
    value
) {

    return String(
        value ?? ""
    )
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );

}


// ============================================================
// ESCAPE ATTRIBUTE
// ============================================================

function escapeAttribute(
    value
) {

    return escapeHTML(
        value
    );

}


// ============================================================
// DEBUG LOG
// ============================================================

function debugLog(
    ...messages
) {

    if (
        window.location.hostname ===
            "localhost" ||
        window.location.hostname ===
            "127.0.0.1"
    ) {

        console.log(
            "[BharatVarshOfficial]",
            ...messages
        );

    }

}


// ============================================================
// 16. FINAL DEBUG
// ============================================================

window.BharatVarshOfficial = {

    // State
    state:
        STATE,

    // Wallpaper
    loadWallpapers,

    renderWallpapers,

    // Categories
    loadCategories,

    filterByCategory,

    // Search
    search:
        performSearch,

    // Authentication
    login:
        loginWithGoogle,

    logout:
        logoutUser,

    // Favourites
    favourite:
        toggleFavourite,

    showFavourites,

    // Theme
    toggleDarkMode,

    // UI
    openLoginModal,

    closeLoginModal,

    // Debug
    debug() {

        console.group(
            "BharatVarshOfficial Debug"
        );


        console.log(
            "Initialized:",
            STATE.initialized
        );


        console.log(
            "User:",
            STATE.currentUser
        );


        console.log(
            "Wallpapers:",
            STATE.wallpapers.length
        );


        console.log(
            "Filtered:",
            STATE.filteredWallpapers.length
        );


        console.log(
            "Categories:",
            STATE.categories
        );


        console.log(
            "Favourites:",
            [...STATE.favourites]
        );


        console.log(
            "Dark Mode:",
            STATE.isDarkMode
        );


        console.groupEnd();

    }

};


// ============================================================
// FINAL SAFETY CHECK
// ============================================================

window.addEventListener(
    "error",
    event => {

        console.error(
            "[BharatVarshOfficial] Global Error:",
            event.error ||
            event.message
        );

    }
);


window.addEventListener(
    "unhandledrejection",
    event => {

        console.error(
            "[BharatVarshOfficial] Promise Error:",
            event.reason
        );

    }
);


// ============================================================
// END OF script.js
// ============================================================
