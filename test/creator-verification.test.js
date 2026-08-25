import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const readProjectFile = (path) =>
    readFile(
        new URL(`../${path}`, import.meta.url),
        "utf8"
    );

test("creator onboarding submits an ownership declaration for review", async () => {
    const [html, script] = await Promise.all([
        readProjectFile("profile.html"),
        readProjectFile("profile.js")
    ]);

    [
        "creatorApplicationForm",
        "creatorChannelName",
        "creatorChannelHandle",
        "creatorCategory",
        "creatorBio",
        "creatorRightsConfirmation",
        "submitCreatorApplication"
    ].forEach((id) => {
        assert.match(
            html,
            new RegExp(`id=["']${id}["']`)
        );
    });

    assert.match(script, /"creatorApplications"/);
    assert.match(script, /rightsConfirmed:\s*true/);
    assert.match(script, /status:\s*"pending"/);
    assert.match(script, /submittedAt:\s*serverTimestamp\(\)/);
});

test("creator applications and public channels have separate rules", async () => {
    const rules = await readProjectFile("firestore.rules");

    assert.match(
        rules,
        /match \/creatorApplications\/\{userId\}/
    );
    assert.match(
        rules,
        /request\.resource\.data\.rightsConfirmed == true/
    );
    assert.match(
        rules,
        /request\.resource\.data\.status == 'pending'/
    );
    assert.match(
        rules,
        /match \/creators\/\{creatorId\}/
    );
    assert.match(
        rules,
        /allow create, update, delete: if isAdmin\(\)/
    );
    assert.match(
        rules,
        /hasAny\(\['creatorStatus'\]\)/
    );
});

test("admin dashboard reviews creator applications atomically", async () => {
    const [html, script] = await Promise.all([
        readProjectFile("css/js/firebase/dashboard.html"),
        readProjectFile("css/js/firebase/dashboard.js")
    ]);

    assert.match(html, /id=["']creatorApplicationsList["']/);
    assert.match(html, /id=["']creatorApplicationCount["']/);
    assert.match(script, /async function loadCreatorApplications\(/);
    assert.match(script, /writeBatch\(db\)/);
    assert.match(script, /"approve"/);
    assert.match(script, /"rejected"/);
    assert.match(script, /doc\(db, "creators", uid\)/);
    assert.doesNotMatch(
        script,
        /doc\(db, "creators", uid\)[\s\S]{0,500}\bemail\b/
    );
});

test("Creator Studio opens only for an approved public creator record", async () => {
    const [html, script, viteConfig] = await Promise.all([
        readProjectFile("creator-studio.html"),
        readProjectFile("creator-studio.js"),
        readProjectFile("vite.config.js")
    ]);

    assert.match(html, /id=["']studioLocked["']/);
    assert.match(html, /signed upload\s+service/i);
    assert.match(script, /doc\(db, "creators", user\.uid\)/);
    assert.match(script, /creatorSnapshot\.data\(\)\.status !== "approved"/);
    assert.match(viteConfig, /creator-studio\.html/);
});
