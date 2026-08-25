// ==========================================
// BharatVarshOfficial
// Cloudinary client uploader
// ==========================================

export const CLOUDINARY_CONFIG_KEY =
    "bharatvarshofficial.cloudinary.v1";

export const MAX_CLOUDINARY_IMAGE_SIZE =
    25 * 1024 * 1024;

export const MAX_CLOUDINARY_VIDEO_SIZE =
    100 * 1024 * 1024;

const ALLOWED_IMAGE_TYPES = new Set([
    "image/jpeg",
    "image/png",
    "image/webp"
]);

const ALLOWED_VIDEO_TYPES = new Set([
    "video/mp4",
    "video/webm",
    "video/ogg"
]);

export function normalizeCloudinaryConfig(value = {}) {
    return {
        cloudName:
            String(value.cloudName || "")
                .trim(),

        uploadPreset:
            String(value.uploadPreset || "")
                .trim()
    };
}

export function validateCloudinaryConfig(value = {}) {
    const config =
        normalizeCloudinaryConfig(value);

    if (!config.cloudName) {
        return "Enter your Cloudinary cloud name.";
    }

    if (!/^[a-zA-Z0-9_-]+$/.test(config.cloudName)) {
        return "Cloud name contains unsupported characters.";
    }

    if (!config.uploadPreset) {
        return "Enter an unsigned Cloudinary upload preset.";
    }

    if (!/^[a-zA-Z0-9_-]+$/.test(config.uploadPreset)) {
        return "Upload preset contains unsupported characters.";
    }

    return "";
}

export function isCloudinaryConfigured(value = {}) {
    return !validateCloudinaryConfig(value);
}

export function loadCloudinaryConfig(storage = globalThis.localStorage) {
    if (!storage) {
        return normalizeCloudinaryConfig();
    }

    try {
        const saved =
            storage.getItem(CLOUDINARY_CONFIG_KEY);

        return normalizeCloudinaryConfig(
            saved ? JSON.parse(saved) : {}
        );
    } catch {
        return normalizeCloudinaryConfig();
    }
}

export function saveCloudinaryConfig(
    value,
    storage = globalThis.localStorage
) {
    const config =
        normalizeCloudinaryConfig(value);

    const validationError =
        validateCloudinaryConfig(config);

    if (validationError) {
        throw new Error(validationError);
    }

    if (!storage) {
        throw new Error(
            "Browser storage is unavailable."
        );
    }

    storage.setItem(
        CLOUDINARY_CONFIG_KEY,
        JSON.stringify(config)
    );

    return config;
}

export function getCloudinaryResourceType(mediaType) {
    return mediaType === "videos"
        ? "video"
        : "image";
}

export function buildCloudinaryUploadEndpoint(
    cloudName,
    mediaType
) {
    const configError =
        validateCloudinaryConfig({
            cloudName,
            uploadPreset: "placeholder"
        });

    if (configError) {
        throw new Error(configError);
    }

    return [
        "https://api.cloudinary.com/v1_1",
        encodeURIComponent(String(cloudName).trim()),
        getCloudinaryResourceType(mediaType),
        "upload"
    ].join("/");
}

export function validateCloudinaryFile(
    file,
    mediaType
) {
    if (!file) return "";

    const isVideo =
        mediaType === "videos";

    const allowedTypes = isVideo
        ? ALLOWED_VIDEO_TYPES
        : ALLOWED_IMAGE_TYPES;

    if (!allowedTypes.has(file.type)) {
        return isVideo
            ? "Choose an MP4, WebM or OGG video."
            : "Choose a JPG, PNG or WebP image.";
    }

    const maximumSize = isVideo
        ? MAX_CLOUDINARY_VIDEO_SIZE
        : MAX_CLOUDINARY_IMAGE_SIZE;

    if (file.size > maximumSize) {
        return isVideo
            ? "Video must be 100 MB or smaller."
            : "Image must be 25 MB or smaller.";
    }

    return "";
}

function parseUploadResponse(xhr) {
    try {
        return JSON.parse(xhr.responseText || "{}");
    } catch {
        return {};
    }
}

export function uploadToCloudinary({
    file,
    mediaType,
    config,
    onProgress = () => {},
    xhrFactory = () => new XMLHttpRequest()
}) {
    const normalizedConfig =
        normalizeCloudinaryConfig(config);

    const configError =
        validateCloudinaryConfig(
            normalizedConfig
        );

    if (configError) {
        return Promise.reject(
            new Error(configError)
        );
    }

    const fileError =
        validateCloudinaryFile(
            file,
            mediaType
        );

    if (fileError) {
        return Promise.reject(
            new Error(fileError)
        );
    }

    if (!file) {
        return Promise.reject(
            new Error("Choose a media file first.")
        );
    }

    return new Promise((resolve, reject) => {
        const xhr = xhrFactory();

        xhr.open(
            "POST",
            buildCloudinaryUploadEndpoint(
                normalizedConfig.cloudName,
                mediaType
            )
        );

        xhr.upload?.addEventListener(
            "progress",
            (event) => {
                if (!event.lengthComputable) return;

                onProgress(
                    Math.min(
                        100,
                        Math.round(
                            (event.loaded / event.total) * 100
                        )
                    )
                );
            }
        );

        xhr.addEventListener("error", () => {
            reject(
                new Error(
                    "Cloudinary upload failed. Check your connection and try again."
                )
            );
        });

        xhr.addEventListener("abort", () => {
            reject(
                new Error("Cloudinary upload was cancelled.")
            );
        });

        xhr.addEventListener("load", () => {
            const response =
                parseUploadResponse(xhr);

            if (
                xhr.status < 200 ||
                xhr.status >= 300
            ) {
                reject(
                    new Error(
                        response?.error?.message ||
                        "Cloudinary rejected the upload."
                    )
                );

                return;
            }

            const url =
                response.secure_url ||
                response.url ||
                "";

            if (!url) {
                reject(
                    new Error(
                        "Cloudinary did not return a media URL."
                    )
                );

                return;
            }

            resolve({
                url,
                assetId:
                    response.asset_id || "",
                publicId:
                    response.public_id || "",
                resourceType:
                    response.resource_type ||
                    getCloudinaryResourceType(mediaType),
                format:
                    response.format || "",
                bytes:
                    Number(response.bytes) || 0,
                width:
                    Number(response.width) || 0,
                height:
                    Number(response.height) || 0,
                duration:
                    Number(response.duration) || 0
            });
        });

        const formData = new FormData();

        formData.append("file", file);
        formData.append(
            "upload_preset",
            normalizedConfig.uploadPreset
        );

        xhr.send(formData);
    });
}
