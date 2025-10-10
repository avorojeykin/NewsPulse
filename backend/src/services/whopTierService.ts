/**
 * Whop Tier Service - SDK Approach
 * Simple tier checking using Whop API client
 */

import { WhopServerSdk } from '@whop/api';

// Initialize Whop SDK
const whopSdk = WhopServerSdk({
  appId: process.env.WHOP_APP_ID!,
  appApiKey: process.env.WHOP_API_KEY!,
});

/**
 * Check if a user has access to Premium tier
 * Uses Whop SDK to check against Premium Access Pass
 */
export async function isPremiumUser(userId: string): Promise<boolean> {
  try {
    // Check if user has access to Premium Access Pass
    const result = await whopSdk.access.checkIfUserHasAccessToAccessPass({
      userId,
      accessPassId: process.env.WHOP_PREMIUM_ACCESS_PASS_ID!,
    });

    return result.hasAccess;
  } catch (error) {
    console.error(`❌ Error checking premium access for user ${userId}:`, error);
    // Default to free tier on error
    return false;
  }
}

/**
 * Get user's tier (free or premium)
 */
export async function getUserTier(userId: string): Promise<'free' | 'premium'> {
  const hasPremium = await isPremiumUser(userId);
  return hasPremium ? 'premium' : 'free';
}

/**
 * Get delay time in milliseconds based on user tier
 * Premium: 0ms (instant delivery)
 * Free: 15 minutes (900,000ms)
 */
export async function getDeliveryDelay(userId: string): Promise<number> {
  const tier = await getUserTier(userId);

  if (tier === 'premium') {
    return 0; // Instant delivery
  } else {
    //return 15 * 60 * 1000; // 15 minutes in milliseconds
    return 0; // free for now for Daniels Community
  }
}

/**
 * Log tier check for debugging
 */
export async function checkAndLogTier(userId: string): Promise<void> {
  const tier = await getUserTier(userId);
  const delay = await getDeliveryDelay(userId);

  console.log(`👤 User ${userId}: ${tier.toUpperCase()} tier (${delay === 0 ? 'instant' : '15min delay'})`);
}
