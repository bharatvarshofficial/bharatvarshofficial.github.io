// ============================================================
// BharatVarshOfficial Creator Earnings Policy
// Creator receives 20% of verified net platform profit that is
// attributable to the creator's eligible content/activity.
// ============================================================

export const CREATOR_PROFIT_SHARE_RATE = 0.20;
export const CREATOR_PROFIT_SHARE_PERCENT = 20;
export const DEFAULT_MINIMUM_PAYOUT_INR = 1000;

export function normalizeProfitAmount(value) {
    const numericValue = Number(value);
    if (!Number.isFinite(numericValue) || numericValue <= 0) {
        return 0;
    }

    return Math.round(numericValue * 100) / 100;
}

export function calculateCreatorProfitShare(attributedPlatformProfit) {
    const profit = normalizeProfitAmount(attributedPlatformProfit);
    return Math.round(profit * CREATOR_PROFIT_SHARE_RATE * 100) / 100;
}

export function calculatePlatformRetainedProfit(attributedPlatformProfit) {
    const profit = normalizeProfitAmount(attributedPlatformProfit);
    const creatorShare = calculateCreatorProfitShare(profit);
    return Math.max(0, Math.round((profit - creatorShare) * 100) / 100);
}
