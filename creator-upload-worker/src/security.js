const SUPPORTED_MEDIA = Object.freeze({
    wallpapers: "image",
    images: "image",
    videos: "video"
});

export function getAllowedOrigins(value = "") {
    return new Set(
        value
            .split(",")
            .map((origin) => origin.trim())
            .filter(Boolean)
    );
}

export function isAllowedOrigin(origin, allowedOrigins) {
    return Boolean(
        origin &&
        allowedOrigins.has(origin)
    );
}

export function getResourceType(mediaType) {
    return SUPPORTED_MEDIA[mediaType] || "";
}

export function buildAssetFolder(uid, mediaType) {
    if (!uid || !getResourceType(mediaType)) {
        throw new Error("Invalid creator upload path.");
    }

    return [
        "BharatVarshOfficial",
        "creator-submissions",
        uid,
        mediaType
    ].join("/");
}

export function serializeCloudinaryParameters(parameters) {
    return Object.entries(parameters)
        .filter(([, value]) =>
            value !== undefined &&
            value !== null &&
            value !== ""
        )
        .sort(([left], [right]) =>
            left.localeCompare(right)
        )
        .map(([key, value]) => `${key}=${value}`)
        .join("&");
}

function bytesToHex(bytes) {
    return Array.from(bytes)
        .map((byte) =>
            byte.toString(16).padStart(2, "0")
        )
        .join("");
}

export async function createCloudinarySignature(
    parameters,
    apiSecret
) {
    if (!apiSecret) {
        throw new Error("Cloudinary API secret is not configured.");
    }

    const serialized =
        serializeCloudinaryParameters(parameters);

    const payload =
        new TextEncoder().encode(
            `${serialized}${apiSecret}`
        );

    const digest = await crypto.subtle.digest(
        "SHA-256",
        payload
    );

    return bytesToHex(new Uint8Array(digest));
}
