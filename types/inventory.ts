export interface StockMovement {
  id: string;
  productId: string;
  variantOptionId?: string;
  type: 'in' | 'out' | 'adjustment' | 'reservation';
  quantity: number;
  reason: string;
  reference?: string;
  createdAt: Date;
  createdBy: string;
}

export interface StockAlert {
  id: string;
  productId: string;
  variantOptionId?: string;
  currentStock: number;
  threshold: number;
  notified: boolean;
  createdAt: Date;
}