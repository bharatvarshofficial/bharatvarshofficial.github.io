import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import {
    buildCloudinaryExactSizeURL,
    getDownloadSizeOptions,
    getExtensionForMimeType,
    getWallpaperDimensions,
    validateDownloadDimensions
} from "../download-utils.js";

const readProjectFile = (path) =>
    readFile(
        new URL(`../${path}`, import.meta.url),
        "utf8"
    );

test("wallpaper dimensions support stored fields and legacy resolution text", () => {
    assert.deepEqual(
        getWallpaperDimensions({
            resolution: "1080 × 1920 px"
        }),
        {
            width: 1080,
            height: 1920,
            orientation: "portrait"
        }
    );

    assert.equal(
        getWallpaperDimensions({
            width: 2560,
            height: 1440
        }).orientation,
        "landscape"
    );
});

test("download sizes use fixed presets without device recommendations", () => {
    const options = getDownloadSizeOptions({
        wallpaper: {
            width: 1440,
            height: 3200
        }
    });

    assert.equal(options[0].id, "mobile-hd");
    assert.equal(
        options.some((option) => option.id === "device-recommended"),
        false
    );
    assert.ok(options.some((option) => option.id === "original"));
    assert.ok(options.some((option) => option.id === "custom"));
});

test("landscape wallpapers receive desktop presets", () => {
    const options = getDownloadSizeOptions({
        wallpaper: {
            width: 3840,
            height: 2160
        }
    });

    assert.ok(
        options.some(
            option =>
                option.id === "desktop-full-hd" &&
                option.width === 1920 &&
                option.height === 1080
        )
    );
});

test("custom dimensions are bounded to safe exact-size exports", () => {
    assert.deepEqual(
        validateDownloadDimensions(1080, 1920),
        {
            valid: true,
            width: 1080,
            height: 1920,
            message: ""
        }
    );

    assert.equal(
        validateDownloadDimensions(100, 1920).valid,
        false
    );

    assert.equal(
        validateDownloadDimensions(7680, 7680).valid,
        false
    );
});

test("Cloudinary URL receives an exact smart-crop transformation", () => {
    const transformed = buildCloudinaryExactSizeURL(
        "https://res.cloudinary.com/kgxel7wp/image/upload/v123/wallpapers/kedarnath.png",
        1080,
        1920
    );

    assert.match(
        transformed,
        /\/image\/upload\/c_fill,g_auto,w_1080,h_1920,fl_attachment,q_auto:good,f_auto\/v123\//
    );

    assert.equal(
        buildCloudinaryExactSizeURL(
            "https://example.com/wallpaper.jpg",
            1080,
            1920
        ),
        ""
    );
});

test("download filename extension follows the generated image MIME type", () => {
    assert.equal(
        getExtensionForMimeType("image/webp"),
        "webp"
    );

    assert.equal(
        getExtensionForMimeType("image/jpeg; charset=binary"),
        "jpg"
    );
});

test("public page wires the accessible size selector and exact-size pipeline", async () => {
    const [html, script, style] = await Promise.all([
        readProjectFile("index.html"),
        readProjectFile("script.js"),
        readProjectFile("style.css")
    ]);

    [
        "downloadSizeModal",
        "downloadSizeOptions",
        "downloadCustomWidth",
        "downloadCustomHeight",
        "downloadSizeConfirm"
    ].forEach((id) => {
        assert.match(
            html,
            new RegExp(`id=["']${id}["']`)
        );
    });

    assert.match(
        html,
        /id=["']downloadSizeDialog["'][^>]*[\s\S]*?role=["']dialog["']/
    );
    assert.match(script, /function openDownloadSizeDialog\(/);
    assert.match(script, /resizeImageBlobToExactSize\(/);
    assert.match(script, /buildCloudinaryExactSizeURL\(/);
    assert.match(style, /\.download-size-options/);
});
