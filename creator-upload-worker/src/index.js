import {
    importX509,
    jwtVerify
} from "jose";

import {
    buildAssetFolder,
    createCloudinarySignature,
    getAllowedOrigins,
    getResourceType,
    isAllowedOrigin
} from "./security.js";

const FIREBASE_CERTIFICATES_URL =
    "https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com";

let certificateCache = {
    expiresAt: 0,
    certificates: null
};

function jsonResponse(body, status, origin = "") {
    const headers = {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "no-store",
        "Vary": "Origin"
    };

    if (origin) {
        headers["Access-Control-Allow-Origin"] = origin;
        headers["Access-Control-Allow-Headers"] =
            "Authorization, Content-Type";
        headers["Access-Control-Allow-Methods"] =
            "POST, OPTIONS";
    }

    return new Response(
        status === 204
            ? null
            : JSON.stringify(body),
        { status, headers }
    );
}

function getBearerToken(request) {
    const authorization =
        request.headers.get("Authorization") || "";

    const match = authorization.match(/^Bearer\s+(.+)$/i);
    return match?.[1] || "";
}

function readJwtHeader(token) {
    const encodedHeader = token.split(".")[0];

    if (!encodedHeader) {
        throw new Error("Malformed Firebase token.");
    }

    const base64 = encodedHeader
        .replace(/-/g, "+")
        .replace(/_/g, "/")
        .padEnd(
            Math.ceil(encodedHeader.length / 4) * 4,
            "="
        );

    return JSON.parse(atob(base64));
}

async function getFirebaseCertificates() {
    const now = Date.now();

    if (
        certificateCache.certificates &&
        certificateCache.expiresAt > now
    ) {
        return certificateCache.certificates;
    }

    const response = await fetch(
        FIREBASE_CERTIFICATES_URL
    );

    if (!response.ok) {
        throw new Error(
            "Firebase public keys are unavailable."
        );
    }

    const cacheControl =
        response.headers.get("Cache-Control") || "";

    const maxAge = Number(
        cacheControl.match(/max-age=(\d+)/)?.[1]
    ) || 3600;

    certificateCache = {
        certificates: await response.json(),
        expiresAt: now + (maxAge * 1000)
    };

    return certificateCache.certificates;
}

async function verifyFirebaseToken(token, projectId) {
    const header = readJwtHeader(token);

    if (header.alg !== "RS256" || !header.kid) {
        throw new Error("Unsupported Firebase token.");
    }

    const certificates =
        await getFirebaseCertificates();

    const certificate = certificates[header.kid];

    if (!certificate) {
        certificateCache.expiresAt = 0;
        throw new Error("Firebase signing key was not found.");
    }

    const publicKey = await importX509(
        certificate,
        "RS256"
    );

    const { payload } = await jwtVerify(
        token,
        publicKey,
        {
            algorithms: ["RS256"],
            audience: projectId,
            issuer:
                `https://securetoken.google.com/${projectId}`
        }
    );

    if (
        !payload.sub ||
        typeof payload.sub !== "string"
    ) {
        throw new Error("Firebase UID is missing.");
    }

    return payload.sub;
}

async function getActiveCreator(
    token,
    projectId,
    uid
) {
    const endpoint =
        `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(projectId)}/databases/(default)/documents/creators/${encodeURIComponent(uid)}`;

    const response = await fetch(endpoint, {
        headers: {
            Authorization: `Bearer ${token}`
        }
    });

    if (!response.ok) return null;

    const document = await response.json();

    return ["active", "approved"].includes(
        document.fields?.status?.stringValue
    )
        ? document
        : null;
}

async function handleSignatureRequest(
    request,
    env,
    origin
) {
    if (
        !env.FIREBASE_PROJECT_ID ||
        !env.CLOUDINARY_CLOUD_NAME ||
        !env.CLOUDINARY_UPLOAD_PRESET ||
        !env.CLOUDINARY_API_KEY ||
        !env.CLOUDINARY_API_SECRET
    ) {
        return jsonResponse(
            { error: "Upload service is not configured." },
            503,
            origin
        );
    }

    const token = getBearerToken(request);

    if (!token) {
        return jsonResponse(
            { error: "Firebase authentication is required." },
            401,
            origin
        );
    }

    let uid;

    try {
        uid = await verifyFirebaseToken(
            token,
            env.FIREBASE_PROJECT_ID
        );
    } catch (error) {
        console.warn("Firebase token rejected:", error);
        return jsonResponse(
            { error: "Invalid or expired Firebase login." },
            401,
            origin
        );
    }

    const creator = await getActiveCreator(
        token,
        env.FIREBASE_PROJECT_ID,
        uid
    );

    if (!creator) {
        return jsonResponse(
            { error: "An active creator channel is required." },
            403,
            origin
        );
    }

    let payload;

    try {
        payload = await request.json();
    } catch {
        return jsonResponse(
            { error: "A JSON request body is required." },
            400,
            origin
        );
    }

    const resourceType =
        getResourceType(payload.mediaType);

    if (!resourceType) {
        return jsonResponse(
            { error: "Unsupported creator media type." },
            400,
            origin
        );
    }

    const timestamp =
        Math.floor(Date.now() / 1000);

    const signedParameters = {
        asset_folder:
            buildAssetFolder(
                uid,
                payload.mediaType
            ),
        public_id:
            `${uid.slice(0, 12)}-${crypto.randomUUID()}`,
        timestamp,
        upload_preset:
            env.CLOUDINARY_UPLOAD_PRESET
    };

    const signature =
        await createCloudinarySignature(
            signedParameters,
            env.CLOUDINARY_API_SECRET
        );

    return jsonResponse(
        {
            apiKey: env.CLOUDINARY_API_KEY,
            cloudName: env.CLOUDINARY_CLOUD_NAME,
            resourceType,
            signature,
            signatureAlgorithm: "sha256",
            signedParameters,
            expiresIn: 3600
        },
        200,
        origin
    );
}

export default {
    async fetch(request, env) {
        const origin =
            request.headers.get("Origin") || "";

        const allowedOrigins =
            getAllowedOrigins(env.ALLOWED_ORIGINS);

        if (!isAllowedOrigin(origin, allowedOrigins)) {
            return jsonResponse(
                { error: "Origin is not allowed." },
                403
            );
        }

        if (request.method === "OPTIONS") {
            return jsonResponse({}, 204, origin);
        }

        const url = new URL(request.url);

        if (
            request.method !== "POST" ||
            url.pathname !== "/api/cloudinary-signature"
        ) {
            return jsonResponse(
                { error: "Not found." },
                404,
                origin
            );
        }

        return handleSignatureRequest(
            request,
            env,
            origin
        );
    }
};
