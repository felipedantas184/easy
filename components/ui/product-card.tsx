'use client';
import { Product } from '@/types/products';
import { useStore } from '@/contexts/store-context';
import { AddToCartButton } from '@/components/cart/AddToCartButton';
import Link from 'next/link';
import { Package } from 'lucide-react';
import { getProductPrice, getProductComparePrice, getProductTotalStock, getDiscountPercentage } from '@/lib/utils/product-helpers';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { store } = useStore();

  // ✅ Usar helpers para obter dados do produto
  const productPrice = getProductPrice(product);
  const productComparePrice = getProductComparePrice(product);
  const totalStock = getProductTotalStock(product);
  const hasDiscount = productComparePrice && productComparePrice > productPrice;
  const discountPercentage = hasDiscount ? getDiscountPercentage(productPrice, productComparePrice) : 0;
  
  const mainImage = product.images && product.images.length > 0 
    ? product.images[0].url 
    : '/images/placeholder-product.jpg';

  // ✅ Verificar status de estoque
  const getStockStatus = () => {
    if (totalStock === 0) {
      return { type: 'out-of-stock', text: 'Esgotado', color: 'bg-red-500' };
    }
    
    if (totalStock <= 5) {
      return { type: 'low-stock', text: 'Estoque baixo', color: 'bg-orange-500' };
    }
    
    return null;
  };

  const stockStatus = getStockStatus();

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(price);
  };

  return (
    <div className="bg-white rounded-lg border hover:shadow-lg transition-shadow duration-300 group relative">
      {/* Badge de Estoque */}
      {stockStatus && (
        <div className={`absolute top-3 left-3 z-10 px-2 py-1 text-xs font-semibold text-white rounded ${stockStatus.color}`}>
          {stockStatus.text}
        </div>
      )}

      {/* Badge de Desconto */}
      {hasDiscount && (
        <div 
          className="absolute top-3 right-3 z-10 px-2 py-1 text-xs font-semibold text-white rounded"
          style={{ backgroundColor: store?.theme.primaryColor }}
        >
          {discountPercentage}% OFF
        </div>
      )}

      {/* Product Image with Link */}
      <Link href={`/${store?.slug}/products/${product.id}`}>
        <div className={`aspect-square relative overflow-hidden rounded-t-lg cursor-pointer ${
          stockStatus?.type === 'out-of-stock' ? 'opacity-60' : ''
        }`}>
          <img
            src={mainImage}
            alt={product.images[0]?.alt || product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/images/placeholder-product.jpg';
            }}
          />
        </div>
      </Link>

      {/* Product Info */}
      <div className="p-4">
        <Link href={`/${store?.slug}/products/${product.id}`}>
          <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 hover:text-blue-600 cursor-pointer">
            {product.name}
          </h3>
        </Link>
        
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
          {product.description}
        </p>

        {/* Price */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <span className="text-lg font-bold text-gray-900">
              {formatPrice(productPrice)}
            </span>
            
            {hasDiscount && (
              <span className="text-sm text-gray-500 line-through">
                {formatPrice(productComparePrice)}
              </span>
            )}
          </div>

          {/* Stock Indicator */}
          {totalStock > 0 && totalStock <= 10 && (
            <div className="text-xs text-orange-600 font-medium">
              {totalStock} restantes
            </div>
          )}
        </div>

        {/* Add to Cart Button */}
        <AddToCartButton 
          product={product}
          className="w-full"
          disabled={totalStock === 0}
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