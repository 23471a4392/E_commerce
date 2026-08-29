export type LoyaltyTier = 'bronze' | 'silver' | 'gold' | 'platinum';

export interface LoyaltyAccount {
  userId: string;
  pointsBalance: number;
  lifetimePointsEarned: number;
  currentTier: LoyaltyTier;
  tierMultiplier: number; // e.g. 1.25x points for Gold
  nextTierPointsNeeded: number;
  joinedAt: string;
}

export interface LoyaltyTransaction {
  id: string;
  userId: string;
  type: 'earn_order' | 'redeem_discount' | 'bonus_promo' | 'tier_upgrade' | 'points_expired';
  points: number; // positive for earn, negative for redeem
  balanceAfter: number;
  referenceId?: string; // orderId or promoId
  description: string;
  createdAt: string;
}

export interface RewardRedemptionOption {
  id: string;
  title: string;
  description: string;
  pointsRequired: number;
  discountType: 'fixed_amount' | 'percentage' | 'free_shipping';
  discountValue: number;
  active: boolean;
}
