// components/store/ProductGrid.tsx - VERSÃO COM PESQUISA E FILTROS FUNCIONAIS
'use client';
import { useState, useEffect, useMemo } from 'react';
import { ProductCard } from '@/components/ui/product-card';
import { Product } from '@/types';
import { productServiceNew } from '@/lib/firebase/firestore-new';
import { Filter, Grid, List, Search, ArrowUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface ProductGridProps {
  storeId: string;
}

type ViewMode = 'grid' | 'list';
type SortOption = 'newest' | 'name' | 'price-low' | 'price-high';
type FilterOption = 'all' | 'bestsellers' | 'promotions';

export function ProductGrid({ storeId }: ProductGridProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Estados para filtros e pesquisa
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [filterBy, setFilterBy] = useState<FilterOption>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Carregar produtos
  const loadProducts = async () => {
    if (!storeId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      console.log('🔄 ProductGrid: Buscando produtos para storeId:', storeId);

      const storeProducts = await productServiceNew.getStoreProducts(storeId);

      console.log('✅ ProductGrid: Produtos encontrados:', storeProducts.length);

      setProducts(storeProducts);
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

  // Função helper para obter preço do produto
  const getProductPrice = (product: Product) => {
    if (product.hasVariants && product.variants && product.variants.length > 0) {
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

    return product.variants?.[0]?.options?.[0]?.price || 0;
  };

  // Função para verificar se produto está em promoção
  const isProductOnSale = (product: Product) => {
    const price = getProductPrice(product);
    const originalPrice = product.variants?.[0]?.options?.[0]?.price;
    return originalPrice && originalPrice > price;
  };

  // Filtrar e ordenar produtos
  const filteredAndSortedProducts = useMemo(() => {
    let filtered = [...products];

    // Aplicar filtro de busca
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(term) ||
        product.description?.toLowerCase().includes(term) ||
        product.category?.toLowerCase().includes(term)
      );
    }

    // Aplicar filtros específicos
    switch (filterBy) {
      case 'bestsellers':
        // Simular produtos mais vendidos (em uma implementação real, isso viria do backend)
        filtered = filtered.filter((_, index) => index % 3 === 0); // Exemplo
        break;
      case 'promotions':
        filtered = filtered.filter(product => isProductOnSale(product));
        break;
      case 'all':
      default:
        // Todos os produtos
        break;
    }

    // Aplicar ordenação
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'price-low':
          return getProductPrice(a) - getProductPrice(b);
        case 'price-high':
          return getProductPrice(b) - getProductPrice(a);
        case 'newest':
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });

    return filtered;
  }, [products, searchTerm, filterBy, sortBy]);

  // Loading Skeleton
  if (loading) {
    return (
      <div className="space-y-6">
        {/* Skeleton dos Filtros */}
        <div className="space-y-4">
          <div className="relative max-w-2xl mx-auto">
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
              <div className="w-5 h-5 bg-gray-200 rounded animate-pulse"></div>
            </div>
            <div className="w-full pl-10 pr-4 py-3 bg-gray-200 rounded-lg animate-pulse"></div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-gray-200 rounded animate-pulse"></div>
              <div className="w-16 h-4 bg-gray-200 rounded animate-pulse"></div>
            </div>

            <div className="flex flex-wrap gap-2 justify-center">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="w-20 h-8 bg-gray-200 rounded-lg animate-pulse"></div>
              ))}
            </div>
          </div>
        </div>

        {/* Skeleton do Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="bg-white rounded-lg border animate-pulse">
              <div className="aspect-square bg-gray-200 rounded-t-lg w-full"></div>
              <div className="p-4">
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

  return (
    <div className="space-y-6">
      {/* Barra de Pesquisa e Filtros - AGORA FUNCIONAIS */}
      <div className="space-y-4">
        {/* Barra de Pesquisa */}
        <div className="relative max-w-2xl mx-auto">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <Input
            type="text"
            placeholder="Buscar produtos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          />
        </div>

        {/* Filtros e Ordenação */}
        <div className="flex flex-wrap gap-4 justify-center">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Filter size={16} />
            <span>Filtrar por:</span>
          </div>
          {/* Ordenação */}
          <div className="flex items-center space-x-2 pl-2 border-l border-gray-200">
            <ArrowUpDown size={16} className="text-gray-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="bg-transparent border-none text-sm text-gray-700 focus:outline-none"
            >
              <option value="newest">Mais Recentes</option>
              <option value="name">Nome A-Z</option>
              <option value="price-low">Menor Preço</option>
              <option value="price-high">Maior Preço</option>
            </select>
          </div>
        </div>
      </div>

      {/* Header com Controles e Contador */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            {filteredAndSortedProducts.length} produto{filteredAndSortedProducts.length !== 1 ? 's' : ''} encontrado{filteredAndSortedProducts.length !== 1 ? 's' : ''}
            {searchTerm && (
              <span className="text-gray-600 text-sm font-normal ml-2">
                para "{searchTerm}"
              </span>
            )}
          </h2>
        </div>

        {/* View Mode Toggle */}
        {/**
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
         */}
      </div>

      {/* Mensagem quando não há resultados */}
      {filteredAndSortedProducts.length === 0 && (
        <div className="text-center py-12">
          <div className="max-w-md mx-auto">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">🔍</span>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Nenhum produto encontrado
            </h3>
            <p className="text-gray-600">
              {searchTerm
                ? `Não encontramos produtos para "${searchTerm}". Tente outros termos.`
                : 'Nenhum produto corresponde aos filtros aplicados.'
              }
            </p>
            {(searchTerm || filterBy !== 'all') && (
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm('');
                  setFilterBy('all');
                }}
                className="mt-4"
              >
                Limpar filtros
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Product Grid/List */}
      {filteredAndSortedProducts.length > 0 && (
        <div className={viewMode === 'grid'
          ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
          : 'grid grid-cols-1 gap-4'
        }>
          {filteredAndSortedProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
            />
          ))}
        </div>
      )}
    </div>
  );
}