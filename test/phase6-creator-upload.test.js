import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const readProjectFile = (path) =>
    readFile(
        new URL(`../${path}`, import.meta.url),
        "utf8"
    );

test("Creator Studio provides signed uploads and private submissions", async () => {
    const [html, script, config] = await Promise.all([
        readProjectFile("creator-studio.html"),
        readProjectFile("creator-studio.js"),
        readProjectFile("creator-upload-config.js")
    ]);

    [
        "creatorUploadForm",
        "creatorMediaFile",
        "creatorMediaTitle",
        "creatorMediaCategory",
        "creatorMediaRights",
        "creatorSubmissionsList"
    ].forEach((id) => {
        assert.match(
            html,
            new RegExp(`id=["']${id}["']`)
        );
    });

    assert.match(script, /currentUser\.getIdToken\(\)/);
    assert.match(script, /requestUploadSignature\(/);
    assert.match(
        script,
        /collection\(db,\s*"creatorMediaSubmissions"\)/
    );
    assert.match(script, /status:\s*"pending"/);

    assert.match(
        config,
        /signingEndpoint:\s*"https:\/\/bharatvarsh-creator-upload-signature\.bharatvarshofficial\.workers\.dev\/api\/cloudinary-signature"/
    );

    assert.doesNotMatch(config, /API_SECRET|apiSecret/);
});

test("creator media remains private until admin review", async () => {
    const rules = await readProjectFile("firestore.rules");

    assert.match(
        rules,
        /match\s+\/creatorMediaSubmissions\/\{submissionId\}/
    );
    assert.match(
        rules,
        /isActiveCreator\(request\.auth\.uid\)/
    );
    assert.match(
        rules,
        /request\.resource\.data\.status\s*==\s*'pending'/
    );
    assert.match(
        rules,
        /request\.resource\.data\.rightsConfirmed\s*==\s*true/
    );
    assert.match(rules, /https:\/\/res\\\\\.cloudinary\\\\\.com\/kgxel7wp\/\.\*/);
    assert.match(
        rules,
        /allow update:\s*if\s+isAdmin\(\)/
    );
});

test("admin approval publishes creator media atomically", async () => {
    const [html, script] = await Promise.all([
        readProjectFile("css/js/firebase/dashboard.html"),
        readProjectFile("css/js/firebase/dashboard.js")
    ]);

    assert.match(
        html,
        /id=["']creatorMediaSubmissionsList["']/
    );
    assert.match(
        html,
        /id=["']creatorMediaSubmissionCount["']/
    );
    assert.match(
        script,
        /async function loadCreatorMediaSubmissions\(/
    );
    assert.match(
        script,
        /async function reviewCreatorMedia\(/
    );
    assert.match(
        script,
        /source:\s*"cloudinary-creator"/
    );
    assert.match(
        script,
        /uploads:\s*increment\(1\)/
    );
    assert.match(
        script,
        /status:\s*"approved"/
    );
    assert.match(
        script,
        /await reviewBatch\.commit\(\)/
    );
});

test("signature Worker verifies Firebase and protects Cloudinary secrets", async () => {
    const [worker, config, ignore] = await Promise.all([
        readProjectFile("creator-upload-worker/src/index.js"),
        readProjectFile("creator-upload-worker/wrangler.jsonc"),
        readProjectFile(".gitignore")
    ]);

    assert.match(worker, /jwtVerify\(/);
    assert.match(
        worker,
        /securetoken@system\.gserviceaccount\.com/
    );
    assert.match(
        worker,
        /documents\/creators\//
    );
    assert.match(worker, /active creator channel is required/i);
    assert.match(
        worker,
        /createCloudinarySignature\(/
    );
    assert.match(worker, /asset_folder/);
    assert.match(worker, /crypto\.randomUUID\(\)/);

    assert.match(
        config,
        /bharatvarsh_creator_uploads/
    );

    assert.match(
        ignore,
        /creator-upload-worker\/\.dev\.vars/
    );
});