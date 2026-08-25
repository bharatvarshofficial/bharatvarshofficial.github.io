// ============================================================
// BharatVarshOfficial
// Device-aware wallpaper recommendation helpers
// ============================================================

const MIN_DEVICE_PIXEL_RATIO = 1;
const MAX_DEVICE_PIXEL_RATIO = 4;

function toPositiveNumber(value, fallback = 0) {
    const number = Number(value);

    return Number.isFinite(number) && number > 0
        ? number
        : fallback;
}

function greatestCommonDivisor(first, second) {
    let left = Math.round(Math.abs(first));
    let right = Math.round(Math.abs(second));

    while (right) {
        const remainder = left % right;
        left = right;
        right = remainder;
    }

    return left || 1;
}

export function getAspectRatioLabel(width, height) {
    const safeWidth = Math.round(toPositiveNumber(width));
    const safeHeight = Math.round(toPositiveNumber(height));

    if (!safeWidth || !safeHeight) return "Unknown";

    const divisor = greatestCommonDivisor(
        safeWidth,
        safeHeight
    );

    const ratioWidth = Math.round(safeWidth / divisor);
    const ratioHeight = Math.round(safeHeight / divisor);

    if (ratioWidth <= 100 && ratioHeight <= 100) {
        return `${ratioWidth}:${ratioHeight}`;
    }

    return (safeWidth / safeHeight).toFixed(2);
}

export function getDeviceRecommendation({
    screenWidth,
    screenHeight,
    devicePixelRatio = 1
} = {}) {
    const cssWidth = Math.round(
        toPositiveNumber(screenWidth, 360)
    );

    const cssHeight = Math.round(
        toPositiveNumber(screenHeight, 800)
    );

    const pixelRatio = Math.min(
        MAX_DEVICE_PIXEL_RATIO,
        Math.max(
            MIN_DEVICE_PIXEL_RATIO,
            toPositiveNumber(devicePixelRatio, 1)
        )
    );

    const pixelWidth = Math.round(cssWidth * pixelRatio);
    const pixelHeight = Math.round(cssHeight * pixelRatio);
    const orientation = pixelHeight >= pixelWidth
        ? "Portrait"
        : "Landscape";

    return {
        cssWidth,
        cssHeight,
        pixelRatio,
        pixelWidth,
        pixelHeight,
        orientation,
        aspectRatio: getAspectRatioLabel(
            pixelWidth,
            pixelHeight
        ),
        label: `${pixelWidth} × ${pixelHeight} px`
    };
}

export function getWallpaperFitMessage(
    wallpaperWidth,
    wallpaperHeight,
    recommendation
) {
    const width = toPositiveNumber(wallpaperWidth);
    const height = toPositiveNumber(wallpaperHeight);

    if (!width || !height || !recommendation) {
        return "Original quality • crop may be required";
    }

    const orientationMatches =
        (height >= width) ===
        (recommendation.pixelHeight >= recommendation.pixelWidth);

    const hasEnoughPixels =
        width >= recommendation.pixelWidth &&
        height >= recommendation.pixelHeight;

    if (orientationMatches && hasEnoughPixels) {
        return "Excellent fit for this screen";
    }

    if (orientationMatches) {
        return "Correct orientation • may appear slightly soft";
    }

    return "Different orientation • crop will be required";
}
