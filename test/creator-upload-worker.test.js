import test from "node:test";
import assert from "node:assert/strict";

import {
    buildAssetFolder,
    createCloudinarySignature,
    getAllowedOrigins,
    getResourceType,
    isAllowedOrigin,
    serializeCloudinaryParameters
} from "../creator-upload-worker/src/security.js";

test("creator upload Worker restricts media types and asset folders", () => {
    assert.equal(getResourceType("wallpapers"), "image");
    assert.equal(getResourceType("images"), "image");
    assert.equal(getResourceType("videos"), "video");
    assert.equal(getResourceType("raw"), "");
    assert.equal(
        buildAssetFolder("creator-123", "wallpapers"),
        "BharatVarshOfficial/creator-submissions/creator-123/wallpapers"
    );
});

test("creator upload Worker allows only configured origins", () => {
    const origins = getAllowedOrigins(
        "http://localhost:5174, https://bharatvarshofficial.github.io"
    );

    assert.equal(
        isAllowedOrigin("http://localhost:5174", origins),
        true
    );
    assert.equal(
        isAllowedOrigin("https://attacker.example", origins),
        false
    );
});

test("Cloudinary parameters are serialized and signed with SHA-256", async () => {
    const parameters = {
        timestamp: 1315060510,
        asset_folder: "BharatVarshOfficial/creator-submissions/user/images",
        upload_preset: "bharatvarsh_creator_uploads"
    };

    assert.equal(
        serializeCloudinaryParameters(parameters),
        "asset_folder=BharatVarshOfficial/creator-submissions/user/images&timestamp=1315060510&upload_preset=bharatvarsh_creator_uploads"
    );

    const signature = await createCloudinarySignature(
        parameters,
        "test-secret"
    );

    assert.match(signature, /^[a-f0-9]{64}$/);
});
