'use client';
import { useState, useEffect } from 'react';
import { Store } from '@/types/store';
import { Product, ProductVariant, VariantOption } from '@/types/products';
import { AddToCartButton } from '@/components/cart/AddToCartButton';
import { Button } from '@/components/ui/button';
import { ChevronLeft, Share, Heart, Truck, Shield, ArrowLeft, Package } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { getProductPrice, getProductComparePrice, getProductTotalStock, getDiscountPercentage } from '@/lib/utils/product-helpers';

interface ProductDetailsProps {
  store: Store;
  product: Product;
}

export function ProductDetails({ store, product }: ProductDetailsProps) {
  const router = useRouter();
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({});
  const [selectedOptions, setSelectedOptions] = useState<Record<string, VariantOption>>({});

  // ✅ Usar helpers para obter preço e estoque
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

  // ✅ Obter preço atual baseado na seleção
  const getCurrentPrice = () => {
    if (product.hasVariants && Object.keys(selectedOptions).length > 0) {
      const selectedOption = Object.values(selectedOptions)[0];
      return selectedOption.price;
    }
    return productPrice;
  };

  // ✅ Obter preço promocional atual
  const getCurrentComparePrice = () => {
    if (product.hasVariants && Object.keys(selectedOptions).length > 0) {
      const selectedOption = Object.values(selectedOptions)[0];
      return selectedOption.comparePrice;
    }
    return productComparePrice;
  };

  // ✅ Obter estoque atual baseado na seleção
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

  // ✅ Verificar se produto está disponível
  const isProductAvailable = currentStock > 0;

  // ✅ Obter texto de estoque
  const getStockText = () => {
    if (currentStock === 0) {
      return <span className="text-red-600 font-medium">Esgotado</span>;
    }
    
    if (currentStock <= 5) {
      return <span className="text-orange-600 font-medium">Apenas {currentStock} em estoque</span>;
    }
    
    return <span className="text-green-600 font-medium">{currentStock} em estoque</span>;
  };

  // ✅ Verificar se há promoção ativa para a seleção atual
  const hasActivePromotion = currentComparePrice && currentComparePrice > currentPrice;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumb e Navegação */}
      <div className="flex items-center space-x-2 text-sm text-gray-600 mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push(`/${store.slug}`)}
          className="flex items-center space-x-1"
        >
          <ArrowLeft size={16} />
          <span>Voltar para a loja</span>
        </Button>
        <span>/</span>
        <span>{product.category}</span>
        <span>/</span>
        <span className="text-gray-900 font-medium">{product.name}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Galeria de Imagens */}
        <div className="space-y-4">
          {/* Imagem Principal */}
          <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
            <img
              src={product.images[selectedImage]?.url || '/images/placeholder-product.jpg'}
              alt={product.images[selectedImage]?.alt || product.name}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Thumbnails */}
          {product.images.length > 1 && (
            <div className="grid grid-cols-4 gap-2">
              {product.images.map((image, index) => (
                <button
                  key={image.id}
                  onClick={() => setSelectedImage(index)}
                  className={`aspect-square bg-gray-100 rounded-md overflow-hidden border-2 ${
                    selectedImage === index 
                      ? 'border-blue-500' 
                      : 'border-transparent'
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
          {/* Categoria */}
          <div className="text-sm text-gray-600">
            {product.category}
          </div>

          {/* Nome do Produto */}
          <h1 className="text-3xl font-bold text-gray-900">
            {product.name}
          </h1>

          {/* Preço */}
          <div className="space-y-2">
            <div className="flex items-center space-x-3">
              <span className="text-3xl font-bold text-gray-900">
                {formatPrice(currentPrice)}
              </span>
              
              {hasActivePromotion && (
                <>
                  <span className="text-xl text-gray-500 line-through">
                    {formatPrice(currentComparePrice!)}
                  </span>
                  <span 
                    className="px-2 py-1 text-sm font-semibold text-white rounded"
                    style={{ backgroundColor: store.theme.primaryColor }}
                  >
                    {currentDiscountPercentage}% OFF
                  </span>
                </>
              )}
            </div>
            
            {hasActivePromotion && (
              <p className="text-sm text-green-600 font-medium">
                Você economiza {formatPrice(currentComparePrice! - currentPrice)}
              </p>
            )}
          </div>

          {/* Descrição */}
          <div className="prose max-w-none">
            <p className="text-gray-700 leading-relaxed">
              {product.description}
            </p>
          </div>

          {/* Display de Estoque */}
          <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
            <Package size={18} className="text-gray-600" />
            <div className="text-sm">
              {getStockText()}
            </div>
          </div>

          {/* Variações */}
          {product.hasVariants && product.variants.length > 0 && (
            <div className="space-y-4">
              {product.variants.map((variant) => (
                <div key={variant.id}>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
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
                          className={`px-4 py-2 border rounded-md text-sm font-medium transition-colors ${
                            selectedVariants[variant.id] === option.id
                              ? 'border-blue-500 bg-blue-50 text-blue-700'
                              : 'border-gray-300 text-gray-700 hover:border-gray-400'
                          } ${!option.isActive || option.stock === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                          disabled={!option.isActive || option.stock === 0}
                        >
                          <div className="flex flex-col items-center">
                            <span>{option.name}</span>
                            {option.price !== productPrice && (
                              <span className="text-xs mt-1">
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
          <div className="space-y-4">
            <AddToCartButton
              product={product}
              variant={selectedVariantData}
              className="text-lg py-3"
              disabled={!isVariantComplete() || !isProductAvailable}
            />

            {!isVariantComplete() && (
              <p className="text-sm text-yellow-600">
                Selecione todas as opções disponíveis
              </p>
            )}

            {!isProductAvailable && (
              <p className="text-sm text-red-600">
                Produto esgotado
              </p>
            )}

            {/* Ações Secundárias */}
            <div className="flex space-x-4">
              <Button variant="outline" className="flex-1">
                <Heart size={18} className="mr-2" />
                Favoritar
              </Button>
              <Button variant="outline" className="flex-1">
                <Share size={18} className="mr-2" />
                Compartilhar
              </Button>
            </div>
          </div>

          {/* Benefícios */}
          <div className="border-t pt-6 space-y-4">
            <div className="flex items-center space-x-3 text-sm text-gray-600">
              <Truck size={20} />
              <div>
                <p className="font-medium text-gray-900">Frete Grátis</p>
                <p>Para todo o Brasil</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3 text-sm text-gray-600">
              <Shield size={20} />
              <div>
                <p className="font-medium text-gray-900">Compra Segura</p>
                <p>Seus dados estão protegidos</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Informações Adicionais */}
      <div className="mt-16 border-t pt-8">
        <div className="max-w-3xl">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Detalhes do Produto
          </h2>
          
          <div className="prose max-w-none">
            <p className="text-gray-700 leading-relaxed">
              {product.description}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}