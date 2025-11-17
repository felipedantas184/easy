// components/ui/product-card.tsx - VERSÃO CORRIGIDA PARA PRODUTOS SEM VARIAÇÕES
'use client';
import { useState } from 'react';
import { Product, VariantOption } from '@/types/products';
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
  getMainImage,
  hasProductDiscount,
  getMaxDiscountPercentage
} from '@/lib/utils/product-helpers';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { store } = useStore();
  const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  // ✅ CORREÇÃO: Lógica invertida - comparePrice é o preço PROMOCIONAL
  const hasVariants = product.hasVariants && product.variants && product.variants.length > 0;

  let productPrice = 0;
  let productComparePrice: number | undefined = undefined;
  let hasDiscount = false;
  let discountPercentage = 0;
  let priceRange: { min: number; max: number } | null = null;

  if (hasVariants && product.variants) {
    // ✅ LÓGICA PARA PRODUTOS COM VARIAÇÕES (já corrigida)
    let minPrice = Infinity;
    let maxPrice = 0;
    let minComparePrice: number | undefined = undefined;
    let maxComparePrice: number | undefined = undefined;
    let foundAnyDiscount = false;

    product.variants.forEach(variant => {
      if (variant.options) {
        variant.options.forEach((option: VariantOption) => {
          if (option.isActive && (option.stock || 0) > 0) {
            // Preço normal (para cálculo de range)
            if (option.price < minPrice) {
              minPrice = option.price;
            }
            if (option.price > maxPrice) {
              maxPrice = option.price;
            }

            // ✅ CORREÇÃO: ComparePrice válido (deve ser MENOR que o preço para ser considerado desconto)
            if (option.comparePrice && option.comparePrice < option.price) {
              foundAnyDiscount = true;

              // Menor preço promocional
              if (!minComparePrice || option.comparePrice < minComparePrice) {
                minComparePrice = option.comparePrice;
              }

              // Maior preço promocional  
              if (!maxComparePrice || option.comparePrice > maxComparePrice) {
                maxComparePrice = option.comparePrice;
              }
            }
          }
        });
      }
    });

    // ✅ DEFINIR OS PREÇOS CORRETOS PARA DISPLAY
    if (foundAnyDiscount && minComparePrice && maxComparePrice) {
      // Se há desconto, usar os preços promocionais
      productPrice = minComparePrice; // Preço promocional mais baixo
      productComparePrice = minPrice; // Preço normal mais baixo (para mostrar riscado)
      priceRange = {
        min: minComparePrice,
        max: maxComparePrice
      };
    } else {
      // Se não há desconto, usar preços normais
      productPrice = minPrice !== Infinity ? minPrice : 0;
      priceRange = {
        min: minPrice !== Infinity ? minPrice : 0,
        max: maxPrice
      };
    }

    hasDiscount = foundAnyDiscount;

    if (hasDiscount && productComparePrice) {
      // ✅ CORREÇÃO: Calcula desconto baseado no preço normal vs promocional
      discountPercentage = getDiscountPercentage(productPrice, productComparePrice);
    }
  } else {
    // ✅ CORREÇÃO COMPLETA PARA PRODUTOS SEM VARIAÇÕES
    const firstVariant = product.variants?.[0];
    const firstOption = firstVariant?.options?.[0];

    if (firstOption) {
      // ✅ LÓGICA CORRIGIDA: comparePrice é o preço PROMOCIONAL
      const normalPrice = firstOption.price; // Preço normal
      const promoPrice = firstOption.comparePrice; // Preço promocional

      // ✅ CORREÇÃO: Verificação segura de tipos
      if (promoPrice && promoPrice < normalPrice) {
        // COM DESCONTO
        hasDiscount = true;
        productPrice = promoPrice;
        productComparePrice = normalPrice;
        discountPercentage = getDiscountPercentage(promoPrice, normalPrice);
      } else {
        // SEM DESCONTO
        hasDiscount = false;
        productPrice = normalPrice;
        productComparePrice = undefined;
      }

      priceRange = {
        min: productPrice,
        max: productPrice
      };

      console.log(`📱 PRODUTO SEM VARIAÇÕES ${product.name}:`, {
        normalPrice,
        promoPrice,
        hasDiscount,
        productPrice, // Preço a ser mostrado
        productComparePrice // Preço a ser riscado
      });
    } else {
      // Fallback caso não tenha opção
      productPrice = 0;
      productComparePrice = undefined;
      priceRange = { min: 0, max: 0 };
    }
  }

  const totalStock = getProductTotalStock(product);
  const mainImage = getMainImage(product);
  const maxDiscountPercentage = hasVariants ? getMaxDiscountPercentage(product) : discountPercentage;

  // ✅ Gatilhos mentais simulados
  const viewingCount = Math.floor(Math.random() * 8) + 3;
  const soldCount = Math.floor(Math.random() * 50) + 10;
  const rating = (Math.random() * 1 + 4).toFixed(1);
  const isHotItem = Math.random() > 0.7;
  const isNewProduct = Math.random() > 0.8;

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
        <div className="relative">
          <Link href={`/${store?.slug}/products/${product.id}`} className="block">
            <div className={`aspect-square relative overflow-hidden bg-gray-100 rounded-t-xl ${stockStatus?.type === 'out-of-stock' ? 'opacity-60 grayscale' : ''}`}>
              {!imageLoaded && !imageError && (
                <div className="absolute inset-0 bg-gradient-to-br from-gray-200 to-gray-300 animate-pulse" />
              )}

              <img
                src={imageError ? '/images/placeholder-product.jpg' : mainImage}
                alt={product.images?.[0]?.alt || product.name}
                className={`w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
                onLoad={() => setImageLoaded(true)}
                onError={handleImageError}
              />

              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/3 transition-all duration-300" />
            </div>
          </Link>

          <div className="absolute top-3 left-3 flex flex-col gap-2 max-w-[70%]">
            {isNewProduct && (
              <Badge variant="success" className="shadow-lg">🆕 Novo</Badge>
            )}

            {isHotItem && (
              <Badge variant="destructive" className="shadow-lg bg-gradient-to-r from-orange-500 to-red-500 text-white">🔥 Popular</Badge>
            )}

            {hasDiscount && (
              <div
                className="px-2 py-1 text-xs font-bold text-white rounded shadow-lg"
                style={{ backgroundColor: store?.theme.primaryColor }}
              >
                {`${discountPercentage}% OFF`}
              </div>
            )}
          </div>

          {stockStatus && (
            <div className="absolute top-3 right-3">
              <Badge variant={stockStatus.variant} className="shadow-lg">
                {stockStatus.text}
              </Badge>
            </div>
          )}

          <div className="absolute bottom-3 left-3">
            <Badge variant="secondary" className="shadow-lg backdrop-blur-sm bg-white/90">
              <Star size={12} className="fill-yellow-400 text-yellow-400 mr-1" />
              {rating}
            </Badge>
          </div>
        </div>

        <div className="p-4 space-y-3">
          <div className="text-xs text-gray-500 uppercase tracking-wide font-medium">
            {product.category}
          </div>

          <Link href={`/${store?.slug}/products/${product.id}`}>
            <h3 className="font-semibold text-gray-900 line-clamp-2 hover:text-blue-600 cursor-pointer transition-colors leading-tight min-h-[2.5rem]">
              {product.name}
            </h3>
          </Link>

          <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed">
            {product.description}
          </p>

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

          {/* ✅ DISPLAY CORRIGIDO PARA TODOS OS CASOS */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              {hasVariants && priceRange ? (
                <div className="flex flex-col">
                  {hasDiscount ? (
                    // ✅ COM DESCONTO: Mostrar preços promocionais
                    <>
                      <span className="text-xs text-gray-600">A partir de</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-lg font-bold text-gray-900">
                          {formatPrice(priceRange.min)}
                        </span>
                        {productComparePrice && (
                          <span className="text-sm text-gray-500 line-through">
                            {formatPrice(productComparePrice)}
                          </span>
                        )}
                      </div>
                      {priceRange.min !== priceRange.max && (
                        <span className="text-xs text-gray-500">
                          Até {formatPrice(priceRange.max)}
                        </span>
                      )}
                      {hasDiscount && productComparePrice && (
                        <span className="text-xs text-green-600 font-medium">
                          Economize {formatPrice(productComparePrice - priceRange.min)}
                        </span>
                      )}
                    </>
                  ) : (
                    // ✅ SEM DESCONTO: Mostrar preços normais
                    <>
                      <span className="text-xs text-gray-600">A partir de</span>
                      <span className="text-lg font-bold text-gray-900">
                        {formatPrice(priceRange.min)}
                      </span>
                      {priceRange.min !== priceRange.max && (
                        <span className="text-xs text-gray-500">
                          Até {formatPrice(priceRange.max)}
                        </span>
                      )}
                    </>
                  )}
                </div>
              ) : (
                // ✅ PRODUTOS SEM VARIAÇÕES - CORRIGIDO
                <div className="flex flex-col space-y-1">
                  <div className="flex items-center space-x-2">
                    {/* ✅ PREÇO ATUAL (promocional se houver desconto) */}
                    <span className="text-lg font-bold text-gray-900">
                      {formatPrice(productPrice)}
                    </span>
                    {/* ✅ PREÇO ORIGINAL (riscado se houver desconto) */}
                    {hasDiscount && productComparePrice && (
                      <span className="text-sm text-gray-500 line-through">
                        {formatPrice(productComparePrice)}
                      </span>
                    )}
                  </div>
                  {/* ✅ ECONOMIA (se houver desconto) */}
                  {hasDiscount && productComparePrice && (
                    <span className="text-xs text-green-600 font-medium">
                      Economize {formatPrice(productComparePrice - productPrice)}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="flex space-x-2 pt-2">
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

            <Link
              href={`/${store?.slug}/products/${product.id}`}
              className="flex-shrink-0"
            >
              <button className="h-11 px-4 border border-gray-300 text-gray-700 rounded-lg hover:border-gray-400 hover:bg-gray-50 transition-all duration-200 flex items-center justify-center">
                <Eye size={18} />
              </button>
            </Link>
          </div>

          <Link
            href={`/${store?.slug}/products/${product.id}`}
            className="flex items-center justify-center text-sm text-gray-500 hover:text-gray-700 transition-colors pt-1"
          >
            <span>Ver detalhes completos</span>
            <ArrowRight size={14} className="ml-1" />
          </Link>
        </div>
      </div>

      <QuickViewModal
        product={product}
        isOpen={isQuickViewOpen}
        onClose={() => setIsQuickViewOpen(false)}
      />
    </>
  );
}