// ============================================================
// BharatVarshOfficial
// Exact-size wallpaper download helpers
// ============================================================

export const MIN_DOWNLOAD_DIMENSION = 240;
export const MAX_DOWNLOAD_DIMENSION = 7680;
export const MAX_DOWNLOAD_PIXELS = 7680 * 4320;

const PORTRAIT_PRESETS = [
    {
        id: "mobile-hd",
        label: "Mobile HD",
        width: 720,
        height: 1280
    },
    {
        id: "mobile-full-hd",
        label: "Mobile Full HD",
        width: 1080,
        height: 1920
    },
    {
        id: "mobile-2k",
        label: "Mobile 2K",
        width: 1440,
        height: 2560
    },
    {
        id: "mobile-4k",
        label: "Mobile 4K",
        width: 2160,
        height: 3840
    }
];

const LANDSCAPE_PRESETS = [
    {
        id: "desktop-hd",
        label: "Desktop HD",
        width: 1280,
        height: 720
    },
    {
        id: "desktop-full-hd",
        label: "Desktop Full HD",
        width: 1920,
        height: 1080
    },
    {
        id: "desktop-2k",
        label: "Desktop 2K",
        width: 2560,
        height: 1440
    },
    {
        id: "desktop-4k",
        label: "Desktop 4K",
        width: 3840,
        height: 2160
    }
];

function toPositiveInteger(value) {
    const number = Number(value);

    return Number.isFinite(number) && number > 0
        ? Math.round(number)
        : 0;
}

function parseResolution(value) {
    const match = String(value || "").match(
        /(\d{2,5})\s*(?:x|×)\s*(\d{2,5})/i
    );

    return match
        ? {
            width: toPositiveInteger(match[1]),
            height: toPositiveInteger(match[2])
        }
        : {
            width: 0,
            height: 0
        };
}

export function getWallpaperDimensions(wallpaper = {}) {
    const parsed = parseResolution(
        wallpaper.resolution ||
        wallpaper.imageResolution ||
        wallpaper.dimensions
    );

    const width = toPositiveInteger(
        wallpaper.width ||
        wallpaper.imageWidth ||
        parsed.width
    );

    const height = toPositiveInteger(
        wallpaper.height ||
        wallpaper.imageHeight ||
        parsed.height
    );

    return {
        width,
        height,
        orientation: width && height
            ? (height >= width ? "portrait" : "landscape")
            : "unknown"
    };
}

export function validateDownloadDimensions(width, height) {
    const safeWidth = toPositiveInteger(width);
    const safeHeight = toPositiveInteger(height);

    if (!safeWidth || !safeHeight) {
        return {
            valid: false,
            message: "Width आणि height दोन्ही भरा."
        };
    }

    if (
        safeWidth < MIN_DOWNLOAD_DIMENSION ||
        safeHeight < MIN_DOWNLOAD_DIMENSION
    ) {
        return {
            valid: false,
            message: `Minimum size ${MIN_DOWNLOAD_DIMENSION} px आहे.`
        };
    }

    if (
        safeWidth > MAX_DOWNLOAD_DIMENSION ||
        safeHeight > MAX_DOWNLOAD_DIMENSION
    ) {
        return {
            valid: false,
            message: `Maximum width किंवा height ${MAX_DOWNLOAD_DIMENSION} px आहे.`
        };
    }

    if (safeWidth * safeHeight > MAX_DOWNLOAD_PIXELS) {
        return {
            valid: false,
            message: "Custom size 8K pixel limitपेक्षा मोठी आहे."
        };
    }

    return {
        valid: true,
        width: safeWidth,
        height: safeHeight,
        message: ""
    };
}

export function getDownloadSizeOptions({
    wallpaper = {}
} = {}) {
    const source = getWallpaperDimensions(wallpaper);

    const orientation = source.orientation !== "unknown"
        ? source.orientation
        : "portrait";

    const presets = orientation === "portrait"
        ? PORTRAIT_PRESETS
        : LANDSCAPE_PRESETS;

    const options = presets.map((preset) => ({ ...preset }));

    options.push({
        id: "original",
        label: "Original quality",
        width: source.width,
        height: source.height,
        original: true
    });

    options.push({
        id: "custom",
        label: "Custom size",
        width: 0,
        height: 0,
        custom: true
    });

    return options;
}

export function isCloudinaryImageURL(imageURL) {
    try {
        const url = new URL(imageURL);

        return url.protocol === "https:" &&
            url.hostname === "res.cloudinary.com" &&
            url.pathname.includes("/image/upload/");
    } catch {
        return false;
    }
}

export function buildCloudinaryExactSizeURL(
    imageURL,
    width,
    height
) {
    const dimensions = validateDownloadDimensions(
        width,
        height
    );

    if (!dimensions.valid || !isCloudinaryImageURL(imageURL)) {
        return "";
    }

    const url = new URL(imageURL);
    const marker = "/image/upload/";
    const markerIndex = url.pathname.indexOf(marker);
    const transformation = [
        "c_fill",
        "g_auto",
        `w_${dimensions.width}`,
        `h_${dimensions.height}`,
        "fl_attachment",
        "q_auto:good",
        "f_auto"
    ].join(",");

    url.pathname = [
        url.pathname.slice(
            0,
            markerIndex + marker.length
        ),
        `${transformation}/`,
        url.pathname.slice(
            markerIndex + marker.length
        )
    ].join("");

    return url.toString();
}

export function getExtensionForMimeType(
    mimeType,
    fallback = "jpg"
) {
    const normalized = String(mimeType || "")
        .split(";")[0]
        .trim()
        .toLowerCase();

    const extensions = {
        "image/avif": "avif",
        "image/jpeg": "jpg",
        "image/png": "png",
        "image/webp": "webp"
    };

    return extensions[normalized] || fallback;
}
