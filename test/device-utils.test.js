import test from "node:test";
import assert from "node:assert/strict";

import {
    getAspectRatioLabel,
    getDeviceRecommendation,
    getWallpaperFitMessage
} from "../device-utils.js";

test("device recommendation converts CSS pixels to physical pixels", () => {
    const result = getDeviceRecommendation({
        screenWidth: 360,
        screenHeight: 800,
        devicePixelRatio: 3
    });

    assert.equal(result.label, "1080 × 2400 px");
    assert.equal(result.orientation, "Portrait");
    assert.equal(result.aspectRatio, "9:20");
});

test("device pixel ratio is clamped to a safe browser range", () => {
    const result = getDeviceRecommendation({
        screenWidth: 1920,
        screenHeight: 1080,
        devicePixelRatio: 9
    });

    assert.equal(result.pixelRatio, 4);
    assert.equal(result.orientation, "Landscape");
});

test("aspect ratio uses a reduced exact ratio when practical", () => {
    assert.equal(
        getAspectRatioLabel(1080, 1920),
        "9:16"
    );
});

test("wallpaper fit explains resolution and orientation", () => {
    const device = getDeviceRecommendation({
        screenWidth: 360,
        screenHeight: 800,
        devicePixelRatio: 3
    });

    assert.equal(
        getWallpaperFitMessage(1440, 3200, device),
        "Excellent fit for this screen"
    );

    assert.match(
        getWallpaperFitMessage(1920, 1080, device),
        /crop/
    );
});
