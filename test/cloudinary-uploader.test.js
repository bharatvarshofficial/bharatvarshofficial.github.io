import test from "node:test";
import assert from "node:assert/strict";

import {
    buildCloudinaryUploadEndpoint,
    getCloudinaryResourceType,
    isCloudinaryConfigured,
    loadCloudinaryConfig,
    saveCloudinaryConfig,
    uploadToCloudinary,
    validateCloudinaryFile
} from "../cloudinary-uploader.js";

function createMemoryStorage() {
    const values = new Map();

    return {
        getItem(key) {
            return values.get(key) ?? null;
        },
        setItem(key, value) {
            values.set(key, String(value));
        }
    };
}

test("Cloudinary configuration is validated and persisted", () => {
    const storage = createMemoryStorage();

    assert.equal(
        isCloudinaryConfigured({}),
        false
    );

    saveCloudinaryConfig(
        {
            cloudName: "bharat-cloud",
            uploadPreset: "bharat_admin"
        },
        storage
    );

    assert.deepEqual(
        loadCloudinaryConfig(storage),
        {
            cloudName: "bharat-cloud",
            uploadPreset: "bharat_admin"
        }
    );
});

test("Cloudinary endpoint uses the correct resource type", () => {
    assert.equal(
        getCloudinaryResourceType("videos"),
        "video"
    );

    assert.equal(
        buildCloudinaryUploadEndpoint(
            "bharat-cloud",
            "wallpapers"
        ),
        "https://api.cloudinary.com/v1_1/bharat-cloud/image/upload"
    );
});

test("Cloudinary file validation enforces type and size", () => {
    assert.equal(
        validateCloudinaryFile(
            {
                type: "image/png",
                size: 2 * 1024 * 1024
            },
            "wallpapers"
        ),
        ""
    );

    assert.match(
        validateCloudinaryFile(
            {
                type: "application/pdf",
                size: 500
            },
            "images"
        ),
        /JPG, PNG or WebP/
    );

    assert.match(
        validateCloudinaryFile(
            {
                type: "video/mp4",
                size: 101 * 1024 * 1024
            },
            "videos"
        ),
        /100 MB/
    );
});

test("Cloudinary upload returns normalized asset metadata", async () => {
    const listeners = new Map();
    const uploadListeners = new Map();

    const xhr = {
        status: 200,
        responseText: JSON.stringify({
            secure_url:
                "https://res.cloudinary.com/demo/image/upload/sample.png",
            asset_id: "asset-123",
            public_id: "bharat/sample",
            resource_type: "image",
            format: "png",
            bytes: 4,
            width: 1440,
            height: 900
        }),
        upload: {
            addEventListener(type, listener) {
                uploadListeners.set(type, listener);
            }
        },
        open(method, url) {
            this.method = method;
            this.url = url;
        },
        addEventListener(type, listener) {
            listeners.set(type, listener);
        },
        send(body) {
            this.body = body;

            uploadListeners.get("progress")?.({
                lengthComputable: true,
                loaded: 4,
                total: 4
            });

            listeners.get("load")?.();
        }
    };

    const progress = [];

    const result = await uploadToCloudinary({
        file: new Blob(
            ["test"],
            { type: "image/png" }
        ),
        mediaType: "wallpapers",
        config: {
            cloudName: "demo",
            uploadPreset: "bharat_admin"
        },
        onProgress(value) {
            progress.push(value);
        },
        xhrFactory() {
            return xhr;
        }
    });

    assert.equal(xhr.method, "POST");
    assert.equal(
        xhr.url,
        "https://api.cloudinary.com/v1_1/demo/image/upload"
    );
    assert.deepEqual(progress, [100]);
    assert.equal(result.publicId, "bharat/sample");
    assert.equal(result.width, 1440);
    assert.equal(result.height, 900);
});
