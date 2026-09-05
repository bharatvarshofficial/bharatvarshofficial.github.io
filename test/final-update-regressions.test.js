import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

function read(path) {
  return readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}

test("final update safely registers creator rights confirmation", () => {
  const source = read("profile.js");
  assert.match(source, /creatorRightsConfirmation:\s*document\.getElementById\(/);
  assert.ok(source.includes("elements.creatorRightsConfirmation?.checked !== true"));
});

test("final update avoids reopening Google chooser for authenticated user", () => {
  const source = read("script.js");
  assert.ok(source.includes("if (auth.currentUser)"));
  assert.ok(!source.includes('prompt: "select_account"'));
});

test("final update verifies exact size and uses local fallback", () => {
  const source = read("script.js");
  assert.ok(source.includes("transformedImage.naturalWidth !== dimensions.width"));
  assert.ok(source.includes("Cloudinary exact-size download failed; falling back to local exact resize."));
  assert.ok(source.includes("resizeImageBlobToExactSize"));
});

test("final update includes 20:9 portrait and landscape presets", () => {
  const source = read("download-utils.js");
  assert.ok(source.includes('id: "mobile-20-9"'));
  assert.ok(source.includes('id: "desktop-20-9"'));
});