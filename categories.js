// ============================================================
// BharatVarshOfficial
// Canonical category model shared by the public site and admin
// ============================================================

const CATEGORY_DEFINITIONS = Object.freeze([
    {
        key: "chhatrapati-shivaji-maharaj",
        label: "Chhatrapati Shivaji Maharaj",
        aliases: [
            "shivaji maharaj",
            "chhatrapati shivaji",
            "shivaji"
        ]
    },
    {
        key: "indian-army",
        label: "Indian Army",
        aliases: ["army"]
    },
    {
        key: "freedom-fighters",
        label: "Freedom Fighters",
        aliases: ["freedom fighter"]
    },
    {
        key: "temples",
        label: "Temples",
        aliases: ["temple"]
    },
    {
        key: "festivals",
        label: "Festivals",
        aliases: ["festival"]
    },
    {
        key: "indian-culture",
        label: "Indian Culture",
        aliases: ["culture"]
    },
    {
        key: "nature-india",
        label: "Nature / India",
        aliases: [
            "nature",
            "india nature",
            "nature india"
        ]
    },
    {
        key: "anime",
        label: "Anime",
        aliases: []
    },
    {
        key: "country",
        label: "Country",
        aliases: ["countries"]
    },
    {
        key: "other",
        label: "Other",
        aliases: ["others"]
    }
]);

function normalizeLookupValue(value) {
    return String(value || "")
        .normalize("NFKC")
        .trim()
        .toLowerCase()
        .replace(/&/g, "and")
        .replace(/[_-]+/g, " ")
        .replace(/\s*\/\s*/g, " ")
        .replace(/[^a-z0-9\u0900-\u097f ]+/g, " ")
        .replace(/\s+/g, " ")
        .trim();
}

const CATEGORY_BY_KEY = new Map();
const KEY_BY_ALIAS = new Map();

CATEGORY_DEFINITIONS.forEach((definition) => {
    CATEGORY_BY_KEY.set(definition.key, definition);

    [
        definition.key,
        definition.label,
        ...definition.aliases
    ].forEach((value) => {
        KEY_BY_ALIAS.set(
            normalizeLookupValue(value),
            definition.key
        );
    });
});

export const CATEGORY_LABELS = Object.freeze(
    CATEGORY_DEFINITIONS.map(
        (definition) => definition.label
    )
);

export function getCategoryKey(value) {
    const lookupValue = normalizeLookupValue(value);

    if (!lookupValue) return "";

    const canonicalKey = KEY_BY_ALIAS.get(lookupValue);

    if (canonicalKey) return canonicalKey;

    return lookupValue
        .replace(/\s+/g, "-")
        .replace(/^-+|-+$/g, "");
}

export function canonicalizeCategory(value) {
    const key = getCategoryKey(value);
    const definition = CATEGORY_BY_KEY.get(key);

    if (definition) return definition.label;

    return String(value || "")
        .normalize("NFKC")
        .trim()
        .replace(/\s+/g, " ");
}

export function categoriesEqual(first, second) {
    const firstKey = getCategoryKey(first);
    const secondKey = getCategoryKey(second);

    return Boolean(firstKey) && firstKey === secondKey;
}

export function mergeCategoryLabels(...categoryGroups) {
    const categoriesByKey = new Map();

    categoryGroups
        .flat()
        .forEach((value) => {
            const label = canonicalizeCategory(value);
            const key = getCategoryKey(label);

            if (key && !categoriesByKey.has(key)) {
                categoriesByKey.set(key, label);
            }
        });

    return [...categoriesByKey.values()];
}
