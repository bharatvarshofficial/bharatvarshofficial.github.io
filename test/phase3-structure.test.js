import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const readProjectFile = (path) =>
    readFile(
        new URL(`../${path}`, import.meta.url),
        "utf8"
    );

test("public page contains no dead placeholder links or fake launch stats", async () => {
    const html = await readProjectFile("index.html");

    assert.doesNotMatch(html, /href=["']#["']/);
    assert.doesNotMatch(html, />\s*AI Wallpaper\s*</);
    assert.doesNotMatch(html, /5000\+|100K\+|10K\+/);
});

test("accessible wallpaper dialog remains wired without smart device recommendations", async () => {
    const [html, script] = await Promise.all([
        readProjectFile("index.html"),
        readProjectFile("script.js")
    ]);

    ["wallpaperModal", "wallpaperModalDownload"].forEach((id) => {
        assert.match(html, new RegExp(`id=["']${id}["']`));
    });

    assert.match(html, /role=["']dialog["']/);
    assert.match(html, /aria-modal=["']true["']/);
    assert.match(script, /function openWallpaperPreview\(/);
    assert.doesNotMatch(html, /Smart size recommendation/i);
    assert.doesNotMatch(html, /id=["']deviceResolution["']/);
    assert.doesNotMatch(script, /getDeviceRecommendation\(/);
});

test("public policy and search discovery files are included", async () => {
    const [policies, robots, sitemap, manifest] = await Promise.all([
        readProjectFile("policies.html"),
        readProjectFile("public/robots.txt"),
        readProjectFile("public/sitemap.xml"),
        readProjectFile("public/site.webmanifest")
    ]);

    assert.match(policies, /id=["']privacy["']/);
    assert.match(policies, /id=["']terms["']/);
    assert.match(robots, /Sitemap:/);
    assert.match(sitemap, /policies\.html/);
    assert.equal(
        JSON.parse(manifest).name,
        "BharatVarshOfficial"
    );
});

test("admin dashboard uses configurable Cloudinary direct upload", async () => {
    const [dashboardHtml, dashboardScript, uploader] = await Promise.all([
        readProjectFile("css/js/firebase/dashboard.html"),
        readProjectFile("css/js/firebase/dashboard.js"),
        readProjectFile("cloudinary-uploader.js")
    ]);

    [
        "cloudinaryCloudName",
        "cloudinaryUploadPreset",
        "cloudinarySaveBtn",
        "mediaFile"
    ].forEach((id) => {
        assert.match(
            dashboardHtml,
            new RegExp(`id=["']${id}["']`)
        );
    });

    assert.doesNotMatch(
        dashboardHtml,
        /id=["']mediaFile["'][^>]*disabled/s
    );

    assert.match(
        dashboardScript,
        /uploadToCloudinary/
    );

    assert.match(
        uploader,
        /api\.cloudinary\.com\/v1_1/
    );

    assert.match(
        uploader,
        /upload_preset/
    );
});

test("admin dashboard keeps legacy media visible and edits legacy URLs safely", async () => {
    const dashboardScript = await readProjectFile(
        "css/js/firebase/dashboard.js"
    );

    assert.match(
        dashboardScript,
        /getCountFromServer/
    );

    assert.match(
        dashboardScript,
        /orderedSnapshot\.size\s*</
    );

    assert.match(
        dashboardScript,
        /isValidPublicURL\(existingURL\)/
    );
});
