export interface DiscountCoupon {
  id: string;
  storeId: string;
  code: string;
  description: string;
  discountType: 'percentage' | 'fixed' | 'shipping';
  discountValue: number;
  minOrderValue?: number;
  maxDiscount?: number;
  usageLimit?: number;
  usedCount: number;
  validFrom: Date;
  validUntil: Date;
  isActive: boolean;
  applicableCategories?: string[];
  excludedProducts?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface DiscountApplication {
  coupon: DiscountCoupon;
  discountAmount: number;
  originalTotal: number;
  finalTotal: number;
}

export interface CartDiscount {
  couponCode: string;
  discountAmount: number;
  discountType: 'percentage' | 'fixed' | 'shipping';
  applied: boolean;
}