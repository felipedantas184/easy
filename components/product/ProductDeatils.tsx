// components/product/ProductDeatils.tsx - VERSÃO CORRIGIDA COMPLETA
'use client';
import { useState, useEffect } from 'react';
import { Store } from '@/types/store';
import { Product, ProductVariant, VariantOption } from '@/types/products';
import { AddToCartButton } from '@/components/cart/AddToCartButton';
import { Button } from '@/components/ui/button';
import {
  ChevronLeft, Share, Heart, Truck, Shield, ArrowLeft, Package,
  Zap, Users, Clock, Star, Check, ArrowRight, MessageCircle,
  ChevronRight, ChevronLeft as ChevronLeftIcon
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import {
  getProductPrice,
  getProductComparePrice,
  getProductTotalStock,
  getDiscountPercentage,
  hasProductDiscount,
  getMaxDiscountPercentage,
  getPriceRange
} from '@/lib/utils/product-helpers';

interface ProductDetailsProps {
  store: Store;
  product: Product;
}

export function ProductDetails({ store, product }: ProductDetailsProps) {
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [typedDescription, setTypedDescription] = useState('');

  const router = useRouter();
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({});
  const [selectedOptions, setSelectedOptions] = useState<Record<string, VariantOption>>({});

  // ✅ CORREÇÃO: Função com lógica para lidar com preços invertidos
  const getCurrentVariantData = () => {
    if (product.hasVariants && Object.keys(selectedOptions).length > 0) {
      const selectedOption = Object.values(selectedOptions)[0];
      
      // ✅ CORREÇÃO: Lógica para detectar e corrigir preços invertidos
      const price = selectedOption.price;
      const comparePrice = selectedOption.comparePrice;
      
      let actualPrice = price;
      let actualComparePrice = comparePrice;
      let hasActualDiscount = false;
      
      // Se comparePrice existe E é diferente de price
      if (comparePrice && comparePrice !== price) {
        // ✅ CORREÇÃO: Determinar qual é o preço real e qual é o de comparação
        if (comparePrice > price) {
          // comparePrice é maior = é o preço original, price é o com desconto
          actualPrice = price;
          actualComparePrice = comparePrice;
          hasActualDiscount = true;
        } else if (comparePrice < price) {
          // comparePrice é menor = está invertido, price é o preço original
          actualPrice = comparePrice;
          actualComparePrice = price;
          hasActualDiscount = true;
        }
      }
      
      const variantData = {
        price: actualPrice,
        comparePrice: actualComparePrice,
        hasDiscount: hasActualDiscount,
        discountPercentage: hasActualDiscount 
          ? getDiscountPercentage(actualPrice, actualComparePrice!)
          : 0,
        economy: hasActualDiscount
          ? actualComparePrice! - actualPrice
          : 0
      };
      
      return variantData;
    }
    
    // Para produtos sem variações
    const basePrice = getProductPrice(product);
    const baseComparePrice = getProductComparePrice(product);
    
    let actualPrice = basePrice;
    let actualComparePrice = baseComparePrice;
    let hasActualDiscount = false;
    
    if (baseComparePrice && baseComparePrice !== basePrice) {
      if (baseComparePrice > basePrice) {
        actualPrice = basePrice;
        actualComparePrice = baseComparePrice;
        hasActualDiscount = true;
      } else if (baseComparePrice < basePrice) {
        actualPrice = baseComparePrice;
        actualComparePrice = basePrice;
        hasActualDiscount = true;
      }
    }
    
    const baseData = {
      price: actualPrice,
      comparePrice: actualComparePrice,
      hasDiscount: hasActualDiscount,
      discountPercentage: hasActualDiscount 
        ? getDiscountPercentage(actualPrice, actualComparePrice!)
        : 0,
      economy: hasActualDiscount
        ? actualComparePrice! - actualPrice
        : 0
    };
    
    return baseData;
  };

  // Gatilhos mentais simulados
  const viewingCount = Math.floor(Math.random() * 15) + 8;
  const soldCount = Math.floor(Math.random() * 200) + 50;
  const rating = (Math.random() * 0.5 + 4.5).toFixed(1);
  const reviewCount = Math.floor(Math.random() * 100) + 20;

  // Dados do produto
  const productPrice = getProductPrice(product);
  const productComparePrice = getProductComparePrice(product);
  const totalStock = getProductTotalStock(product);
  const hasDiscount = hasProductDiscount(product);
  const discountPercentage = hasDiscount ? getDiscountPercentage(
    productPrice,
    productComparePrice || productPrice
  ) : 0;
  const maxDiscountPercentage = product.hasVariants ? getMaxDiscountPercentage(product) : discountPercentage;
  const [viewCount, setViewCount] = useState(viewingCount);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(price);
  };

  const handleVariantSelect = (variant: ProductVariant, option: VariantOption) => {
    setSelectedVariants(prev => ({
      ...prev,
      [variant.id]: option.id
    }));
    
    setSelectedOptions(prev => ({
      ...prev,
      [variant.id]: option
    }));
  };

  const getSelectedVariantData = () => {
    if (!product.hasVariants || Object.keys(selectedOptions).length === 0) {
      return undefined;
    }

    const selectedOption = Object.values(selectedOptions)[0];
    return {
      variantId: Object.keys(selectedVariants)[0],
      optionId: selectedOption.id,
      optionName: selectedOption.name,
      price: selectedOption.price,
    };
  };

  const getCurrentStock = () => {
    if (product.hasVariants && Object.keys(selectedOptions).length > 0) {
      const selectedOption = Object.values(selectedOptions)[0];
      return selectedOption.stock;
    }
    return totalStock;
  };

  const isVariantComplete = () => {
    if (!product.hasVariants) return true;
    return product.variants.every(variant => selectedVariants[variant.id]);
  };

  // ✅ CORREÇÃO: Usar a função corrigida
  const currentVariantData = getCurrentVariantData();
  const currentPrice = currentVariantData.price;
  const currentComparePrice = currentVariantData.comparePrice;
  const hasActivePromotion = currentVariantData.hasDiscount;
  const currentDiscountPercentage = currentVariantData.discountPercentage;
  const currentEconomy = currentVariantData.economy;

  const currentStock = getCurrentStock();
  const selectedVariantData = getSelectedVariantData();
  const isProductAvailable = currentStock > 0;

  const getStockText = () => {
    if (currentStock === 0) {
      return <span className="text-red-600 font-medium">⛔ Produto Esgotado</span>;
    }

    if (currentStock <= 3) {
      return <span className="text-orange-600 font-medium">🚀 Últimas {currentStock} unidades!</span>;
    }

    if (currentStock <= 10) {
      return <span className="text-orange-600 font-medium">⚠️ Apenas {currentStock} em estoque</span>;
    }

    return <span className="text-green-600 font-medium">✅ {currentStock} unidades disponíveis</span>;
  };

  // Navegação de imagens
  const nextImage = () => {
    setSelectedImage(prev => (prev + 1) % product.images.length);
  };

  const prevImage = () => {
    setSelectedImage(prev => (prev - 1 + product.images.length) % product.images.length);
  };

  const shareProduct = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: product.name,
          text: product.description,
          url: window.location.href,
        });
      } catch (err) {
        console.log('Erro ao compartilhar:', err);
      }
    } else {
      // Fallback para copiar link
      navigator.clipboard.writeText(window.location.href);
      alert('Link copiado para a área de transferência!');
    }
  };

  const trustFeatures = [
    { icon: Truck, text: 'Entrega Grátis para todo Brasil' },
    { icon: Shield, text: 'Compra 100% Segura' },
    { icon: Clock, text: 'Entregamos em até 48h' },
    { icon: Zap, text: 'PIX Aprovado na Hora' },
  ];

  useEffect(() => {
    if (product.description) {
      let i = 0;
      const typingEffect = setInterval(() => {
        if (i < product.description.length) {
          setTypedDescription(product.description.slice(0, i + 1));
          i++;
        } else {
          clearInterval(typingEffect);
        }
      }, 20); // Velocidade da digitação

      return () => clearInterval(typingEffect);
    }
  }, [product.description]);

  useEffect(() => {
    const interval = setInterval(() => {
      setViewCount(prev => prev + Math.floor(Math.random() * 2));
    }, 30000); // A cada 30 segundos

    return () => clearInterval(interval);
  }, []);

  // Scroll to reviews
  const scrollToReviews = () => {
    document.getElementById('reviews-section')?.scrollIntoView({
      behavior: 'smooth'
    });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumb Moderno */}
      <div className="flex items-center space-x-2 text-sm text-gray-600 mb-8">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push(`/${store.slug}`)}
          className="flex items-center space-x-2 hover:bg-gray-100 rounded-lg px-3 py-2 transition-colors"
        >
          <ArrowLeft size={16} />
          <span>Voltar para a loja</span>
        </Button>
        <span className="text-gray-400">•</span>
        <span className="text-gray-500">{product.category}</span>
        <span className="text-gray-400">•</span>
        <span className="text-gray-900 font-medium truncate max-w-[200px]">
          {product.name}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
        {/* Galeria de Imagens Moderna */}
        <div className="space-y-4">
          {/* Imagem Principal com Controles */}
          <div className="relative aspect-square bg-gray-100 rounded-2xl overflow-hidden group">
            <img
              src={product.images[selectedImage]?.url || '/images/placeholder-product.jpg'}
              alt={product.images[selectedImage]?.alt || product.name}
              className={`w-full h-full object-cover transition-opacity duration-300 ${imageLoaded ? 'opacity-100' : 'opacity-0'
                }`}
              onLoad={() => setImageLoaded(true)}
            />

            {/* Loading Skeleton */}
            {!imageLoaded && (
              <div className="absolute inset-0 bg-gradient-to-br from-gray-200 to-gray-300 animate-pulse rounded-2xl" />
            )}

            {/* Controles de Navegação */}
            {product.images.length > 1 && (
              <>
                <button
                  onClick={prevImage}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110"
                >
                  <ChevronLeftIcon size={20} />
                </button>
                <button
                  onClick={nextImage}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110"
                >
                  <ChevronRight size={20} />
                </button>
              </>
            )}

            {/* Badge de Destaque */}
            {hasActivePromotion && (
              <div
                className="absolute top-4 left-4 px-3 py-1.5 text-white font-bold rounded-full shadow-lg text-sm animate-pulse"
                style={{
                  backgroundColor: store.theme.primaryColor,
                  background: `linear-gradient(135deg, ${store.theme.primaryColor} 0%, ${store.theme.secondaryColor} 100%)`
                }}
              >
                🔥 {currentDiscountPercentage}% OFF
              </div>
            )}

            {/* Indicador de Imagem */}
            {product.images.length > 1 && (
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
                {product.images.map((_, index) => (
                  <div
                    key={index}
                    className={`w-2 h-2 rounded-full transition-all duration-300 ${index === selectedImage
                      ? 'bg-white scale-125'
                      : 'bg-white/50'
                      }`}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Thumbnails Grid */}
          {product.images.length > 1 && (
            <div className="grid grid-cols-4 gap-3">
              {product.images.map((image, index) => (
                <button
                  key={image.id}
                  onClick={() => setSelectedImage(index)}
                  className={`aspect-square bg-gray-100 rounded-xl overflow-hidden border-2 transition-all duration-200 ${selectedImage === index
                    ? 'border-blue-500 ring-2 ring-blue-200 shadow-md scale-105'
                    : 'border-transparent hover:border-gray-300 hover:shadow-sm'
                    }`}
                >
                  <img
                    src={image.url}
                    alt={image.alt || `${product.name} ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Informações do Produto */}
        <div className="space-y-6">
          {/* Categoria e Rating com Review Link */}
          <div className="flex items-center justify-between">
            <div className="inline-flex items-center space-x-2 bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm font-medium border border-blue-200">
              <span>🏷️ {product.category}</span>
            </div>
            <button
              onClick={scrollToReviews}
              className="flex items-center space-x-1 text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              <Star className="w-4 h-4 text-yellow-400 fill-current" />
              <span className="font-semibold">{rating}</span>
              <span className="text-gray-400">({reviewCount})</span>
              <ArrowRight size={14} className="text-gray-400" />
            </button>
          </div>

          {/* Nome do Produto */}
          <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 leading-tight">
            {product.name}
          </h1>

          {/* Social Proof Dinâmica */}
          <div className="flex items-center space-x-6 text-sm text-gray-500">
            <div className="flex items-center space-x-1">
              <Users size={16} className="text-blue-500" />
              <span className="animate-pulse">{viewCount} pessoas visualizando</span>
            </div>
            <div className="flex items-center space-x-1">
              <Zap size={16} className="text-orange-500" />
              <span>{soldCount}+ vendidos</span>
            </div>
          </div>

          {/* ✅ CORREÇÃO: Preço com Destaque - VERSÃO CORRIGIDA */}
          <div className="space-y-3 p-6 bg-gradient-to-br from-gray-50 to-white rounded-2xl border border-gray-100">
            <div className="flex items-baseline space-x-3 flex-wrap gap-2">
              <span className="text-3xl lg:text-4xl font-bold text-gray-900">
                {formatPrice(currentPrice)}
              </span>

              {/* ✅ CORREÇÃO: Agora deve funcionar com a lógica corrigida */}
              {hasActivePromotion && currentComparePrice && (
                <>
                  <span className="text-xl text-gray-500 line-through">
                    {formatPrice(currentComparePrice)}
                  </span>
                  <span 
                    className="px-3 py-1 text-sm font-bold text-white rounded-full"
                    style={{ 
                      backgroundColor: store.theme.primaryColor,
                      background: `linear-gradient(135deg, ${store.theme.primaryColor} 0%, ${store.theme.secondaryColor} 100%)`
                    }}
                  >
                    {currentDiscountPercentage}% OFF
                  </span>
                </>
              )}
            </div>

            {/* ✅ CORREÇÃO: Agora deve mostrar a economia */}
            {hasActivePromotion && currentEconomy > 0 && (
              <p className="text-green-600 font-semibold text-lg">
                💰 Você economiza {formatPrice(currentEconomy)}
              </p>
            )}

            {/* Parcelamento */}
            <div className="text-sm text-gray-600 bg-white px-3 py-2 rounded-lg border border-gray-200 inline-block">
              📦 ou 12x de {formatPrice(currentPrice / 12)} sem juros
            </div>

            {/* Mensagem para selecionar variação */}
            {product.hasVariants && Object.keys(selectedOptions).length === 0 && (
              <div className="text-sm text-blue-600 bg-blue-50 px-3 py-2 rounded-lg border border-blue-200 inline-block mt-2">
                ⚡ Selecione uma opção para ver o preço específico
              </div>
            )}
          </div>

          {/* Descrição com Efeito de Digitação */}
          <div className="prose max-w-none">
            <p className="text-gray-700 leading-relaxed text-lg border-l-4 border-blue-500 pl-4 py-2 bg-blue-50 rounded-r-lg">
              {typedDescription || product.description}
            </p>
          </div>

          {/* Status do Estoque com Urgência */}
          <div className={`flex items-center space-x-3 p-4 rounded-xl border transition-all duration-300 ${currentStock <= 3
            ? 'bg-orange-50 border-orange-200 animate-pulse'
            : currentStock === 0
              ? 'bg-red-50 border-red-200'
              : 'bg-green-50 border-green-200'
            }`}>
            <Package size={20} className={
              currentStock <= 3
                ? 'text-orange-600'
                : currentStock === 0
                  ? 'text-red-600'
                  : 'text-green-600'
            } />
            <div className="text-sm font-medium">
              {getStockText()}
            </div>
            {currentStock <= 10 && currentStock > 0 && (
              <div className="ml-auto">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-ping" />
              </div>
            )}
          </div>

          {/* ✅ CORREÇÃO: Variações com lógica corrigida */}
          {product.hasVariants && product.variants.length > 0 && (
            <div className="space-y-6">
              {product.variants.map((variant) => (
                <div key={variant.id}>
                  <label className="block text-lg font-semibold text-gray-900 mb-4">
                    {variant.name}
                  </label>
                  <div className="flex flex-wrap gap-3">
                    {variant.options.map((option) => {
                      // ✅ CORREÇÃO: Lógica invertida para as opções também
                      const price = option.price;
                      const comparePrice = option.comparePrice;
                      
                      let actualPrice = price;
                      let actualComparePrice = comparePrice;
                      let optionHasPromotion = false;
                      
                      if (comparePrice && comparePrice !== price) {
                        if (comparePrice > price) {
                          actualPrice = price;
                          actualComparePrice = comparePrice;
                          optionHasPromotion = true;
                        } else if (comparePrice < price) {
                          actualPrice = comparePrice;
                          actualComparePrice = price;
                          optionHasPromotion = true;
                        }
                      }
                      
                      const optionDiscount = optionHasPromotion 
                        ? getDiscountPercentage(actualPrice, actualComparePrice!)
                        : 0;
                      const optionEconomy = optionHasPromotion ? actualComparePrice! - actualPrice : 0;

                      return (
                        <button
                          key={option.id}
                          onClick={() => handleVariantSelect(variant, option)}
                          className={`px-4 py-3 border-2 rounded-xl text-sm font-semibold transition-all min-w-[100px] ${
                            selectedVariants[variant.id] === option.id
                              ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-lg ring-2 ring-blue-200'
                              : 'border-gray-300 text-gray-700 hover:border-gray-400 hover:shadow-md'
                          } ${
                            !option.isActive || option.stock === 0 
                              ? 'opacity-50 cursor-not-allowed grayscale' 
                              : ''
                          }`}
                          disabled={!option.isActive || option.stock === 0}
                        >
                          <div className="flex flex-col items-center space-y-1">
                            <span className="font-semibold">{option.name}</span>
                            
                            <div className="flex flex-col items-center space-y-1">
                              <span className="font-bold text-gray-900">
                                {formatPrice(actualPrice)}
                              </span>
                              
                              {optionHasPromotion && (
                                <div className="flex flex-col items-center space-y-0">
                                  <span className="text-xs text-gray-500 line-through">
                                    {formatPrice(actualComparePrice!)}
                                  </span>
                                  <span 
                                    className="text-xs font-bold text-white px-2 py-0.5 rounded-full"
                                    style={{ 
                                      backgroundColor: store.theme.primaryColor,
                                    }}
                                  >
                                    -{optionDiscount}%
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Ações Principais */}
          <div className="space-y-4">
            <AddToCartButton
              product={product}
              variant={selectedVariantData}
              className="text-lg py-4 font-semibold rounded-xl shadow-2xl hover:shadow-xl transform hover:scale-105 transition-all duration-300"
              disabled={!isVariantComplete() || !isProductAvailable}
            />

            {!isVariantComplete() && product.hasVariants && (
              <p className="text-sm text-yellow-600 text-center">
                ⚠️ Selecione todas as opções disponíveis para continuar
              </p>
            )}

            {/* Ações Secundárias */}
            <div className="flex space-x-3">
              <Button
                variant="outline"
                onClick={() => setIsWishlisted(!isWishlisted)}
                className={`flex-1 py-3 rounded-xl border-2 ${isWishlisted
                  ? 'border-red-300 bg-red-50 text-red-600'
                  : 'border-gray-300 text-gray-700'
                  }`}
              >
                <Heart
                  size={20}
                  className={`mr-2 ${isWishlisted ? 'fill-current' : ''}`}
                />
                {isWishlisted ? 'Favoritado' : 'Favoritar'}
              </Button>

              <Button
                variant="outline"
                onClick={shareProduct}
                className="flex-1 py-3 rounded-xl border-2 border-gray-300 text-gray-700"
              >
                <Share size={20} className="mr-2" />
                Compartilhar
              </Button>
            </div>

            {/* WhatsApp Direct */}
            {store.contact.whatsapp && (
              <a
                href={`https://wa.me/${store.contact.whatsapp}?text=Olá! Tenho interesse no produto: ${product.name}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center space-x-2 w-full py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition-colors"
              >
                <MessageCircle size={20} />
                <span>Tirar Dúvidas no WhatsApp</span>
              </a>
            )}

            {/* Trust Badges Mobile */}
            <div className="lg:hidden grid grid-cols-2 gap-3 pt-6">
              {trustFeatures.map((feature, index) => (
                <div key={index} className="flex items-center space-x-2 text-sm text-gray-600 p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <feature.icon size={16} className="text-green-500 flex-shrink-0" />
                  <span className="font-medium">{feature.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Trust Badges Desktop */}
          <div className="hidden lg:grid lg:grid-cols-2 gap-4 pt-6">
            {trustFeatures.map((feature, index) => (
              <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm">
                  <feature.icon size={18} className="text-gray-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900 text-sm">{feature.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Informações Detalhadas */}
      <div className="mt-16 border-t border-gray-200 pt-12">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Descrição Detalhada */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center space-x-2">
                <span>📋</span>
                <span>Descrição Completa</span>
              </h2>
              <div className="prose prose-lg max-w-none">
                <p className="text-gray-700 leading-relaxed text-lg bg-gray-50 p-6 rounded-2xl border border-gray-200">
                  {product.description}
                </p>

                {/* Características */}
                <div className="mt-6 space-y-3 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                  <h3 className="font-semibold text-gray-900 mb-4">✨ Características Principais</h3>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-3 text-gray-700">
                      <Check size={18} className="text-green-500 flex-shrink-0" />
                      <span>Material premium e durável</span>
                    </div>
                    <div className="flex items-center space-x-3 text-gray-700">
                      <Check size={18} className="text-green-500 flex-shrink-0" />
                      <span>Garantia do fabricante incluída</span>
                    </div>
                    <div className="flex items-center space-x-3 text-gray-700">
                      <Check size={18} className="text-green-500 flex-shrink-0" />
                      <span>Entrega rápida e rastreada</span>
                    </div>
                    <div className="flex items-center space-x-3 text-gray-700">
                      <Check size={18} className="text-green-500 flex-shrink-0" />
                      <span>Suporte técnico especializado</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Especificações e Reviews */}
            <div className="space-y-8">
              {/* Especificações */}
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center space-x-2">
                  <span>⚙️</span>
                  <span>Especificações</span>
                </h2>
                <div className="bg-white rounded-2xl p-6 space-y-4 border border-gray-200 shadow-sm">
                  <div className="flex justify-between py-3 border-b border-gray-200">
                    <span className="font-medium text-gray-600">Categoria</span>
                    <span className="font-semibold text-gray-900">{product.category}</span>
                  </div>
                  <div className="flex justify-between py-3 border-b border-gray-200">
                    <span className="font-medium text-gray-600">Disponibilidade</span>
                    <span className={`font-semibold ${currentStock > 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                      {currentStock > 0 ? '🟢 Em Estoque' : '🔴 Esgotado'}
                    </span>
                  </div>
                  <div className="flex justify-between py-3 border-b border-gray-200">
                    <span className="font-medium text-gray-600">SKU</span>
                    <span className="font-semibold text-gray-900 font-mono">
                      {product.hasVariants && selectedVariantData
                        ? selectedVariantData.optionId.slice(0, 8).toUpperCase()
                        : product.id.slice(0, 8).toUpperCase()
                      }
                    </span>
                  </div>
                  <div className="flex justify-between py-3">
                    <span className="font-medium text-gray-600">Avaliação</span>
                    <span className="font-semibold text-gray-900 flex items-center space-x-1">
                      <Star size={16} className="text-yellow-400 fill-current" />
                      <span>{rating}/5</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Seção de Reviews */}
              <div id="reviews-section">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center space-x-2">
                  <span>⭐</span>
                  <span>Avaliações dos Clientes</span>
                </h2>
                <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
                  <div className="text-center mb-6">
                    <div className="text-4xl font-bold text-gray-900 mb-2">{rating}</div>
                    <div className="flex items-center justify-center space-x-1 mb-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          size={20}
                          className={`${star <= Math.floor(parseFloat(rating))
                            ? 'text-yellow-400 fill-current'
                            : 'text-gray-300'
                            }`}
                        />
                      ))}
                    </div>
                    <div className="text-sm text-gray-600">
                      Baseado em {reviewCount} avaliações
                    </div>
                  </div>

                  <Button
                    onClick={scrollToReviews}
                    variant="outline"
                    className="w-full py-3 rounded-xl border-2 border-gray-300 text-gray-700 hover:border-gray-400"
                  >
                    Ver Todas as Avaliações
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}