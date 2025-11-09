// components/ui/product-card.tsx - REDESIGN COMPLETO
'use client';
import { useState } from 'react';
import { Product } from '@/types/products';
import { useStore } from '@/contexts/store-context';
import { AddToCartButton } from '@/components/cart/AddToCartButton';
import { QuickViewModal } from '@/components/product/QuickViewModal';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Eye, Zap, Users, ArrowRight, Star } from 'lucide-react';
import {
  getProductPrice,
  getProductComparePrice,
  getProductTotalStock,
  getDiscountPercentage,
  getPriceRange,
  getMainImage,
  hasAnyPromotion
} from '@/lib/utils/product-helpers';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { store } = useStore();
  const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  // ✅ Dados do produto
  const productPrice = getProductPrice(product);
  const productComparePrice = getProductComparePrice(product);
  const totalStock = getProductTotalStock(product);
  const hasDiscount = productComparePrice && productComparePrice > productPrice;
  const discountPercentage = hasDiscount ? getDiscountPercentage(productPrice, productComparePrice) : 0;
  const hasVariants = product.hasVariants && product.variants && product.variants.length > 0;
  const priceRange = hasVariants ? getPriceRange(product) : null;
  const mainImage = getMainImage(product);

  // ✅ Gatilhos mentais simulados
  const viewingCount = Math.floor(Math.random() * 8) + 3;
  const soldCount = Math.floor(Math.random() * 50) + 10;
  const rating = (Math.random() * 1 + 4).toFixed(1); // 4.0 - 5.0
  const isHotItem = Math.random() > 0.7;
  const isNewProduct = Math.random() > 0.8;

  // ✅ Status de estoque
  const getStockStatus = () => {
    if (totalStock === 0) return { type: 'out-of-stock', text: 'Esgotado', variant: 'destructive' as const };
    if (totalStock <= 3) return { type: 'low-stock', text: 'Últimas!', variant: 'destructive' as const };
    if (totalStock <= 10) return { type: 'low-stock', text: 'Estoque Baixo', variant: 'destructive' as const };
    return null;
  };

  const stockStatus = getStockStatus();

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(price);
  };

  const handleQuickView = () => {
    setIsQuickViewOpen(true);
  };

  const handleImageError = () => {
    setImageError(true);
    setImageLoaded(true);
  };

  return (
    <>
      <div className="group bg-white rounded-xl border border-gray-200 hover:border-gray-300 hover:shadow-2xl transition-all duration-300 overflow-hidden">
        {/* Header com Badges Organizados */}
        <div className="relative">
          {/* Imagem do Produto */}
          <Link href={`/${store?.slug}/products/${product.id}`} className="block">
            <div className={`aspect-square relative overflow-hidden bg-gray-100 rounded-t-xl ${stockStatus?.type === 'out-of-stock' ? 'opacity-60 grayscale' : ''
              }`}>
              {/* Loading Skeleton */}
              {!imageLoaded && !imageError && (
                <div className="absolute inset-0 bg-gradient-to-br from-gray-200 to-gray-300 animate-pulse" />
              )}

              <img
                src={imageError ? '/images/placeholder-product.jpg' : mainImage}
                alt={product.images?.[0]?.alt || product.name}
                className={`w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 ${imageLoaded ? 'opacity-100' : 'opacity-0'
                  }`}
                onLoad={() => setImageLoaded(true)}
                onError={handleImageError}
              />

              {/* ✅ OVERLAY CORRIGIDO - apenas no hover e muito suave */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/3 transition-all duration-300" />
            </div>
          </Link>

          {/* Badges Grid Organizado */}
          <div className="absolute top-3 left-3 flex flex-col gap-2 max-w-[70%]">
            {/* Badge de Novo */}
            {isNewProduct && (
              <Badge variant="success" className="shadow-lg">
                🆕 Novo
              </Badge>
            )}

            {/* Badge de Popular */}
            {isHotItem && (
              <Badge variant="destructive" className="shadow-lg bg-gradient-to-r from-orange-500 to-red-500 text-white">
                🔥 Popular
              </Badge>
            )}

            {/* Badge de Desconto */}
            {hasDiscount && (
              <Badge variant="default" className="shadow-lg" style={{
                backgroundColor: store?.theme.primaryColor,
                color: 'white'
              }}>
                {discountPercentage}% OFF
              </Badge>
            )}
          </div>

          {/* Badge de Estoque (lado direito para não sobrepor) */}
          {stockStatus && (
            <div className="absolute top-3 right-3">
              <Badge variant={stockStatus.variant} className="shadow-lg">
                {stockStatus.text}
              </Badge>
            </div>
          )}

          {/* Rating (canto inferior) */}
          <div className="absolute bottom-3 left-3">
            <Badge variant="secondary" className="shadow-lg backdrop-blur-sm bg-white/90">
              <Star size={12} className="fill-yellow-400 text-yellow-400 mr-1" />
              {rating}
            </Badge>
          </div>
        </div>

        {/* Conteúdo do Card */}
        <div className="p-4 space-y-3">
          {/* Categoria */}
          <div className="text-xs text-gray-500 uppercase tracking-wide font-medium">
            {product.category}
          </div>

          {/* Nome do Produto */}
          <Link href={`/${store?.slug}/products/${product.id}`}>
            <h3 className="font-semibold text-gray-900 line-clamp-2 hover:text-blue-600 cursor-pointer transition-colors leading-tight min-h-[2.5rem]">
              {product.name}
            </h3>
          </Link>

          {/* Descrição */}
          <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed">
            {product.description}
          </p>

          {/* Gatilhos Sociais */}
          <div className="flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-1">
                <Users size={12} />
                <span>{viewingCount} visualizando</span>
              </div>
              <div className="flex items-center space-x-1">
                <Zap size={12} />
                <span>{soldCount} vendidos</span>
              </div>
            </div>
            {hasVariants && (
              <span className="text-gray-400">
                {product.variants.length} opções
              </span>
            )}
          </div>

          {/* Preço */}
          <div className="space-y-1">
            {hasVariants && priceRange ? (
              <div className="space-y-1">
                <div className="text-xs text-gray-600">A partir de</div>
                <div className="flex items-baseline space-x-2">
                  <span className="text-xl font-bold text-gray-900">
                    {formatPrice(priceRange.min)}
                  </span>
                  {priceRange.min !== priceRange.max && (
                    <span className="text-sm text-gray-500">
                      até {formatPrice(priceRange.max)}
                    </span>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-baseline space-x-2">
                <span className="text-xl font-bold text-gray-900">
                  {formatPrice(productPrice)}
                </span>
                {hasDiscount && (
                  <span className="text-sm text-gray-500 line-through">
                    {formatPrice(productComparePrice!)}
                  </span>
                )}
              </div>
            )}

            {hasDiscount && !hasVariants && (
              <div className="text-sm text-green-600 font-medium">
                Economize {formatPrice(productComparePrice! - productPrice)}
              </div>
            )}
          </div>

          {/* Ações Duplas */}
          <div className="flex space-x-2 pt-2">
            {/* Botão Principal - Comprar/Ver Opções */}
            <div className="flex-1">
              <AddToCartButton
                product={product}
                className="w-full font-semibold hover:shadow-lg transition-all duration-300 h-11"
                disabled={totalStock === 0}
                showQuickView={true}
                onShowQuickView={handleQuickView}
                style={{
                  backgroundColor: store?.theme.primaryColor,
                  borderColor: store?.theme.primaryColor,
                }}
              />
            </div>

            {/* Botão Secundário - Ver Detalhes */}
            <Link
              href={`/${store?.slug}/products/${product.id}`}
              className="flex-shrink-0"
            >
              <button className="h-11 px-4 border border-gray-300 text-gray-700 rounded-lg hover:border-gray-400 hover:bg-gray-50 transition-all duration-200 flex items-center justify-center">
                <Eye size={18} />
              </button>
            </Link>
          </div>

          {/* Link de Detalhes Textual */}
          <Link
            href={`/${store?.slug}/products/${product.id}`}
            className="flex items-center justify-center text-sm text-gray-500 hover:text-gray-700 transition-colors pt-1"
          >
            <span>Ver detalhes completos</span>
            <ArrowRight size={14} className="ml-1" />
          </Link>
        </div>
      </div>

      {/* Quick View Modal */}
      <QuickViewModal
        product={product}
        isOpen={isQuickViewOpen}
        onClose={() => setIsQuickViewOpen(false)}
      />
    </>
  );
}