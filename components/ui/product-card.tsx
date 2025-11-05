'use client';
import { useStore } from '@/contexts/store-context';
import { AddToCartButton } from '@/components/cart/AddToCartButton';
import { Product } from '@/types';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { store } = useStore();

  // ✅ CORRIGIR: Usar placeholder se não tiver imagem
  const mainImage = product.images && product.images.length > 0 
    ? product.images[0] 
    : '/images/placeholder-product.jpg';
  
  const hasDiscount = product.comparePrice && product.comparePrice > product.price;

  // ✅ CORRIGIR: Formatar preço corretamente
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(price);
  };

  return (
    <div className="bg-white rounded-lg border hover:shadow-lg transition-shadow duration-300 group">
      {/* Product Image */}
      <div className="aspect-square relative overflow-hidden rounded-t-lg">
        <img
          src={mainImage}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          onError={(e) => {
            // Fallback para imagem quebrada
            (e.target as HTMLImageElement).src = '/images/placeholder-product.jpg';
          }}
        />
        
        {/* Discount Badge */}
        {hasDiscount && (
          <div 
            className="absolute top-3 left-3 px-2 py-1 text-xs font-semibold text-white rounded"
            style={{ backgroundColor: store?.theme.primaryColor }}
          >
            {Math.round(((product.comparePrice! - product.price) / product.comparePrice!) * 100)}% OFF
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
          {product.name}
        </h3>
        
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
          {product.description}
        </p>

        {/* Price */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <span className="text-lg font-bold text-gray-900">
              {formatPrice(product.price)}
            </span>
            
            {hasDiscount && (
              <span className="text-sm text-gray-500 line-through">
                {formatPrice(product.comparePrice!)}
              </span>
            )}
          </div>
        </div>

        {/* ✅ ATUALIZADO: Usar AddToCartButton */}
        <AddToCartButton 
          product={product}
          className="w-full"
          style={{ 
            backgroundColor: store?.theme.primaryColor,
            borderColor: store?.theme.primaryColor,
          }}
        />

        {/* Variants Indicator */}
        {product.hasVariants && product.variants && product.variants.length > 0 && (
          <p className="text-xs text-gray-500 text-center mt-2">
            {product.variants.length} opção{product.variants.length > 1 ? 'es' : ''} disponível{product.variants.length > 1 ? 'is' : ''}
          </p>
        )}
      </div>
    </div>
  );
}