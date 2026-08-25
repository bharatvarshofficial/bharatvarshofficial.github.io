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

test("device advisor and accessible wallpaper dialog are wired", async () => {
    const [html, script] = await Promise.all([
        readProjectFile("index.html"),
        readProjectFile("script.js")
    ]);

    [
        "deviceResolution",
        "deviceOrientation",
        "deviceAspectRatio",
        "wallpaperModal",
        "wallpaperModalDownload"
    ].forEach((id) => {
        assert.match(html, new RegExp(`id=["']${id}["']`));
    });

    assert.match(html, /role=["']dialog["']/);
    assert.match(html, /aria-modal=["']true["']/);
    assert.match(script, /function openWallpaperPreview\(/);
    assert.match(script, /getDeviceRecommendation\(/);
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

test("direct Firebase Storage selection stays disabled until Cloudinary", async () => {
    const [dashboardHtml, dashboardScript] = await Promise.all([
        readProjectFile("css/js/firebase/dashboard.html"),
        readProjectFile("css/js/firebase/dashboard.js")
    ]);

    assert.match(
        dashboardHtml,
        /id=["']mediaFile["'][^>]*disabled/s
    );

    assert.match(
        dashboardScript,
        /const DIRECT_FILE_UPLOAD_ENABLED = false;/
    );

    assert.match(
        dashboardScript,
        /Use a public media URL/
    );
});
