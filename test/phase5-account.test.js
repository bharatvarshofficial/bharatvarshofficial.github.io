import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const readProjectFile = (path) =>
    readFile(
        new URL(`../${path}`, import.meta.url),
        "utf8"
    );

test("signed-in users receive a YouTube-style account menu", async () => {
    const [html, script] = await Promise.all([
        readProjectFile("index.html"),
        readProjectFile("script.js")
    ]);

    [
        "accountMenu",
        "accountMenuButton",
        "accountDropdown",
        "headerUserPhoto",
        "accountFavouritesButton",
        "accountLogoutButton"
    ].forEach((id) => {
        assert.match(
            html,
            new RegExp(`id=["']${id}["']`)
        );
    });

    assert.match(html, /href=["']\.\/profile\.html["']/);
    assert.match(script, /function setAccountMenuOpen\(/);
    assert.match(script, /updateAccountAvatar\(/);
});

test("private profile page exposes account and instant creator foundations", async () => {
    const [html, script, viteConfig] = await Promise.all([
        readProjectFile("profile.html"),
        readProjectFile("profile.js"),
        readProjectFile("vite.config.js")
    ]);

    assert.match(html, /name=["']robots["']/);
    assert.match(html, /noindex, nofollow/);
    assert.match(html, /data-profile-tab=["']favourites["']/);
    assert.match(html, /data-profile-tab=["']creator["']/);
    assert.match(script, /creatorStatus:\s*["']active["']/);
    assert.match(script, /collection|wallpapers/);
    assert.match(viteConfig, /profile\.html/);
});

test("private account data remains owner-only in Firestore rules", async () => {
    const rules = await readProjectFile("firestore.rules");

    assert.match(rules, /match \/users\/\{userId\}/);
    assert.match(rules, /allow read: if isOwner\(userId\) \|\| isAdmin\(\)/);
    assert.doesNotMatch(
        rules,
        /match \/users\/\{userId\}[\s\S]{0,180}allow read: if true/
    );
});
