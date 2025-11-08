'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useCart } from '@/contexts/cart-context';
import { Product } from '@/types/products';
import { ShoppingCart, Check, Loader2 } from 'lucide-react';
import { getProductTotalStock } from '@/lib/utils/product-helpers'; // ✅ IMPORTAR HELPER

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
}

export function AddToCartButton({ 
  product, 
  variant, 
  className = '', 
  disabled = false,
  style 
}: AddToCartButtonProps) {
  const { addItem } = useCart();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleAddToCart = async () => {
    if (disabled) return;

    setLoading(true);
    
    const result = await addItem(product, 1, variant);
    
    if (result.success) {
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);
    } else {
      console.error('Erro ao adicionar ao carrinho:', result.message);
    }
    
    setLoading(false);
  };

  // ✅ CORREÇÃO: Usar helper para obter estoque total
  const totalStock = getProductTotalStock(product);
  const isOutOfStock = totalStock === 0;

  return (
    <Button
      onClick={handleAddToCart}
      disabled={disabled || loading || isOutOfStock}
      className={`relative overflow-hidden ${className}`}
      style={style}
    >
      {loading ? (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          Adicionando...
        </>
      ) : success ? (
        <>
          <Check className="w-4 h-4 mr-2" />
          Adicionado!
        </>
      ) : isOutOfStock ? (
        <>
          <ShoppingCart className="w-4 h-4 mr-2" />
          Esgotado
        </>
      ) : (
        <>
          <ShoppingCart className="w-4 h-4 mr-2" />
          Adicionar ao Carrinho
        </>
      )}
    </Button>
  );
}