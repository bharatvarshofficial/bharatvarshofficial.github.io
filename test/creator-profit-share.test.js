import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
    CREATOR_PROFIT_SHARE_RATE,
    CREATOR_PROFIT_SHARE_PERCENT,
    calculateCreatorProfitShare,
    calculatePlatformRetainedProfit
} from "../creator-earnings-policy.js";

const readProjectFile = (path) =>
    readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("creator profit share is fixed at exactly 20 percent", () => {
    assert.equal(CREATOR_PROFIT_SHARE_RATE, 0.20);
    assert.equal(CREATOR_PROFIT_SHARE_PERCENT, 20);
    assert.equal(calculateCreatorProfitShare(100), 20);
    assert.equal(calculateCreatorProfitShare(1000), 200);
    assert.equal(calculateCreatorProfitShare(123.45), 24.69);
    assert.equal(calculateCreatorProfitShare(-50), 0);
    assert.equal(calculatePlatformRetainedProfit(1000), 800);
});

test("creator studio clearly explains 20 percent verified profit sharing", async () => {
    const [html, script, profileScript] = await Promise.all([
        readProjectFile("creator-studio.html"),
        readProjectFile("creator-studio.js"),
        readProjectFile("profile.js")
    ]);

    assert.match(html, /20% of the verified net platform profit/i);
    assert.match(html, /Earn 20%/i);
    assert.match(html, /studioAttributedProfit/);
    assert.match(html, /studioProfitShareRate/);
    assert.match(script, /CREATOR_PROFIT_SHARE_RATE/);
    assert.match(script, /attributedPlatformProfit/);
    assert.match(profileScript, /profitShareRate:\s*CREATOR_PROFIT_SHARE_RATE/);
    assert.match(profileScript, /attributedPlatformProfit:\s*0/);
});

test("admin settles creator-attributed profit and credits only the 20 percent share", async () => {
    const [html, script, rules] = await Promise.all([
        readProjectFile("css/js/firebase/dashboard.html"),
        readProjectFile("css/js/firebase/dashboard.js"),
        readProjectFile("firestore.rules")
    ]);

    assert.match(html, /earningsAttributedProfit/);
    assert.match(html, /Creator share \(20%\)/i);
    assert.match(script, /calculateCreatorProfitShare\(attributedProfit\)/);
    assert.match(script, /type:\s*"profit_share_credit"/);
    assert.match(script, /attributedPlatformProfit:\s*attributedProfit/);
    assert.match(script, /profitShareRate:\s*CREATOR_PROFIT_SHARE_RATE/);
    assert.match(script, /availableBalance = increment\(creatorShare\)/);
    assert.match(rules, /profitShareRate == 0\.20/);
    assert.match(rules, /allow update, delete: if isAdmin\(\)/);
});
