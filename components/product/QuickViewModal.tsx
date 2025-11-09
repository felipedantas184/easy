// components/product/QuickViewModal.tsx - VERSÃO MOBILE-FIRST
'use client';
import { useState, useEffect } from 'react';
import { Product, ProductVariant, VariantOption } from '@/types/products';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, ShoppingCart, Package, Zap, Users, Shield, Truck, Star, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { useStore } from '@/contexts/store-context';
import { AddToCartButton } from '@/components/cart/AddToCartButton';
import { 
  getProductPrice, 
  getProductComparePrice, 
  getProductTotalStock, 
  getDiscountPercentage
} from '@/lib/utils/product-helpers';

interface QuickViewModalProps {
  product: Product;
  isOpen: boolean;
  onClose: () => void;
}

export function QuickViewModal({ product, isOpen, onClose }: QuickViewModalProps) {
  const { store } = useStore();
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({});
  const [selectedOptions, setSelectedOptions] = useState<Record<string, VariantOption>>({});
  const [isMobile, setIsMobile] = useState(false);

  // Detectar mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Reset e configurações
  useEffect(() => {
    if (isOpen) {
      setSelectedVariants({});
      setSelectedOptions({});
      setSelectedImage(0);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [product, isOpen]);

  // Fechar com ESC
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
    }

    return () => {
      document.removeEventListener('keydown', handleEsc);
    };
  }, [isOpen, onClose]);

  const productPrice = getProductPrice(product);
  const productComparePrice = getProductComparePrice(product);
  const totalStock = getProductTotalStock(product);
  const hasDiscount = productComparePrice && productComparePrice > productPrice;
  const discountPercentage = hasDiscount ? getDiscountPercentage(productPrice, productComparePrice) : 0;

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

  const getCurrentPrice = () => {
    if (product.hasVariants && Object.keys(selectedOptions).length > 0) {
      const selectedOption = Object.values(selectedOptions)[0];
      return selectedOption.price;
    }
    return productPrice;
  };

  const getCurrentComparePrice = () => {
    if (product.hasVariants && Object.keys(selectedOptions).length > 0) {
      const selectedOption = Object.values(selectedOptions)[0];
      return selectedOption.comparePrice;
    }
    return productComparePrice;
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

  const currentPrice = getCurrentPrice();
  const currentComparePrice = getCurrentComparePrice();
  const currentStock = getCurrentStock();
  const selectedVariantData = getSelectedVariantData();
  const currentDiscountPercentage = currentComparePrice && currentComparePrice > currentPrice 
    ? getDiscountPercentage(currentPrice, currentComparePrice)
    : 0;

  const isProductAvailable = currentStock > 0;

  // Gatilhos mentais
  const viewingCount = Math.floor(Math.random() * 15) + 5;
  const soldCount = Math.floor(Math.random() * 50) + 10;
  const rating = (Math.random() * 1 + 4).toFixed(1);

  // Navegação de imagens mobile
  const nextImage = () => {
    setSelectedImage(prev => (prev + 1) % product.images.length);
  };

  const prevImage = () => {
    setSelectedImage(prev => (prev - 1 + product.images.length) % product.images.length);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop mobile-friendly */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
      />
      
      {/* Modal Container */}
      <div className="fixed inset-0 flex items-end justify-center sm:items-center sm:p-4">
        <div 
          className="bg-white w-full max-h-[90vh] sm:max-h-[85vh] sm:max-w-2xl sm:rounded-2xl shadow-2xl transform transition-transform duration-300 sm:scale-95 sm:hover:scale-100 flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header Sticky */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white sticky top-0 z-20 sm:relative sm:p-6">
            <h2 className="text-lg font-bold text-gray-900 sm:text-xl">Escolher Opções</h2>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onClose}
              className="rounded-full w-8 h-8 sm:w-10 sm:h-10 hover:bg-gray-100"
            >
              <X size={18} className="sm:w-5 sm:h-5" />
            </Button>
          </div>

          {/* Content com Scroll */}
          <div className="flex-1 overflow-y-auto">
            <div className="flex flex-col sm:grid sm:grid-cols-2 sm:gap-6">
              
              {/* Seção de Imagem - Mobile Full Width */}
              <div className="relative">
                {/* Imagem Principal com Controles Mobile */}
                <div className="aspect-square bg-gray-100 relative sm:rounded-xl sm:overflow-hidden">
                  <img
                    src={product.images[selectedImage]?.url || '/images/placeholder-product.jpg'}
                    alt={product.images[selectedImage]?.alt || product.name}
                    className="w-full h-full object-cover"
                  />

                  {/* Controles de Navegação Mobile */}
                  {isMobile && product.images.length > 1 && (
                    <>
                      <button
                        onClick={prevImage}
                        className="absolute left-2 top-1/2 transform -translate-y-1/2 w-10 h-10 bg-black/50 text-white rounded-full flex items-center justify-center"
                      >
                        <ChevronLeft size={20} />
                      </button>
                      <button
                        onClick={nextImage}
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 w-10 h-10 bg-black/50 text-white rounded-full flex items-center justify-center"
                      >
                        <ChevronRight size={20} />
                      </button>
                    </>
                  )}

                  {/* Indicador de Imagem Mobile */}
                  {isMobile && product.images.length > 1 && (
                    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
                      {product.images.map((_, index) => (
                        <div
                          key={index}
                          className={`w-2 h-2 rounded-full ${
                            index === selectedImage ? 'bg-white' : 'bg-white/50'
                          }`}
                        />
                      ))}
                    </div>
                  )}
                </div>

                {/* Thumbnails - Apenas Desktop */}
                {!isMobile && product.images.length > 1 && (
                  <div className="grid grid-cols-4 gap-2 mt-3">
                    {product.images.map((image, index) => (
                      <button
                        key={image.id}
                        onClick={() => setSelectedImage(index)}
                        className={`aspect-square bg-gray-100 rounded-lg overflow-hidden border-2 transition-all ${
                          selectedImage === index 
                            ? 'border-blue-500 ring-2 ring-blue-200' 
                            : 'border-transparent hover:border-gray-300'
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

                {/* Selos Mobile */}
                <div className="sm:hidden grid grid-cols-2 gap-2 p-4 border-b">
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Truck size={16} />
                    <span>Entrega Grátis</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Shield size={16} />
                    <span>Compra Segura</span>
                  </div>
                </div>
              </div>

              {/* Seção de Informações */}
              <div className="p-4 sm:p-0 sm:pr-6 sm:pb-6 space-y-4">
                {/* Categoria e Rating */}
                <div className="flex items-center justify-between">
                  <Badge variant="secondary" className="text-xs">
                    {product.category}
                  </Badge>
                  <div className="flex items-center space-x-1 text-sm text-gray-600">
                    <Star size={14} className="fill-yellow-400 text-yellow-400" />
                    <span>{rating}</span>
                    <span className="text-gray-400 hidden sm:inline">({soldCount})</span>
                  </div>
                </div>

                {/* Nome do Produto */}
                <h1 className="text-xl font-bold text-gray-900 leading-tight sm:text-2xl">
                  {product.name}
                </h1>

                {/* Descrição */}
                <p className="text-gray-600 text-sm leading-relaxed sm:text-base">
                  {product.description}
                </p>

                {/* Gatilhos Sociais */}
                <div className="flex items-center space-x-4 text-xs text-gray-500 sm:text-sm">
                  <div className="flex items-center space-x-1">
                    <Users size={12} className="sm:w-4 sm:h-4" />
                    <span>{viewingCount} visualizando</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Zap size={12} className="sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline">{soldCount} vendidos</span>
                    <span className="sm:hidden">{soldCount}</span>
                  </div>
                </div>

                {/* Preço */}
                <div className="space-y-2">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl font-bold text-gray-900 sm:text-3xl">
                      {formatPrice(currentPrice)}
                    </span>
                    
                    {currentComparePrice && currentComparePrice > currentPrice && (
                      <>
                        <span className="text-xl text-gray-500 line-through">
                          {formatPrice(currentComparePrice)}
                        </span>
                        <Badge variant="default" className="text-xs sm:text-sm" style={{ 
                          backgroundColor: store?.theme.primaryColor,
                          color: 'white'
                        }}>
                          {currentDiscountPercentage}% OFF
                        </Badge>
                      </>
                    )}
                  </div>
                  
                  {currentComparePrice && currentComparePrice > currentPrice && (
                    <p className="text-green-600 font-medium text-sm sm:text-base">
                      💰 Economize {formatPrice(currentComparePrice - currentPrice)}
                    </p>
                  )}
                </div>

                {/* Status do Estoque */}
                <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
                  <Package size={16} className="text-gray-600 flex-shrink-0" />
                  <div className="text-sm">
                    {currentStock === 0 ? (
                      <span className="text-red-600 font-medium">⛔ Produto Esgotado</span>
                    ) : currentStock <= 5 ? (
                      <span className="text-orange-600 font-medium">
                        🚀 Apenas {currentStock} unidades!
                      </span>
                    ) : (
                      <span className="text-green-600 font-medium">
                        ✅ {currentStock} em estoque
                      </span>
                    )}
                  </div>
                </div>

                {/* Variações */}
                {product.hasVariants && product.variants.length > 0 && (
                  <div className="space-y-4">
                    {product.variants.map((variant) => (
                      <div key={variant.id}>
                        <label className="block text-sm font-medium text-gray-900 mb-2 sm:mb-3">
                          {variant.name}
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {variant.options.map((option) => {
                            const optionHasPromotion = option.comparePrice && option.comparePrice > option.price;
                            const optionDiscount = optionHasPromotion 
                              ? getDiscountPercentage(option.price, option.comparePrice!)
                              : 0;
                            
                            return (
                              <button
                                key={option.id}
                                onClick={() => handleVariantSelect(variant, option)}
                                className={`px-3 py-2 border rounded-lg text-xs font-medium transition-all min-w-[70px] sm:min-w-[80px] sm:px-4 sm:py-3 sm:text-sm ${
                                  selectedVariants[variant.id] === option.id
                                    ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-sm ring-2 ring-blue-200'
                                    : 'border-gray-300 text-gray-700 hover:border-gray-400 hover:shadow-sm'
                                } ${
                                  !option.isActive || option.stock === 0 
                                    ? 'opacity-50 cursor-not-allowed grayscale' 
                                    : ''
                                }`}
                                disabled={!option.isActive || option.stock === 0}
                              >
                                <div className="flex flex-col items-center space-y-1">
                                  <span className="font-medium">{option.name}</span>
                                  {option.price !== productPrice && (
                                    <span className="font-semibold">
                                      {formatPrice(option.price)}
                                      {optionHasPromotion && (
                                        <span className="text-green-600 ml-1">
                                          (-{optionDiscount}%)
                                        </span>
                                      )}
                                    </span>
                                  )}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Ações */}
                <div className="space-y-3 pt-2 sm:pt-4">
                  <AddToCartButton
                    product={product}
                    variant={selectedVariantData}
                    className="w-full text-base py-3 font-semibold rounded-xl sm:text-lg sm:py-4"
                    disabled={!isVariantComplete() || !isProductAvailable}
                  />

                  {!isVariantComplete() && product.hasVariants && (
                    <p className="text-sm text-yellow-600 text-center">
                      ⚠️ Selecione todas as opções
                    </p>
                  )}

                  {/* Link para página completa */}
                  <div className="text-center pt-2">
                    <a 
                      href={`/${store?.slug}/products/${product.id}`}
                      className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800 font-medium"
                      onClick={onClose}
                    >
                      Ver página completa do produto
                      <ArrowRight size={14} className="ml-1" />
                    </a>
                  </div>
                </div>

                {/* Selos de Confiança Desktop */}
                <div className="hidden sm:grid sm:grid-cols-2 sm:gap-3 sm:pt-4">
                  <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
                    <Truck size={18} className="text-blue-600 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900 text-sm">Frete Grátis</p>
                      <p className="text-xs text-gray-600">Para todo Brasil</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
                    <Shield size={18} className="text-green-600 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900 text-sm">Compra Segura</p>
                      <p className="text-xs text-gray-600">Dados protegidos</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Sticky para Mobile */}
          {isMobile && (
            <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4">
              <AddToCartButton
                product={product}
                variant={selectedVariantData}
                className="w-full text-base py-3 font-semibold rounded-lg"
                disabled={!isVariantComplete() || !isProductAvailable}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}