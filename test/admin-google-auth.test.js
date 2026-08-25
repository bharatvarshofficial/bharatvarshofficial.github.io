import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const readProjectFile = (path) =>
    readFile(
        new URL(`../${path}`, import.meta.url),
        "utf8"
    );

test("admin login uses Google provider and exact UID authorization", async () => {
    const [html, script] = await Promise.all([
        readProjectFile("admin.html"),
        readProjectFile("admin.js")
    ]);

    assert.match(html, /id=["']googleAdminLogin["']/);
    assert.match(html, /Continue with Google/);
    assert.match(script, /new GoogleAuthProvider\(\)/);
    assert.match(script, /signInWithPopup\(/);
    assert.match(
        script,
        /hGrTepDbtsaCoSQL5D2bBG0iZzD2/
    );
    assert.match(script, /credential\.user\.uid !== ADMIN_UID/);
    assert.match(script, /await signOut\(auth\)/);
});

test("admin page no longer requests or resets a Gmail password", async () => {
    const [html, script] = await Promise.all([
        readProjectFile("admin.html"),
        readProjectFile("admin.js")
    ]);

    assert.doesNotMatch(html, /type=["']password["']/);
    assert.doesNotMatch(html, /Forgot Password/i);
    assert.doesNotMatch(script, /signInWithEmailAndPassword/);
    assert.doesNotMatch(script, /sendPasswordResetEmail/);
});
