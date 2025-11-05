'use client';
import { useState } from 'react';
import { useCart } from '@/contexts/cart-context';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Check } from 'lucide-react';
import { Product } from '@/types';

interface AddToCartButtonProps {
  product: Product;
  variant?: {
    variantId: string;
    optionId: string;
    optionName: string;
    price: number;
  };
  className?: string;
  style?: React.CSSProperties;
}

export function AddToCartButton({ product, variant, className, style }: AddToCartButtonProps) {
  const { addItem, state } = useCart();
  const [added, setAdded] = useState(false);

  const handleAddToCart = () => {
    addItem(product, 1, variant);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const isInCart = state.items.some(item =>
    item.product.id === product.id &&
    item.selectedVariant?.variantId === variant?.variantId &&
    item.selectedVariant?.optionId === variant?.optionId
  );

  return (
    <Button
      onClick={handleAddToCart}
      className={`w-full ${className}`}
      style={style} 
      disabled={added}
      variant={isInCart ? "secondary" : "default"}
    >
      {added || isInCart ? (
        <>
          <Check size={18} className="mr-2" />
          {isInCart ? 'No Carrinho' : 'Adicionado!'}
        </>
      ) : (
        <>
          <ShoppingCart size={18} className="mr-2" />
          Adicionar ao Carrinho
        </>
      )}
    </Button>
  );
}