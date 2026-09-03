import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const readProjectFile = (path) =>
    readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("creator channel is created instantly without an admin application", async () => {
    const [html, script] = await Promise.all([
        readProjectFile("profile.html"),
        readProjectFile("profile.js")
    ]);

    [
        "creatorChannelForm",
        "creatorChannelName",
        "creatorChannelHandle",
        "creatorCategory",
        "creatorBio",
        "creatorRightsConfirmation",
        "createCreatorChannelNow"
    ].forEach((id) => {
        assert.match(html, new RegExp(`id=["']${id}["']`));
    });

    assert.match(html, /No admin approval is\s+required/i);
    assert.match(script, /doc\(db, "creators", currentUser\.uid\)/);
    assert.match(script, /status:\s*"active"/);
    assert.match(script, /writeBatch\(db\)/);
    assert.doesNotMatch(script, /"creatorApplications"/);
    assert.doesNotMatch(script, /status:\s*"pending"/);
});

test("creator rules allow safe self-service channel creation and protect metrics", async () => {
    const rules = await readProjectFile("firestore.rules");

    assert.match(rules, /match \/creators\/\{creatorId\}/);
    assert.match(rules, /allow create: if isOwner\(creatorId\)/);
    assert.match(rules, /request\.resource\.data\.status == 'active'/);
    assert.match(rules, /request\.resource\.data\.uploads == 0/);
    assert.match(rules, /request\.resource\.data\.followers == 0/);
    assert.match(rules, /creatorApplications[\s\S]*allow create, update, delete: if false/);
});

test("Creator Studio accepts an active creator channel", async () => {
    const [html, script, viteConfig] = await Promise.all([
        readProjectFile("creator-studio.html"),
        readProjectFile("creator-studio.js"),
        readProjectFile("vite.config.js")
    ]);

    assert.match(html, /No admin approval is\s+required/i);
    assert.match(script, /\["active", "approved"\]\.includes/);
    assert.match(script, /showState\("active"\)/);
    assert.match(viteConfig, /creator-studio\.html/);
});

test("creator earnings are backend controlled with a payout threshold", async () => {
    const [html, script, rules] = await Promise.all([
        readProjectFile("creator-studio.html"),
        readProjectFile("creator-studio.js"),
        readProjectFile("firestore.rules")
    ]);

    assert.match(html, /id=["']studioEstimatedEarnings["']/);
    assert.match(html, /id=["']studioPayoutButton["']/);
    assert.match(script, /"creatorEarnings"/);
    assert.match(script, /"payoutRequests"/);
    assert.match(script, /"creatorEarningTransactions"/);
    assert.match(rules, /match \/creatorEarnings\/\{creatorId\}/);
    assert.match(rules, /match \/creatorEarningTransactions\/\{transactionId\}/);
    assert.match(rules, /allow update, delete: if isAdmin\(\)/);
    assert.match(rules, /minimumPayout == 1000/);
});

test("admin dashboard can settle verified creator profit share and process payouts", async () => {
    const [html, script] = await Promise.all([
        readProjectFile("css/js/firebase/dashboard.html"),
        readProjectFile("css/js/firebase/dashboard.js")
    ]);

    assert.match(html, /id=["']creatorEarningsForm["']/);
    assert.match(html, /id=["']creatorPayoutRequestsList["']/);
    assert.match(script, /async function saveCreatorEarnings\(/);
    assert.match(script, /async function loadCreatorPayoutRequests\(/);
    assert.match(script, /async function reviewCreatorPayout\(/);
    assert.match(script, /availableBalance:\s*increment\(-amount\)/);
    assert.match(script, /type:\s*"profit_share_credit"/);
    assert.match(script, /type:\s*"payout"/);
});
