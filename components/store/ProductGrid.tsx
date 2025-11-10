// components/store/ProductGrid.tsx - VERSÃO CORRIGIDA
'use client';
import { useState, useEffect } from 'react';
import { ProductCard } from '@/components/ui/product-card';
import { Product } from '@/types';
import { productServiceNew } from '@/lib/firebase/firestore-new';
import { Filter, Grid, List, SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ProductGridProps {
  storeId: string;
}

type ViewMode = 'grid' | 'list';
type SortOption = 'name' | 'price-low' | 'price-high' | 'newest';

export function ProductGrid({ storeId }: ProductGridProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [showFilters, setShowFilters] = useState(false);

  // ✅ CORREÇÃO: Uma única função loadProducts
  const loadProducts = async () => {
    if (!storeId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      console.log('🔄 ProductGrid: Buscando produtos para storeId:', storeId); // DEBUG

      const storeProducts = await productServiceNew.getStoreProducts(storeId);
      
      console.log('✅ ProductGrid: Produtos encontrados:', storeProducts); // DEBUG

      setProducts(storeProducts);
      setFilteredProducts(storeProducts);
    } catch (err) {
      console.error('❌ ProductGrid: Erro ao carregar produtos:', err);
      setError('Erro ao carregar produtos da loja');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, [storeId]);

  // ✅ CORREÇÃO: Ordenar produtos corretamente
  useEffect(() => {
    if (products.length === 0) return;

    const sorted = [...products].sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'price-low':
          return getProductPrice(a) - getProductPrice(b);
        case 'price-high':
          return getProductPrice(b) - getProductPrice(a);
        case 'newest':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        default:
          return 0;
      }
    });
    setFilteredProducts(sorted);
  }, [sortBy, products]);

  // Helper function para obter preço
  const getProductPrice = (product: Product) => {
    if (product.hasVariants && product.variants && product.variants.length > 0) {
      // Encontrar o menor preço entre todas as opções ativas
      let minPrice = Infinity;
      product.variants.forEach(variant => {
        variant.options.forEach(option => {
          if (option.isActive && option.price < minPrice) {
            minPrice = option.price;
          }
        });
      });
      return minPrice !== Infinity ? minPrice : 0;
    }
    
    // Produto sem variações
    return product.variants?.[0]?.options?.[0]?.price || 0;
  };

  // Loading Skeleton melhorado
  if (loading) {
    return (
      <div className="space-y-6">
        {/* Header Skeleton */}
        <div className="flex justify-between items-center">
          <div className="h-6 bg-gray-200 rounded w-32 animate-pulse"></div>
          <div className="flex space-x-2">
            <div className="h-8 bg-gray-200 rounded w-20 animate-pulse"></div>
            <div className="h-8 bg-gray-200 rounded w-20 animate-pulse"></div>
          </div>
        </div>

        {/* Grid Skeleton */}
        <div className={`grid gap-6 ${
          viewMode === 'grid' 
            ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' 
            : 'grid-cols-1'
        }`}>
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className={`bg-white rounded-lg border animate-pulse ${
              viewMode === 'list' ? 'flex' : ''
            }`}>
              <div className={`aspect-square bg-gray-200 ${
                viewMode === 'list' ? 'w-32 rounded-l-lg' : 'rounded-t-lg w-full'
              }`}></div>
              <div className="p-4 flex-1">
                <div className="w-3/4 h-4 bg-gray-200 rounded mb-2"></div>
                <div className="w-1/2 h-4 bg-gray-200 rounded mb-3"></div>
                <div className="w-1/3 h-6 bg-gray-200 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="max-w-md mx-auto">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl text-red-600">⚠️</span>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Erro ao carregar produtos
          </h3>
          <p className="text-gray-600 mb-4">
            {error}
          </p>
          <button 
            onClick={loadProducts}
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  if (filteredProducts.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="max-w-md mx-auto">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">📦</span>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Nenhum produto encontrado
          </h3>
          <p className="text-gray-600">
            {products.length === 0 
              ? 'Esta loja ainda não possui produtos cadastrados.'
              : 'Nenhum produto corresponde aos filtros aplicados.'
            }
          </p>
          {products.length === 0 && (
            <div className="mt-4">
              <p className="text-sm text-gray-500">
                💡 Acesse o dashboard para adicionar produtos a esta loja.
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header com Controles */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            {filteredProducts.length} produto{filteredProducts.length !== 1 ? 's' : ''} encontrado{filteredProducts.length !== 1 ? 's' : ''}
          </h2>
        </div>

        <div className="flex items-center space-x-4">
          {/* Ordenação */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="newest">Mais Recentes</option>
            <option value="name">Nome A-Z</option>
            <option value="price-low">Menor Preço</option>
            <option value="price-high">Maior Preço</option>
          </select>

          {/* View Mode Toggle */}
          <div className="flex border border-gray-300 rounded-md overflow-hidden">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
              className="rounded-none"
            >
              <Grid size={16} />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="rounded-none"
            >
              <List size={16} />
            </Button>
          </div>
        </div>
      </div>

      {/* Product Grid/List */}
      <div className={viewMode === 'grid' 
        ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
        : 'grid grid-cols-1 gap-4'
      }>
        {filteredProducts.map((product) => (
          <ProductCard 
            key={product.id} 
            product={product} 
          />
        ))}
      </div>
    </div>
  );
}