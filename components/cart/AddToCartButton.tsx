// components/cart/AddToCartButton.tsx - VERSÃO FINAL
'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useCart } from '@/contexts/cart-context';
import { Product } from '@/types/products';
import { ShoppingCart, Check, Loader2, Plus } from 'lucide-react';
import { getProductTotalStock } from '@/lib/utils/product-helpers';

interface AddToCartButtonProps {
  product: Product;
  variant?: {
    variantId: string;
    optionId: string;
    optionName: string;
    price: number;
  };
  className?: string;
  disabled?: boolean;
  style?: React.CSSProperties;
  onAddToCart?: () => void;
  showQuickView?: boolean;
  onShowQuickView?: () => void;
}

export function AddToCartButton({
  product,
  variant,
  className = '',
  disabled = false,
  style,
  onAddToCart,
  showQuickView = false,
  onShowQuickView
}: AddToCartButtonProps) {
  const { addItem } = useCart();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const totalStock = getProductTotalStock(product);
  const isOutOfStock = totalStock === 0;
  const hasVariants = product.hasVariants && product.variants && product.variants.length > 0;

  const shouldShowQuickView = showQuickView && hasVariants && !variant;

  const handleAddToCart = async () => {
    if (disabled || isOutOfStock) return;

    if (shouldShowQuickView && onShowQuickView) {
      onShowQuickView();
      return;
    }

    setLoading(true);

    const result = await addItem(product, 1, variant);

    if (result.success) {
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);
      onAddToCart?.();
    } else {
      console.error('❌ AddToCartButton: Erro', result.message);
    }

    setLoading(false);
  };

  const getButtonText = () => {
    if (isOutOfStock) return 'Esgotado';
    if (shouldShowQuickView) return 'Comprar Agora';
    if (loading) return 'Adicionando...';
    if (success) return 'Adicionado!';
    return 'Adicionar ao Carrinho';
  };

  const getButtonIcon = () => {
    if (loading) return <Loader2 className="w-4 h-4 mr-2 animate-spin" />;
    if (success) return <Check className="w-4 h-4 mr-2" />;
    if (shouldShowQuickView) return <Plus className="w-4 h-4 mr-2" />;
    return <ShoppingCart className="w-4 h-4 mr-2" />;
  };

  return (
    <Button
      onClick={handleAddToCart}
      disabled={disabled || loading || isOutOfStock}
      className={`relative overflow-hidden transition-all duration-300 w-full sm:w-auto ${success ? 'scale-105 bg-green-600 hover:bg-green-700' : ''
        } ${className}`}
      style={style}
    >
      {getButtonIcon()}
      {getButtonText()}
    </Button>
  );
}