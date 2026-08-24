import test from "node:test";
import assert from "node:assert/strict";

import {
    CATEGORY_LABELS,
    canonicalizeCategory,
    categoriesEqual,
    getCategoryKey,
    mergeCategoryLabels
} from "../categories.js";

test("legacy category names resolve to canonical labels", () => {
    assert.equal(
        canonicalizeCategory("Shivaji Maharaj"),
        "Chhatrapati Shivaji Maharaj"
    );

    assert.equal(
        canonicalizeCategory("Temple"),
        "Temples"
    );

    assert.equal(
        canonicalizeCategory("Nature"),
        "Nature / India"
    );
});

test("category comparisons ignore supported aliases", () => {
    assert.equal(
        categoriesEqual(
            "Shivaji Maharaj",
            "Chhatrapati Shivaji Maharaj"
        ),
        true
    );

    assert.equal(
        categoriesEqual("Temple", "Temples"),
        true
    );
});

test("category keys are stable", () => {
    assert.equal(
        getCategoryKey("Nature / India"),
        "nature-india"
    );

    assert.equal(
        getCategoryKey("Freedom Fighter"),
        "freedom-fighters"
    );
});

test("merged category labels contain no alias duplicates", () => {
    const merged = mergeCategoryLabels(
        CATEGORY_LABELS,
        ["Shivaji Maharaj", "Temple", "Nature"]
    );

    assert.equal(
        merged.filter(
            (category) =>
                category === "Chhatrapati Shivaji Maharaj"
        ).length,
        1
    );

    assert.equal(
        merged.filter(
            (category) => category === "Temples"
        ).length,
        1
    );
});
