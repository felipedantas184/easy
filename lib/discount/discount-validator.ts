import { DiscountCoupon } from '@/types/discount';
import { CartItem } from '@/contexts/cart-context';

export class DiscountValidator {
  /**
   * Validar se cupom pode ser aplicado
   */
  static validateCoupon(
    coupon: DiscountCoupon, 
    cartItems: CartItem[], 
    cartTotal: number
  ): { isValid: boolean; error?: string } {
    
    // Verificar se está ativo
    if (!coupon.isActive) {
      return { isValid: false, error: 'Cupom não está ativo' };
    }

    // Verificar validade
    const now = new Date();
    if (now < coupon.validFrom) {
      return { isValid: false, error: 'Cupom ainda não está válido' };
    }

    if (now > coupon.validUntil) {
      return { isValid: false, error: 'Cupom expirado' };
    }

    // Verificar limite de uso
    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
      return { isValid: false, error: 'Cupom já foi utilizado o máximo de vezes' };
    }

    // Verificar valor mínimo do pedido
    if (coupon.minOrderValue && cartTotal < coupon.minOrderValue) {
      return { isValid: false, error: `Valor mínimo do pedido: R$ ${coupon.minOrderValue.toFixed(2)}` };
    }

    // Verificar categorias aplicáveis
    if (coupon.applicableCategories && coupon.applicableCategories.length > 0) {
      const hasApplicableProduct = cartItems.some(item => 
        coupon.applicableCategories!.includes(item.product.category)
      );
      
      if (!hasApplicableProduct) {
        return { isValid: false, error: 'Cupom não aplicável aos produtos do carrinho' };
      }
    }

    // Verificar produtos excluídos
    if (coupon.excludedProducts && coupon.excludedProducts.length > 0) {
      const hasExcludedProduct = cartItems.some(item =>
        coupon.excludedProducts!.includes(item.product.id)
      );
      
      if (hasExcludedProduct) {
        return { isValid: false, error: 'Cupom não aplicável a alguns produtos do carrinho' };
      }
    }

    return { isValid: true };
  }

  /**
   * Calcular valor do desconto
   */
  static calculateDiscount(coupon: DiscountCoupon, cartTotal: number): number {
    let discountAmount = 0;

    switch (coupon.discountType) {
      case 'percentage':
        discountAmount = (cartTotal * coupon.discountValue) / 100;
        break;
      
      case 'fixed':
        discountAmount = coupon.discountValue;
        break;
      
      case 'shipping':
        // Frete grátis - retornamos 0 pois o desconto é no frete
        discountAmount = 0;
        break;
    }

    // Aplicar desconto máximo se definido
    if (coupon.maxDiscount && discountAmount > coupon.maxDiscount) {
      discountAmount = coupon.maxDiscount;
    }

    // Garantir que desconto não seja maior que o total
    if (discountAmount > cartTotal) {
      discountAmount = cartTotal;
    }

    return Math.max(0, discountAmount);
  }

  /**
   * Formatar descrição do cupom
   */
  static formatCouponDescription(coupon: DiscountCoupon): string {
    const types = {
      percentage: `${coupon.discountValue}% OFF`,
      fixed: `R$ ${coupon.discountValue.toFixed(2)} OFF`,
      shipping: 'FRETE GRÁTIS',
    };

    let description = types[coupon.discountType];

    if (coupon.minOrderValue) {
      description += ` em pedidos acima de R$ ${coupon.minOrderValue.toFixed(2)}`;
    }

    if (coupon.usageLimit) {
      description += ` (${coupon.usageLimit - coupon.usedCount} usos restantes)`;
    }

    return description;
  }
}