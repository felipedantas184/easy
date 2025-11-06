'use client';
import { useState } from 'react';
import { Product } from '@/types/products';
import { useCart } from '@/contexts/cart-context';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Check } from 'lucide-react';

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
  disabled?: boolean;
}

export function AddToCartButton({ product, variant, className, disabled }: AddToCartButtonProps) {
  const { addItem, state } = useCart();
  const [added, setAdded] = useState(false);

  const handleAddToCart = () => {
    addItem(product, 1, variant);
    setAdded(true);
    
    setTimeout(() => setAdded(false), 2000);
  };

  // Verificar se o item já está no carrinho
  const isInCart = state.items.some(item =>
    item.product.id === product.id &&
    item.selectedVariant?.variantId === variant?.variantId &&
    item.selectedVariant?.optionId === variant?.optionId
  );

  return (
    <Button
      onClick={handleAddToCart}
      className={`w-full ${className}`}
      disabled={disabled || added}
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